// V6 — Agent Feedback Store (P4 — Self-Learning Signal Layer)
// Records user accept/reject decisions on agent suggestions.
// Used to adjust confidence scores for future agent runs.

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"
import type { AgentType, AgentActionType } from "@/lib/compliance/agentic-engine"

// ── Types ─────────────────────────────────────────────────────────────────────

export type AgentFeedbackDecision = "approved" | "rejected" | "ignored"

export type AgentFeedbackRecord = {
  id: string
  agentType: AgentType
  actionType: AgentActionType
  suggestionContext: {
    findingId?: string
    documentType?: string
    vendorId?: string
    triggerReason: string
  }
  decision: AgentFeedbackDecision
  rejectionReason?: string
  decidedAtISO: string
  createdAtISO: string
}

export type AgentFeedbackStats = {
  totalSuggestions: number
  approved: number
  rejected: number
  ignored: number
  approvalRate: number
  topRejectionReasons: string[]
}

type AgentFeedbackLog = {
  records: AgentFeedbackRecord[]
}

// ── Storage ───────────────────────────────────────────────────────────────────

const feedbackStorage = createAdaptiveStorage<AgentFeedbackLog>(
  "agent-feedback",
  "agent_feedback",
)

async function readLog(orgId: string): Promise<AgentFeedbackLog> {
  return (await feedbackStorage.read(orgId)) ?? { records: [] }
}

async function writeLog(orgId: string, log: AgentFeedbackLog): Promise<void> {
  await feedbackStorage.write(orgId, log)
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function recordFeedback(
  orgId: string,
  feedback: Omit<AgentFeedbackRecord, "id" | "createdAtISO">,
): Promise<void> {
  const log = await readLog(orgId)
  const record: AgentFeedbackRecord = {
    ...feedback,
    id: `fb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAtISO: new Date().toISOString(),
  }
  log.records.push(record)
  // Keep last 500 records
  if (log.records.length > 500) {
    log.records = log.records.slice(-500)
  }
  await writeLog(orgId, log)
}

export async function safeRecordFeedback(
  orgId: string,
  feedback: Omit<AgentFeedbackRecord, "id" | "createdAtISO">,
): Promise<void> {
  try {
    await recordFeedback(orgId, feedback)
  } catch {
    // Feedback logging is secondary; never block agent execution
  }
}

export async function getFeedbackStats(
  orgId: string,
  agentType?: AgentType,
): Promise<AgentFeedbackStats> {
  const log = await readLog(orgId)
  const records = agentType
    ? log.records.filter((r) => r.agentType === agentType)
    : log.records

  const approved = records.filter((r) => r.decision === "approved").length
  const rejected = records.filter((r) => r.decision === "rejected").length
  const ignored = records.filter((r) => r.decision === "ignored").length
  const total = records.length

  // Top rejection reasons
  const reasonCounts: Record<string, number> = {}
  for (const r of records) {
    if (r.decision === "rejected" && r.rejectionReason) {
      reasonCounts[r.rejectionReason] = (reasonCounts[r.rejectionReason] ?? 0) + 1
    }
  }
  const topRejectionReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason]) => reason)

  return {
    totalSuggestions: total,
    approved,
    rejected,
    ignored,
    approvalRate: total === 0 ? 0.5 : approved / total,
    topRejectionReasons,
  }
}

// ── Confidence adjustment ─────────────────────────────────────────────────────

/**
 * Adjust a base confidence score based on historical approval rates.
 * Returns the adjusted confidence (clamped 0.1–0.95).
 * Falls back to baseConfidence if fewer than 5 feedback records exist.
 */
export async function adjustedConfidence(
  baseConfidence: number,
  orgId: string,
  agentType: AgentType,
): Promise<number> {
  const stats = await getFeedbackStats(orgId, agentType)
  if (stats.totalSuggestions < 5) return baseConfidence

  const { approvalRate } = stats
  let adjusted = baseConfidence
  if (approvalRate > 0.8) adjusted = Math.min(0.95, baseConfidence * 1.1)
  else if (approvalRate < 0.3) adjusted = Math.max(0.1, baseConfidence * 0.8)

  return adjusted
}
