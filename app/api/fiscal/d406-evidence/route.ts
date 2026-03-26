// Faza 2 — TASK 7: SAF-T D406 Evidence
// POST — marca D406 ca depus (cu sau fără dovadă atașată)
// GET  — verifică statusul curent

import { NextResponse } from "next/server"
import { readState, writeState } from "@/lib/server/mvp-store"
import type { ComplianceState } from "@/lib/compliance/types"

export async function GET() {
  const state = (await readState()) as ComplianceState
  return NextResponse.json({
    d406EvidenceSubmitted: state.d406EvidenceSubmitted ?? false,
  })
}

export async function POST() {
  const state = (await readState()) as ComplianceState

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

  await writeState(updated)

  return NextResponse.json({ ok: true, d406EvidenceSubmitted: true })
}
