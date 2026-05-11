// Resumable batch session state for bulk invoice processing.
// Inspired by artpods56/ksef2 — bulk uploads with 100-1000 invoices crash on
// item 437/500 and lose progress today. We persist per-item state so a crashed
// session can resume from the next pending item instead of restarting.

import { hasSupabaseConfig, supabaseInsert, supabaseSelect, supabaseUpdate } from "./supabase-rest"

export type BatchItemStatus = "pending" | "processing" | "succeeded" | "failed" | "skipped"
export type BatchKind = "validate" | "upload" | "import-erp"

export type BatchItem = {
  itemIndex: number
  /** Stable identifier for idempotency (e.g., invoice number hash). */
  itemKey: string
  status: BatchItemStatus
  /** Result snapshot persisted on completion (truncated to 4 KB). */
  resultSnippet: string | null
  errorMessage: string | null
  durationMs: number | null
  updatedAtISO: string
}

export type BatchSession = {
  sessionId: string
  orgId: string
  kind: BatchKind
  label: string
  totalItems: number
  processedCount: number
  failedCount: number
  succeededCount: number
  status: "active" | "completed" | "cancelled"
  createdAtISO: string
  updatedAtISO: string
  /** Per-item state. */
  items: BatchItem[]
}

type SessionRow = {
  session_id: string
  org_id: string
  kind: BatchKind
  label: string
  total_items: number
  processed_count: number
  failed_count: number
  succeeded_count: number
  status: BatchSession["status"]
  items: BatchItem[]
  created_at: string
  updated_at: string
}

const TABLE = "batch_sessions"
const RESULT_SNIPPET_LIMIT = 4_096
const inMemorySessions = new Map<string, BatchSession>()

function truncate(value: string | null | undefined): string | null {
  if (!value) return null
  return value.length > RESULT_SNIPPET_LIMIT
    ? value.slice(0, RESULT_SNIPPET_LIMIT) + `…[${value.length - RESULT_SNIPPET_LIMIT} chars]`
    : value
}

function sessionToRow(session: BatchSession): SessionRow {
  return {
    session_id: session.sessionId,
    org_id: session.orgId,
    kind: session.kind,
    label: session.label,
    total_items: session.totalItems,
    processed_count: session.processedCount,
    failed_count: session.failedCount,
    succeeded_count: session.succeededCount,
    status: session.status,
    items: session.items,
    created_at: session.createdAtISO,
    updated_at: session.updatedAtISO,
  }
}

function rowToSession(row: SessionRow): BatchSession {
  return {
    sessionId: row.session_id,
    orgId: row.org_id,
    kind: row.kind,
    label: row.label,
    totalItems: row.total_items,
    processedCount: row.processed_count,
    failedCount: row.failed_count,
    succeededCount: row.succeeded_count,
    status: row.status,
    items: row.items,
    createdAtISO: row.created_at,
    updatedAtISO: row.updated_at,
  }
}

async function persistSession(session: BatchSession, isNew = false): Promise<void> {
  inMemorySessions.set(session.sessionId, session)
  if (!hasSupabaseConfig()) return
  try {
    if (isNew) {
      await supabaseInsert(TABLE, [sessionToRow(session)])
    } else {
      await supabaseUpdate(
        TABLE,
        `session_id=eq.${encodeURIComponent(session.sessionId)}`,
        sessionToRow(session),
      )
    }
  } catch {
    // Non-critical — in-memory cache keeps the session alive for this instance
  }
}

export async function startBatchSession(params: {
  orgId: string
  kind: BatchKind
  label: string
  itemKeys: string[]
}): Promise<BatchSession> {
  const nowISO = new Date().toISOString()
  const sessionId = `batch-${nowISO.replace(/[^0-9]/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 6)}`
  const items: BatchItem[] = params.itemKeys.map((itemKey, idx) => ({
    itemIndex: idx,
    itemKey,
    status: "pending",
    resultSnippet: null,
    errorMessage: null,
    durationMs: null,
    updatedAtISO: nowISO,
  }))
  const session: BatchSession = {
    sessionId,
    orgId: params.orgId,
    kind: params.kind,
    label: params.label,
    totalItems: items.length,
    processedCount: 0,
    failedCount: 0,
    succeededCount: 0,
    status: items.length === 0 ? "completed" : "active",
    createdAtISO: nowISO,
    updatedAtISO: nowISO,
    items,
  }
  await persistSession(session, true)
  return session
}

