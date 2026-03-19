// GET /api/findings/[id]
// Returns a single ScanFinding from the current org's state.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { readState } from "@/lib/server/mvp-store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const state = await readState()
    const finding = state.findings.find((f) => f.id === id)

    if (!finding) {
      return jsonError("Finding inexistent.", 404, "NOT_FOUND")
    }

    return NextResponse.json({ finding })
  } catch {
    return jsonError("Eroare la citirea finding-ului.", 500)
  }
}
