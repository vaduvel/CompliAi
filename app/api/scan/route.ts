import { NextResponse } from "next/server"

import { mutateState } from "@/lib/server/mvp-store"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import {
  analyzeExtractedScan,
  createExtractedScan,
  type ExtractionResult,
  validateScanInputPayload,
} from "@/lib/server/scan-workflow"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { RequestValidationError } from "@/lib/server/request-validation"

export async function POST(request: Request) {
  try {
    const body = validateScanInputPayload(await request.json())
    const actor = await resolveOptionalEventActor(request)
    let extractionResult: ExtractionResult | undefined

    const nextState = await mutateState(async (current) => {
      const extracted = await createExtractedScan(current, body, actor)
      extractionResult = extracted.result
      return analyzeExtractedScan(extracted.nextState, extracted.result.scan.id, body.content, actor)
    })

    if (!extractionResult) {
      throw new Error("Extragerea s-a terminat fara rezultat utilizabil.")
    }

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      ocrUsed: extractionResult.ocrUsed,
      ocrWarning: extractionResult.ocrWarning,
      extractedTextPreview: extractionResult.extractedTextPreview,
      message:
        "Scanare finalizată. Acesta este un scor de risc și o recomandare AI. Verifică uman înainte de raport oficial.",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare la scanare."
    const status =
      error instanceof RequestValidationError
        ? error.status
        : message.includes("Nu am extras")
          ? 422
          : 400
    return NextResponse.json(
      {
        error: message,
        code: error instanceof RequestValidationError ? error.code : "SCAN_FAILED",
      },
      { status }
    )
  }
}