export async function loadBatchSession(
  orgId: string,
  sessionId: string,
): Promise<BatchSession | null> {
  if (hasSupabaseConfig()) {
    try {
      const rows = await supabaseSelect<SessionRow>(
        TABLE,
        `select=*&session_id=eq.${encodeURIComponent(sessionId)}&org_id=eq.${encodeURIComponent(orgId)}&limit=1`,
        "public",
      )
      const row = rows?.[0]
      if (row) {
        const session = rowToSession(row)
        inMemorySessions.set(sessionId, session)
        return session
      }
    } catch {
      // Fall back to in-memory
    }
  }
  return inMemorySessions.get(sessionId) ?? null
}

export async function listActiveBatchSessions(orgId: string): Promise<BatchSession[]> {
  if (hasSupabaseConfig()) {
    try {
      const rows = await supabaseSelect<SessionRow>(
        TABLE,
        `select=*&org_id=eq.${encodeURIComponent(orgId)}&status=eq.active&order=created_at.desc&limit=10`,
        "public",
      )
      if (Array.isArray(rows)) return rows.map(rowToSession)
    } catch {
      // Fall through
    }
  }
  return Array.from(inMemorySessions.values()).filter(
    (s) => s.orgId === orgId && s.status === "active",
  )
}

export async function updateBatchItem(
  session: BatchSession,
  itemIndex: number,
  patch: {
    status: BatchItemStatus
    resultSnippet?: string | null
    errorMessage?: string | null
    durationMs?: number | null
  },
): Promise<BatchSession> {
  const nowISO = new Date().toISOString()
  const updated: BatchSession = { ...session, updatedAtISO: nowISO, items: [...session.items] }
  const previous = updated.items[itemIndex]
  if (!previous) return session

  const next: BatchItem = {
    ...previous,
    status: patch.status,
    resultSnippet: patch.resultSnippet !== undefined ? truncate(patch.resultSnippet) : previous.resultSnippet,
    errorMessage: patch.errorMessage !== undefined ? patch.errorMessage : previous.errorMessage,
    durationMs: patch.durationMs !== undefined ? patch.durationMs : previous.durationMs,
    updatedAtISO: nowISO,
  }
  updated.items[itemIndex] = next

  updated.processedCount = updated.items.filter(
    (i) => i.status === "succeeded" || i.status === "failed" || i.status === "skipped",
  ).length
  updated.failedCount = updated.items.filter((i) => i.status === "failed").length
  updated.succeededCount = updated.items.filter((i) => i.status === "succeeded").length

  if (updated.processedCount === updated.totalItems) {
    updated.status = "completed"
  }

  await persistSession(updated)
  return updated
}

export async function cancelBatchSession(session: BatchSession): Promise<BatchSession> {
  const nowISO = new Date().toISOString()
  const updated: BatchSession = { ...session, status: "cancelled", updatedAtISO: nowISO }
  await persistSession(updated)
  return updated
}

/**
 * Find the next pending item to process. Returns null when the session is
 * exhausted. Used by workers to drive the queue.
 */
export function nextPendingItem(session: BatchSession): BatchItem | null {
  return session.items.find((item) => item.status === "pending") ?? null
}

/**
 * Resume a crashed session by retrying every item still pending or marked as
 * failed-with-transient-error. Caller supplies the processor.
 */
export async function resumeBatchSession(
  session: BatchSession,
  processor: (item: BatchItem) => Promise<{
    status: Exclude<BatchItemStatus, "pending" | "processing">
    resultSnippet?: string | null
    errorMessage?: string | null
  }>,
): Promise<BatchSession> {
  let current = session
  while (true) {
    const item = nextPendingItem(current)
    if (!item) break
    const startedAt = Date.now()
    try {
      const result = await processor(item)
      current = await updateBatchItem(current, item.itemIndex, {
        status: result.status,
        resultSnippet: result.resultSnippet,
        errorMessage: result.errorMessage,
        durationMs: Date.now() - startedAt,
      })
    } catch (err) {
      current = await updateBatchItem(current, item.itemIndex, {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Processor threw an unknown error.",
        durationMs: Date.now() - startedAt,
      })
    }
  }
  return current
}
