// DEV-ONLY seed endpoint pentru testarea features FC-4..FC-10.
// Refuză cereri în production. Cere session valid (orice rol).
//
// POST /api/dev/seed-state { patch: Partial<State> }
//   → merge patch în state-ul org-ului din session și flush memory cache.
//
// IMPORTANT: nu trimite niciodată în production. Gated pe NODE_ENV.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readFreshStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import type { ComplianceState } from "@/lib/compliance/types"

const ALLOWED_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Dev seed disabled in production.", 403, "DEV_SEED_DISABLED")
  }
  try {
    const session = requireRole(request, [...ALLOWED_ROLES], "dev seed")
    const body = (await request.json()) as { patch?: Record<string, unknown> }
    const patch = body.patch ?? {}

    // Force fresh load (bypasses cache)
    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const merged = { ...state, ...patch } as ComplianceState
    await writeStateForOrg(session.orgId, merged, session.orgName)

    return NextResponse.json({
      ok: true,
      mergedKeys: Object.keys(patch),
      orgId: session.orgId,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare seed.",
      500,
      "DEV_SEED_FAILED",
    )
  }
}
