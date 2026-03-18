// V6 — Agentic Compliance Engine
// Core types, orchestrator logic, trigger system, execution framework.
// 5 agents + 1 orchestrator. Human-in-the-loop pe 3 niveluri.

// ── Agent types ──────────────────────────────────────────────────────────────

export type AgentType =
  | "fiscal_sensor"
  | "compliance_monitor"
  | "document"
  | "vendor_risk"
  | "regulatory_radar"

export const AGENT_LABELS: Record<AgentType, string> = {
  fiscal_sensor: "Fiscal Sensor",
  compliance_monitor: "Compliance Monitor",
  document: "Document Agent",
  vendor_risk: "Vendor Risk Agent",
  regulatory_radar: "Regulatory Radar",
}

export const AGENT_DESCRIPTIONS: Record<AgentType, string> = {
  fiscal_sensor: "Monitorizare e-Factura — detectare facturi respinse, clasificare, escalare",
  compliance_monitor: "Scan continuu conformitate — expirări, degradări, gaps noi",
  document: "Generare proactivă documente — versionare, completare gaps",
  vendor_risk: "Evaluare periodică furnizori — re-scoring, DPA tracking, auto-findings",
  regulatory_radar: "Monitorizare legislativă — DNSC, EUR-Lex, impact assessment",
}

// ── Trigger system ───────────────────────────────────────────────────────────

export type TriggerType = "cron" | "event" | "manual"

export type AgentTrigger = {
  id: string
  type: TriggerType
  source: string // e.g. 'cron-daily', 'assessment-completed', 'user-click'
  agentType: AgentType
  orgId: string
  data?: Record<string, unknown>
  triggeredAtISO: string
}

// ── Approval levels ──────────────────────────────────────────────────────────

/**
 * NIVEL 1 — Auto-execute: detectie, clasificare, notificare, logare
 * NIVEL 2 — Auto-draft, human-approve: documente, remedieri, escalări
 * NIVEL 3 — Human-only: semnare, trimitere autorități, decizii juridice
 */
export type ApprovalLevel = 1 | 2 | 3

// ── Agent actions ────────────────────────────────────────────────────────────

export type AgentActionType =
  | "finding_created"
  | "finding_updated"
  | "notification_sent"
  | "document_drafted"
  | "vendor_rescored"
  | "escalation_raised"
  | "score_updated"
  | "review_triggered"
  | "alert_created"
  | "digest_generated"

export type AgentAction = {
  type: AgentActionType
  description: string
  targetId?: string // finding ID, vendor ID, document type, etc.
  approvalLevel: ApprovalLevel
  autoApplied: boolean // true if level 1, false if level 2+
}

// ── Agent output ─────────────────────────────────────────────────────────────

export type AgentRunStatus = "running" | "completed" | "failed" | "awaiting_approval"

export type AgentOutput = {
  agentType: AgentType
  runId: string
  status: AgentRunStatus
  actions: AgentAction[]
  confidence: number // 0-1
  reasoning: string // explanation for the user
  startedAtISO: string
  completedAtISO?: string
  error?: string
  metrics?: {
    itemsScanned: number
    issuesFound: number
    actionsAutoApplied: number
    actionsPendingApproval: number
  }
}

// ── Agent run log (persistent) ───────────────────────────────────────────────

export type AgentRunLog = {
  runs: AgentOutput[]
  lastRunPerAgent: Partial<Record<AgentType, string>> // ISO timestamp
}

// ── Orchestrator decision ────────────────────────────────────────────────────

/**
 * Determine which agents should run for a given trigger.
 */
export function routeToAgents(trigger: AgentTrigger): AgentType[] {
  // Direct routing — trigger specifies agent
  if (trigger.agentType) return [trigger.agentType]

  // Cron triggers can run multiple agents
  if (trigger.source === "cron-daily") {
    return ["compliance_monitor", "fiscal_sensor", "vendor_risk"]
  }
  if (trigger.source === "cron-weekly") {
    return ["compliance_monitor", "vendor_risk", "regulatory_radar"]
  }

  return [trigger.agentType]
}

/**
 * Determine if an action requires human approval.
 */
export function requiresHumanApproval(action: AgentAction): boolean {
  return action.approvalLevel >= 2
}

// ── Run ID generator ─────────────────────────────────────────────────────────

let runCounter = 0
export function generateRunId(agentType: AgentType): string {
  return `run-${agentType}-${Date.now().toString(36)}-${(++runCounter).toString(36)}`
}

// ── Trigger ID generator ─────────────────────────────────────────────────────

let triggerCounter = 0
export function generateTriggerId(): string {
  return `trg-${Date.now().toString(36)}-${(++triggerCounter).toString(36)}`
}
