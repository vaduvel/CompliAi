// ICP API Permission Helper (Layer 5 din IA spec) — server-side defensive check.
//
// Folosit în API routes care servesc module restricted per icpSegment.
// Citește icpSegment / subFlag / accessMode din request headers (set de
// middleware Layer 4) și returnează 403 dacă moduleId nu e permis.
//
// Defense in depth peste Layer 3 (sidebar) + Layer 4 (route guard):
//   - Layer 3 ascunde din UI
//   - Layer 4 redirect URL direct cu cross-sell
//   - Layer 5 returnează 403 pentru API calls (anti-tampering — chiar dacă
//     cineva forțează fetch direct cu header-uri editate, server respinge)
//
// Pattern: backward compat — dacă headers lipsesc (utilizator vechi), null/undefined
// = no filter aplicat = behavior actual. Filter devine activ când middleware
// populează headers din JWT extins.

import {
  isModuleAllowed,
  type AccessMode,
  type SubFlag,
} from "@/lib/compliscan/icp-modules"
import type { DashboardNavId } from "@/components/compliscan/navigation"
import type { IcpSegment } from "@/lib/server/white-label"

// ── Types ────────────────────────────────────────────────────────────────────

export type IcpContext = {
  icpSegment: IcpSegment | null
  subFlag: SubFlag | null
  accessMode: AccessMode
}

export class IcpPermissionError extends Error {
  readonly status: number = 403
  readonly code: string = "ICP_MODULE_FORBIDDEN"
  readonly moduleId: DashboardNavId
  readonly icpSegment: IcpSegment | null

  constructor(moduleId: DashboardNavId, icpSegment: IcpSegment | null) {
    super(
      `Modulul "${moduleId}" nu este disponibil pentru rolul tău (icpSegment: ${
        icpSegment ?? "neavând"
      }). Activează modulele suplimentare din Setări → Module disponibile.`,
    )
    this.name = "IcpPermissionError"
    this.moduleId = moduleId
    this.icpSegment = icpSegment
  }
}

// ── Validators (defensive parsing din request headers) ───────────────────────

const VALID_ICPS = new Set<IcpSegment>([
  "solo",
  "cabinet-dpo",
  "cabinet-fiscal",
  "cabinet-hr",
  "imm-internal",
  "imm-hr",
  "enterprise",
])

const VALID_SUB_FLAGS = new Set<SubFlag>([
  "legal-only",
  "cabinet-cyber",
  "ai-gov",
  "banking",
])

const VALID_ACCESS_MODES = new Set<AccessMode>(["owner", "patron", "auditor-token"])

function parseIcpSegment(value: string | null | undefined): IcpSegment | null {
  if (!value) return null
  return (VALID_ICPS as Set<string>).has(value) ? (value as IcpSegment) : null
}

function parseSubFlag(value: string | null | undefined): SubFlag | null {
  if (!value) return null
  return (VALID_SUB_FLAGS as Set<string>).has(value) ? (value as SubFlag) : null
}

function parseAccessMode(value: string | null | undefined): AccessMode {
  if (!value) return "owner"
  return (VALID_ACCESS_MODES as Set<string>).has(value)
    ? (value as AccessMode)
    : "owner"
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Citește icpSegment + subFlag + accessMode din request headers.
 * Headers-urile sunt populate de middleware (Layer 4) după verifyToken JWT.
 *
 * Backward compat: dacă headers lipsesc, returnează null/owner = no filter.
 */
export function getIcpContextFromRequest(request: Request): IcpContext {
  return {
    icpSegment: parseIcpSegment(request.headers.get("x-compliscan-icp-segment")),
    subFlag: parseSubFlag(request.headers.get("x-compliscan-sub-flag")),
    accessMode: parseAccessMode(request.headers.get("x-compliscan-access-mode")),
  }
}

/**
 * Check dacă moduleId e permis pentru contextul user-ului.
 * Returnează boolean — pentru cazuri unde vrei custom error handling.
 */
export function checkModuleAccess(
  request: Request,
  moduleId: DashboardNavId,
): boolean {
  const ctx = getIcpContextFromRequest(request)
  // Backward compat: icpSegment null = no filter aplicat = permite
  if (ctx.icpSegment === null && ctx.accessMode === "owner") {
    return true
  }
  return isModuleAllowed(moduleId, ctx.icpSegment, ctx.subFlag, ctx.accessMode)
}

/**
 * Require ca moduleId să fie permis. Aruncă IcpPermissionError dacă nu.
 * Folosit în API routes — apel la început, înainte de logica principală.
 *
 * Exemplu:
 *   export async function POST(request: Request) {
 *     requireModuleAccess(request, "dpia")
 *     // ...rest of handler — doar utilizatori cu acces la DPIA ajung aici
 *   }
 */
export function requireModuleAccess(
  request: Request,
  moduleId: DashboardNavId,
): IcpContext {
  const ctx = getIcpContextFromRequest(request)
  // Backward compat: icpSegment null = no filter aplicat = permite (utilizator
  // vechi fără ICP setat încă)
  if (ctx.icpSegment === null && ctx.accessMode === "owner") {
    return ctx
  }
  if (!isModuleAllowed(moduleId, ctx.icpSegment, ctx.subFlag, ctx.accessMode)) {
    throw new IcpPermissionError(moduleId, ctx.icpSegment)
  }
  return ctx
}

/**
 * Helper pentru API routes care vor un error response standard JSON.
 * Folosit cu try/catch pe IcpPermissionError sau direct după check.
 *
 * Exemplu:
 *   export async function POST(request: Request) {
 *     const denied = ensureModuleOrDeny(request, "dpia")
 *     if (denied) return denied  // 403 JSON Response
 *     // ... rest of handler
 *   }
 */
export function ensureModuleOrDeny(
  request: Request,
  moduleId: DashboardNavId,
): Response | null {
  if (checkModuleAccess(request, moduleId)) return null
  const ctx = getIcpContextFromRequest(request)
  return new Response(
    JSON.stringify({
      error: `Modulul "${moduleId}" nu este disponibil pentru rolul tău. Activează modulele suplimentare din Setări → Module disponibile.`,
      code: "ICP_MODULE_FORBIDDEN",
      moduleId,
      icpSegment: ctx.icpSegment,
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    },
  )
}
