// Faza 2 — TASK 8: NIS2 Eligibility Gate API
// GET  — citește eligibilitatea curentă (null dacă nu a fost evaluată)
// POST — evaluează + salvează rezultatul + generează finding dacă e cazul

import { NextResponse } from "next/server"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2Eligibility, saveNis2Eligibility } from "@/lib/server/nis2-store"
import type { Nis2EligibilityRecord } from "@/lib/server/nis2-store"
import {
  evaluateNis2Eligibility,
  NIS2_SECTORS,
  type Nis2EmployeeRange,
  type Nis2RevenueRange,
} from "@/lib/compliscan/nis2-eligibility"
import { readState, writeState } from "@/lib/server/mvp-store"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"

const VALID_EMPLOYEES: Nis2EmployeeRange[] = ["sub50", "50-250", "peste250"]
const VALID_REVENUE: Nis2RevenueRange[] = ["sub10m", "10-50m", "peste50m"]

export async function GET() {
  const { orgId } = await getOrgContext()
  const eligibility = await readNis2Eligibility(orgId)
  return NextResponse.json({ eligibility })
}

export async function POST(req: Request) {
  const { orgId } = await getOrgContext()
  const body = await req.json()

  const { sectorId, employees, revenue } = body as {
    sectorId?: string
    employees?: string
    revenue?: string
  }

  if (!sectorId || !employees || !revenue) {
    return NextResponse.json(
      { error: "sectorId, employees, revenue sunt obligatorii" },
      { status: 400 }
    )
  }

  if (!NIS2_SECTORS.some((s) => s.id === sectorId)) {
    return NextResponse.json({ error: "Sector invalid" }, { status: 400 })
  }

  if (!VALID_EMPLOYEES.includes(employees as Nis2EmployeeRange)) {
    return NextResponse.json({ error: "Valoare angajați invalidă" }, { status: 400 })
  }

  if (!VALID_REVENUE.includes(revenue as Nis2RevenueRange)) {
    return NextResponse.json({ error: "Valoare cifră de afaceri invalidă" }, { status: 400 })
  }

  const output = evaluateNis2Eligibility(
    sectorId,
    employees as Nis2EmployeeRange,
    revenue as Nis2RevenueRange
  )

  const now = new Date().toISOString()
  const record: Nis2EligibilityRecord = {
    sectorId,
    employees: employees as Nis2EmployeeRange,
    revenue: revenue as Nis2RevenueRange,
    result: output.result,
    savedAtISO: now,
  }

  await saveNis2Eligibility(orgId, record)

  // Generate or clear finding based on result
  const state = (await readState()) as ComplianceState
  const findings = (state.findings ?? []).filter(
    (f) => f.id !== "nis2-finding-eligibility"
  )

  const sector = NIS2_SECTORS.find((s) => s.id === sectorId)

  if (output.result === "intri" || output.result === "posibil") {
    const finding: ScanFinding = {
      id: "nis2-finding-eligibility",
      title:
        output.result === "intri"
          ? "Organizația ta intră sub NIS2"
          : "Posibilă aplicabilitate NIS2",
      detail: output.description,
      category: "NIS2",
      severity: output.result === "intri" ? "high" : "medium",
      risk: output.result === "intri" ? "high" : "low",
      principles: ["accountability"],
      sourceDocument: "NIS2 Eligibility Gate",
      legalReference: `OUG 155/2024 · Directiva (UE) 2022/2555 · Anexa ${sector?.annex ?? "1"}`,
      remediationHint: output.recommendation,
      findingStatus: "open",
      createdAtISO: now,
    }
    findings.push(finding)
  }

  await writeState({ ...state, findings })

  return NextResponse.json({ ok: true, eligibility: record, output })
}
