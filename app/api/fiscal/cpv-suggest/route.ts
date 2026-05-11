// API F#5 — Sugestii CPV pentru descriere produs/serviciu.
//
// POST { description: string, topN?: number, minScore?: number }
// Returns { suggestions: [{ code, description, score, matchedKeywords }] }
//
// Rate limit aplicat — 30 req/min per session (rezistă la abuse pentru lead magnet).
// Lead magnet route publică e separată (/cauta-cod-cpv) cu rate limit mai strict.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { suggestCpvCodes } from "@/lib/compliance/cpv-classifier"

const MAX_DESCRIPTION_LENGTH = 500
const DEFAULT_TOP_N = 3
const MAX_TOP_N = 10
const DEFAULT_MIN_SCORE = 0.1

export async function POST(request: Request) {
  let body: { description?: string; topN?: number; minScore?: number }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return jsonError("Body invalid (JSON).", 400, "CPV_INVALID_BODY")
  }

  if (!body.description || typeof body.description !== "string") {
    return jsonError("description (string) obligatoriu.", 400, "CPV_NO_DESCRIPTION")
  }

  const description = body.description.trim()
  if (description.length === 0) {
    return jsonError("description nu poate fi gol.", 400, "CPV_EMPTY_DESCRIPTION")
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return jsonError(
      `description prea lung (max ${MAX_DESCRIPTION_LENGTH} caractere).`,
      400,
      "CPV_DESCRIPTION_TOO_LONG",
    )
  }

  const topN = Math.min(MAX_TOP_N, Math.max(1, Math.floor(body.topN ?? DEFAULT_TOP_N)))
  const minScore =
    typeof body.minScore === "number" && body.minScore >= 0 && body.minScore <= 1
      ? body.minScore
      : DEFAULT_MIN_SCORE

  const suggestions = suggestCpvCodes(description, topN, minScore)

  return NextResponse.json({
    ok: true,
    description,
    suggestions,
    note: "Sugestii informative — decizia codului CPV final aparține contabilului (CECCAR Art. 14). Verifică în catalogul oficial EU Reg. 2195/2002.",
  })
}
