// P4 — Predictive Risk Trajectory API
// GET /api/risk/trajectory → RiskTrajectory

import { NextResponse } from "next/server"

import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { normalizeComplianceState } from "@/lib/compliance/engine"
import { getAgentLog } from "@/lib/server/agent-run-store"
import { calculateRiskTrajectory } from "@/lib/compliance/risk-trajectory"
import { getIcpContextFromRequest } from "@/lib/server/icp-permissions"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

// Iminent risks NON-FISCAL — pentru cabinet-fiscal le scoatem din răspuns.
// Mircea (contabil CECCAR) NU operează pe Pay Transparency / AI Act / DPO
// timeline; afișarea lor ca "trajectory degradation drivers" e zgomot.
const NON_FISCAL_IMINENT_RISK_PREFIXES = ["pay-transparency-", "ai-act-"] as const

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/risk/trajectory")

  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "risk trajectory"
    )

    const [rawState, agentLog] = await Promise.all([
      readFreshStateForOrg(session.orgId, session.orgName),
      getAgentLog(session.orgId),
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

    // Cabinet-fiscal scope: drop iminentRisks non-fiscal (Pay Transparency,
    // AI Act timeline) — irelevant pentru contabil. Recalculate trend dacă
    // toate iminentRisks rămase sunt fiscal.
    const { icpSegment } = getIcpContextFromRequest(request)
    if (icpSegment === "cabinet-fiscal" && trajectory.iminentRisks.length > 0) {
      const filtered = trajectory.iminentRisks.filter(
        (risk) => !NON_FISCAL_IMINENT_RISK_PREFIXES.some((prefix) => risk.id.startsWith(prefix)),
      )
      trajectory.iminentRisks = filtered
    }

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
