// API F#11 — explain enriched pentru o listă de coduri erori e-Factura.
//
// POST { errors: string[] } → { explanations: EnrichedExplanation[] }
//
// Foloseste static error map + legal references + autoFixSafe flag.
// (Phase 2: opțional Gemini API enrichment pentru context dinamic.)

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { enrichErrorList } from "@/lib/compliance/efactura-error-ai-explain"

export async function POST(request: Request) {
  let body: { errors?: string[] }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return jsonError("Body invalid.", 400, "EXPLAIN_INVALID_BODY")
  }

  if (!Array.isArray(body.errors)) {
    return jsonError("errors (array) obligatoriu.", 400, "EXPLAIN_NO_ERRORS")
  }
  if (body.errors.length > 50) {
    return jsonError("Maxim 50 erori per request.", 400, "EXPLAIN_TOO_MANY")
  }

  const explanations = enrichErrorList(body.errors)

  return NextResponse.json({
    ok: true,
    explanations,
    note: "Explicații informative — decizia fix aparține contabilului per CECCAR Art. 14.",
  })
}
