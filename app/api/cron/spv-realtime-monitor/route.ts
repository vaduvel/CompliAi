// Real-time SPV monitor — cron 4x/zi (06:00, 12:00, 16:00, 20:00 RO).
//
// Pain point: ANAF SPV mesaje noi pot apărea oricând (notificări e-TVA,
// confirmări e-Factura, mesaje conformare). Cron lunar = târziu cu 25-30
// zile. Acest cron sub-ora poll-uiește 4x/zi pentru detectare rapidă (SLA 6h).
//
// Pattern QuickConta dar fără sub-minute polling (rate limit ANAF 100 req/h
// prin OAuth standard).
//
// Logica:
//   1. Pentru fiecare org cu integrations.spv connected
//   2. fetchSpvMessages(token, cif, days=1) — doar ultima zi
//   3. Identifică mesaje NOI (id nu e în state.spvSeenMessageIds)
//   4. Pentru fiecare nou: convert la signal/finding, notifică user
//   5. Persistă noile id-uri în state ca să nu redetectăm

import { NextResponse } from "next/server"
import { listAllOrgIds, readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { ensureValidToken, fetchSpvMessages, type SpvMessage } from "@/lib/anaf-spv-client"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { systemEventActor } from "@/lib/server/event-actor"
import { safeRecordCronRun } from "@/lib/server/cron-status-store"
import type { ComplianceState } from "@/lib/compliance/types"

type StateWithSpvSeen = ComplianceState & {
  spvSeenMessageIds?: string[]      // last 500 message IDs deja procesate
  spvLastPollAtISO?: string
}

const MAX_SEEN_IDS = 500              // cap istoric ca să nu crească state-ul

function classifyMessageUrgency(msg: SpvMessage): "critical" | "high" | "medium" | "info" {
  const tip = msg.tip.toLowerCase()
  const det = msg.detalii.toLowerCase()

  if (tip.includes("amenda") || tip.includes("decizie") || det.includes("amend")) return "critical"
  if (tip.includes("notificare") && (det.includes("e-tva") || det.includes("conformare"))) return "high"
  if (tip.includes("erori") || det.includes("respins")) return "high"
  if (tip.includes("factura") && det.includes("primit")) return "info"
  return "medium"
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
  const startMs = Date.now()
  const orgIds = await listAllOrgIds()
  let processed = 0
  let totalNewMessages = 0
  let criticalCount = 0
  let errors = 0

  for (const orgId of orgIds) {
    try {
      const state = (await readStateForOrg(orgId)) as StateWithSpvSeen | null
      if (!state) continue

      const cui = state.orgProfile?.cui
      if (!cui) continue
      // Doar orgs cu integrare ANAF SPV connected
      const tokenResult = await ensureValidToken(orgId, nowISO)
      if (!tokenResult.token || tokenResult.expired) continue

      const cleanCif = cui.replace(/^RO/i, "")
      const response = await fetchSpvMessages(tokenResult.token.accessToken, cleanCif, 1)
      if (!response || response.eroare || !response.mesaje) continue

      const seenIds = new Set(state.spvSeenMessageIds ?? [])
      const newMessages = response.mesaje.filter((m) => !seenIds.has(m.id))

      if (newMessages.length === 0) {
        await writeStateForOrg(orgId, { ...state, spvLastPollAtISO: nowISO })
        processed++
        continue
      }

      // Auditează fiecare mesaj nou ca event
      const events = newMessages.map((msg) => {
        const urgency = classifyMessageUrgency(msg)
        if (urgency === "critical") criticalCount++
        return createComplianceEvent(
          {
            type: "spv.realtime.message_detected",
            entityType: "system",
            entityId: msg.id,
            message: `[${urgency.toUpperCase()}] SPV message nou: ${msg.tip} — ${msg.detalii.slice(0, 100)}`,
            createdAtISO: nowISO,
            metadata: {
              spvId: msg.id,
              tip: msg.tip,
              urgency,
              dataCreare: msg.dataCreare,
              cif: msg.cif,
            },
          },
          systemEventActor("CompliScan spv-realtime cron"),
        )
      })

      // Update seen IDs (cap la MAX_SEEN_IDS)
      const updatedSeen = [
        ...(state.spvSeenMessageIds ?? []),
        ...newMessages.map((m) => m.id),
      ].slice(-MAX_SEEN_IDS)

      await writeStateForOrg(orgId, {
        ...state,
        spvSeenMessageIds: updatedSeen,
        spvLastPollAtISO: nowISO,
        events: appendComplianceEvents(state, events),
      })

      processed++
      totalNewMessages += newMessages.length
    } catch (err) {
      errors++
      console.error(`[spv-realtime-monitor] org ${orgId} failed:`, err)
    }
  }

  await safeRecordCronRun({
    name: "spv-realtime-monitor",
    lastRunAtISO: nowISO,
    ok: errors === 0,
    durationMs: Date.now() - startMs,
    summary:
      totalNewMessages === 0
        ? `${processed} orgs verificate, nicio mesaj nou.`
        : `${totalNewMessages} mesaje noi (${criticalCount} critice) din ${processed} orgs.`,
    stats: {
      processed,
      totalNewMessages,
      criticalCount,
      errors,
    },
  })

  return NextResponse.json({
    processed,
    totalNewMessages,
    criticalCount,
    errors,
    timestamp: nowISO,
    nextPollSlots: ["06:00", "12:00", "16:00", "20:00"],
  })
}
