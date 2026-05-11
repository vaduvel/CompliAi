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
import { fetchRecentEurLexActs } from "@/lib/server/eurlex-client"
import { fetchDnscAnnouncements } from "@/lib/server/dnsc-monitor"
import { safeRecordCronRun } from "@/lib/server/cron-status-store"
import type { EurLexDocument } from "@/lib/server/eurlex-client"
import type { DnscAnnouncement } from "@/lib/server/dnsc-monitor"

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  const nowISO = new Date().toISOString()
  const startMs = Date.now()
  const results: { orgId: string; issuesFound: number; actionsCount: number; error?: string }[] = []
  let capturedCronErrors = false

  try {
    // Phase 2: fetch external sources once, share across all orgs (cost-efficient)
    const lastWeekISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    let eurLexDocs: EurLexDocument[] = []
    let dnscAnnouncements: DnscAnnouncement[] = []

    try {
      ;[eurLexDocs, dnscAnnouncements] = await Promise.all([
        fetchRecentEurLexActs(lastWeekISO),
        fetchDnscAnnouncements(lastWeekISO),
      ])
      console.log(
        `[RegulatoryRadar] Phase 2 sources: ${eurLexDocs.length} EUR-Lex, ${dnscAnnouncements.length} DNSC`,
      )
    } catch {
      // External source fetch failed — continue with Phase 1 only
      console.log("[RegulatoryRadar] Phase 2 surse externe indisponibile, continuăm cu Phase 1.")
    }

    const organizations = await loadOrganizations()
    const orgsToProcess = organizations.slice(0, 50)

    for (const org of orgsToProcess) {
      try {
        const output = await executeAgent(org.id, "regulatory_radar", {
          externalSources: { eurLexDocs, dnscAnnouncements },
        })
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

    const orgsWithErrors = results.filter((r) => r.error).length
    await safeRecordCronRun({
      name: "agent-regulatory-radar",
      lastRunAtISO: nowISO,
      ok: orgsWithErrors === 0,
      durationMs: Date.now() - startMs,
      summary: `${results.length} orgs procesate, ${totalIssues} probleme, ${totalActions} acțiuni${orgsWithErrors > 0 ? `, ${orgsWithErrors} erori` : ""}.`,
      stats: {
        orgsProcessed: results.length,
        totalIssues,
        totalActions,
        errors: orgsWithErrors,
        eurLexDocs: eurLexDocs.length,
        dnscAnnouncements: dnscAnnouncements.length,
      },
      errorMessage:
        orgsWithErrors > 0
          ? results.find((r) => r.error)?.error
          : undefined,
    })

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

    await safeRecordCronRun({
      name: "agent-regulatory-radar",
      lastRunAtISO: nowISO,
      ok: false,
      durationMs: Date.now() - startMs,
      summary: `Eroare critică: ${msg}`,
      stats: {
        orgsProcessed: results.length,
      },
      errorMessage: msg,
    })

    return jsonError(`Eroare la execuția Regulatory Radar: ${msg}`, 500, "REGULATORY_RADAR_CRON_FAILED")
  }
}
