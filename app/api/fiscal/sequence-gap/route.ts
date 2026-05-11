import { NextResponse } from "next/server"

import {
  analyzeInvoiceSequence,
  sequenceFindingsFromAnalysis,
  type InvoiceSequenceEntry,
} from "@/lib/compliance/invoice-sequence-gap"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"

/**
 * POST /api/fiscal/sequence-gap — analyze an array of {invoiceNumber, issueDateISO}
 * for series gaps, duplicates, out-of-order issue dates. Optional: also returns
 * ScanFinding[] ready to drop into the cockpit.
 *
 * Body:
 *   { entries: [{ invoiceNumber, issueDateISO, source? }], generateFindings?: boolean }
 */
export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "analiza secvenței facturilor",
    )
    const body = (await request.json().catch(() => ({}))) as {
      entries?: InvoiceSequenceEntry[]
      generateFindings?: boolean
    }
    if (!Array.isArray(body.entries)) {
      return jsonError("Lipsește array-ul `entries`.", 400, "SEQ_INVALID_BODY")
    }
    const analysis = analyzeInvoiceSequence(body.entries)
    const findings = body.generateFindings
      ? sequenceFindingsFromAnalysis(analysis, new Date().toISOString())
      : []
    return NextResponse.json({
      orgId: session.orgId,
      analysis,
      findings,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Nu am putut analiza secvența.", 500, "SEQ_ANALYZE_FAILED")
  }
}
