// POST /api/cron/agent-regulatory-radar
// V6 — Regulatory Radar weekly cron.
// Runs regulatory_radar agent for all active orgs.
// Invoked by Vercel Cron (every Wednesday 07:00 UTC).
// Legislative changes are slow — weekly cadence is sufficient.

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { executeAgent } from "@/lib/server/agent-orchestrator"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  const results: { orgId: string; issuesFound: number; actionsCount: number; error?: string }[] = []
  let capturedCronErrors = false

  try {
    const organizations = await loadOrganizations()
    const orgsToProcess = organizations.slice(0, 50)

    for (const org of orgsToProcess) {
      try {
        const output = await executeAgent(org.id, "regulatory_radar")
        results.push({
          orgId: org.id,
          issuesFound: output.metrics?.issuesFound ?? 0,
          actionsCount: output.actions.length,
        })
      } catch (err) {
        capturedCronErrors =
          captureCronError(err, {
            cron: "/api/cron/agent-regulatory-radar",
            metadata: { agent: "regulatory_radar" },
            orgId: org.id,
            step: "org-run",
          }) || capturedCronErrors

        results.push({
          orgId: org.id,
          issuesFound: 0,
          actionsCount: 0,
          error: err instanceof Error ? err.message : "unknown",
        })
      }
    }

    const totalIssues = results.reduce((s, r) => s + r.issuesFound, 0)
    const totalActions = results.reduce((s, r) => s + r.actionsCount, 0)

    console.log(
      `[RegulatoryRadar] Weekly run completat: ${results.length} org-uri, ${totalIssues} probleme, ${totalActions} acțiuni`,
    )

    if (capturedCronErrors) {
      await flushCronTelemetry()
    }

    return NextResponse.json({
      ok: true,
      orgsProcessed: results.length,
      totalIssues,
      totalActions,
      executedAt: new Date().toISOString(),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown"
    console.error(`[RegulatoryRadar] Eroare critică: ${msg}`)

    captureCronError(error, {
      cron: "/api/cron/agent-regulatory-radar",
      metadata: { agent: "regulatory_radar" },
      step: "critical",
    })
    await flushCronTelemetry()

    return jsonError(`Eroare la execuția Regulatory Radar: ${msg}`, 500, "REGULATORY_RADAR_CRON_FAILED")
  }
}
