// V6 — Agentic Engine API
// GET  /api/agents       → agent run history
// POST /api/agents       → manual agent execution

import { NextResponse } from "next/server"

import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { safeGetRecentRuns } from "@/lib/server/agent-run-store"
import { executeAgent } from "@/lib/server/agent-orchestrator"
import { AGENT_LABELS, AGENT_DESCRIPTIONS, type AgentType } from "@/lib/compliance/agentic-engine"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

const VALID_AGENTS: AgentType[] = [
  "compliance_monitor",
  "fiscal_sensor",
  "document",
  "vendor_risk",
  "regulatory_radar",
]

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/agents")

  try {
    const session = requireRole(request, ["owner", "compliance", "reviewer"], "vizualizare agenți")
    const { orgId } = await getOrgContext()

    const recentRuns = await safeGetRecentRuns(orgId, 30)

    void session

    return NextResponse.json(
      {
        agents: VALID_AGENTS.map((a) => ({
          type: a,
          label: AGENT_LABELS[a],
          description: AGENT_DESCRIPTIONS[a],
          implemented: true, // all 5 agents now implemented (V6-F4)
          lastRun: recentRuns.find((r) => r.agentType === a) ?? null,
        })),
        recentRuns,
      },
      withRequestIdHeaders(undefined, context)
    )
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code, undefined, context)
    await logRouteError(context, error, {
      code: "AGENTS_GET_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError("Nu am putut încărca datele agenților.", 500, "AGENTS_GET_FAILED", undefined, context)
  }
}

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/agents")

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
        undefined,
        context
      )
    }

    const output = await executeAgent(orgId, agentType)
    void session

    return NextResponse.json({ output }, withRequestIdHeaders(undefined, context))
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code, undefined, context)
    await logRouteError(context, error, {
      code: "AGENT_EXECUTE_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError("Nu am putut executa agentul.", 500, "AGENT_EXECUTE_FAILED", undefined, context)
  }
}
