// GET /api/dashboard/calendar
// Agregare deadline-uri din toate modulele: DSAR, NIS2, Vendor Review, ANSPDCP.
// Returnează evenimente sortate cronologic cu grupare temporală.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readDsarState } from "@/lib/server/dsar-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { safeListReviews } from "@/lib/server/vendor-review-store"
import { WRITE_ROLES } from "@/lib/server/rbac"

export type CalendarEventType =
  | "dsar-deadline"
  | "nis2-early-warning"
  | "nis2-72h"
  | "nis2-final"
  | "anspdcp-breach"
  | "vendor-revalidation"
  | "vendor-overdue"

export type CalendarEventGroup = "overdue" | "today" | "this-week" | "this-month" | "later"

export type CalendarEvent = {
  id: string
  type: CalendarEventType
  title: string
  detail: string
  deadlineISO: string
  daysLeft: number
  group: CalendarEventGroup
  severity: "critical" | "high" | "medium" | "low"
  href: string
  legalBasis?: string
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

function getGroup(days: number): CalendarEventGroup {
  if (days < 0) return "overdue"
  if (days === 0) return "today"
  if (days <= 7) return "this-week"
  if (days <= 31) return "this-month"
  return "later"
}

export async function GET(request: Request) {
  try {
    requireRole(request, WRITE_ROLES, "calendar deadline-uri")
    const { orgId } = await getOrgContext()

    const events: CalendarEvent[] = []

    // ── DSAR deadlines ────────────────────────────────────────────────────────
    try {
      const dsarState = await readDsarState(orgId)
      const active = dsarState.requests.filter(
        (r) => r.status !== "responded" && r.status !== "refused"
      )
      const typeLabels: Record<string, string> = {
        access: "Acces (Art. 15)",
        rectification: "Rectificare (Art. 16)",
        erasure: "Ștergere (Art. 17)",
        portability: "Portabilitate (Art. 20)",
        objection: "Opoziție (Art. 21)",
        restriction: "Restricționare (Art. 18)",
      }
      for (const req of active) {
        const deadline = req.extendedDeadlineISO ?? req.deadlineISO
        const days = daysUntil(deadline)
        events.push({
          id: `dsar-${req.id}`,
          type: "dsar-deadline",
          title: `DSAR ${typeLabels[req.requestType] ?? req.requestType} — ${req.requesterName}`,
          detail: req.extendedDeadlineISO ? "Termen extins la 60 zile" : "Termen standard 30 zile GDPR Art. 12",
          deadlineISO: deadline,
          daysLeft: days,
          group: getGroup(days),
          severity: days < 0 ? "critical" : days <= 3 ? "critical" : days <= 7 ? "high" : "medium",
          href: "/dashboard/dsar",
          legalBasis: "GDPR Art. 12",
        })
      }
    } catch { /* DSAR indisponibil */ }

    // ── NIS2 Incidents — deadline per etapă ───────────────────────────────────
    try {
      const nis2State = await readNis2State(orgId)
      const open = nis2State.incidents.filter((i) => i.status !== "closed")
      for (const inc of open) {
        // Early Warning (24h) — dacă nu a fost trimis
        if (inc.status === "open" && inc.deadline24hISO) {
          const days = daysUntil(inc.deadline24hISO)
          events.push({
            id: `nis2-ew-${inc.id}`,
            type: "nis2-early-warning",
            title: `Early Warning DNSC — ${inc.title}`,
            detail: "Alertă inițială obligatorie NIS2 Art. 23(4)(a)",
            deadlineISO: inc.deadline24hISO,
            daysLeft: days,
            group: getGroup(days),
            severity: days < 0 ? "critical" : "critical",
            href: "/dashboard/nis2",
            legalBasis: "NIS2 Art. 23(4)(a)",
          })
        }
        // Raport 72h — dacă nu a fost trimis
        if ((inc.status === "open" || inc.status === "reported-24h") && inc.deadline72hISO) {
          const days = daysUntil(inc.deadline72hISO)
          events.push({
            id: `nis2-72h-${inc.id}`,
            type: "nis2-72h",
            title: `Raport 72h DNSC — ${inc.title}`,
            detail: "Raport complet cu analiză impact NIS2 Art. 23(4)(b)",
            deadlineISO: inc.deadline72hISO,
            daysLeft: days,
            group: getGroup(days),
            severity: days < 0 ? "critical" : days <= 1 ? "critical" : "high",
            href: "/dashboard/nis2",
            legalBasis: "NIS2 Art. 23(4)(b)",
          })
        }
        // Raport final 30 zile — de la raportul inițial 72h (NIS2 Art. 23(4)(c))
        if (inc.deadlineFinalISO && inc.status !== "closed") {
          const days = daysUntil(inc.deadlineFinalISO)
          events.push({
            id: `nis2-final-${inc.id}`,
            type: "nis2-final",
            title: `Raport final DNSC — ${inc.title}`,
            detail: "Raport final NIS2 Art. 23(4)(c) — 30 zile de la raportul inițial 72h",
            deadlineISO: inc.deadlineFinalISO,
            daysLeft: days,
            group: getGroup(days),
            severity: days < 0 ? "critical" : days <= 7 ? "high" : "medium",
            href: "/dashboard/nis2",
            legalBasis: "NIS2 Art. 23(4)(c)",
          })
        }
        // ANSPDCP breach notification — dacă există și e pending
        if (inc.anspdcpNotification?.required && inc.anspdcpNotification.status === "pending" && inc.anspdcpNotification.deadlineISO) {
          const days = daysUntil(inc.anspdcpNotification.deadlineISO)
          events.push({
            id: `anspdcp-${inc.id}`,
            type: "anspdcp-breach",
            title: `Notificare ANSPDCP — ${inc.title}`,
            detail: "Breach de date personale — notificare 72h GDPR Art. 33",
            deadlineISO: inc.anspdcpNotification.deadlineISO,
            daysLeft: days,
            group: getGroup(days),
            severity: days < 0 ? "critical" : days <= 1 ? "critical" : "high",
            href: "/dashboard/nis2",
            legalBasis: "GDPR Art. 33",
          })
        }
      }
    } catch { /* NIS2 indisponibil */ }

    // ── Vendor Review — revalidare / overdue ──────────────────────────────────
    try {
      const reviews = await safeListReviews(orgId)
      for (const rev of reviews) {
        if (rev.status === "overdue-review") {
          const days = rev.nextReviewDueISO ? daysUntil(rev.nextReviewDueISO) : -1
          events.push({
            id: `vendor-overdue-${rev.id}`,
            type: "vendor-overdue",
            title: `Revalidare depășită — ${rev.vendorName}`,
            detail: "DPA sau review-ul periodic trebuie reînnoit",
            deadlineISO: rev.nextReviewDueISO ?? new Date().toISOString(),
            daysLeft: days,
            group: getGroup(days),
            severity: "high",
            href: "/dashboard/vendor-review",
          })
        } else if (rev.nextReviewDueISO) {
          const days = daysUntil(rev.nextReviewDueISO)
          if (days <= 31) { // Afișăm doar ce vine în 31 de zile
            events.push({
              id: `vendor-rev-${rev.id}`,
              type: "vendor-revalidation",
              title: `Revalidare planificată — ${rev.vendorName}`,
              detail: "Review periodic DPA furnizor",
              deadlineISO: rev.nextReviewDueISO,
              daysLeft: days,
              group: getGroup(days),
              severity: days <= 7 ? "high" : "medium",
              href: "/dashboard/vendor-review",
            })
          }
        }
      }
    } catch { /* vendor review indisponibil */ }

    // Sortare: overdue first, then by deadline asc
    events.sort((a, b) => a.daysLeft - b.daysLeft)

    const grouped: Record<CalendarEventGroup, CalendarEvent[]> = {
      overdue: [],
      today: [],
      "this-week": [],
      "this-month": [],
      later: [],
    }
    for (const e of events) grouped[e.group].push(e)

    return NextResponse.json({
      events,
      grouped,
      total: events.length,
      overdueCount: grouped.overdue.length,
      todayCount: grouped.today.length,
      thisWeekCount: grouped["this-week"].length,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca calendarul.", 500, "CALENDAR_FETCH_FAILED")
  }
}
