import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import {
  listActiveBatchSessions,
  startBatchSession,
  type BatchKind,
} from "@/lib/server/resumable-batch"

const VALID_KINDS: BatchKind[] = ["validate", "upload", "import-erp"]

/**
 * GET /api/fiscal/batch-sessions — list active sessions for the active org.
 */
export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "vizualizarea sesiunilor de batch",
    )
    const sessions = await listActiveBatchSessions(session.orgId)
    return NextResponse.json({ orgId: session.orgId, sessions })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Nu am putut citi sesiunile.", 500, "BATCH_LIST_FAILED")
  }
}

/**
 * POST /api/fiscal/batch-sessions — start a new batch session.
 *
 * Body: { kind, label, itemKeys: string[] }
 */
export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "pornirea unei sesiuni de batch",
    )
    const body = (await request.json().catch(() => ({}))) as {
      kind?: BatchKind
      label?: string
      itemKeys?: string[]
    }
    if (!body.kind || !VALID_KINDS.includes(body.kind)) {
      return jsonError(`kind invalid; valori permise: ${VALID_KINDS.join(", ")}`, 400, "BATCH_KIND_INVALID")
    }
    if (typeof body.label !== "string" || !body.label.trim()) {
      return jsonError("label e obligatoriu.", 400, "BATCH_LABEL_REQUIRED")
    }
    if (!Array.isArray(body.itemKeys)) {
      return jsonError("itemKeys e obligatoriu (array).", 400, "BATCH_ITEMS_REQUIRED")
    }
    const created = await startBatchSession({
      orgId: session.orgId,
      kind: body.kind,
      label: body.label.trim(),
      itemKeys: body.itemKeys,
    })
    return NextResponse.json({ session: created })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Nu am putut porni sesiunea.", 500, "BATCH_START_FAILED")
  }
}
