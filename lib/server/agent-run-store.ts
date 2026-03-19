// V6 — Agent Run Store
// Persistent storage for agent execution logs.
// Uses createAdaptiveStorage (local .data/ or Supabase).

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"
import type { AgentOutput, AgentRunLog, AgentType } from "@/lib/compliance/agentic-engine"

const agentRunStorage = createAdaptiveStorage<AgentRunLog>(
  "agent-runs",
  "agent_runs",
)

async function readLog(orgId: string): Promise<AgentRunLog> {
  return (await agentRunStorage.read(orgId)) ?? { runs: [], lastRunPerAgent: {} }
}

async function writeLog(orgId: string, log: AgentRunLog): Promise<void> {
  await agentRunStorage.write(orgId, log)
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function appendRun(orgId: string, run: AgentOutput): Promise<void> {
  const log = await readLog(orgId)
  log.runs.push(run)
  log.lastRunPerAgent[run.agentType] = run.startedAtISO
  // Keep max 200 runs (trim oldest)
  if (log.runs.length > 200) {
    log.runs = log.runs.slice(-200)
  }
  await writeLog(orgId, log)
}

export async function safeAppendRun(orgId: string, run: AgentOutput): Promise<void> {
  try {
    await appendRun(orgId, run)
  } catch {
    // Agent logs are secondary; execution should still complete without persistent history.
  }
}

export async function getAgentLog(orgId: string): Promise<AgentRunLog> {
  return readLog(orgId)
}

export async function getLastRun(orgId: string, agentType: AgentType): Promise<AgentOutput | null> {
  const log = await readLog(orgId)
  const runs = log.runs.filter((r) => r.agentType === agentType)
  return runs.length > 0 ? runs[runs.length - 1] : null
}

export async function getRecentRuns(orgId: string, limit = 20): Promise<AgentOutput[]> {
  const log = await readLog(orgId)
  return log.runs.slice(-limit).reverse()
}

export async function safeGetRecentRuns(orgId: string, limit = 20): Promise<AgentOutput[]> {
  try {
    return await getRecentRuns(orgId, limit)
  } catch {
    return []
  }
}
