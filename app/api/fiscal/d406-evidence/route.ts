// Faza 2 — TASK 7: SAF-T D406 Evidence
// POST — marca D406 ca depus (cu sau fără dovadă atașată)
// GET  — verifică statusul curent

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import type { ComplianceState } from "@/lib/compliance/types"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

export async function GET(request: Request) {
  const session = requireRole(request, [...READ_ROLES], "status dovadă D406")
  const orgId = session.orgId
  const state = (await readStateForOrg(orgId)) as ComplianceState | null
  if (!state) {
    return jsonError("Nu am putut încărca starea organizației active.", 500, "D406_STATE_UNAVAILABLE")
  }
  return NextResponse.json({
    d406EvidenceSubmitted: state.d406EvidenceSubmitted ?? false,
  })
}

export async function POST(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "marcare dovadă D406")
  const orgId = session.orgId
  const orgName = session.orgName
  const state = (await readStateForOrg(orgId)) as ComplianceState | null
  if (!state) {
    return jsonError("Nu am putut încărca starea organizației active.", 500, "D406_STATE_UNAVAILABLE")
  }

  const updated: ComplianceState = {
    ...state,
    d406EvidenceSubmitted: true,
  }

  // Close the D406 finding if it exists
  updated.findings = (updated.findings ?? []).map((f) =>
    f.id === "saft-d406-registration" && f.findingStatus !== "resolved"
      ? { ...f, findingStatus: "resolved" as const }
      : f,
  )

  await writeStateForOrg(orgId, updated, orgName)

  return NextResponse.json({ ok: true, d406EvidenceSubmitted: true })
}
