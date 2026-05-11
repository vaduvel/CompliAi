import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import {
  cancelBatchSession,
  loadBatchSession,
  nextPendingItem,
  updateBatchItem,
  type BatchItemStatus,
} from "@/lib/server/resumable-batch"

/**
 * GET /api/fiscal/batch-sessions/[id] — fetch a session by id for resume.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "citirea unei sesiuni")
    const { id } = await params
    const batch = await loadBatchSession(session.orgId, id)
    if (!batch) return jsonError("Sesiunea nu a fost găsită.", 404, "BATCH_NOT_FOUND")
    return NextResponse.json({ session: batch, nextPending: nextPendingItem(batch) })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Nu am putut citi sesiunea.", 500, "BATCH_READ_FAILED")
  }
}

/**
 * PATCH /api/fiscal/batch-sessions/[id] — update an item's status (worker side).
 *
 * Body: { itemIndex, status, resultSnippet?, errorMessage?, durationMs? } OR { cancel: true }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "actualizarea unei sesiuni")
    const { id } = await params
    const batch = await loadBatchSession(session.orgId, id)
    if (!batch) return jsonError("Sesiunea nu a fost găsită.", 404, "BATCH_NOT_FOUND")

    const body = (await request.json().catch(() => ({}))) as {
      itemIndex?: number
      status?: BatchItemStatus
      resultSnippet?: string | null
      errorMessage?: string | null
      durationMs?: number | null
      cancel?: boolean
    }

    if (body.cancel) {
      const cancelled = await cancelBatchSession(batch)
      return NextResponse.json({ session: cancelled })
    }

    if (
      typeof body.itemIndex !== "number" ||
      !body.status ||
      !["pending", "processing", "succeeded", "failed", "skipped"].includes(body.status)
    ) {
      return jsonError("itemIndex + status obligatorii.", 400, "BATCH_PATCH_INVALID")
    }

    const updated = await updateBatchItem(batch, body.itemIndex, {
      status: body.status,
      resultSnippet: body.resultSnippet ?? null,
      errorMessage: body.errorMessage ?? null,
      durationMs: body.durationMs ?? null,
    })
    return NextResponse.json({ session: updated, nextPending: nextPendingItem(updated) })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Nu am putut actualiza sesiunea.", 500, "BATCH_UPDATE_FAILED")
  }
}
