// P0-6 — Poll ANAF SPV submission status.
// GET: checks ANAF for the current status of a submission.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { checkSubmitStatus, getSubmission } from "@/lib/server/anaf-submit-flow"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireRole(request, [...READ_ROLES], "verificare status transmitere ANAF")

    const orgId = session.orgId
    const { id: submissionId } = await params

    // First just get the submission
    const submission = await getSubmission(orgId, submissionId)
    if (!submission) {
      return jsonError("Transmiterea nu a fost găsită.", 404, "SUBMISSION_NOT_FOUND")
    }

    // If it's already resolved or not yet submitted, return without polling ANAF
    if (
      submission.status === "ok" ||
      submission.status === "nok" ||
      submission.status === "error" ||
      submission.status === "pending_approval" ||
      submission.status === "approved" ||
      submission.status === "submitting"
    ) {
      return NextResponse.json({ submission, polled: false })
    }

    // Poll ANAF for status update
    const result = await checkSubmitStatus({ orgId, submissionId })

    return NextResponse.json({
      submission: result.submission,
      anafResult: result.anafResult,
      polled: true,
      changed: result.changed,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la verificarea statusului.", 500, "STATUS_CHECK_FAILED")
  }
}
