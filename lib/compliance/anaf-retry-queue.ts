// Buffer persistent pentru retry transmiteri ANAF eșuate temporar.
//
// Pain point research: ANAF e-Factura returnează „Bad Gateway", „endTime nu
// poate fi în viitor", server down — contabilul pierde facturile. Cu acest
// buffer, items-le sunt salvate în state, retry-uite automat la cron, alertă
// când reușesc sau eșuează final.
//
// Pure functions pentru queue management. State trăiește în
// ComplianceState.anafRetryQueue.

export type RetryAttemptResult =
  | { ok: true; submittedAtISO: string; spvIndex?: string }
  | { ok: false; transient: boolean; reason: string; httpStatus?: number }

export type AnafRetryItem = {
  id: string                          // unique queue item id
  type: "efactura_submit" | "etva_response" | "saft_upload"
  orgId: string
  payload: {                          // serializable payload pentru re-submit
    invoiceNumber?: string
    invoiceSeries?: string
    xml?: string                      // pentru e-Factura
    notificationId?: string           // pentru e-TVA
    period?: string                   // pentru SAF-T
    [k: string]: unknown
  }
  createdAtISO: string
  attempts: number
  maxAttempts: number                 // default 5
  nextRetryAtISO: string
  lastError: string | null
  lastAttemptAtISO: string | null
  status: "pending" | "succeeded" | "failed_permanent"
  successPayload?: { spvIndex: string; submittedAtISO: string }
}

export type RetryQueueOptions = {
  baseDelayMinutes?: number           // default 30 (30 min, 1h, 2h, 4h, 8h)
  maxAttempts?: number                // default 5
}

const DEFAULT_BASE_DELAY_MIN = 30
const DEFAULT_MAX_ATTEMPTS = 5

// ── Queue management ─────────────────────────────────────────────────────────

