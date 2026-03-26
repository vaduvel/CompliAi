// POST /api/reports/share-token — G2: Generate secure share link
// Creates a 72h-expiry token for sharing with accountant/counsel/partner.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { getOrgContext } from "@/lib/server/org-context"
import { generateSignedShareToken } from "@/lib/server/share-token-store"

export async function POST(request: Request) {
  try {
    const ctx = await getOrgContext()
    if (!ctx?.orgId) return jsonError("Neautorizat.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as { recipientType?: string }
    const recipientType = (body.recipientType === "counsel" || body.recipientType === "partner")
      ? body.recipientType
      : "accountant" as const

    const token = generateSignedShareToken(ctx.orgId, recipientType, new Date().toISOString())
    const expiresAtISO = new Date(Date.now() + 72 * 3_600_000).toISOString()

    return NextResponse.json({ ok: true, token, expiresAtISO })
  } catch {
    return jsonError("Eroare la generarea tokenului.", 500, "SHARE_TOKEN_FAILED")
  }
}
