// V6 — Agentic Engine API
// GET  /api/agents       → agent run history
// POST /api/agents       → manual agent execution

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { getRecentRuns } from "@/lib/server/agent-run-store"
import { executeAgent } from "@/lib/server/agent-orchestrator"
import { AGENT_LABELS, AGENT_DESCRIPTIONS, type AgentType } from "@/lib/compliance/agentic-engine"

const VALID_AGENTS: AgentType[] = [
  "compliance_monitor",
  "fiscal_sensor",
  "document",
  "vendor_risk",
  "regulatory_radar",
]

export async function GET(request: Request) {
  try {
    const session = requireRole(request, ["owner", "compliance", "reviewer"], "vizualizare agenți")
    const { orgId } = await getOrgContext()

    const recentRuns = await getRecentRuns(orgId, 30)

    return NextResponse.json({
      agents: VALID_AGENTS.map((a) => ({
        type: a,
        label: AGENT_LABELS[a],
        description: AGENT_DESCRIPTIONS[a],
        implemented: true, // all 5 agents now implemented (V6-F4)
        lastRun: recentRuns.find((r) => r.agentType === a) ?? null,
      })),
      recentRuns,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca datele agenților.", 500, "AGENTS_GET_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = requireRole(request, ["owner", "compliance"], "execuție agent manual")
    const { orgId } = await getOrgContext()

    const body = (await request.json()) as { agentType?: string }
    const agentType = body.agentType as AgentType

    if (!agentType || !VALID_AGENTS.includes(agentType)) {
      return jsonError(
        `Agent invalid. Agenți disponibili: ${VALID_AGENTS.join(", ")}`,
        400,
        "INVALID_AGENT",
      )
    }

    const output = await executeAgent(orgId, agentType)

    return NextResponse.json({ output })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut executa agentul.", 500, "AGENT_EXECUTE_FAILED")
  }
}
