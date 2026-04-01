// NIS2 assessment — GET (load saved) / POST (save + score)

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State, saveNis2Assessment, getDnscRegistrationStatus } from "@/lib/server/nis2-store"
import { scoreNis2Assessment, convertNIS2GapsToFindings, type Nis2Answers, type Nis2Sector } from "@/lib/compliance/nis2-rules"
import { buildDnscRescueFinding, DNSC_RESCUE_FINDING_ID } from "@/lib/compliance/nis2-rescue"
import { mutateFreshState } from "@/lib/server/mvp-store"
import {
  preserveRuntimeStateForSingleFinding,
} from "@/lib/server/preserve-finding-runtime-state"
import { mergeNis2PackageFindings } from "@/lib/server/nis2-package-sync"

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { orgId } = await getOrgContext()
    const state = await readNis2State(orgId)
    return NextResponse.json({ assessment: state.assessment })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut incarca evaluarea NIS2.", 500, "NIS2_ASSESSMENT_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as { sector: Nis2Sector; answers: Nis2Answers; answersMeta?: Record<string, unknown> }

    if (!body.sector || !body.answers) {
      return jsonError("Câmpuri obligatorii: sector, answers.", 400, "MISSING_FIELDS")
    }

    const result = scoreNis2Assessment(body.answers, body.sector)

    const now = new Date().toISOString()
    const { orgId } = await getOrgContext()
    await saveNis2Assessment(orgId, {
      sector: body.sector,
      answers: body.answers,
      ...(body.answersMeta ? { answersMeta: body.answersMeta as import("@/lib/compliance/nis2-rules").Nis2AnswersMeta } : {}),
      savedAtISO: now,
      score: result.score,
      maturityLabel: result.maturityLabel,
    })

    // Build rescue finding for incomplete DNSC registration (V3 P0.2)
    const dnscStatus = await getDnscRegistrationStatus(orgId)
    const rescueFinding = buildDnscRescueFinding(result.entityType, dnscStatus, now)

    // Sync NIS2 gaps into the central remediation board.
    // Replaces any existing NIS2 findings so re-runs don't accumulate duplicates.
    const nis2State = await readNis2State(orgId)
    const nis2Findings = convertNIS2GapsToFindings(result.gaps, body.sector, now)
    await mutateFreshState((current) => {
      const mergedAssessmentFindings = [
        ...current.findings.filter(
          (finding) => !finding.id.startsWith("nis2-finding-") && finding.id !== DNSC_RESCUE_FINDING_ID
        ),
        ...nis2Findings.map((finding) => preserveRuntimeStateForSingleFinding(current.findings, finding)),
        ...(rescueFinding ? [preserveRuntimeStateForSingleFinding(current.findings, rescueFinding)] : []),
      ]

      return {
        ...current,
        findings: mergeNis2PackageFindings(mergedAssessmentFindings, nis2State, now),
      }
    })

    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut salva evaluarea NIS2.", 500, "NIS2_ASSESSMENT_SAVE_FAILED")
  }
}
