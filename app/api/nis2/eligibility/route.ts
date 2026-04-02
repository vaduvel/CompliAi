// Faza 2 — TASK 8: NIS2 Eligibility Gate API
// GET  — citește eligibilitatea curentă (null dacă nu a fost evaluată)
// POST — evaluează + salvează rezultatul + generează finding dacă e cazul

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readNis2Eligibility, saveNis2Eligibility } from "@/lib/server/nis2-store"
import type { Nis2EligibilityRecord } from "@/lib/server/nis2-store"
import {
  evaluateNis2Eligibility,
  NIS2_SECTORS,
  type Nis2EmployeeRange,
  type Nis2RevenueRange,
} from "@/lib/compliscan/nis2-eligibility"
import { readFreshStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { initialComplianceState } from "@/lib/compliance/engine"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"

const VALID_EMPLOYEES: Nis2EmployeeRange[] = ["sub50", "50-250", "peste250"]
const VALID_REVENUE: Nis2RevenueRange[] = ["sub10m", "10-50m", "peste50m"]

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "citirea eligibilității NIS2")
    const eligibility = await readNis2Eligibility(session.orgId)
    return NextResponse.json({ eligibility })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca eligibilitatea NIS2.", 500, "NIS2_ELIGIBILITY_READ_FAILED")
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(req, "salvarea eligibilității NIS2")
    const body = await req.json()

    const { sectorId, employees, revenue } = body as {
      sectorId?: string
      employees?: string
      revenue?: string
    }

    if (!sectorId || !employees || !revenue) {
      return jsonError("sectorId, employees, revenue sunt obligatorii.", 400, "MISSING_ELIGIBILITY_FIELDS")
    }

    if (!NIS2_SECTORS.some((s) => s.id === sectorId)) {
      return jsonError("Sector invalid.", 400, "INVALID_NIS2_SECTOR")
    }

    if (!VALID_EMPLOYEES.includes(employees as Nis2EmployeeRange)) {
      return jsonError("Valoare angajați invalidă.", 400, "INVALID_EMPLOYEE_RANGE")
    }

    if (!VALID_REVENUE.includes(revenue as Nis2RevenueRange)) {
      return jsonError("Valoare cifră de afaceri invalidă.", 400, "INVALID_REVENUE_RANGE")
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

    await saveNis2Eligibility(session.orgId, record)

    const state =
      ((await readFreshStateForOrg(session.orgId, session.orgName)) as ComplianceState | null) ??
      initialComplianceState
    const findings = (state.findings ?? []).filter((f) => f.id !== "nis2-finding-eligibility")

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

    await writeStateForOrg(session.orgId, { ...state, findings }, session.orgName)

    return NextResponse.json({ ok: true, eligibility: record, output })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut salva eligibilitatea NIS2.", 500, "NIS2_ELIGIBILITY_SAVE_FAILED")
  }
}
