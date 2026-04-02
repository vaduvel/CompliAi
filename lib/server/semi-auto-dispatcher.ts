// lib/server/semi-auto-dispatcher.ts
// Dispatches side-effects when a semi-auto pending action is auto-executed
// after the 24h window elapses without rejection.
//
// IMPORTANT: submit_anaf is NEVER semi-auto (LOCKED_OVERRIDES in autonomy-resolver).
// This file must NEVER touch ANAF submission logic.

import type { BatchActionType } from "@/lib/compliance/batch-actions"
import { executeBatchActionForOrg } from "@/lib/server/batch-executor"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { createNotification } from "@/lib/server/notifications-store"
import type { PendingAction } from "@/lib/server/approval-queue"
import { markReportRun, type ScheduledReportFrequency, type ScheduledReportType } from "@/lib/server/scheduled-reports"
import { executeScheduledReportDelivery } from "@/lib/server/scheduled-report-runtime"

export type DispatchResult = {
  executed: boolean
  detail: string
}

/**
 * Execute the real side-effect for a semi-auto action that was auto-approved.
 * Returns what happened so the caller can log it.
 */
export async function dispatchAutoExecutedAction(
  action: PendingAction,
): Promise<DispatchResult> {
  switch (action.actionType) {
    case "resolve_finding":
      return resolveFindings(action)
    case "generate_document":
      return { executed: true, detail: "Document generation queued via next agent cycle." }
    case "repair_efactura":
      return { executed: true, detail: "Repair auto-approved — user can apply from fiscal page." }
    case "vendor_merge":
      return { executed: true, detail: "Vendor merge approved — applied on next vendor sync." }
    case "auto_remediation":
      return { executed: true, detail: "Auto-remediation approved — applied on next agent cycle." }
    case "classify_ai_system":
      return { executed: true, detail: "AI system classification approved." }
    case "publish_trust_center":
      return { executed: true, detail: "Trust center publish approved." }
    case "batch_action":
      return dispatchBatchAction(action)
    case "submit_anaf":
      // This should never happen (LOCKED_OVERRIDES), but guard anyway
      return { executed: false, detail: "submit_anaf cannot be auto-executed." }
    default:
      return { executed: false, detail: `Unknown action type: ${action.actionType}` }
  }
}

// ── resolve_finding dispatcher ──────────────────────────────────────────────

async function resolveFindings(action: PendingAction): Promise<DispatchResult> {
  const { orgId, sourceFindingId, proposedData } = action
  if (!sourceFindingId) {
    return { executed: false, detail: "No sourceFindingId on action." }
  }

  const targetStatus = (proposedData?.targetStatus as string) ?? "under_monitoring"
  const evidenceNote = (proposedData?.evidenceNote as string) ?? undefined

  try {
    const state = await readStateForOrg(orgId)
    if (!state) return { executed: false, detail: "Org state not found." }

    const idx = state.findings.findIndex((f) => f.id === sourceFindingId)
    if (idx === -1) return { executed: false, detail: `Finding ${sourceFindingId} not found.` }

    const finding = state.findings[idx]
    const nowISO = new Date().toISOString()

    const updatedFindings = [...state.findings]
    updatedFindings[idx] = {
      ...finding,
      findingStatus: targetStatus as "resolved" | "under_monitoring",
      findingStatusUpdatedAtISO: nowISO,
      nextMonitoringDateISO:
        targetStatus === "under_monitoring"
          ? new Date(Date.now() + 90 * 86_400_000).toISOString()
          : finding.nextMonitoringDateISO,
      operationalEvidenceNote: evidenceNote ?? finding.operationalEvidenceNote,
      resolution: {
        problem: finding.resolution?.problem ?? finding.detail,
        impact: finding.resolution?.impact ?? finding.impactSummary ?? "Riscul a fost evaluat și aprobat automat.",
        action: finding.resolution?.action ?? finding.remediationHint ?? "Acțiune auto-aprobată după 24h fără respingere.",
        generatedAsset: finding.resolution?.generatedAsset,
        humanStep: "Acțiune auto-aprobată după 24h fără respingere (politica semi-automat).",
        closureEvidence:
          evidenceNote ??
          finding.resolution?.closureEvidence ??
          "Aprobat automat conform politicii de autonomie.",
        revalidation: finding.resolution?.revalidation,
        reviewedAtISO: nowISO,
      },
    }

    await writeStateForOrg(orgId, { ...state, findings: updatedFindings })

    await createNotification(orgId, {
      type: "info",
      title: `Finding rezolvat automat: ${finding.title}`,
      message: `"${finding.title}" a trecut în ${targetStatus === "under_monitoring" ? "monitorizare" : "rezolvat"} după aprobarea automată (24h fără respingere).`,
      linkTo: `/dashboard/resolve/${sourceFindingId}`,
    }).catch(() => {})

    return {
      executed: true,
      detail: `Finding ${sourceFindingId} → ${targetStatus}`,
    }
  } catch (err) {
    return {
      executed: false,
      detail: `Error: ${err instanceof Error ? err.message : "unknown"}`,
    }
  }
}

