// GAP #5 (Sprint 4) — P300 vs D300 preventive check endpoint.
//
// POST: client trimite { period, d300, p300 } (sau d300 + flag pentru pull
// automat P300 din ANAF SPV când e disponibil).
//
// Server-side:
//   1. Validează input
//   2. Comparator preventiv compareD300P300()
//   3. Dacă triggers: generate finding, persist to state.findings (replace stale
//      preventive finding pentru aceeași perioadă), audit event
//   4. Returnează result + (eventual) finding new
//
// GET: returnează istoric P300 checks pentru org (dacă persisted).
//
// NOTĂ: Pull-ul automat din ANAF SPV nu e încă implementat — endpoint dedicat
// pentru P300 nu e public la ANAF (trebuie SPV cu cont fiscal). Susținem doar
// modul "manual paste" pentru acum.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import type { ComplianceState } from "@/lib/compliance/types"
import {
  buildD300P300Finding,
  compareD300P300,
  parseDeclarationInput,
  type VatDeclarationSnapshot,
  type D300P300ComparisonResult,
} from "@/lib/compliance/d300-p300-comparator"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

const PREVENT_FINDING_PREFIX = "etva-p300-prevent-"

type StateWithChecks = ComplianceState & {
  p300Checks?: Array<{
    period: string
    comparedAtISO: string
    triggersAnafNotification: boolean
    worstDeltaAbs: number
  }>
}

// ── Body schema (manual mode) ────────────────────────────────────────────────

type CheckBody = {
  period?: string
  d300?: VatDeclarationSnapshot | string  // object sau raw string (paste)
  p300?: VatDeclarationSnapshot | string
}

function asSnapshot(input: unknown, period: string | undefined): VatDeclarationSnapshot | null {
  if (typeof input === "string") {
    const parsed = parseDeclarationInput(input)
    if (!parsed) return null
    if (period && !parsed.period) return { ...parsed, period }
    return parsed
  }
  if (input && typeof input === "object") {
    const obj = input as Partial<VatDeclarationSnapshot>
    const usePeriod = obj.period ?? period
    if (
      typeof usePeriod === "string" &&
      typeof obj.taxableBase === "number" &&
      typeof obj.vatCollected === "number" &&
      typeof obj.vatDeducted === "number" &&
      typeof obj.vatToPay === "number"
    ) {
      return { ...obj, period: usePeriod } as VatDeclarationSnapshot
    }
  }
  return null
}

// ── GET — return last comparison snapshot ────────────────────────────────────

export async function GET(request: Request) {
  const session = requireRole(request, [...READ_ROLES], "vizualizare comparator P300")
  const orgId = session.orgId
  const state = (await readStateForOrg(orgId)) as StateWithChecks | null
  if (!state) {
    return jsonError("Nu am putut încărca starea organizației active.", 500, "P300_STATE_UNAVAILABLE")
  }
  return NextResponse.json({
    history: state.p300Checks ?? [],
    activeFindings: (state.findings ?? []).filter((f) => f.id.startsWith(PREVENT_FINDING_PREFIX)),
  })
}

// ── POST — run comparison ────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "rulare comparator P300")
  const orgId = session.orgId
  const orgName = session.orgName

  let body: CheckBody
  try {
    body = (await request.json()) as CheckBody
  } catch {
    return jsonError("Body invalid (așteptăm JSON).", 400, "P300_INVALID_BODY")
  }

  const d300 = asSnapshot(body.d300, body.period)
  const p300 = asSnapshot(body.p300, body.period)

  if (!d300 || !p300) {
    return jsonError(
      "Date insuficiente. Trimite ambele snapshot-uri D300 și P300 (perioada, baza, TVA colectat/dedus/de plată).",
      400,
      "P300_MISSING_DATA",
    )
  }
  if (d300.period !== p300.period) {
    return jsonError(
      `Perioadele diferă (D300: ${d300.period}, P300: ${p300.period}). Folosește aceeași lună.`,
      400,
      "P300_PERIOD_MISMATCH",
    )
  }

  const nowISO = new Date().toISOString()

  let result: D300P300ComparisonResult
  try {
    result = compareD300P300(d300, p300, nowISO)
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Eroare la comparare.",
      400,
      "P300_COMPARE_ERROR",
    )
  }

  // Build finding (null if no trigger)
  const newFinding = buildD300P300Finding(result, nowISO)

  const state = (await readStateForOrg(orgId)) as StateWithChecks | null
  if (!state) {
    return jsonError("Nu am putut încărca starea organizației active.", 500, "P300_STATE_UNAVAILABLE")
  }

  // Replace existing prevent finding pentru aceeași perioadă (upsert)
  const findingsWithoutStale = (state.findings ?? []).filter(
    (f) => f.id !== `etva-p300-prevent-${result.period}`,
  )
  const updatedFindings = newFinding
    ? [...findingsWithoutStale, newFinding]
    : findingsWithoutStale

  const checks = state.p300Checks ?? []
  const newCheck = {
    period: result.period,
    comparedAtISO: nowISO,
    triggersAnafNotification: result.triggersAnafNotification,
    worstDeltaAbs: result.worstDeltaAbs,
  }
  // Keep last 24 checks (cap istoric)
  const updatedChecks = [
    ...checks.filter((c) => c.period !== result.period),
    newCheck,
  ].slice(-24)

  // Audit event
  const actor = await resolveOptionalEventActor(request)
  const auditEvent = createComplianceEvent(
    {
      type: "fiscal.p300_check",
      entityType: "system",
      entityId: `p300-${result.period}`,
      message: `Comparator D300 vs P300 rulat pentru perioada ${result.period}. ${
        result.triggersAnafNotification
          ? "Diferențe peste prag — finding preventiv generat."
          : "Sub pragul de notificare ANAF."
      }`,
      createdAtISO: nowISO,
      metadata: {
        period: result.period,
        triggers: result.triggersAnafNotification,
        worstField: result.worstField ?? "",
        worstDeltaAbs: result.worstDeltaAbs,
        recommendedAction: result.recommendedAction,
      },
    },
    actor,
  )

  const updatedState: StateWithChecks = {
    ...state,
    findings: updatedFindings,
    p300Checks: updatedChecks,
    events: appendComplianceEvents(state, [auditEvent]),
  }

  await writeStateForOrg(orgId, updatedState, orgName)

  return NextResponse.json({
    ok: true,
    result,
    finding: newFinding,
  })
}
