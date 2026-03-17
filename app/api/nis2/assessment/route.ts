// NIS2 assessment — GET (load saved) / POST (save + score)

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State, saveNis2Assessment } from "@/lib/server/nis2-store"
import { scoreNis2Assessment, convertNIS2GapsToFindings, type Nis2Answers, type Nis2Sector } from "@/lib/compliance/nis2-rules"
import { mutateState } from "@/lib/server/mvp-store"

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

    const body = (await request.json()) as { sector: Nis2Sector; answers: Nis2Answers }

    if (!body.sector || !body.answers) {
      return jsonError("Câmpuri obligatorii: sector, answers.", 400, "MISSING_FIELDS")
    }

    const result = scoreNis2Assessment(body.answers, body.sector)

    const now = new Date().toISOString()
    const { orgId } = await getOrgContext()
    await saveNis2Assessment(orgId, {
      sector: body.sector,
      answers: body.answers,
      savedAtISO: now,
      score: result.score,
      maturityLabel: result.maturityLabel,
    })

    // Sync NIS2 gaps into the central remediation board.
    // Replaces any existing NIS2 findings so re-runs don't accumulate duplicates.
    if (result.gaps.length > 0) {
      const nis2Findings = convertNIS2GapsToFindings(result.gaps, body.sector, now)
      await mutateState((current) => ({
        ...current,
        findings: [
          ...current.findings.filter((f) => f.category !== "NIS2"),
          ...nis2Findings,
        ],
      }))
    } else {
      // No gaps — clear any stale NIS2 findings from a previous assessment
      await mutateState((current) => ({
        ...current,
        findings: current.findings.filter((f) => f.category !== "NIS2"),
      }))
    }

    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut salva evaluarea NIS2.", 500, "NIS2_ASSESSMENT_SAVE_FAILED")
  }
}