async function dispatchBatchAction(action: PendingAction): Promise<DispatchResult> {
  const proposed = action.proposedData ?? {}

  const scheduledReportId =
    typeof proposed.scheduledReportId === "string" ? proposed.scheduledReportId.trim() : ""

  if (scheduledReportId) {
    const reportType =
      typeof proposed.reportType === "string" ? (proposed.reportType as ScheduledReportType) : null
    const clientOrgIds = Array.isArray(proposed.clientOrgIds)
      ? proposed.clientOrgIds.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : []
    const recipientEmails = Array.isArray(proposed.recipientEmails)
      ? proposed.recipientEmails.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : []
    const frequency =
      typeof proposed.frequency === "string"
        ? (proposed.frequency as ScheduledReportFrequency)
        : undefined

    if (!reportType || clientOrgIds.length === 0 || recipientEmails.length === 0) {
      return {
        executed: false,
        detail: "Scheduled report approval incomplet — lipsesc reportType, firmele sau destinatarii.",
      }
    }

    const execution = await executeScheduledReportDelivery({
      orgId: action.orgId,
      orgName: action.orgId,
      scheduledReportId,
      reportType,
      frequency,
      clientOrgIds,
      recipientEmails,
      executionMode: "approved",
    })

    if (execution.success && frequency) {
      await markReportRun(action.orgId, scheduledReportId, frequency).catch(() => {})
    }

    return {
      executed: execution.success,
      detail: execution.detail,
    }
  }

  const targetOrgId = typeof proposed.targetOrgId === "string" ? proposed.targetOrgId.trim() : ""
  const actionType =
    typeof proposed.actionType === "string" ? (proposed.actionType as BatchActionType) : null

  if (!targetOrgId || !actionType) {
    return {
      executed: false,
      detail: "Batch action approval incomplet — lipsesc targetOrgId sau actionType.",
    }
  }

  const execution = await executeBatchActionForOrg(
    targetOrgId,
    actionType,
    (proposed.config as Record<string, unknown> | undefined) ?? {}
  )

  await createNotification(action.orgId, {
    type: execution.success ? "info" : "vendor_risk",
    title: execution.success ? "Acțiune batch executată" : "Acțiune batch eșuată",
    message: execution.success
      ? `${actionType} pentru ${typeof proposed.targetOrgName === "string" ? proposed.targetOrgName : targetOrgId}: ${execution.detail}`
      : `${actionType} pentru ${typeof proposed.targetOrgName === "string" ? proposed.targetOrgName : targetOrgId} a eșuat: ${execution.detail}`,
    linkTo: "/portfolio",
  }).catch(() => {})

  return {
    executed: execution.success,
    detail: execution.detail,
  }
}
