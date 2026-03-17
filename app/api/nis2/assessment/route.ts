// NIS2 assessment — GET (load saved) / POST (save + score)

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State, saveNis2Assessment } from "@/lib/server/nis2-store"
import { scoreNis2Assessment, type Nis2Answers, type Nis2Sector } from "@/lib/compliance/nis2-rules"

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

    const { orgId } = await getOrgContext()
    await saveNis2Assessment(orgId, {
      sector: body.sector,
      answers: body.answers,
      savedAtISO: new Date().toISOString(),
      score: result.score,
      maturityLabel: result.maturityLabel,
    })

    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut salva evaluarea NIS2.", 500, "NIS2_ASSESSMENT_SAVE_FAILED")
  }
}
