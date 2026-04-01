// lib/server/batch-executor.ts
// Executes batch actions for partner portfolio operations.
// Called from the batch API when autonomy policy === "auto".
// For semi/manual, a pending_action is created instead (handled in batch route).

import { executeAgent } from "@/lib/server/agent-orchestrator"
import { createNotification } from "@/lib/server/notifications-store"
import type { BatchActionType } from "@/lib/compliance/batch-actions"

export type BatchExecutionResult = {
  success: boolean
  detail: string
  issuesFound?: number
}

export async function executeBatchActionForOrg(
  orgId: string,
  actionType: BatchActionType,
  _config?: Record<string, unknown>,
): Promise<BatchExecutionResult> {
  switch (actionType) {
    case "run_baseline_scan": {
      const output = await executeAgent(orgId, "compliance_monitor")
      const issues = output.metrics?.issuesFound ?? 0
      return {
        success: output.status !== "failed",
        detail: `Scanare completă: ${issues} probleme detectate.`,
        issuesFound: issues,
      }
    }

    case "generate_ropa": {
      const output = await executeAgent(orgId, "document")
      return {
        success: output.status !== "failed",
        detail: `Generare documente: ${output.actions.length} acțiuni procesate.`,
      }
    }

    case "export_audit_pack": {
      // Audit pack export is heavy — notify the user so they can download from Dosar
      await createNotification(orgId, {
        type: "info",
        title: "Export audit pack disponibil",
        message: "Pachetul de audit este disponibil pentru descărcare din pagina Dosar.",
        linkTo: "/dashboard/dosar",
      }).catch(() => {})
      return {
        success: true,
        detail: "Notificare de export trimisă — descarcă pachetul din Dosar.",
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
      }
    }

    default: {
      const exhaustive: never = actionType
      return { success: false, detail: `Tip de acțiune necunoscut: ${String(exhaustive)}` }
    }
  }
}
