// POST /api/reports/share-token — G2: Generate secure share link
// Creates a 72h-expiry token for sharing with accountant/counsel/partner.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { generateSignedShareToken } from "@/lib/server/share-token-store"

export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "generarea linkului securizat de partajare"
    )

    const body = (await request.json()) as { recipientType?: string }
    const recipientType = (body.recipientType === "counsel" || body.recipientType === "partner")
      ? body.recipientType
      : "accountant" as const

    const token = generateSignedShareToken(session.orgId, recipientType, new Date().toISOString())
    const expiresAtISO = new Date(Date.now() + 72 * 3_600_000).toISOString()

    return NextResponse.json({ ok: true, token, expiresAtISO })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Eroare la generarea tokenului.", 500, "SHARE_TOKEN_FAILED")
  }
}
