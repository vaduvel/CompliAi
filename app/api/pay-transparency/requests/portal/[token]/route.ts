// Pay Transparency — Public employee portal endpoint
// Token-based, NO auth required.
// GET: status check (employee verifies their request status)
// POST: submit new request — token-ul în URL identifică ORGANIZAȚIA, nu cererea
// (organizația publică un link unic per ea, accesibil tuturor angajaților)

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import {
  computeDaysRemaining,
  createRequest,
  getRequestByToken,
  type EmployeeRequestQuestion,
} from "@/lib/server/pay-transparency-requests-store"

// Token-ul URL e mapping orgId — în prod, ar trebui derivat dintr-un secret
// per org. Pentru MVP, folosim direct orgId-ul ca token (HR-ul îi dă link
// angajaților). Producția ulterioară: HMAC-signed token cu rotation.
function decodeOrgToken(token: string): string | null {
  // Format așteptat: org-XXXX (orgId direct).
  // În viitor: HMAC verification + rotation.
  if (!token || !token.startsWith("org-")) return null
  return token
}

const VALID_QUESTIONS: EmployeeRequestQuestion[] = [
  "own_salary",
  "average_salary_role",
  "gender_pay_gap",
  "promotion_criteria",
  "other",
]

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const orgId = decodeOrgToken(token)
  if (!orgId) {
    return jsonError("Token invalid sau expirat.", 404, "PT_PORTAL_INVALID_TOKEN")
  }
  // Public GET — confirmă că orgId-ul există dar nu returnează date
  return NextResponse.json({
    ok: true,
    portalAvailable: true,
    orgId,
  })
}

type PostBody = {
  /** Token request (sub-token al cererii personale, dacă angajatul vrea status). */
  requestToken?: string
  jobRole?: string
  question?: EmployeeRequestQuestion
  detail?: string
  employeeName?: string
  contactEmail?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const orgId = decodeOrgToken(token)
  if (!orgId) {
    return jsonError("Token invalid sau expirat.", 404, "PT_PORTAL_INVALID_TOKEN")
  }

  const body = (await request.json()) as PostBody

  // If body has requestToken, return status of that personal request
  if (body.requestToken) {
    const found = await getRequestByToken(orgId, body.requestToken)
    if (!found) {
      return jsonError("Cerere personală negăsită.", 404, "PT_REQUEST_NOT_FOUND")
    }
    const nowISO = new Date().toISOString()
    return NextResponse.json({
      ok: true,
      status: found.status,
      receivedAtISO: found.receivedAtISO,
      deadlineISO: found.deadlineISO,
      daysRemaining: computeDaysRemaining(found, nowISO),
      hasAnswer: Boolean(found.answer),
      answer: found.status === "answered" ? found.answer : null,
    })
  }

  // Otherwise, create new request
  if (!body.jobRole || !body.jobRole.trim()) {
    return jsonError("jobRole required", 400, "INVALID_BODY")
  }
  if (!body.question || !VALID_QUESTIONS.includes(body.question)) {
    return jsonError("question must be a valid EmployeeRequestQuestion", 400, "INVALID_BODY")
  }
  // Anti-spam basic: jobRole trebuie sa fie minim 2 chars
  if (body.jobRole.trim().length < 2) {
    return jsonError("jobRole too short", 400, "INVALID_BODY")
  }

  const created = await createRequest({
    orgId,
    jobRole: body.jobRole,
    question: body.question,
    detail: body.detail,
    employeeName: body.employeeName,
    contactEmail: body.contactEmail,
    nowISO: new Date().toISOString(),
  })

  return NextResponse.json({
    ok: true,
    requestId: created.id,
    requestToken: created.token,
    receivedAtISO: created.receivedAtISO,
    deadlineISO: created.deadlineISO,
    message: "Cererea a fost înregistrată. Vei primi răspuns în maximum 30 de zile.",
  })
}
