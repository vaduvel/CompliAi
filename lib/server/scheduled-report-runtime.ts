import {
  computeDashboardSummary,
  initialComplianceState,
  normalizeComplianceState,
} from "@/lib/compliance/engine"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { buildAuditPack } from "@/lib/server/audit-pack"
import { buildAICompliancePack } from "@/lib/server/ai-compliance-pack"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { createNotification } from "@/lib/server/notifications-store"
import { mutateStateForOrg, readStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import type { WorkspaceContext } from "@/lib/compliance/types"
import { type ScheduledReportFrequency, REPORT_TYPE_LABELS, type ScheduledReportType } from "@/lib/server/scheduled-reports"

type ClientSnapshot = {
  orgId: string
  orgName: string
  score: number
  riskLabel: string
  openAlerts: number
  efacturaRiskCount: number
  generatedDocumentsCount: number
}

export type ScheduledReportExecutionMode = "auto" | "approved"

export type ScheduledReportExecutionResult = {
  success: boolean
  detail: string
  clientCount: number
  recipientCount: number
  reportType: ScheduledReportType
}

function buildWorkspaceContext(orgId: string, orgName: string): WorkspaceContext {
  return {
    orgId,
    orgName,
    workspaceLabel: orgName,
    workspaceOwner: "system",
    workspaceInitials: orgName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "CS",
  }
}

async function loadClientSnapshots(clientOrgIds: string[]): Promise<ClientSnapshot[]> {
  const snapshots = await Promise.all(
    clientOrgIds.map(async (orgId) => {
      const rawState = await readStateForOrg(orgId)
      if (!rawState) {
        return {
          orgId,
          orgName: orgId,
          score: 0,
          riskLabel: "Fără date",
          openAlerts: 0,
          efacturaRiskCount: 0,
          generatedDocumentsCount: 0,
        } satisfies ClientSnapshot
      }

      const state = normalizeComplianceState(rawState)
      const summary = computeDashboardSummary(state)
      return {
        orgId,
        orgName: orgId,
        score: summary.score,
        riskLabel: summary.riskLabel,
        openAlerts: summary.openAlerts,
        efacturaRiskCount: state.findings.filter(
          (finding) =>
            finding.category === "E_FACTURA" &&
            (finding.findingStatus ?? "open") !== "resolved"
        ).length,
        generatedDocumentsCount: state.generatedDocuments.length,
      } satisfies ClientSnapshot
    })
  )

  return snapshots
}

async function buildAuditPackSummary(clientOrgIds: string[]): Promise<{
  readyCount: number
  reviewRequiredCount: number
  avgScore: number | null
}> {
  let readyCount = 0
  let reviewRequiredCount = 0
  const scores: number[] = []

  for (const orgId of clientOrgIds) {
    const rawState = await readStateForOrg(orgId)
    if (!rawState) {
      reviewRequiredCount++
      continue
    }

    const state = normalizeComplianceState(rawState)
    const workspace = buildWorkspaceContext(orgId, orgId)
    const summary = computeDashboardSummary(state)
    const remediationPlan = buildRemediationPlan(state)
    const snapshot =
      state.snapshotHistory[0] ??
      buildCompliScanSnapshot({
        state,
        summary,
        remediationPlan,
        workspace,
      })
    const nis2State = await readNis2State(orgId).catch(() => null)
    const compliancePack = buildAICompliancePack({
      state,
      remediationPlan,
      workspace,
      snapshot,
    })
    const auditPack = buildAuditPack({
      state,
      remediationPlan,
      workspace,
      compliancePack,
      snapshot,
      nis2State,
    })

    const score = auditPack.executiveSummary.complianceScore
    if (typeof score === "number") scores.push(score)
    if (auditPack.executiveSummary.auditReadiness === "audit_ready") {
      readyCount++
    } else {
      reviewRequiredCount++
    }
  }

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      : null

  return { readyCount, reviewRequiredCount, avgScore }
}

function buildExecutionDetail(
  reportType: ScheduledReportType,
  clientSnapshots: ClientSnapshot[],
  auditPackSummary?: {
    readyCount: number
    reviewRequiredCount: number
    avgScore: number | null
  }
) {
  switch (reportType) {
    case "compliance_summary": {
      const avgScore =
        clientSnapshots.length > 0
          ? Math.round(
              clientSnapshots.reduce((sum, item) => sum + item.score, 0) / clientSnapshots.length
            )
          : 0
      const totalAlerts = clientSnapshots.reduce((sum, item) => sum + item.openAlerts, 0)
      const redClients = clientSnapshots.filter((item) => item.openAlerts > 0).length
      return `Sumar conformitate generat pentru ${clientSnapshots.length} firme · scor mediu ${avgScore}/100 · ${totalAlerts} alerte deschise · ${redClients} firme cu risc activ.`
    }
    case "fiscal_status": {
      const totalSignals = clientSnapshots.reduce((sum, item) => sum + item.efacturaRiskCount, 0)
      const riskyClients = clientSnapshots.filter((item) => item.efacturaRiskCount > 0).length
      return `Status fiscal agregat pentru ${clientSnapshots.length} firme · ${totalSignals} semnale e-Factura active · ${riskyClients} firme necesită follow-up fiscal.`
    }
    case "audit_pack": {
      const readyCount = auditPackSummary?.readyCount ?? 0
      const reviewRequiredCount = auditPackSummary?.reviewRequiredCount ?? clientSnapshots.length
      const avgScore = auditPackSummary?.avgScore
      return `Audit Pack evaluat pentru ${clientSnapshots.length} firme · ${readyCount} gata de export · ${reviewRequiredCount} necesită review · scor mediu ${avgScore ?? "—"}/100.`
    }
    case "portfolio_full": {
      const totalAlerts = clientSnapshots.reduce((sum, item) => sum + item.openAlerts, 0)
      const totalDocs = clientSnapshots.reduce((sum, item) => sum + item.generatedDocumentsCount, 0)
      return `Snapshot portofoliu complet pentru ${clientSnapshots.length} firme · ${totalAlerts} alerte deschise · ${totalDocs} livrabile în Dosar.`
    }
  }
}

export async function executeScheduledReportDelivery(params: {
  orgId: string
  scheduledReportId: string
  reportType: ScheduledReportType
  frequency?: ScheduledReportFrequency
  clientOrgIds: string[]
  recipientEmails: string[]
  executionMode: ScheduledReportExecutionMode
  orgName?: string
}): Promise<ScheduledReportExecutionResult> {
  const orgName = params.orgName ?? params.orgId
  const clientSnapshots = await loadClientSnapshots(params.clientOrgIds)
  const auditPackSummary =
    params.reportType === "audit_pack"
      ? await buildAuditPackSummary(params.clientOrgIds)
      : undefined
  const detail = buildExecutionDetail(params.reportType, clientSnapshots, auditPackSummary)
  const nowISO = new Date().toISOString()

  await mutateStateForOrg(
    params.orgId,
    (current) => {
      const state = normalizeComplianceState(current ?? initialComplianceState)
      return {
        ...state,
        events: appendComplianceEvents(state, [
          createComplianceEvent({
            type: "report.scheduled_run",
            entityType: "task",
            entityId: params.scheduledReportId,
            message: detail,
            createdAtISO: nowISO,
            metadata: {
              scheduledReportId: params.scheduledReportId,
              reportType: params.reportType,
              frequency: params.frequency ?? "manual",
              approvalQueued: false,
              executionMode: params.executionMode,
              recipientCount: params.recipientEmails.length,
              clientCount: params.clientOrgIds.length,
            },
          }),
        ]),
      }
    },
    orgName
  )

  await createNotification(params.orgId, {
    type: "info",
    title: `${REPORT_TYPE_LABELS[params.reportType]} executat`,
    message:
      params.executionMode === "approved"
        ? `${detail} Raportul a fost lansat după aprobare.`
        : `${detail} Raportul a fost lansat automat conform programării.`,
    linkTo: "/dashboard/settings/scheduled-reports",
  }).catch(() => {})

  return {
    success: true,
    detail,
    clientCount: params.clientOrgIds.length,
    recipientCount: params.recipientEmails.length,
    reportType: params.reportType,
  }
}
