// V6 — Agent Orchestrator
// Executes agents, applies auto-actions (notifications, findings),
// logs results, respects human-in-the-loop levels.

import { normalizeComplianceState } from "@/lib/compliance/engine"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { createNotification } from "@/lib/server/notifications-store"
import { appendRun } from "@/lib/server/agent-run-store"
import { trackEvent } from "@/lib/server/analytics"
import { runComplianceMonitor } from "@/lib/compliance/agent-compliance-monitor"
import { runFiscalSensor } from "@/lib/compliance/agent-fiscal-sensor"
import { runDocumentAgent } from "@/lib/compliance/agent-document"
import { runVendorRiskAgent } from "@/lib/compliance/agent-vendor-risk"
import { runRegulatoryRadar } from "@/lib/compliance/agent-regulatory-radar"
import type { AgentType, AgentOutput } from "@/lib/compliance/agentic-engine"
import { listReviews } from "@/lib/server/vendor-review-store"

export type OrchestratorResult = {
  orgId: string
  agentsRun: AgentType[]
  outputs: AgentOutput[]
  totalActions: number
  totalIssues: number
  executedAtISO: string
}

/**
 * Execute a single agent for an org.
 * Applies level-1 auto-actions (notifications).
 * Returns the agent output.
 */
export async function executeAgent(
  orgId: string,
  agentType: AgentType,
): Promise<AgentOutput> {
  const nowISO = new Date().toISOString()

  if (agentType === "compliance_monitor") {
    const rawState = await readStateForOrg(orgId)
    if (!rawState) {
      return makeEmptyOutput(agentType, "Nicio stare de conformitate pentru această organizație.")
    }
    const state = normalizeComplianceState(rawState)
    const vendorReviews = await listReviews(orgId)

    const output = runComplianceMonitor({
      orgId,
      state,
      vendorReviews,
      nowISO,
    })

    // Apply level-1 auto-actions: notifications
    await applyAutoActions(orgId, output)
    await appendRun(orgId, output)
    void trackEvent(orgId, "agent_run" as never, {
      agent: agentType,
      issues: output.metrics?.issuesFound ?? 0,
    })

    return output
  }

  if (agentType === "fiscal_sensor") {
    const rawState = await readStateForOrg(orgId)
    if (!rawState) {
      return makeEmptyOutput(agentType, "Nicio stare de conformitate pentru această organizație.")
    }
    const state = normalizeComplianceState(rawState)

    // Get e-Factura signals from state
    const signals = (state as Record<string, unknown>).efacturaSignals as
      | import("@/lib/compliance/efactura-risk").EFacturaInvoiceSignal[]
      | undefined

    const output = runFiscalSensor({
      orgId,
      state,
      signals: signals ?? [],
      nowISO,
    })

    await applyAutoActions(orgId, output)
    await appendRun(orgId, output)
    void trackEvent(orgId, "agent_run" as never, {
      agent: agentType,
      issues: output.metrics?.issuesFound ?? 0,
    })

    return output
  }

  if (agentType === "document") {
    const rawState = await readStateForOrg(orgId)
    if (!rawState) {
      return makeEmptyOutput(agentType, "Nicio stare de conformitate pentru această organizație.")
    }
    const state = normalizeComplianceState(rawState)

    const output = runDocumentAgent({
      orgId,
      state,
      nowISO,
    })

    await applyAutoActions(orgId, output)
    await appendRun(orgId, output)
    void trackEvent(orgId, "agent_run" as never, {
      agent: agentType,
      issues: output.metrics?.issuesFound ?? 0,
    })

    return output
  }

  if (agentType === "vendor_risk") {
    const rawState = await readStateForOrg(orgId)
    if (!rawState) {
      return makeEmptyOutput(agentType, "Nicio stare de conformitate pentru această organizație.")
    }
    const state = normalizeComplianceState(rawState)
    const vendorReviews = await listReviews(orgId)

    const output = runVendorRiskAgent({
      orgId,
      state,
      vendorReviews,
      nowISO,
    })

    await applyAutoActions(orgId, output)
    await appendRun(orgId, output)
    void trackEvent(orgId, "agent_run" as never, {
      agent: agentType,
      issues: output.metrics?.issuesFound ?? 0,
    })

    return output
  }

  if (agentType === "regulatory_radar") {
    const rawState = await readStateForOrg(orgId)
    if (!rawState) {
      return makeEmptyOutput(agentType, "Nicio stare de conformitate pentru această organizație.")
    }
    const state = normalizeComplianceState(rawState)

    const output = runRegulatoryRadar({
      orgId,
      state,
      nowISO,
    })

    await applyAutoActions(orgId, output)
    await appendRun(orgId, output)
    void trackEvent(orgId, "agent_run" as never, {
      agent: agentType,
      issues: output.metrics?.issuesFound ?? 0,
    })

    return output
  }

  // Placeholder for future agents
  return makeEmptyOutput(agentType, `Agentul "${agentType}" nu este încă implementat.`)
}

/**
 * Execute multiple agents for an org (e.g., daily cron).
 */
export async function executeAgents(
  orgId: string,
  agentTypes: AgentType[],
): Promise<OrchestratorResult> {
  const outputs: AgentOutput[] = []

  for (const agentType of agentTypes) {
    try {
      const output = await executeAgent(orgId, agentType)
      outputs.push(output)
    } catch (error) {
      outputs.push({
        agentType,
        runId: `run-${agentType}-error`,
        status: "failed",
        actions: [],
        confidence: 0,
        reasoning: `Eroare la execuția agentului: ${error instanceof Error ? error.message : "necunoscută"}`,
        startedAtISO: new Date().toISOString(),
        completedAtISO: new Date().toISOString(),
        error: error instanceof Error ? error.message : "unknown",
      })
    }
  }

  return {
    orgId,
    agentsRun: agentTypes,
    outputs,
    totalActions: outputs.reduce((s, o) => s + o.actions.length, 0),
    totalIssues: outputs.reduce((s, o) => s + (o.metrics?.issuesFound ?? 0), 0),
    executedAtISO: new Date().toISOString(),
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function applyAutoActions(orgId: string, output: AgentOutput): Promise<void> {
  const autoActions = output.actions.filter((a) => a.autoApplied)

  for (const action of autoActions) {
    if (action.type === "notification_sent" || action.type === "escalation_raised") {
      await createNotification(orgId, {
        type: action.type === "escalation_raised" ? "finding_new" : "info",
        title: `[${output.agentType}] ${action.description.slice(0, 80)}`,
        message: action.description,
        linkTo: action.targetId ? `/dashboard/scanari` : undefined,
      }).catch(() => {
        // Notification failure shouldn't block agent execution
      })
    }
  }
}

function makeEmptyOutput(agentType: AgentType, reasoning: string): AgentOutput {
  return {
    agentType,
    runId: `run-${agentType}-skip`,
    status: "completed",
    actions: [],
    confidence: 1,
    reasoning,
    startedAtISO: new Date().toISOString(),
    completedAtISO: new Date().toISOString(),
    metrics: { itemsScanned: 0, issuesFound: 0, actionsAutoApplied: 0, actionsPendingApproval: 0 },
  }
}
