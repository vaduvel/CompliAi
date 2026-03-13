import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import {
  runIntakeAgent,
  runFindingsAgent,
  runDriftAgent,
  runEvidenceAgent,
  validateAgentOutput,
} from "@/lib/compliance/agent-runner"
import type { AgentProposalBundle, SourceEnvelope } from "@/lib/compliance/agent-os"
import { requireAuthenticatedSession } from "@/lib/server/auth"

export async function POST(request: NextRequest) {
  let orgId: string
  try {
    orgId = requireAuthenticatedSession(request, "rularea Agent OS").orgId
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: 401 })
  }

  const sourceEnvelope = (await request.json()) as SourceEnvelope

  // Validare de bază
  if (!sourceEnvelope || !sourceEnvelope.sourceId) {
    return NextResponse.json({ error: "Invalid SourceEnvelope provided." }, { status: 400 })
  }

  // Asigură-te că plicul aparține organizației autentificate
  if (sourceEnvelope.orgId !== orgId) {
    return NextResponse.json(
      { error: "Forbidden: SourceEnvelope does not belong to your organization." },
      { status: 403 }
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
      return NextResponse.json(
        {
          error: "Agent output invalid",
          details: validationErrors,
        },
        { status: 422 }
      )
    }

    // În mod normal, acest pachet ar fi salvat în baza de date pentru review uman.
    // Acum, îl returnăm direct.
    return NextResponse.json(proposalBundle)
  } catch (error) {
    console.error("Agent run failed:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Agent run failed", details: errorMessage }, { status: 500 })
  }
}
