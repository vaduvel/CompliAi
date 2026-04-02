// P1 — Portfolio batch actions engine.
// POST: runs a batch action across multiple org IDs.
// Each action is evaluated through the autonomy policy.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import { resolvePolicy } from "@/lib/server/autonomy-resolver"
import { createPendingAction } from "@/lib/server/approval-queue"
import {
  type BatchActionType,
  type BatchResult,
  BATCH_ACTION_RISK,
  BATCH_ACTION_LABELS,
  VALID_BATCH_ACTIONS,
} from "@/lib/compliance/batch-actions"
import { executeBatchActionForOrg } from "@/lib/server/batch-executor"

function buildBatchNextStep(actionType: BatchActionType, status: BatchResult["status"]) {
  if (status === "pending_approval") {
    switch (actionType) {
      case "generate_ropa":
        return "Deschide Aprobări și confirmă generarea documentelor pentru client."
      case "run_baseline_scan":
        return "Deschide Aprobări și pornește scanarea baseline pentru client."
      case "export_audit_pack":
        return "Deschide Aprobări și confirmă evaluarea Audit Pack pentru client."
      case "send_compliance_summary":
        return "Deschide Aprobări și confirmă trimiterea sumarului de conformitate."
      default:
        return "Deschide Aprobări și confirmă acțiunea batch."
    }
  }

  if (status === "success") {
    switch (actionType) {
      case "generate_ropa":
        return "Intră în firmă și verifică documentele generate."
      case "run_baseline_scan":
        return "Intră în firmă și verifică noile cazuri sau taskuri deschise."
      case "export_audit_pack":
        return "Intră în firmă și deschide Audit Pack din Dovadă sau Reports."
      case "send_compliance_summary":
        return "Intră în firmă și verifică sumarul actualizat de conformitate."
      default:
        return "Intră în firmă și verifică rezultatul operațional."
    }
  }

  return "Revizuiește eroarea și încearcă din nou după corectare."
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager"], "batch operations")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Batch actions sunt disponibile doar în modul partner.", 403, "PORTFOLIO_FORBIDDEN")
    }

    const body = await request.json() as {
      actionType: BatchActionType
      orgIds: string[]
      config?: Record<string, unknown>
    }

    if (!VALID_BATCH_ACTIONS.includes(body.actionType)) {
      return jsonError("Acțiune batch invalidă.", 400, "INVALID_BATCH_ACTION")
    }
    if (!body.orgIds?.length) {
      return jsonError("Selectează cel puțin o firmă.", 400, "NO_ORGS_SELECTED")
    }
    if (body.orgIds.length > 50) {
      return jsonError("Maximum 50 de firme per batch.", 400, "BATCH_LIMIT_EXCEEDED")
    }

    const riskLevel = BATCH_ACTION_RISK[body.actionType]
    const partnerOrgId = session.orgId
    const userId = session.userId

    const policy = await resolvePolicy({
      userId,
      orgId: partnerOrgId,
      actionType: "batch_action",
      riskLevel,
    })

    const results: BatchResult[] = []

    for (const orgId of body.orgIds) {
      const orgName = body.config?.orgNames
        ? (body.config.orgNames as Record<string, string>)[orgId] ?? orgId
        : orgId

      try {
        if (policy === "auto") {
          const execResult = await executeBatchActionForOrg(orgId, body.actionType, body.config)
          results.push({
            orgId,
            orgName,
            status: execResult.success ? "success" : "failed",
            detail: execResult.detail,
            error: execResult.success ? undefined : execResult.detail,
            nextStep: buildBatchNextStep(body.actionType, execResult.success ? "success" : "failed"),
            summary: execResult.summary,
          })
        } else {
          const action = await createPendingAction({
            orgId: partnerOrgId,
            userId,
            actionType: "batch_action",
            riskLevel,
            explanation: `${BATCH_ACTION_LABELS[body.actionType]} pentru firma ${orgName} (${orgId})`,
            diffSummary: `Acțiune: ${body.actionType} · Firmă: ${orgId}`,
            proposedData: {
              actionType: body.actionType,
              targetOrgId: orgId,
              targetOrgName: orgName,
              config: body.config ?? {},
            },
            expiresInHours: policy === "semi" ? 24 : undefined,
          })
          results.push({
            orgId,
            orgName,
            status: "pending_approval",
            pendingActionId: action.id,
            detail: `Așteaptă aprobarea pentru ${BATCH_ACTION_LABELS[body.actionType].toLowerCase()}.`,
            nextStep: buildBatchNextStep(body.actionType, "pending_approval"),
            summary: {
              policy,
              riskLevel,
            },
          })
        }
      } catch (err) {
        results.push({
          orgId,
          orgName,
          status: "failed",
          detail: err instanceof Error ? err.message : "Acțiunea nu a putut fi executată.",
          error: err instanceof Error ? err.message : "unknown",
          nextStep: buildBatchNextStep(body.actionType, "failed"),
        })
      }
    }

    const pendingCount = results.filter((r) => r.status === "pending_approval").length
    const successCount = results.filter((r) => r.status === "success").length

    return NextResponse.json({
      ok: true,
      results,
      pendingCount,
      successCount,
      policy,
      message:
        pendingCount > 0
          ? `${pendingCount} acțiuni necesită aprobare. ${successCount} rulate direct.`
          : `${successCount} acțiuni rulate cu succes.`,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la batch.", 500, "BATCH_FAILED")
  }
}
