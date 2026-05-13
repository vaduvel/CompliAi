// FC-3 Pas 10 — Cross-Correlation cross-client (portfolio cabinet).
//
// Pentru fiecare client din portofoliu, rulează motorul cross-correlation
// peste state-ul lui și agregă statistici. Permite cabinetului să vadă
// ÎN UN SINGUR LOC toți clienții cu inconsistențe între D300/AGA/D205/D100.
//
// GET /api/partner/portfolio/cross-correlation
//   → { summary, clients[] } cu counts errors/warnings/ok per regulă per client.
// GET /api/partner/portfolio/cross-correlation?orgId=X
//   → findings complete pentru un client specific (pentru drawer).
//
// Doar partener mode.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import {
  requireFreshAuthenticatedSession,
  resolveUserMode,
} from "@/lib/server/auth"
import {
  listAccessiblePortfolioMemberships,
  loadPortfolioBundles,
  type PortfolioOrgBundle,
} from "@/lib/server/portfolio"
import {
  runCrossCorrelation,
  type CrossCorrelationFinding,
  type CrossCorrelationReport,
} from "@/lib/compliance/cross-correlation-engine"
import type { ComplianceState } from "@/lib/compliance/types"
import type { StateWithParsedDeclarations } from "@/lib/compliance/parsed-declarations"
import type { StateWithParsedAga } from "@/lib/compliance/parsed-aga"
import type { StateWithParsedInvoices } from "@/lib/compliance/parsed-invoices"
import type { StateWithOnrcSnapshots } from "@/lib/compliance/onrc-snapshot"

type StateExt = ComplianceState &
  StateWithParsedDeclarations &
  StateWithParsedAga &
  StateWithParsedInvoices &
  StateWithOnrcSnapshots & {
    crossCorrelationLastReport?: CrossCorrelationReport
  }

export type CrossClientRow = {
  orgId: string
  orgName: string
  /** Ultimul raport persistat la nivel de client (dacă a fost rulat). */
  lastReportAtISO: string | null
  /** Raport rulat live acum (live agregat). */
  totalChecks: number
  errors: number
  warnings: number
  ok: number
  info: number
  byRule: {
    R1: number
    R2: number
    R3: number
    R5: number
  }
  /** Risk level derivat: critic = orice error, warning = warnings>0, ok altfel. */
  riskLevel: "ok" | "warning" | "critical"
  inputs: {
    declarations: number
    aga: number
    invoices: number
    onrc: number
  }
  /** Top 3 cele mai severe findings (pentru preview rapid). */
  topFindings: Array<{
    id: string
    rule: string
    severity: string
    title: string
    period: string | null
  }>
}

function clientToReport(bundle: PortfolioOrgBundle): {
  report: CrossCorrelationReport
  state: StateExt | null
} {
  const state = bundle.state as StateExt | null
  if (!state) {
    return {
      state: null,
      report: runCrossCorrelation({
        declarations: [],
        aga: [],
        invoices: [],
        onrc: [],
      }),
    }
  }
  const report = runCrossCorrelation({
    declarations: state.parsedDeclarations ?? [],
    aga: state.parsedAga ?? [],
    invoices: state.parsedInvoices ?? [],
    onrc: state.onrcSnapshots ?? [],
  })
  return { state, report }
}

function bundleToRow(bundle: PortfolioOrgBundle): CrossClientRow {
  const { report, state } = clientToReport(bundle)
  const errors = report.summary.errors
  const warnings = report.summary.warnings
  const riskLevel: CrossClientRow["riskLevel"] =
    errors > 0 ? "critical" : warnings > 0 ? "warning" : "ok"

  const SEV_ORDER: Record<string, number> = {
    error: 0,
    warning: 1,
    info: 2,
    ok: 3,
  }
  const topFindings = report.findings
    .filter((f) => f.severity === "error" || f.severity === "warning")
    .sort((a, b) => SEV_ORDER[a.severity]! - SEV_ORDER[b.severity]!)
    .slice(0, 3)
    .map((f) => ({
      id: f.id,
      rule: f.rule,
      severity: f.severity,
      title: f.title,
      period: f.period,
    }))

  return {
    orgId: bundle.membership.orgId,
    orgName: bundle.membership.orgName,
    lastReportAtISO: state?.crossCorrelationLastReport?.generatedAtISO ?? null,
    totalChecks: report.summary.totalChecks,
    errors,
    warnings,
    ok: report.summary.ok,
    info: report.summary.info,
    byRule: {
      R1: report.summary.byRule.R1.error + report.summary.byRule.R1.warning,
      R2: report.summary.byRule.R2.error + report.summary.byRule.R2.warning,
      R3: report.summary.byRule.R3.error + report.summary.byRule.R3.warning,
      R5: report.summary.byRule.R5.error + report.summary.byRule.R5.warning,
    },
    riskLevel,
    inputs: report.inputs && {
      declarations:
        report.inputs.d300Count +
        report.inputs.d205Count +
        report.inputs.d100Count,
      aga: report.inputs.agaCount,
      invoices: report.inputs.invoicesCount,
      onrc: report.inputs.onrcCount,
    },
    topFindings,
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "vizualizare cross-correlation cross-client",
    )

    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      return jsonError(
        "Doar utilizatorii în modul partner pot accesa această secțiune.",
        403,
        "PORTFOLIO_XCORR_FORBIDDEN",
      )
    }

    const url = new URL(request.url)
    const orgIdParam = url.searchParams.get("orgId")

    const memberships = await listAccessiblePortfolioMemberships(session)
    const bundles = await loadPortfolioBundles(memberships.slice(0, 50))

    // Detail mode: returnează findings complete pentru un orgId specific
    if (orgIdParam) {
      const target = bundles.find((b) => b.membership.orgId === orgIdParam)
      if (!target) {
        return jsonError("Client negăsit în portofoliu.", 404, "PORTFOLIO_CLIENT_NOT_FOUND")
      }
      const { report } = clientToReport(target)
      return NextResponse.json({
        ok: true,
        client: {
          orgId: target.membership.orgId,
          orgName: target.membership.orgName,
        },
        report,
      })
    }

    // Summary mode: agregat per client
    const clients = bundles.map(bundleToRow)

    // Sort: critical → warning → ok (în fiecare grupă, mai multe erori primul)
    const RISK_ORDER: Record<CrossClientRow["riskLevel"], number> = {
      critical: 0,
      warning: 1,
      ok: 2,
    }
    clients.sort((a, b) => {
      const r = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]
      if (r !== 0) return r
      return b.errors + b.warnings - (a.errors + a.warnings)
    })

    const summary = {
      totalClients: clients.length,
      criticalClients: clients.filter((c) => c.riskLevel === "critical").length,
      warningClients: clients.filter((c) => c.riskLevel === "warning").length,
      okClients: clients.filter((c) => c.riskLevel === "ok").length,
      totalErrors: clients.reduce((s, c) => s + c.errors, 0),
      totalWarnings: clients.reduce((s, c) => s + c.warnings, 0),
      clientsWithInputs: clients.filter(
        (c) =>
          c.inputs.declarations > 0 ||
          c.inputs.aga > 0 ||
          c.inputs.invoices > 0 ||
          c.inputs.onrc > 0,
      ).length,
    }

    return NextResponse.json({
      ok: true,
      summary,
      clients,
      generatedAtISO: new Date().toISOString(),
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      "Eroare la încărcare cross-correlation portofoliu.",
      500,
      "PORTFOLIO_XCORR_FAILED",
    )
  }
}
