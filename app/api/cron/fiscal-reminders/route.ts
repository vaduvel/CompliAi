// Sprint 6.1 — Cron zilnic pentru reminder fiscal.
//
// Iterează toate orgs cu integrare ANAF/SmartBill/Oblio sau filingRecords
// active. Pentru fiecare:
//   1. Generează FilingReminder[] din generateFilingReminders
//   2. Numără findings critice noi (efactura/etva/saft)
//   3. Decide dacă trimite email (urgent ≤3 zile, warning ≤7 zile, sau
//      finding critical/high nou, sau probleme e-Factura)
//   4. Trimite via Resend către primul owner al organizației
//   5. Audit log în events
//
// Schedule recomandat: zilnic la 7:30 RO (vercel.json cron).

import { NextResponse } from "next/server"

import { listAllOrgIds, readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { listOrganizationMembers } from "@/lib/server/auth"
import {
  generateFilingReminders,
  type FilingRecord,
} from "@/lib/compliance/filing-discipline"
import { computeSAFTHygiene } from "@/lib/compliance/saft-hygiene"
import {
  sendFiscalReminderEmail,
  type FiscalEmailResult,
} from "@/lib/server/fiscal-reminder-email"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { systemEventActor } from "@/lib/server/event-actor"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"

type StateWithFilings = ComplianceState & { filingRecords?: FilingRecord[] }

const FRESHNESS_HOURS = 24  // findings considerate „noi" dacă createdAtISO în ultimele 24h

function isFreshFinding(f: ScanFinding, nowMs: number): boolean {
  if (!f.createdAtISO) return false
  const createdMs = new Date(f.createdAtISO).getTime()
  return nowMs - createdMs < FRESHNESS_HOURS * 3_600_000
}

function isFiscalCategory(category?: string): boolean {
  return category === "E_FACTURA"
}

function getRecipientEmail(orgId: string, members: Awaited<ReturnType<typeof listOrganizationMembers>>): string | null {
  // Preferăm owner-ul; fallback la primul membru activ cu email
  const owner = members.find((m) => m.role === "owner")
  if (owner?.email) return owner.email
  return members.find((m) => !!m.email)?.email ?? null
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
  const nowMs = Date.now()
  const orgIds = await listAllOrgIds()

  let processed = 0
  let emailsSent = 0
  let emailsSkipped = 0
  let errors = 0
  const channelStats: Record<string, number> = { resend: 0, console: 0 }

  for (const orgId of orgIds) {
    try {
      const state = (await readStateForOrg(orgId)) as StateWithFilings | null
      if (!state) continue

      // Skip dacă org nu are nicio activitate fiscal-relevantă
      const hasFilings = (state.filingRecords ?? []).length > 0
      const hasIntegration = !!state.integrations?.smartbill || !!state.integrations?.oblio
      const hasFiscalFindings = (state.findings ?? []).some((f) => isFiscalCategory(f.category))
      if (!hasFilings && !hasIntegration && !hasFiscalFindings) continue

      const reminders = generateFilingReminders(state.filingRecords ?? [], nowISO)
      const upcomingReminders = reminders.filter(
        (r) => r.escalationLevel === "escalation" || r.escalationLevel === "warning",
      )

      const newFindings = (state.findings ?? []).filter(
        (f) => isFiscalCategory(f.category) && isFreshFinding(f, nowMs),
      )

      const efacturaProblems = state.efacturaSignalsCount ?? 0

      // Calculăm SAF-T hygiene curent (snapshot)
      const saftHygiene = hasFilings
        ? computeSAFTHygiene(state.filingRecords ?? [], nowISO)
        : null
      const saftHygieneScore =
        saftHygiene && saftHygiene.totalFilings > 0 ? saftHygiene.hygieneScore : null

      const members = await listOrganizationMembers(orgId)
      const recipientEmail = getRecipientEmail(orgId, members)
      if (!recipientEmail) {
        // Nu putem trimite; dar logăm
        emailsSkipped++
        continue
      }

      const orgName =
        members.find((m) => m.role === "owner")?.orgName ?? state.orgProfile?.cui ?? orgId

      const result: FiscalEmailResult = await sendFiscalReminderEmail({
        orgName,
        recipientEmail,
        reminders: upcomingReminders,
        newFindings,
        efacturaProblems,
        saftHygieneScore,
        spvLastSyncedAtISO: state.efacturaSyncedAtISO ?? null,
      })

      if (result.ok) {
        if (result.channel === "console" && result.reason?.startsWith("skipped")) {
          emailsSkipped++
        } else {
          emailsSent++
          channelStats[result.channel] = (channelStats[result.channel] ?? 0) + 1
        }
      } else {
        errors++
      }

      // Audit event
      const auditEvent = createComplianceEvent(
        {
          type: "fiscal.reminder_email_dispatched",
          entityType: "system",
          entityId: `fiscal-reminders-${nowISO.slice(0, 10)}`,
          message: `Cron fiscal reminders: ${upcomingReminders.length} termene, ${newFindings.length} findings noi, ${efacturaProblems} probleme e-Factura. Email ${result.ok ? "trimis" : "eșuat"} via ${result.channel}.`,
          createdAtISO: nowISO,
          metadata: {
            remindersCount: upcomingReminders.length,
            newFindingsCount: newFindings.length,
            efacturaProblems,
            saftHygieneScore: saftHygieneScore ?? 0,
            channel: result.channel,
            ok: result.ok,
            reason: result.reason ?? "",
            recipientEmailMasked: recipientEmail.replace(/^(.{3}).*(@.*)$/, "$1***$2"),
          },
        },
        systemEventActor("CompliScan fiscal-reminders cron"),
      )

      const updated: ComplianceState = {
        ...state,
        events: appendComplianceEvents(state, [auditEvent]),
      }

      await writeStateForOrg(orgId, updated)
      processed++
    } catch (err) {
      errors++
      console.error(`[fiscal-reminders] org ${orgId} failed:`, err)
    }
  }

  return NextResponse.json({
    processed,
    emailsSent,
    emailsSkipped,
    errors,
    channelStats,
    timestamp: nowISO,
  })
}
