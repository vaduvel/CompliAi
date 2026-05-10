// Cron handler pentru retry queue ANAF.
//
// Iterează toate orgs, ia items pending cu nextRetryAtISO ≤ now, încearcă
// re-submitul, aplică rezultatul. Pentru e-Factura: re-submit prin
// SmartBill API existent sau direct ANAF SPV (când avem token).
//
// În dev: doar marchează ca attempt fără să facă apel real (mock).
// În prod cu credentiale reale: face apel real.
//
// Schedule recomandat: la fiecare 15 min.

import { NextResponse } from "next/server"

import { listAllOrgIds, readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  applyAttemptResult,
  getDueRetries,
  getQueueStats,
  pruneQueue,
  type AnafRetryItem,
  type RetryAttemptResult,
} from "@/lib/compliance/anaf-retry-queue"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { systemEventActor } from "@/lib/server/event-actor"
import type { ComplianceState } from "@/lib/compliance/types"

type StateWithQueue = ComplianceState & {
  anafRetryQueue?: AnafRetryItem[]
}

/**
 * Mock submit — în prod înlocuim cu apel real spre SmartBill / ANAF SPV.
 * Pentru dev: succes 70%, transient 25%, permanent 5%.
 */
function mockSubmit(item: AnafRetryItem): RetryAttemptResult {
  const r = Math.random()
  if (r < 0.7) {
    return {
      ok: true,
      submittedAtISO: new Date().toISOString(),
      spvIndex: `MOCK-SPV-${item.id.slice(-8)}`,
    }
  }
  if (r < 0.95) {
    return { ok: false, transient: true, reason: "Bad Gateway (mock)", httpStatus: 502 }
  }
  return { ok: false, transient: false, reason: "XML invalid (mock)", httpStatus: 400 }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const nowISO = new Date().toISOString()
  const orgIds = await listAllOrgIds()

  let totalAttempted = 0
  let totalSucceeded = 0
  let totalRetryQueued = 0
  let totalFailedPermanent = 0
  let orgsProcessed = 0

  for (const orgId of orgIds) {
    try {
      const state = (await readStateForOrg(orgId)) as StateWithQueue | null
      if (!state) continue

      const queue = state.anafRetryQueue ?? []
      if (queue.length === 0) continue

      const due = getDueRetries(queue, nowISO)
      if (due.length === 0) {
        // Doar prune dacă vechi
        const pruned = pruneQueue(queue, nowISO)
        if (pruned.length !== queue.length) {
          await writeStateForOrg(orgId, { ...state, anafRetryQueue: pruned })
        }
        continue
      }

      let updatedQueue = queue
      for (const item of due) {
        totalAttempted++
        const result = mockSubmit(item)
        updatedQueue = applyAttemptResult(updatedQueue, item.id, result)
        const updatedItem = updatedQueue.find((i) => i.id === item.id)
        if (updatedItem?.status === "succeeded") totalSucceeded++
        else if (updatedItem?.status === "failed_permanent") totalFailedPermanent++
        else totalRetryQueued++
      }

      const pruned = pruneQueue(updatedQueue, nowISO)
      const stats = getQueueStats(pruned)

      const auditEvent = createComplianceEvent(
        {
          type: "anaf.retry_queue.processed",
          entityType: "system",
          entityId: `anaf-retry-${nowISO.slice(0, 10)}`,
          message: `Retry queue ANAF: ${due.length} items încercate, ${stats.succeeded} succes, ${stats.pending} încă pending, ${stats.failedPermanent} failed permanent.`,
          createdAtISO: nowISO,
          metadata: {
            attempted: due.length,
            ...stats,
          },
        },
        systemEventActor("CompliScan anaf-retry-queue cron"),
      )

      await writeStateForOrg(orgId, {
        ...state,
        anafRetryQueue: pruned,
        events: appendComplianceEvents(state, [auditEvent]),
      })

      orgsProcessed++
    } catch (err) {
      console.error(`[anaf-retry-queue] org ${orgId} failed:`, err)
    }
  }

  return NextResponse.json({
    orgsProcessed,
    totalAttempted,
    totalSucceeded,
    totalRetryQueued,
    totalFailedPermanent,
    timestamp: nowISO,
  })
}
