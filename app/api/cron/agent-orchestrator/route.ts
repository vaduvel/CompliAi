// POST /api/cron/agent-orchestrator
// V6 — Agentic Engine daily cron.
// Runs compliance_monitor, fiscal_sensor, document, vendor_risk for all active orgs.
// regulatory_radar runs weekly via /api/cron/agent-regulatory-radar.
// Invoked by Vercel Cron (daily 06:00 UTC) or external trigger.

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { executeAgents, sweepSemiAutoActions } from "@/lib/server/agent-orchestrator"
import type { AgentType } from "@/lib/compliance/agentic-engine"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"

// Daily: compliance_monitor + fiscal_sensor (high-frequency) + document + vendor_risk.
// regulatory_radar runs weekly (lower frequency, legislative changes are slow).
const DAILY_AGENTS: AgentType[] = [
  "compliance_monitor",
  "fiscal_sensor",
  "document",
  "vendor_risk",
]

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  const results: { orgId: string; totalActions: number; totalIssues: number; error?: string }[] = []
  let capturedCronErrors = false

  try {
    const organizations = await loadOrganizations()
    const orgsToProcess = organizations.slice(0, 50)

    for (const org of orgsToProcess) {
      try {
        const result = await executeAgents(org.id, DAILY_AGENTS)
        // Sweep semi-auto pending actions whose 24h window has elapsed
        await sweepSemiAutoActions(org.id).catch(() => {})
        results.push({
          orgId: org.id,
          totalActions: result.totalActions,
          totalIssues: result.totalIssues,
        })
      } catch (err) {
        capturedCronErrors =
          captureCronError(err, {
            cron: "/api/cron/agent-orchestrator",
            metadata: { agents: DAILY_AGENTS },
            orgId: org.id,
            step: "org-run",
          }) || capturedCronErrors

        results.push({
          orgId: org.id,
          totalActions: 0,
          totalIssues: 0,
          error: err instanceof Error ? err.message : "unknown",
        })
      }
    }

    const totalIssues = results.reduce((s, r) => s + r.totalIssues, 0)
    const totalActions = results.reduce((s, r) => s + r.totalActions, 0)

    console.log(
      `[AgentOrchestrator] Daily run completat: ${results.length} org-uri, ${totalIssues} probleme, ${totalActions} acțiuni`,
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
    console.error(`[AgentOrchestrator] Eroare critică: ${msg}`)

    captureCronError(error, {
      cron: "/api/cron/agent-orchestrator",
      metadata: { agents: DAILY_AGENTS },
      step: "critical",
    })
    await flushCronTelemetry()

    return jsonError(`Eroare la execuția agenților: ${msg}`, 500, "AGENT_ORCHESTRATOR_FAILED")
  }
}
