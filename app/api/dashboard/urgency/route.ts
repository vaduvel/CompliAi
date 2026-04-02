// GET /api/dashboard/urgency
// Agregare urgențe cross-modul: DSAR deadlines + NIS2 incidents deschise + Vendor reviews overdue.
// Alimentează secțiunea "Urgențe cu deadline" din pagina De rezolvat.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { readDsarState } from "@/lib/server/dsar-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { safeListReviews } from "@/lib/server/vendor-review-store"
import { WRITE_ROLES } from "@/lib/server/rbac"

export type UrgencyItem = {
  id: string
  source: "dsar" | "nis2" | "vendor"
  title: string
  detail: string
  severity: "critical" | "high" | "medium"
  deadlineISO?: string
  daysLeft?: number
  href: string
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "urgențe dashboard")
    const orgId = session.orgId

    const items: UrgencyItem[] = []

    // ── DSAR: cereri active cu deadline aproape sau depășit ───────────────────
    try {
      const dsarState = await readDsarState(orgId)
      const activeRequests = dsarState.requests.filter(
        (r) => r.status !== "responded" && r.status !== "refused"
      )
      for (const req of activeRequests) {
        const effectiveDeadline = req.extendedDeadlineISO ?? req.deadlineISO
        const days = daysUntil(effectiveDeadline)
        if (days > 14) continue // doar cele urgente (< 14 zile)

        const typeLabels: Record<string, string> = {
          access: "acces (Art. 15)",
          rectification: "rectificare (Art. 16)",
          erasure: "ștergere (Art. 17)",
          portability: "portabilitate (Art. 20)",
          objection: "opoziție (Art. 21)",
          restriction: "restricționare (Art. 18)",
        }
        const typeLabel = typeLabels[req.requestType] ?? req.requestType

        items.push({
          id: req.id,
          source: "dsar",
          title: `DSAR ${typeLabel} — ${req.requesterName}`,
          detail: days < 0
            ? `Deadline depășit cu ${Math.abs(days)} zile. Risc sancțiune ANSPDCP.`
            : `${days} zile rămase până la deadline GDPR Art. 12.`,
          severity: days < 0 ? "critical" : days <= 3 ? "critical" : days <= 7 ? "high" : "medium",
          deadlineISO: effectiveDeadline,
          daysLeft: days,
          href: "/dashboard/dsar",
        })
      }
    } catch {
      // DSAR state indisponibil — skip silențios
    }

    // ── NIS2 Incidents: deschise (nu closed) ─────────────────────────────────
    try {
      const nis2State = await readNis2State(orgId)
      const openIncidents = nis2State.incidents.filter((i) => i.status !== "closed")
      for (const inc of openIncidents) {
        const nextDeadline =
          inc.status === "open" ? inc.deadline24hISO
          : inc.status === "reported-24h" ? inc.deadline72hISO
          : undefined

        const days = nextDeadline ? daysUntil(nextDeadline) : null

        const stageLabels: Record<string, string> = {
          open: "Early Warning nesolicitat (24h)",
          "reported-24h": "Raport 72h pending",
          "reported-72h": "Raport final pending (30 zile)",
        }

        items.push({
          id: inc.id,
          source: "nis2",
          title: `Incident NIS2: ${inc.title}`,
          detail: stageLabels[inc.status] ?? `Status: ${inc.status}`,
          severity: inc.severity === "critical" ? "critical"
            : inc.severity === "high" ? "high"
            : "medium",
          deadlineISO: nextDeadline,
          daysLeft: days ?? undefined,
          href: "/dashboard/nis2",
        })
      }
    } catch {
      // NIS2 state indisponibil — skip silențios
    }

    // ── Vendor Reviews: overdue sau status activ problematic ──────────────────
    try {
      const reviews = await safeListReviews(orgId)
      const overdueReviews = reviews.filter((r) => r.status === "overdue-review")
      for (const rev of overdueReviews) {
        items.push({
          id: rev.id,
          source: "vendor",
          title: `Vendor Review: ${rev.vendorName}`,
          detail: "Review depășit — DPA sau revalidare necesară.",
          severity: rev.urgency === "critical" ? "critical"
            : rev.urgency === "high" ? "high"
            : "medium",
          deadlineISO: rev.nextReviewDueISO,
          href: "/dashboard/vendor-review",
        })
      }
    } catch {
      // vendor review state indisponibil — skip silențios
    }

    // Sortare: critical first, apoi după deadline
    items.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2 }
      const sevDiff = sev[a.severity] - sev[b.severity]
      if (sevDiff !== 0) return sevDiff
      if (a.daysLeft !== undefined && b.daysLeft !== undefined) return a.daysLeft - b.daysLeft
      return 0
    })

    return NextResponse.json({ items, total: items.length })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca urgențele.", 500, "URGENCY_FETCH_FAILED")
  }
}
