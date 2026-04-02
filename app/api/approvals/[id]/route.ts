/**
 * Approval Queue — single action detail + approve/reject.
 *
 * GET  /api/approvals/[id]  — detail with diff
 * PATCH /api/approvals/[id] — approve or reject
 */
import { NextResponse } from "next/server"

import { decidePendingAction, getPendingAction, markExecuted } from "@/lib/server/approval-queue"
import { syncSubmissionApprovalDecision } from "@/lib/server/anaf-submit-flow"
import { dispatchAutoExecutedAction } from "@/lib/server/semi-auto-dispatcher"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireFreshRole(request, ["owner", "partner_manager", "compliance"], "approval-detail")
    const { orgId } = await getOrgContext()
    const { id } = await params

    const action = await getPendingAction(orgId, id)
    if (!action) return jsonError("Acțiunea nu a fost găsită.", 404, "ACTION_NOT_FOUND")

    return NextResponse.json({ action })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la încărcarea acțiunii.", 500, "APPROVAL_DETAIL_FAILED")
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance"],
      "approval-decide"
    )
    const { orgId } = await getOrgContext()
    const { id } = await params

    const body = (await request.json()) as {
      decision: "approved" | "rejected"
      note?: string
    }

    if (!body.decision || !["approved", "rejected"].includes(body.decision)) {
      return jsonError("Decizie invalidă. Trimite 'approved' sau 'rejected'.", 400, "INVALID_DECISION")
    }

    const updated = await decidePendingAction({
      orgId,
      actionId: id,
      decision: body.decision,
      decidedByEmail: session.email,
      note: body.note,
    })

    if (!updated) {
      return jsonError("Acțiunea nu a fost găsită sau nu mai este pending.", 404, "ACTION_NOT_PENDING")
    }

    let executed = false

    if (updated.actionType === "submit_anaf") {
      await syncSubmissionApprovalDecision({
        orgId,
        approvalActionId: id,
        decision: body.decision,
        note: body.note,
      })
    } else if (body.decision === "approved") {
      try {
        const dispatch = await dispatchAutoExecutedAction(updated)
        if (dispatch.executed) {
          await markExecuted(orgId, id, { executedBy: "approval-api", detail: dispatch.detail })
        }
        executed = dispatch.executed
      } catch {
        console.error(`[approvals] Execution failed for ${id}`)
      }
    }

    return NextResponse.json({
      action: updated,
      executed,
      synced: updated.actionType === "submit_anaf",
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la procesarea deciziei.", 500, "APPROVAL_DECIDE_FAILED")
  }
}
