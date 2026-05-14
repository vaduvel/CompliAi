// Sprint 6.3 — Portfolio fiscal aggregation per client.
//
// Pentru fiecare client din portofoliul cabinetului:
//   - Scor SAF-T hygiene (0-100, 5 labels)
//   - Filing discipline score
//   - Numărul de findings e-Factura active
//   - Status integrări (SmartBill/Oblio conectat?)
//   - Ultimul sync timestamp
//   - Risk level fiscal global (combinat)
//
// Auth: doar partner mode poate accesa. Reuses listAccessiblePortfolioMemberships
// + loadPortfolioBundles din infrastructura existing.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession, resolveUserMode } from "@/lib/server/auth"
import {
  listAccessiblePortfolioMemberships,
  loadPortfolioBundles,
} from "@/lib/server/portfolio"
import {
  computeFilingDisciplineScore,
  type FilingRecord,
} from "@/lib/compliance/filing-discipline"
import { computeSAFTHygiene } from "@/lib/compliance/saft-hygiene"
import { EFACTURA_RISK_FINDING_PREFIX } from "@/lib/compliance/efactura-risk"
import type { ComplianceState } from "@/lib/compliance/types"

type FiscalClientRow = {
  orgId: string
  orgName: string
  saftHygieneScore: number | null
  saftHygieneLabel: string | null
  filingDisciplineScore: number | null
  filingDisciplineLabel: string | null
  filingTotal: number
  filingMissing: number
  filingLate: number
  filingRectified: number
  efacturaIssueCount: number
  efacturaSignalsTotal: number
  efacturaLastSyncAtISO: string | null
  smartbillConnected: boolean
  smartbillLastSyncAtISO: string | null
  oblioConnected: boolean
  oblioLastSyncAtISO: string | null
  riskLevel: "ok" | "warning" | "critical"
  topFinding: { id: string; title: string; severity: string } | null
}

type StateWithFilings = ComplianceState & { filingRecords?: FilingRecord[] }

function deriveRiskLevel(row: Omit<FiscalClientRow, "riskLevel">): "ok" | "warning" | "critical" {
  // [FC-12 fix 2026-05-14] Maria persona test: AZI tab arăta "2 CRITICE"
  // dar Sumar per client arăta "RISC CRITIC 0" — threshold prea înalt
  // (filingMissing >= 2). Acum: orice declarație lipsă = critic (1 R6 D300
  // nedepusă = ANAF penalitate iminentă), aliniat cu AZI tab criticCount.
  if (
    (row.saftHygieneScore !== null && row.saftHygieneScore < 50) ||
    (row.filingDisciplineScore !== null && row.filingDisciplineScore < 50) ||
    row.efacturaIssueCount >= 5 ||
    row.filingMissing >= 1
  ) {
    return "critical"
  }
  if (
    (row.saftHygieneScore !== null && row.saftHygieneScore < 70) ||
    (row.filingDisciplineScore !== null && row.filingDisciplineScore < 70) ||
    row.efacturaIssueCount > 0 ||
    row.filingLate > 0
  ) {
    return "warning"
  }
  return "ok"
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "accesarea portofoliului fiscal",
    )

    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      return jsonError(
        "Doar utilizatorii în modul partner pot accesa portofoliul fiscal.",
        403,
        "PORTFOLIO_FISCAL_FORBIDDEN",
      )
    }

    const memberships = await listAccessiblePortfolioMemberships(session)
    const bundles = await loadPortfolioBundles(memberships.slice(0, 50))
    const nowISO = new Date().toISOString()

    const clients: FiscalClientRow[] = bundles.map((bundle) => {
      const state = bundle.state as StateWithFilings | null
      const filings = state?.filingRecords ?? []
      const findings = state?.findings ?? []

      // SAF-T hygiene
      const saftHygiene =
        filings.length > 0 && filings.some((f) => f.type === "saft")
          ? computeSAFTHygiene(filings, nowISO)
          : null
      const saftHygieneScore =
        saftHygiene && saftHygiene.totalFilings > 0 ? saftHygiene.hygieneScore : null
      const saftHygieneLabel = saftHygiene && saftHygiene.totalFilings > 0 ? saftHygiene.hygieneLabel : null

      // Filing discipline
      const disciplineScore =
        filings.length > 0 ? computeFilingDisciplineScore(filings) : null
      const filingMissing = filings.filter((f) => f.status === "missing").length
      const filingLate = filings.filter((f) => f.status === "late").length
      const filingRectified = filings.filter((f) => f.status === "rectified").length

      // e-Factura
      const efacturaIssueCount = findings.filter(
        (f) => f.id.startsWith(EFACTURA_RISK_FINDING_PREFIX) && f.findingStatus !== "resolved",
      ).length
      const efacturaSignalsTotal = state?.efacturaSignalsCount ?? 0

      // Integrări
      const smartbill = state?.integrations?.smartbill
      const oblio = state?.integrations?.oblio

      // Top finding (highest severity)
      const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
      const topFinding = findings
        .filter((f) => f.category === "E_FACTURA" && f.findingStatus !== "resolved")
        .sort((a, b) => (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0))[0]

      const baseRow: Omit<FiscalClientRow, "riskLevel"> = {
        orgId: bundle.membership.orgId,
        orgName: bundle.membership.orgName,
        saftHygieneScore,
        saftHygieneLabel,
        filingDisciplineScore: disciplineScore?.score ?? null,
        filingDisciplineLabel: disciplineScore?.label ?? null,
        filingTotal: filings.length,
        filingMissing,
        filingLate,
        filingRectified,
        efacturaIssueCount,
        efacturaSignalsTotal,
        efacturaLastSyncAtISO: state?.efacturaSyncedAtISO ?? null,
        smartbillConnected: !!smartbill,
        smartbillLastSyncAtISO: smartbill?.lastSyncAtISO ?? null,
        oblioConnected: !!oblio,
        oblioLastSyncAtISO: oblio?.lastSyncAtISO ?? null,
        topFinding: topFinding
          ? { id: topFinding.id, title: topFinding.title, severity: topFinding.severity }
          : null,
      }

      return { ...baseRow, riskLevel: deriveRiskLevel(baseRow) }
    })

    // Aggregate stats
    const totalClients = clients.length
    const criticalClients = clients.filter((c) => c.riskLevel === "critical").length
    const warningClients = clients.filter((c) => c.riskLevel === "warning").length
    const okClients = clients.filter((c) => c.riskLevel === "ok").length
    const totalEfacturaIssues = clients.reduce((s, c) => s + c.efacturaIssueCount, 0)
    const totalFilingMissing = clients.reduce((s, c) => s + c.filingMissing, 0)
    const integrationsConnected = clients.filter(
      (c) => c.smartbillConnected || c.oblioConnected,
    ).length

    const saftScores = clients
      .map((c) => c.saftHygieneScore)
      .filter((s): s is number => s !== null)
    const avgSaftScore =
      saftScores.length > 0
        ? Math.round(saftScores.reduce((s, x) => s + x, 0) / saftScores.length)
        : null

    return NextResponse.json({
      summary: {
        totalClients,
        criticalClients,
        warningClients,
        okClients,
        totalEfacturaIssues,
        totalFilingMissing,
        integrationsConnected,
        avgSaftScore,
      },
      clients: clients.sort((a, b) => {
        // Critical primul, apoi warning, apoi ok
        const order: Record<string, number> = { critical: 0, warning: 1, ok: 2 }
        return order[a.riskLevel] - order[b.riskLevel]
      }),
      timestamp: nowISO,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la portofoliul fiscal.", 500, "PORTFOLIO_FISCAL_FAILED")
  }
}
