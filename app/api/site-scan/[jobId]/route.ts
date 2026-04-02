// GET /api/site-scan/[jobId] — Fix #7: poll async scan job status
// Citește statusul job-ului din state (stocat la POST).

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "citirea jobului de scanare site")

    const { jobId } = await params
    if (!jobId) return jsonError("jobId lipsă.", 400, "MISSING_JOB_ID")

    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    if (!state) return jsonError("Starea organizației nu a fost găsită.", 404, "ORG_STATE_NOT_FOUND")
    const job = state.siteScanJobs?.[jobId]

    if (!job) return jsonError("Job-ul nu a fost găsit.", 404, "JOB_NOT_FOUND")

    return NextResponse.json({
      jobId: job.jobId,
      status: job.status,
      url: job.url,
      createdAtISO: job.createdAtISO,
      completedAtISO: job.completedAtISO ?? null,
      result: job.result ?? null,
      error: job.error ?? null,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la citirea job-ului.", 500, "JOB_READ_FAILED")
  }
}
