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
    const partnerOrgId = request.headers.get("x-compliscan-org-id") ?? ""
    const userId = request.headers.get("x-compliscan-user-id") ?? ""

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
          results.push({ orgId, orgName, status: "success" })
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
          results.push({ orgId, orgName, status: "pending_approval", pendingActionId: action.id })
        }
      } catch (err) {
        results.push({ orgId, orgName, status: "failed", error: err instanceof Error ? err.message : "unknown" })
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
