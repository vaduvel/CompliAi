import { describe, it, expect } from "vitest"

import {
  applyAttemptResult,
  classifyAnafError,
  enqueueRetryItem,
  getDueRetries,
  getQueueStats,
  pruneQueue,
} from "./anaf-retry-queue"

describe("classifyAnafError", () => {
  it("502/503/504 → transient", () => {
    expect(classifyAnafError("Bad Gateway", 502).transient).toBe(true)
    expect(classifyAnafError("Service Unavailable", 503).transient).toBe(true)
    expect(classifyAnafError("Gateway Timeout", 504).transient).toBe(true)
  })

  it("401/403 → permanent (auth)", () => {
    expect(classifyAnafError("Unauthorized", 401).transient).toBe(false)
    expect(classifyAnafError("Forbidden", 403).transient).toBe(false)
  })

  it("400 → permanent (validation)", () => {
    expect(classifyAnafError("Invalid XML", 400).transient).toBe(false)
  })

  it("ANAF-specific transient messages", () => {
    expect(classifyAnafError("server is busy").transient).toBe(true)
    expect(classifyAnafError("endTime nu poate fi în viitor").transient).toBe(true)
  })

  it("Network errors → transient", () => {
    expect(classifyAnafError("ECONNREFUSED").transient).toBe(true)
    expect(classifyAnafError("fetch failed").transient).toBe(true)
  })
})

describe("enqueueRetryItem", () => {
  it("adaugă item cu nextRetryAtISO în viitor", () => {
    const { queue, item } = enqueueRetryItem([], {
      type: "efactura_submit",
      orgId: "org-1",
      payload: { invoiceNumber: "001", xml: "<x/>" },
      createdAtISO: "2026-05-10T10:00:00Z",
      maxAttempts: 5,
    })
    expect(queue.length).toBe(1)
    expect(item.status).toBe("pending")
    expect(item.attempts).toBe(0)
    expect(new Date(item.nextRetryAtISO).getTime()).toBeGreaterThan(Date.now())
  })
})

describe("applyAttemptResult", () => {
  function buildItem() {
    return enqueueRetryItem([], {
      type: "efactura_submit",
      orgId: "org-1",
      payload: { invoiceNumber: "001" },
      createdAtISO: "2026-05-10T10:00:00Z",
      maxAttempts: 3,
    }).queue[0]
  }

  it("succeeded → status succeeded + successPayload", () => {
    const item = buildItem()
    const result = applyAttemptResult(
      [item],
      item.id,
      { ok: true, submittedAtISO: "2026-05-10T11:00:00Z", spvIndex: "SPV-12345" },
    )
    expect(result[0].status).toBe("succeeded")
    expect(result[0].successPayload?.spvIndex).toBe("SPV-12345")
    expect(result[0].attempts).toBe(1)
  })

  it("transient failure → retry cu backoff exponential", () => {
    const item = buildItem()
    const after1 = applyAttemptResult(
      [item],
      item.id,
      { ok: false, transient: true, reason: "Bad Gateway" },
    )
    expect(after1[0].status).toBe("pending")
    expect(after1[0].attempts).toBe(1)
    expect(after1[0].lastError).toBe("Bad Gateway")
  })

  it("permanent failure → status failed_permanent (no retry)", () => {
    const item = buildItem()
    const result = applyAttemptResult(
      [item],
      item.id,
      { ok: false, transient: false, reason: "401 Unauthorized" },
    )
    expect(result[0].status).toBe("failed_permanent")
    expect(result[0].attempts).toBe(1)
  })

  it("max attempts reached → status failed_permanent", () => {
    let queue = [buildItem()]
    for (let i = 0; i < 3; i++) {
      queue = applyAttemptResult(queue, queue[0].id, {
        ok: false, transient: true, reason: "Bad Gateway",
      })
    }
    expect(queue[0].status).toBe("failed_permanent")
    expect(queue[0].attempts).toBe(3)
    expect(queue[0].lastError).toContain("max attempts reached")
  })
})

describe("getDueRetries", () => {
  it("returnează doar items pending cu nextRetryAtISO ≤ now", () => {
    const item = enqueueRetryItem([], {
      type: "efactura_submit",
      orgId: "org-1",
      payload: {},
      createdAtISO: "2026-05-10T10:00:00Z",
      maxAttempts: 3,
    }).queue[0]
    // item.nextRetryAtISO e ~30 min în viitor
    const dueNow = getDueRetries([item], new Date().toISOString())
    expect(dueNow.length).toBe(0)
    const dueLater = getDueRetries([item], new Date(Date.now() + 31 * 60_000).toISOString())
    expect(dueLater.length).toBe(1)
  })
})

describe("getQueueStats", () => {
  it("contorizează corect status-urile", () => {
    const items = [
      { ...stub("a"), status: "pending" as const },
      { ...stub("b"), status: "succeeded" as const },
      { ...stub("c"), status: "failed_permanent" as const },
      { ...stub("d"), status: "pending" as const },
    ]
    const s = getQueueStats(items)
    expect(s).toEqual({ pending: 2, succeeded: 1, failedPermanent: 1, total: 4 })
  })
})

describe("pruneQueue", () => {
  it("șterge succeeded > 30 zile", () => {
    const old: any = { ...stub("old"), status: "succeeded", lastAttemptAtISO: "2025-01-01T00:00:00Z" }
    const recent: any = { ...stub("rec"), status: "succeeded", lastAttemptAtISO: new Date().toISOString() }
    const pending: any = { ...stub("pend"), status: "pending" }
    const result = pruneQueue([old, recent, pending], new Date().toISOString())
    expect(result.length).toBe(2)
    expect(result.find((i) => i.id === old.id)).toBeUndefined()
  })
})

function stub(id: string) {
  return {
    id,
    type: "efactura_submit" as const,
    orgId: "x",
    payload: {},
    createdAtISO: "2026-05-10T10:00:00Z",
    attempts: 0,
    maxAttempts: 5,
    nextRetryAtISO: "2099-01-01T00:00:00Z",
    lastError: null,
    lastAttemptAtISO: null,
    status: "pending" as const,
  }
}
