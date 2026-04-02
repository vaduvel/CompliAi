// P4 — Predictive Risk Trajectory API
// GET /api/risk/trajectory → RiskTrajectory

import { NextResponse } from "next/server"

import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { normalizeComplianceState } from "@/lib/compliance/engine"
import { getAgentLog } from "@/lib/server/agent-run-store"
import { calculateRiskTrajectory } from "@/lib/compliance/risk-trajectory"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/risk/trajectory")

  try {
    const session = requireRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "risk trajectory",
    )
    const { orgId } = await getOrgContext()
    void session

    const [rawState, agentLog] = await Promise.all([
      readStateForOrg(orgId),
      getAgentLog(orgId),
    ])

    if (!rawState) {
      return NextResponse.json(
        {
          currentScore: 0,
          currentOpenFindings: 0,
          trajectory: [],
          iminentRisks: [],
          trend: "stable",
          summaryLabel: "Nicio stare disponibilă",
        },
        withRequestIdHeaders(undefined, context),
      )
    }

    const state = normalizeComplianceState(rawState)
    const trajectory = calculateRiskTrajectory(state, agentLog, new Date().toISOString())

    return NextResponse.json(trajectory, withRequestIdHeaders(undefined, context))
  } catch (error) {
    if (error instanceof AuthzError)
      return jsonError(error.message, error.status, error.code, undefined, context)
    await logRouteError(context, error, {
      code: "RISK_TRAJECTORY_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError(
      "Nu am putut calcula trajectoria de risc.",
      500,
      "RISK_TRAJECTORY_FAILED",
      undefined,
      context,
    )
  }
}
