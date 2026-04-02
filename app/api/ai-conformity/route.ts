import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshRole, AuthzError } from "@/lib/server/auth"
import { mutateStateForOrg, readFreshStateForOrg } from "@/lib/server/mvp-store"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { getOrgContext } from "@/lib/server/org-context"
import {
  scoreAssessment,
  type AssessmentAnswers,
} from "@/lib/compliance/ai-conformity-assessment"

// Store assessments inside state.aiComplianceFieldOverrides keyed by "conformity-{systemId}"
// Using a generic field pattern to avoid schema changes.
// Field key: "conformity_assessment", value: JSON string of answers.

const CONFORMITY_FIELD = "conformity_assessment"

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
      "conformitate AI"
    )

    const { searchParams } = new URL(request.url)
    const systemId = searchParams.get("systemId")

    if (!systemId) {
      return jsonError("systemId este obligatoriu.", 400, "SYSTEM_ID_REQUIRED")
    }

    const state =
      (await readFreshStateForOrg(session.orgId, session.orgName)) ??
      normalizeComplianceState(initialComplianceState)

    const raw = state.aiComplianceFieldOverrides?.[systemId]?.[CONFORMITY_FIELD]?.value
    const answers: AssessmentAnswers = raw ? (JSON.parse(raw) as AssessmentAnswers) : {}
    const result = scoreAssessment(answers)

    return NextResponse.json({ systemId, answers, result })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la citire evaluare.", 500, "CONFORMITY_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance"],
      "salvare evaluare conformitate AI"
    )

    const body = (await request.json()) as { systemId?: string; answers?: AssessmentAnswers }
    const { systemId, answers } = body

    if (!systemId || typeof systemId !== "string") {
      return jsonError("systemId este obligatoriu.", 400, "SYSTEM_ID_REQUIRED")
    }
    if (!answers || typeof answers !== "object") {
      return jsonError("answers sunt obligatorii.", 400, "ANSWERS_REQUIRED")
    }

    const result = scoreAssessment(answers)
    const now = new Date().toISOString()

    const nextState = await mutateStateForOrg(session.orgId, (current) => {
      const existing = current.aiComplianceFieldOverrides ?? {}
      const systemOverrides = existing[systemId] ?? {}

      return {
        ...current,
        aiComplianceFieldOverrides: {
          ...existing,
          [systemId]: {
            ...systemOverrides,
            [CONFORMITY_FIELD]: {
              value: JSON.stringify(answers),
              confirmedByUser: true,
              updatedAtISO: now,
            },
          },
        },
      }
    }, session.orgName)

    const workspaceOverride = {
      ...(await getOrgContext({ request })),
      orgId: session.orgId,
      orgName: session.orgName,
      userRole: session.role,
    }

    return NextResponse.json({
      systemId,
      answers,
      result,
      savedAt: now,
      ...(await buildDashboardPayload(nextState, workspaceOverride)),
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la salvare evaluare.", 500, "CONFORMITY_SAVE_FAILED")
  }
}
