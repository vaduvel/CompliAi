// NIS2 Maturity Assessment API — Sprint 2.6
// GET: returns saved maturity assessment
// POST: saves assessment + auto-generates findings for weak domains

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { saveMaturityAssessment, readMaturityAssessment, readNis2State } from "@/lib/server/nis2-store"
import type { MaturityAssessment } from "@/lib/server/nis2-store"
import { scoreMaturity, convertMaturityGapsToFindings } from "@/lib/compliance/nis2-maturity"
import type { MaturityAnswers } from "@/lib/compliance/nis2-maturity"
import { mutateFreshStateForOrg } from "@/lib/server/mvp-store"
import { preserveRuntimeStateForSingleFinding } from "@/lib/server/preserve-finding-runtime-state"
import { mergeNis2PackageFindings } from "@/lib/server/nis2-package-sync"
import { READ_ROLES, WRITE_ROLES } from "@/lib/server/rbac"

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, READ_ROLES, "citirea maturității NIS2")
    const assessment = await readMaturityAssessment(session.orgId)
    return NextResponse.json({ assessment })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca auto-evaluarea de maturitate.", 500, "MATURITY_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "salvarea maturității NIS2")

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

    await saveMaturityAssessment(session.orgId, assessment)

    // Auto-generate findings for domains with score < 50%
    const maturityFindings = convertMaturityGapsToFindings(result.domains, now)
    await mutateFreshStateForOrg(
      session.orgId,
      async (current) => ({
        ...current,
        findings: mergeNis2PackageFindings(
          [
            ...current.findings.filter((f) => !f.id.startsWith("nis2-maturity-")),
            ...maturityFindings.map((finding) => preserveRuntimeStateForSingleFinding(current.findings, finding)),
          ],
          await readNis2State(session.orgId),
          now
        ),
      }),
      session.orgName
    )

    return NextResponse.json({ assessment, result })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut salva auto-evaluarea de maturitate.", 500, "MATURITY_SAVE_FAILED")
  }
}
