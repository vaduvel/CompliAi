// Cron PFA Form 082 deadline alert.
//
// Rulează zilnic. Pentru fiecare org cu pfaForm082Clients:
//   1. Calculează zile rămase până la 26 mai 2026.
//   2. Dacă urgency >= "medium": trimite email reminder către owner-ul org.
//   3. Adaugă audit event.
//
// Trigger zile critice: 14, 7, 3, 1 zile înainte.

import { NextResponse } from "next/server"
import { listAllOrgIds, readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { listOrganizationMembers } from "@/lib/server/auth"
import {
  buildSnapshot,
  computeDaysUntilDeadline,
  PFA_FORM082_DEADLINE_ISO,
  type PfaClientRecord,
} from "@/lib/compliance/pfa-form082-tracker"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { systemEventActor } from "@/lib/server/event-actor"
import { safeRecordCronRun } from "@/lib/server/cron-status-store"
import { sendOperationalEmail } from "@/lib/server/fiscal-reminder-email"
import type { ComplianceState } from "@/lib/compliance/types"

type StateWithPfa = ComplianceState & {
  pfaForm082Clients?: PfaClientRecord[]
}

const TRIGGER_DAYS = new Set([14, 7, 3, 1, 0])

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
  const daysUntilDeadline = computeDaysUntilDeadline(nowISO)
  const isTriggerDay = TRIGGER_DAYS.has(daysUntilDeadline)

  const orgIds = await listAllOrgIds()
  let processed = 0
  let emailsSent = 0
  let skippedNoAtRisk = 0
  let errors = 0
  const errorDetails: Array<{ orgId: string; reason: string }> = []

  for (const orgId of orgIds) {
    try {
      const state = (await readStateForOrg(orgId)) as StateWithPfa | null
      if (!state) continue
      const clients = state.pfaForm082Clients ?? []
      if (clients.length === 0) continue

      const snapshot = buildSnapshot(clients, nowISO)
      if (snapshot.atRiskClients.length === 0) {
        skippedNoAtRisk++
        continue
      }

      // Trimite email DOAR la zilele trigger SAU urgență critical
      if (!isTriggerDay && snapshot.urgency !== "critical") {
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

      const subject =
        daysUntilDeadline <= 0
          ? `[CRITIC] PFA Form 082: deadline EXPIRAT — ${snapshot.atRiskClients.length} clienți afectați`
          : `PFA Form 082: ${daysUntilDeadline} zile rămase — ${snapshot.atRiskClients.length} clienți de registrat`

      const body = [
        `Bună,`,
        ``,
        `Reminder automat CompliScan: deadline-ul pentru registrarea PFA / CNP în Registrul RO e-Factura via Formular 082 este 26 mai 2026.`,
        ``,
        `Status portofoliul tău:`,
        `- Total clienți PFA tracked: ${snapshot.totalClients}`,
        `- Înregistrați: ${snapshot.registered}`,
        `- Form depus, în așteptare: ${snapshot.formSubmitted}`,
        `- Neînregistrați: ${snapshot.notRegistered}`,
        `- Status necunoscut: ${snapshot.unknown}`,
        `- Exempt: ${snapshot.exempt}`,
        ``,
        `Zile rămase: ${snapshot.daysUntilDeadline >= 0 ? snapshot.daysUntilDeadline : "EXPIRAT (" + Math.abs(snapshot.daysUntilDeadline) + " zile peste)"}`,
        `Urgență: ${snapshot.urgency.toUpperCase()}`,
        ``,
        `Clienți cu probleme (top 5):`,
        ...snapshot.atRiskClients.slice(0, 5).map(
          (c) => `  - ${c.name} (${c.taxId}) — status: ${c.status}`,
        ),
        ``,
        `Acțiune recomandată: deschide CompliScan → Fiscal → tab "PFA / Form 082" pentru a vedea lista completă și a depune Form 082 prin SPV.`,
        ``,
        `Bază legală: OG 6/2026 + Ordin ANAF 378/2026.`,
        ``,
        `— CompliScan (mesaj automat)`,
      ].join("\n")

      const result = await sendOperationalEmail({
        to: recipient,
        subject,
        body,
        label: `pfa-form082-deadline-alert:${orgId}`,
      })

      if (result.ok) emailsSent++

      const auditEvent = createComplianceEvent(
        {
          type: "fiscal.pfa_form082_alert_sent",
          entityType: "system",
          entityId: `pfa-alert-${nowISO.slice(0, 10)}`,
          message: `PFA Form 082 alert: ${snapshot.atRiskClients.length} clienți, ${daysUntilDeadline} zile rămase.`,
          createdAtISO: nowISO,
          metadata: {
            daysUntilDeadline,
            urgency: snapshot.urgency,
            atRiskCount: snapshot.atRiskClients.length,
            channel: result.channel,
            ok: result.ok,
            reason: result.reason ?? "",
          },
        },
        systemEventActor("CompliScan pfa-form082 cron"),
      )

      await writeStateForOrg(orgId, {
        ...state,
        events: appendComplianceEvents(state, [auditEvent]),
      })

      processed++
    } catch (err) {
      errors++
      const reason = err instanceof Error ? err.message : String(err)
      errorDetails.push({ orgId, reason: reason.slice(0, 200) })
      console.error(`[pfa-form082-deadline-alert] org ${orgId} failed:`, err)
    }
  }

  await safeRecordCronRun({
    name: "pfa-form082-deadline-alert",
    lastRunAtISO: nowISO,
    ok: errors === 0,
    durationMs: Date.now() - startMs,
    summary: `${emailsSent} email-uri trimise, ${skippedNoAtRisk} fără risk, ${errors} erori (${processed} procesate, ${daysUntilDeadline} zile până 26 mai 2026).`,
    stats: {
      processed,
      emailsSent,
      skippedNoAtRisk,
      errors,
      daysUntilDeadline,
      isTriggerDay: isTriggerDay ? 1 : 0,
    },
    errorMessage:
      errors > 0 && errorDetails[0]
        ? `${errorDetails[0].reason}${errorDetails.length > 1 ? ` (+${errorDetails.length - 1} more)` : ""}`
        : undefined,
  })

  return NextResponse.json({
    processed,
    emailsSent,
    skippedNoAtRisk,
    errors,
    daysUntilDeadline,
    deadline: PFA_FORM082_DEADLINE_ISO,
    timestamp: nowISO,
  })
}
