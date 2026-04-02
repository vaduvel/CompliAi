// V3 P1.1 — Compliance Response Pack endpoint
// Generează documentul de răspuns la cereri de due diligence / chestionare conformitate.

import { NextResponse } from "next/server"

import { computeDashboardSummary, initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import type { ETVADiscrepancy } from "@/lib/compliance/etva-discrepancy"
import type { EFacturaInvoiceSignal } from "@/lib/compliance/efactura-risk"
import { buildFiscalSummary } from "@/lib/compliance/efactura-signal-hardening"
import {
  buildOverdueFilingFindings,
  computeFilingDisciplineScore,
  generateFilingReminders,
  type FilingRecord,
} from "@/lib/compliance/filing-discipline"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import {
  buildComplianceResponse,
  buildComplianceResponseHtml,
  type ResponsePackFiscalStatus,
  type ResponsePackVendorSummary,
} from "@/lib/compliance/response-pack"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { requireFreshRole } from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { safeListReviews } from "@/lib/server/vendor-review-store"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/reports/response-pack")

  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
      "generarea response pack-ului de conformitate"
    )
    const state =
      (await readFreshStateForOrg(session.orgId, session.orgName)) ??
      normalizeComplianceState(initialComplianceState)
    const normalized = normalizeComplianceState(state)
    const summary = computeDashboardSummary(normalized)
    const remediationPlan = buildRemediationPlan(normalized)
    const nowISO = new Date().toISOString()

    const reviews = await safeListReviews(session.orgId)
    let vendorReviewSummary: ResponsePackVendorSummary | undefined
    if (reviews.length > 0) {
      vendorReviewSummary = {
        totalVendors: reviews.length,
        reviewedVendors: reviews.filter((r) => r.status === "closed").length,
        overdueReviews: reviews.filter((r) => r.status === "overdue-review").length,
        criticalCount: reviews.filter((r) => r.urgency === "critical" && r.status !== "closed").length,
        topReviews: reviews.slice(0, 10).map((r) => ({
          vendorName: r.vendorName,
          status: r.status,
          urgency: r.urgency,
          reviewCase: r.reviewCase ?? null,
          hasEvidence: (r.evidenceItems?.length ?? 0) > 0 || !!r.closureEvidence,
          nextReviewDueISO: r.nextReviewDueISO ?? null,
        })),
      }
    }

    let fiscalStatus: ResponsePackFiscalStatus | undefined
    const stateAny = state as Record<string, unknown>
    const efacturaSignals = (stateAny.efacturaSignals ?? []) as EFacturaInvoiceSignal[]
    const etvaDiscrepancies = (stateAny.etvaDiscrepancies ?? []) as ETVADiscrepancy[]
    const filingRecords = (stateAny.filingRecords ?? []) as FilingRecord[]

    if (
      normalized.efacturaConnected ||
      efacturaSignals.length > 0 ||
      etvaDiscrepancies.length > 0 ||
      filingRecords.length > 0
    ) {
      const fiscalSummary =
        efacturaSignals.length > 0
          ? buildFiscalSummary(efacturaSignals, nowISO)
          : {
              totalSignals: 0,
              criticalUrgency: 0,
              highUrgency: 0,
              fiscalHealthLabel: "sănătos" as const,
              repeatedRejectionVendors: 0,
              pendingTooLong: 0,
              averageUrgency: 0,
            }

      const filingScore = computeFilingDisciplineScore(filingRecords)
      const reminders = generateFilingReminders(filingRecords, nowISO)
      const overdueFilings = buildOverdueFilingFindings(filingRecords, nowISO)

      const pendingDiscrepancies = etvaDiscrepancies.filter(
        (d) => d.status !== "resolved" && d.status !== "overdue"
      ).length
      const overdueDiscrepancies = etvaDiscrepancies.filter((d) => d.status === "overdue").length

      const syncMs = normalized.efacturaSyncedAtISO
        ? new Date(nowISO).getTime() - new Date(normalized.efacturaSyncedAtISO).getTime()
        : null
      const lastSyncDaysAgo = syncMs !== null ? Math.floor(syncMs / 86_400_000) : null

      fiscalStatus = {
        efacturaConnected: normalized.efacturaConnected,
        lastSyncDaysAgo,
        signalsTotal: fiscalSummary.totalSignals,
        signalsCritical: fiscalSummary.criticalUrgency,
        signalsHigh: fiscalSummary.highUrgency,
        fiscalHealthLabel: fiscalSummary.fiscalHealthLabel,
        etvaPendingDiscrepancies: pendingDiscrepancies,
        etvaOverdueDiscrepancies: overdueDiscrepancies,
        filingDisciplineScore: filingScore.score,
        filingDisciplineLabel: filingScore.label,
        overdueFilings: overdueFilings.length,
        upcomingReminders: reminders.length,
      }
    }

    const report = buildComplianceResponse(
      normalized,
      summary,
      remediationPlan,
      session.orgName,
      nowISO,
      vendorReviewSummary,
      fiscalStatus
    )
    const html = buildComplianceResponseHtml(report)

    return NextResponse.json({ report, html }, withRequestIdHeaders(undefined, context))
  } catch (error) {
    await logRouteError(context, error, {
      code: "RESPONSE_PACK_GENERATE_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    const message = error instanceof Error ? error.message : "Response Pack nu a putut fi generat."
    return jsonError(message, 500, "RESPONSE_PACK_GENERATE_FAILED", undefined, context)
  }
}
