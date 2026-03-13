import { NextResponse } from "next/server"

import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { mutateState } from "@/lib/server/mvp-store"
import {
  createExtractedScan,
  type ExtractionResult,
  type ScanInputPayload,
} from "@/lib/server/scan-workflow"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScanInputPayload
    let extractionResult: ExtractionResult | undefined

    const nextState = await mutateState(async (current) => {
      const extracted = await createExtractedScan(current, body)
      extractionResult = extracted.result
      return extracted.nextState
    })

    if (!extractionResult) {
      throw new Error("Extragerea s-a terminat fara rezultat utilizabil.")
    }

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      scan: extractionResult.scan,
      ocrUsed: extractionResult.ocrUsed,
      ocrWarning: extractionResult.ocrWarning,
      extractedTextPreview: extractionResult.extractedTextPreview,
      message: "Textul a fost extras. Revizuieste-l si porneste analiza.",
    })
  } catch (error) {
    const err = error as Error & { ocrWarning?: string | null }
    const message = err instanceof Error ? err.message : "Eroare la extragere."
    const status = message.includes("Nu am extras") ? 422 : 400
    return NextResponse.json(
      { error: message, ocrWarning: err.ocrWarning ?? null, extractionStatus: "needs_review" },
      { status }
    )
  }
}
