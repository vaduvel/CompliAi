// D300/D394 draft assistant — primește SAF-T XML, extrage tranzacții TVA,
// returnează draft D300 + D394 pre-completat. Contabilul revizuiește/aprobă.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import {
  buildD300Draft,
  buildD394Draft,
  extractVatLinesFromSaft,
} from "@/lib/compliance/d300-assistant"

export async function POST(request: Request) {
  try {
    await requireFreshAuthenticatedSession(request, "D300 draft assistant")
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Auth eșuată.", 401, "D300_AUTH_FAILED")
  }

  let body: { xml?: string; period?: string }
  try {
    body = (await request.json()) as { xml?: string; period?: string }
  } catch {
    return jsonError("Body invalid (JSON).", 400, "D300_INVALID_BODY")
  }

  if (!body.xml || body.xml.trim().length < 100) {
    return jsonError("XML SAF-T lipsește.", 400, "D300_NO_XML")
  }
  if (!body.period) {
    return jsonError("Perioada lipsește (ex: 2026-04).", 400, "D300_NO_PERIOD")
  }

  const nowISO = new Date().toISOString()
  const lines = extractVatLinesFromSaft(body.xml)

  const d300 = buildD300Draft(body.period, lines, nowISO)
  const d394 = buildD394Draft(body.period, lines, nowISO)

  return NextResponse.json({
    ok: true,
    period: body.period,
    transactionsExtracted: lines.length,
    d300,
    d394,
    timestamp: nowISO,
  })
}
