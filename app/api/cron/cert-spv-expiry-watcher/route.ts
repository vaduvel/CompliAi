// Cron F#4 — Certificate SPV expiry watcher.
//
// Rulează zilnic. Pentru fiecare org cabinet cu certSpvRecords:
//   1. Recalculează status pe baza datelor curente.
//   2. Pentru fiecare cert at-risk (expired / unauthorized / critical / soon):
//      - Dacă daysUntilExpiry e în ALERT_TRIGGER_DAYS (30/14/7/3/1/0), trimite email.
//   3. Adaugă audit event.
//
// Skip sâmbătă/duminică/sărbători (isAlertableToday).

import { NextResponse } from "next/server"
import { listAllOrgIds, readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { listOrganizationMembers } from "@/lib/server/auth"
import {
  buildSnapshot,
  daysUntilExpiry,
  isAlertableToday,
  recomputeStatus,
  shouldSendAlert,
  type CertSpvRecord,
} from "@/lib/compliance/cert-spv-tracker"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { systemEventActor } from "@/lib/server/event-actor"
import { safeRecordCronRun } from "@/lib/server/cron-status-store"
import { sendOperationalEmail } from "@/lib/server/fiscal-reminder-email"
import type { ComplianceState } from "@/lib/compliance/types"

type StateWithCert = ComplianceState & {
  certSpvRecords?: CertSpvRecord[]
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
  const alertable = isAlertableToday(nowISO)

  const orgIds = await listAllOrgIds()
  let processed = 0
  let emailsSent = 0
  let recordsTracked = 0
  let errors = 0
  let alertsSkippedWeekend = 0
  const errorDetails: Array<{ orgId: string; reason: string }> = []

  for (const orgId of orgIds) {
    try {
      const state = (await readStateForOrg(orgId)) as StateWithCert | null
      if (!state) continue
      const records = state.certSpvRecords ?? []
      if (records.length === 0) continue

      const refreshed = records.map((r) => recomputeStatus(r, nowISO))
      recordsTracked += refreshed.length

      // Persist statusul recalculat (chiar dacă nu trimitem email)
      await writeStateForOrg(orgId, { ...state, certSpvRecords: refreshed })

      const snapshot = buildSnapshot(refreshed)
      if (snapshot.atRiskRecords.length === 0) {
        processed++
        continue
      }

      // Trigger emails DOAR în zile lucrătoare RO
      if (!alertable) {
        alertsSkippedWeekend++
        processed++
        continue
      }

      // Filtru: certificate care trebuie sa primeasca alert AZI
      const toAlert = snapshot.atRiskRecords.filter((r) => {
        if (r.status === "expired" || r.status === "unauthorized") return true // mereu alert
        const days = daysUntilExpiry(r.validUntilISO, nowISO)
        return shouldSendAlert(days)
      })

      if (toAlert.length === 0) {
        processed++
        continue
      }

      const members = await listOrganizationMembers(orgId)
      const owner = members.find((m) => m.role === "owner")
      const recipient = owner?.email ?? members.find((m) => !!m.email)?.email
      if (!recipient) {
        processed++
        continue
      }

      const subject = `[CompliScan Cert SPV] ${toAlert.length} certificate digitale necesită atenție`
      const body = [
        `Bună,`,
        ``,
        `Reminder automat CompliScan — Certificate digitale SPV:`,
        ``,
        ...toAlert.slice(0, 10).map((r) => {
          const days = daysUntilExpiry(r.validUntilISO, nowISO)
          return `- ${r.clientName} (${r.clientCif}) — ${r.ownerName}: ${
            r.status === "expired"
              ? `EXPIRAT acum ${Math.abs(days)} zile`
              : r.status === "unauthorized"
                ? `SPV "Utilizator neautorizat" — verifică re-enrollment`
                : `expiră în ${days} ${days === 1 ? "zi" : "zile"} (${r.status})`
          }`
        }),
        ``,
        `Acțiune recomandată:`,
        `- Pentru certificate expiring_critical: începe procedura reînnoire ACUM (poate dura 24h-2 săptămâni).`,
        `- Pentru certificate "unauthorized": deschide ANAF SPV → Modificare date → Reînnoire certificat.`,
        ``,
        `Deschide CompliScan → Fiscal → Cockpit → Cert SPV manager pentru detalii complete.`,
        ``,
        `— CompliScan (mesaj automat)`,
      ].join("\n")

      const result = await sendOperationalEmail({
        to: recipient,
        subject,
        body,
        label: `cert-spv-watcher:${orgId}`,
      })

      if (result.ok) emailsSent++

      const auditEvent = createComplianceEvent(
        {
          type: "fiscal.cert_spv_alert_sent",
          entityType: "system",
          entityId: `cert-alert-${nowISO.slice(0, 10)}`,
          message: `Cert SPV alert: ${toAlert.length} certificate at-risk pentru ${snapshot.total} total tracked.`,
          createdAtISO: nowISO,
          metadata: {
            totalRecords: snapshot.total,
            atRiskCount: snapshot.atRiskRecords.length,
            alertedCount: toAlert.length,
            channel: result.channel,
            ok: result.ok,
            reason: result.reason ?? "",
          },
        },
        systemEventActor("CompliScan cert-spv-expiry cron"),
      )

      await writeStateForOrg(orgId, {
        ...state,
        certSpvRecords: refreshed,
        events: appendComplianceEvents(state, [auditEvent]),
      })

      processed++
    } catch (err) {
      errors++
      const reason = err instanceof Error ? err.message : String(err)
      errorDetails.push({ orgId, reason: reason.slice(0, 200) })
      console.error(`[cert-spv-expiry-watcher] org ${orgId} failed:`, err)
    }
  }

  await safeRecordCronRun({
    name: "cert-spv-expiry-watcher",
    lastRunAtISO: nowISO,
    ok: errors === 0,
    durationMs: Date.now() - startMs,
    summary: alertable
      ? `${emailsSent} email-uri trimise, ${recordsTracked} certificate tracked, ${errors} erori.`
      : `Sărit (weekend/sărbătoare). ${recordsTracked} certificate status recalculat.`,
    stats: {
      processed,
      emailsSent,
      recordsTracked,
      alertsSkippedWeekend,
      errors,
      alertableToday: alertable ? 1 : 0,
    },
    errorMessage:
      errors > 0 && errorDetails[0]
        ? `${errorDetails[0].reason}${errorDetails.length > 1 ? ` (+${errorDetails.length - 1} more)` : ""}`
        : undefined,
  })

  return NextResponse.json({
    processed,
    emailsSent,
    recordsTracked,
    alertsSkippedWeekend,
    errors,
    alertableToday: alertable,
    timestamp: nowISO,
  })
}
