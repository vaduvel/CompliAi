// Pay Transparency — HR-side requests API
// GET: list cereri pentru org HR
// (POST creates sunt prin /portal/[token] — public endpoint)

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import {
  computeDaysRemaining,
  listRequestsForOrg,
} from "@/lib/server/pay-transparency-requests-store"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, [...READ_ROLES], "citire cereri PT")
    const requests = await listRequestsForOrg(session.orgId)
    const nowISO = new Date().toISOString()
    const enriched = requests.map((r) => ({
      ...r,
      daysRemaining: computeDaysRemaining(r, nowISO),
    }))
    return NextResponse.json({ ok: true, requests: enriched })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la listarea cererilor.", 500, "PT_REQUESTS_LIST_FAILED")
  }
}
