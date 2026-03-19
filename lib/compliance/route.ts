import type { NextRequest } from "next/server"

import {
  runIntakeAgent,
  runFindingsAgent,
  runDriftAgent,
  runEvidenceAgent,
  validateAgentOutput,
} from "@/lib/compliance/agent-runner"
import type { AgentProposalBundle, SourceEnvelope } from "@/lib/compliance/agent-os"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { requireAuthenticatedSession } from "@/lib/server/auth"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function POST(request: NextRequest) {
  const context = createRequestContext(request, "/api/agent/run")
  let orgId: string
  try {
    orgId = requireAuthenticatedSession(request, "rularea Agent OS").orgId
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized"
    await logRouteError(context, error, {
      code: "AUTH_UNAUTHORIZED",
      durationMs: getRequestDurationMs(context),
      status: 401,
    })
    return jsonError(message, 401, "AUTH_UNAUTHORIZED", undefined, context)
  }

  const sourceEnvelope = (await request.json()) as SourceEnvelope

  // Validare de bază
  if (!sourceEnvelope || !sourceEnvelope.sourceId) {
    return jsonError("Invalid SourceEnvelope provided.", 400, "INVALID_SOURCE_ENVELOPE", undefined, context)
  }

  // Asigură-te că plicul aparține organizației autentificate
  if (sourceEnvelope.orgId !== orgId) {
    return jsonError(
      "Forbidden: SourceEnvelope does not belong to your organization.",
      403,
      "AUTH_ORG_MISMATCH",
      undefined,
      context
    )
  }

  try {
    // Rulează agenții în paralel
    const [intakeProposal, findingsProposal, driftProposal, evidenceProposal] = await Promise.all([
      runIntakeAgent(sourceEnvelope),
      runFindingsAgent(sourceEnvelope),
      runDriftAgent(sourceEnvelope), // Placeholder
      runEvidenceAgent(sourceEnvelope), // Placeholder
    ])

    const proposalBundle: AgentProposalBundle = {
      sourceId: sourceEnvelope.sourceId,
      intake: intakeProposal,
      findings: findingsProposal,
      drifts: driftProposal,
      evidence: evidenceProposal,
      reviewState: "needs_review",
    }

    const validations = [
      validateAgentOutput("intake", intakeProposal),
      validateAgentOutput("findings", findingsProposal),
      validateAgentOutput("drift", driftProposal),
      validateAgentOutput("evidence", evidenceProposal),
    ]

    const validationErrors = validations.flatMap((entry) => entry.errors)
    if (validationErrors.length > 0) {
      return jsonError(
        "Agent output invalid",
        422,
        "AGENT_OUTPUT_INVALID",
        { details: validationErrors },
        context
      )
    }

    // În mod normal, acest pachet ar fi salvat în baza de date pentru review uman.
    // Acum, îl returnăm direct.
    return jsonWithRequestContext(proposalBundle, context)
  } catch (error) {
    await logRouteError(context, error, {
      code: "AGENT_RUN_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return jsonError("Agent run failed", 500, "AGENT_RUN_FAILED", { details: errorMessage }, context)
  }
}
