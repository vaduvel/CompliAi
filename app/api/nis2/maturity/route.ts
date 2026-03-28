// NIS2 Maturity Assessment API — Sprint 2.6
// GET: returns saved maturity assessment
// POST: saves assessment + auto-generates findings for weak domains

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { saveMaturityAssessment, readMaturityAssessment } from "@/lib/server/nis2-store"
import type { MaturityAssessment } from "@/lib/server/nis2-store"
import { scoreMaturity, convertMaturityGapsToFindings } from "@/lib/compliance/nis2-maturity"
import type { MaturityAnswers } from "@/lib/compliance/nis2-maturity"
import { mutateState } from "@/lib/server/mvp-store"
import { preserveRuntimeStateForRegeneratedFindings } from "@/lib/server/preserve-finding-runtime-state"

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { orgId } = await getOrgContext()
    const assessment = await readMaturityAssessment(orgId)
    return NextResponse.json({ assessment })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca auto-evaluarea de maturitate.", 500, "MATURITY_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as { answers: MaturityAnswers }

    if (!body.answers || typeof body.answers !== "object") {
      return jsonError("Câmp obligatoriu: answers.", 400, "MISSING_FIELDS")
    }

    const now = new Date().toISOString()
    const remPlanDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const result = scoreMaturity(body.answers)

    const assessment: MaturityAssessment = {
      level: result.level,
      completedAt: now,
      domains: result.domains.map((d) => ({
        id: d.id,
        name: d.name,
        score: d.score,
        status: d.status,
      })),
      overallScore: result.overallScore,
      answers: body.answers as Record<string, string>,
      remediationPlanDue: remPlanDue,
    }

    const { orgId } = await getOrgContext()
    await saveMaturityAssessment(orgId, assessment)

    // Auto-generate findings for domains with score < 50%
    const maturityFindings = convertMaturityGapsToFindings(result.domains, now)
    await mutateState((current) => ({
      ...current,
      findings: [
        // Remove previous maturity findings, keep everything else
        ...current.findings.filter((f) => !f.id.startsWith("nis2-maturity-")),
        ...preserveRuntimeStateForRegeneratedFindings(current.findings, maturityFindings),
      ],
    }))

    return NextResponse.json({ assessment, result })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut salva auto-evaluarea de maturitate.", 500, "MATURITY_SAVE_FAILED")
  }
}
