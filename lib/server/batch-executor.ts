// lib/server/batch-executor.ts
// Executes batch actions for partner portfolio operations.
// Called from the batch API when autonomy policy === "auto".
// For semi/manual, a pending_action is created instead (handled in batch route).

import {
  computeDashboardSummary,
  normalizeComplianceState,
} from "@/lib/compliance/engine"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { buildAuditPack } from "@/lib/server/audit-pack"
import { executeAgent } from "@/lib/server/agent-orchestrator"
import { buildAICompliancePack } from "@/lib/server/ai-compliance-pack"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { mutateStateForOrg, readStateForOrg } from "@/lib/server/mvp-store"
import { createNotification } from "@/lib/server/notifications-store"
import { readNis2State } from "@/lib/server/nis2-store"
import type { BatchActionType } from "@/lib/compliance/batch-actions"
import type { WorkspaceContext } from "@/lib/compliance/types"

export type BatchExecutionResult = {
  success: boolean
  detail: string
  issuesFound?: number
  summary?: Record<string, string | number | boolean>
}

function buildWorkspaceContext(orgId: string): WorkspaceContext {
  return {
    orgId,
    orgName: orgId,
    workspaceLabel: orgId,
    workspaceOwner: "system",
    workspaceInitials: orgId.slice(0, 2).toUpperCase(),
  }
}

export async function executeBatchActionForOrg(
  orgId: string,
  actionType: BatchActionType,
  _config?: Record<string, unknown>,
): Promise<BatchExecutionResult> {
  void _config
  switch (actionType) {
    case "run_baseline_scan": {
      const output = await executeAgent(orgId, "compliance_monitor")
      const issues = output.metrics?.issuesFound ?? 0
      return {
        success: output.status !== "failed",
        detail: `Scanare completă: ${issues} probleme detectate.`,
        issuesFound: issues,
        summary: {
          issuesFound: issues,
          runStatus: output.status,
        },
      }
    }

    case "generate_ropa": {
      const output = await executeAgent(orgId, "document")
      return {
        success: output.status !== "failed",
        detail: `Generare documente: ${output.actions.length} acțiuni procesate.`,
        summary: {
          actionsProcessed: output.actions.length,
          runStatus: output.status,
        },
      }
    }

    case "export_audit_pack": {
      const rawState = await readStateForOrg(orgId)
      if (!rawState) {
        return {
          success: false,
          detail: "Nu există încă un snapshot de conformitate pentru exportul Audit Pack.",
        }
      }

      const state = normalizeComplianceState(rawState)
      const workspace = buildWorkspaceContext(orgId)
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
      const readiness = auditPack.executiveSummary.auditReadiness
      const blockers = auditPack.executiveSummary.topBlockers.length
      const score = auditPack.executiveSummary.complianceScore ?? 0

      await mutateStateForOrg(
        orgId,
        (current) => ({
          ...current,
          events: appendComplianceEvents(current, [
            createComplianceEvent({
              type: "report.audit_pack_evaluated",
              entityType: "system",
              entityId: `audit-pack-${Date.now().toString(36)}`,
              message:
                readiness === "audit_ready"
                  ? `Audit Pack evaluat: gata pentru export (${score}/100).`
                  : `Audit Pack evaluat: necesită review (${blockers} blocker${blockers === 1 ? "" : "e"}).`,
              createdAtISO: new Date().toISOString(),
              metadata: {
                readiness,
                blockerCount: blockers,
                complianceScore: score,
              },
            }),
          ]),
        }),
        orgId
      )

      await createNotification(orgId, {
        type: "info",
        title: readiness === "audit_ready" ? "Audit Pack gata de export" : "Audit Pack necesită review",
        message:
          readiness === "audit_ready"
            ? `Pachetul de audit a fost evaluat și este gata de export (${score}/100).`
            : `Pachetul de audit a fost evaluat, dar mai sunt ${blockers} blocker${blockers === 1 ? "" : "e"} de închis.`,
        linkTo: "/dashboard/reports/vault",
      }).catch(() => {})
      return {
        success: true,
        detail:
          readiness === "audit_ready"
            ? `Audit Pack evaluat: gata de export (${score}/100).`
            : `Audit Pack evaluat: ${blockers} blocker${blockers === 1 ? "" : "e"} rămase înainte de export.`,
        summary: {
          readiness,
          blockerCount: blockers,
          complianceScore: score,
        },
      }
    }

    case "send_compliance_summary": {
      const output = await executeAgent(orgId, "compliance_monitor")
      const issues = output.metrics?.issuesFound ?? 0
      await createNotification(orgId, {
        type: "info",
        title: "Sumar conformitate generat",
        message: `Starea conformității a fost actualizată: ${issues} probleme detectate în ultimul scan.`,
        linkTo: "/dashboard",
      }).catch(() => {})
      return {
        success: output.status !== "failed",
        detail: `Sumar trimis: ${issues} probleme detectate.`,
        issuesFound: issues,
        summary: {
          issuesFound: issues,
          runStatus: output.status,
        },
      }
    }

    default: {
      const exhaustive: never = actionType
      return { success: false, detail: `Tip de acțiune necunoscut: ${String(exhaustive)}` }
    }
  }
}
