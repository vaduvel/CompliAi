// POST /api/cron/legislation-monitor
// F1 — Daily legislation radar.
// Checks official sources for changes, notifies orgs with matching frameworks.

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { normalizeComplianceState } from "@/lib/compliance/engine"
import { createNotification } from "@/lib/server/notifications-store"
import { checkLegislationChanges } from "@/lib/legislation-monitor"
import { isLegislationRelevant } from "@/lib/compliscan/feed-sources"
import type { ApplicabilityTag } from "@/lib/compliance/applicability"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  try {
    const changes = await checkLegislationChanges()

    if (changes.length === 0) {
      console.log("[LegislationMonitor] Nicio schimbare detectată.")
      return NextResponse.json({ ok: true, changes: 0 })
    }

    // Notify all orgs with matching frameworks
    const organizations = await loadOrganizations()
    let notificationsSent = 0

    for (const org of organizations.slice(0, 50)) {
      try {
        const rawState = await readStateForOrg(org.id)
        if (!rawState) continue

        const state = normalizeComplianceState(rawState)
        const tags = state.applicability?.tags ?? []

        for (const change of changes) {
          // Notify if org has this framework active (using centralized relevance filter)
          if (isLegislationRelevant(change.framework, tags as ApplicabilityTag[])) {
            await createNotification(org.id, {
              type: "info",
              title: `Schimbare legislativă: ${change.sursa}`,
              message: change.summary.slice(0, 300),
              linkTo: "/dashboard/scan",
            }).catch(() => {})
            notificationsSent++
          }
        }
      } catch (err) {
        captureCronError(err, {
          cron: "/api/cron/legislation-monitor",
          orgId: org.id,
          step: "org-notify",
        })
      }
    }

    console.log(
      `[LegislationMonitor] ${changes.length} schimbări, ${notificationsSent} notificări trimise.`
    )

    return NextResponse.json({
      ok: true,
      changes: changes.length,
      notifications: notificationsSent,
    })
  } catch (error) {
    captureCronError(error, { cron: "/api/cron/legislation-monitor", step: "critical" })
    await flushCronTelemetry()
    return jsonError("Eroare la legislation monitor.", 500, "LEGISLATION_MONITOR_FAILED")
  }
}
