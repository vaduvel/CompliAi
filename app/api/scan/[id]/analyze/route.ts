import { NextResponse } from "next/server"

import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { mutateState } from "@/lib/server/mvp-store"
import { analyzeExtractedScan } from "@/lib/server/scan-workflow"

type AnalyzePayload = {
  reviewedContent?: string
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as AnalyzePayload

    const nextState = await mutateState((current) =>
      analyzeExtractedScan(current, id, body.reviewedContent)
    )

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message: "Analiza a fost rulata pe textul revizuit.",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare la analiza."

    if (message === "SCAN_NOT_FOUND") {
      return NextResponse.json({ error: "Scan-ul nu exista." }, { status: 404 })
    }

    if (message === "SCAN_ALREADY_ANALYZED") {
      return NextResponse.json(
        { error: "Acest scan a fost deja analizat." },
        { status: 409 }
      )
    }

    if (message === "SCAN_EMPTY_CONTENT") {
      return NextResponse.json(
        { error: "Textul revizuit este gol. Corecteaza continutul inainte de analiza." },
        { status: 422 }
      )
    }

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
