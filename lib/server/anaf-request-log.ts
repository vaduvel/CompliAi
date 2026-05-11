// ANAF request/response audit log per org.
// Inspired by pzs/nav-online-invoice's getLastRequestData() pattern: when ANAF
// rejects a submission, the accountant needs the raw request + response + headers
// to dispute it or prove what was sent. Persisted in Supabase via supabase-rest
// when available; falls back to in-memory map otherwise.

import { hasSupabaseConfig, supabaseInsert, supabaseSelect } from "./supabase-rest"

const MAX_ENTRIES_PER_ORG = 100
const inMemoryByOrg = new Map<string, AnafRequestLogEntry[]>()

export type AnafRequestLogKind = "upload" | "status" | "list" | "download" | "probe"

export type AnafRequestLogEntry = {
  id: string
  orgId: string
  kind: AnafRequestLogKind
  url: string
  method: "GET" | "POST"
  /** Truncated to 16 KB to avoid blowing up Supabase rows */
  requestBody: string
  responseStatus: number
  responseHeaders: Record<string, string>
  responseBody: string
  correlationId: string | null
  anafIndexIncarcare: string | null
  anafExecutionStatus: string | null
  durationMs: number
  errorMessage: string | null
  createdAtISO: string
}

type SupabaseRow = {
  id: string
  org_id: string
  kind: AnafRequestLogKind
  url: string
  method: string
  request_body: string
  response_status: number
  response_headers: Record<string, string>
  response_body: string
  correlation_id: string | null
  anaf_index_incarcare: string | null
  anaf_execution_status: string | null
  duration_ms: number
  error_message: string | null
  created_at: string
}

const TRUNCATION_LIMIT = 16_384

function truncate(value: string): string {
  if (value.length <= TRUNCATION_LIMIT) return value
  return value.slice(0, TRUNCATION_LIMIT) + `\n…[truncated ${value.length - TRUNCATION_LIMIT} chars]`
}

function parseExecutionStatus(body: string): { index: string | null; status: string | null } {
  const indexMatch = body.match(/index_incarcare="([^"]+)"/i)
  const statusMatch = body.match(/ExecutionStatus="([^"]+)"/i)
  return {
    index: indexMatch?.[1] ?? null,
    status: statusMatch?.[1] ?? null,
  }
}

function rowToEntry(row: SupabaseRow): AnafRequestLogEntry {
  return {
    id: row.id,
    orgId: row.org_id,
    kind: row.kind,
    url: row.url,
    method: row.method as "GET" | "POST",
    requestBody: row.request_body,
    responseStatus: row.response_status,
    responseHeaders: row.response_headers,
    responseBody: row.response_body,
    correlationId: row.correlation_id,
    anafIndexIncarcare: row.anaf_index_incarcare,
    anafExecutionStatus: row.anaf_execution_status,
    durationMs: row.duration_ms,
    errorMessage: row.error_message,
    createdAtISO: row.created_at,
  }
}

function entryToRow(entry: AnafRequestLogEntry): SupabaseRow {
  return {
    id: entry.id,
    org_id: entry.orgId,
    kind: entry.kind,
    url: entry.url,
    method: entry.method,
    request_body: entry.requestBody,
    response_status: entry.responseStatus,
    response_headers: entry.responseHeaders,
    response_body: entry.responseBody,
    correlation_id: entry.correlationId,
    anaf_index_incarcare: entry.anafIndexIncarcare,
    anaf_execution_status: entry.anafExecutionStatus,
    duration_ms: entry.durationMs,
    error_message: entry.errorMessage,
    created_at: entry.createdAtISO,
  }
}

export async function logAnafRequest(params: {
  orgId: string
  kind: AnafRequestLogKind
  url: string
  method: "GET" | "POST"
  requestBody: string
  responseStatus: number
  responseHeaders: Record<string, string>
  responseBody: string
  durationMs: number
  errorMessage?: string | null
}): Promise<AnafRequestLogEntry> {
  const correlationId = params.responseHeaders["x-correlation-id"] ?? null
  const { index, status } = parseExecutionStatus(params.responseBody)

  const entry: AnafRequestLogEntry = {
    id: `anaf-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orgId: params.orgId,
    kind: params.kind,
    url: params.url,
    method: params.method,
    requestBody: truncate(params.requestBody),
    responseStatus: params.responseStatus,
    responseHeaders: params.responseHeaders,
    responseBody: truncate(params.responseBody),
    correlationId,
    anafIndexIncarcare: index,
    anafExecutionStatus: status,
    durationMs: params.durationMs,
    errorMessage: params.errorMessage ?? null,
    createdAtISO: new Date().toISOString(),
  }

  if (hasSupabaseConfig()) {
    try {
      await supabaseInsert("anaf_request_log", [entryToRow(entry)])
    } catch {
      // Non-critical — fall through to in-memory cache
    }
  }

  const bucket = inMemoryByOrg.get(params.orgId) ?? []
  bucket.unshift(entry)
  inMemoryByOrg.set(params.orgId, bucket.slice(0, MAX_ENTRIES_PER_ORG))

  return entry
}

export async function listAnafRequestLog(
  orgId: string,
  limit = 20,
): Promise<AnafRequestLogEntry[]> {
  if (hasSupabaseConfig()) {
    try {
      const rows = await supabaseSelect<SupabaseRow>(
        "anaf_request_log",
        `select=*&org_id=eq.${encodeURIComponent(orgId)}&order=created_at.desc&limit=${limit}`,
        "public",
      )
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map(rowToEntry)
      }
    } catch {
      // Fall through
    }
  }
  const bucket = inMemoryByOrg.get(orgId) ?? []
  return bucket.slice(0, limit)
}

export async function getAnafRequestLogEntry(
  orgId: string,
  entryId: string,
): Promise<AnafRequestLogEntry | null> {
  const entries = await listAnafRequestLog(orgId, MAX_ENTRIES_PER_ORG)
  return entries.find((entry) => entry.id === entryId) ?? null
}