export function enqueueRetryItem(
  queue: AnafRetryItem[],
  newItem: Omit<AnafRetryItem, "id" | "attempts" | "nextRetryAtISO" | "status" | "lastError" | "lastAttemptAtISO">,
  opts: RetryQueueOptions = {},
): { queue: AnafRetryItem[]; item: AnafRetryItem } {
  const baseDelay = opts.baseDelayMinutes ?? DEFAULT_BASE_DELAY_MIN
  const maxAttempts = opts.maxAttempts ?? newItem.maxAttempts ?? DEFAULT_MAX_ATTEMPTS

  const id = `retry-${newItem.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const item: AnafRetryItem = {
    id,
    type: newItem.type,
    orgId: newItem.orgId,
    payload: newItem.payload,
    createdAtISO: newItem.createdAtISO,
    attempts: 0,
    maxAttempts,
    nextRetryAtISO: new Date(Date.now() + baseDelay * 60_000).toISOString(),
    lastError: null,
    lastAttemptAtISO: null,
    status: "pending",
  }
  return { queue: [...queue, item], item }
}

/**
 * Calculează când să fie încercat din nou: exponential backoff cu jitter.
 * 30 min, 1h, 2h, 4h, 8h.
 */
export function computeNextRetry(
  attempt: number,
  baseDelayMinutes: number = DEFAULT_BASE_DELAY_MIN,
): string {
  const minutes = baseDelayMinutes * Math.pow(2, Math.max(0, attempt - 1))
  const jitter = Math.random() * 60_000  // ±1 min jitter
  return new Date(Date.now() + minutes * 60_000 + jitter).toISOString()
}

/**
 * Aplică rezultatul unui attempt asupra queue-ului.
 */
export function applyAttemptResult(
  queue: AnafRetryItem[],
  itemId: string,
  result: RetryAttemptResult,
  opts: RetryQueueOptions = {},
): AnafRetryItem[] {
  const baseDelay = opts.baseDelayMinutes ?? DEFAULT_BASE_DELAY_MIN
  const nowISO = new Date().toISOString()

  return queue.map((item) => {
    if (item.id !== itemId) return item
    if (item.status !== "pending") return item

    const nextAttempt = item.attempts + 1

    if (result.ok) {
      return {
        ...item,
        attempts: nextAttempt,
        lastAttemptAtISO: nowISO,
        lastError: null,
        status: "succeeded",
        successPayload: {
          spvIndex: result.spvIndex ?? "",
          submittedAtISO: result.submittedAtISO,
        },
      }
    }

    // Failure case
    if (!result.transient) {
      // Permanent failure — don't retry
      return {
        ...item,
        attempts: nextAttempt,
        lastAttemptAtISO: nowISO,
        lastError: result.reason,
        status: "failed_permanent",
      }
    }

    // Transient failure — retry with backoff
    if (nextAttempt >= item.maxAttempts) {
      return {
        ...item,
        attempts: nextAttempt,
        lastAttemptAtISO: nowISO,
        lastError: `${result.reason} (max attempts reached)`,
        status: "failed_permanent",
      }
    }

    return {
      ...item,
      attempts: nextAttempt,
      lastAttemptAtISO: nowISO,
      lastError: result.reason,
      nextRetryAtISO: computeNextRetry(nextAttempt, baseDelay),
    }
  })
}

/**
 * Identifică transient errors din mesajul ANAF — astea trebuie retry-uite.
 * Permanent errors trebuie raportate user-ului fără retry.
 */
export function classifyAnafError(
  reason: string,
  httpStatus?: number,
): { transient: boolean; category: string } {
  const r = reason.toLowerCase()

  // HTTP 5xx → transient (ANAF down)
  if (httpStatus && httpStatus >= 500 && httpStatus < 600) {
    return { transient: true, category: "anaf_server_error" }
  }
  // 502/503/504 specifically
  if (httpStatus === 502 || httpStatus === 503 || httpStatus === 504) {
    return { transient: true, category: "anaf_gateway" }
  }
  // 429 rate limit → transient cu delay mai mare
  if (httpStatus === 429) {
    return { transient: true, category: "rate_limit" }
  }
  // Network error
  if (r.includes("econnrefused") || r.includes("etimedout") || r.includes("fetch failed")) {
    return { transient: true, category: "network" }
  }
  // ANAF-specific transient messages
  if (r.includes("bad gateway") || r.includes("server is busy") || r.includes("temporarily unavailable")) {
    return { transient: true, category: "anaf_busy" }
  }
  if (r.includes("endtime nu poate fi în viitor") || r.includes("endtime cannot be in the future")) {
    // Asta e bug ANAF — retry mai târziu
    return { transient: true, category: "anaf_clock_drift" }
  }
  // 401/403 → permanent (auth)
  if (httpStatus === 401 || httpStatus === 403) {
    return { transient: false, category: "auth" }
  }
  // 400 + validation → permanent (XML invalid, factură duplicată, etc.)
  if (httpStatus === 400) {
    return { transient: false, category: "validation" }
  }
  // 4xx general → permanent
  if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
    return { transient: false, category: "client_error" }
  }
  // Default: assume transient but with caution
  return { transient: true, category: "unknown" }
}

// ── Selectors / queries ──────────────────────────────────────────────────────

export function getDueRetries(queue: AnafRetryItem[], nowISO: string): AnafRetryItem[] {
  return queue.filter(
    (item) => item.status === "pending" && item.nextRetryAtISO <= nowISO,
  )
}

export function getQueueStats(queue: AnafRetryItem[]): {
  pending: number
  succeeded: number
  failedPermanent: number
  total: number
} {
  return {
    pending: queue.filter((i) => i.status === "pending").length,
    succeeded: queue.filter((i) => i.status === "succeeded").length,
    failedPermanent: queue.filter((i) => i.status === "failed_permanent").length,
    total: queue.length,
  }
}

/**
 * Curăță items vechi succedate (>30 zile) sau eșuate permanent (>7 zile).
 * Reduce dimensiunea state-ului în timp.
 */
export function pruneQueue(queue: AnafRetryItem[], nowISO: string): AnafRetryItem[] {
  const now = new Date(nowISO).getTime()
  return queue.filter((item) => {
    if (item.status === "succeeded" && item.lastAttemptAtISO) {
      const ageDays = (now - new Date(item.lastAttemptAtISO).getTime()) / 86_400_000
      return ageDays < 30
    }
    if (item.status === "failed_permanent" && item.lastAttemptAtISO) {
      const ageDays = (now - new Date(item.lastAttemptAtISO).getTime()) / 86_400_000
      return ageDays < 7
    }
    return true
  })
}
