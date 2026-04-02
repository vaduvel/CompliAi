/**
 * Approval Queue API — list pending actions for current org.
 *
 * GET /api/approvals
 * Query: ?status=pending&type=repair_efactura&risk=high&limit=50
 */
import { NextResponse } from "next/server"

import type { PendingActionStatus, PendingActionType, RiskLevel } from "@/lib/server/approval-queue"
import { getApprovalCounts, listPendingActions } from "@/lib/server/approval-queue"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager", "compliance"], "approvals-list")
    const orgId = session.orgId

    const url = new URL(request.url)
    const statusParam = url.searchParams.get("status")
    const typeParam = url.searchParams.get("type")
    const riskParam = url.searchParams.get("risk")
    const limitParam = url.searchParams.get("limit")

    const filters: {
      status?: PendingActionStatus[]
      actionType?: PendingActionType[]
      riskLevel?: RiskLevel[]
      limit?: number
    } = {}

    if (statusParam) filters.status = statusParam.split(",") as PendingActionStatus[]
    if (typeParam) filters.actionType = typeParam.split(",") as PendingActionType[]
    if (riskParam) filters.riskLevel = riskParam.split(",") as RiskLevel[]
    if (limitParam) filters.limit = Math.min(parseInt(limitParam, 10) || 50, 200)

    const [actions, counts] = await Promise.all([
      listPendingActions(orgId, filters),
      getApprovalCounts(orgId),
    ])

    return NextResponse.json({ actions, counts })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la încărcarea aprobărilor.", 500, "APPROVALS_LIST_FAILED")
  }
}
