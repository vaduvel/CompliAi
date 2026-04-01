// P0-6 — Execute approved ANAF SPV submit.
// POST: verifies approval, uploads XML to ANAF, returns result.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { executeSubmit } from "@/lib/server/anaf-submit-flow"

const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

export async function POST(request: Request) {
  try {
    requireRole(request, [...WRITE_ROLES], "executare transmitere ANAF")

    const orgId = request.headers.get("x-compliscan-org-id") ?? ""

    const body = (await request.json()) as {
      submissionId?: string
    }

    if (!body.submissionId) {
      return jsonError("submissionId este obligatoriu.", 400, "MISSING_SUBMISSION_ID")
    }

    const result = await executeSubmit({
      orgId,
      submissionId: body.submissionId,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          submission: result.submission,
          error: result.error,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      submission: result.submission,
      message: result.submission.indexDescarcare
        ? `Factură transmisă la ANAF. Index încărcare: ${result.submission.indexDescarcare}`
        : "Factură transmisă la ANAF.",
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la transmiterea către ANAF.", 500, "SUBMIT_EXEC_FAILED")
  }
}
