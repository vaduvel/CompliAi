// POST /api/reports/share-token — G2: Generate secure share link
// Creates a 72h-expiry token for sharing with accountant/counsel/partner.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { getOrgContext } from "@/lib/server/org-context"
import { generateShareToken } from "@/lib/compliance/response-pack"

export async function POST(request: Request) {
  try {
    const ctx = await getOrgContext()
    if (!ctx?.orgId) return jsonError("Neautorizat.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as { recipientType?: string }
    const recipientType = (body.recipientType === "counsel" || body.recipientType === "partner")
      ? body.recipientType
      : "accountant" as const

    const token = generateShareToken(ctx.orgId, recipientType, new Date().toISOString())

    return NextResponse.json({ ok: true, token })
  } catch {
    return jsonError("Eroare la generarea tokenului.", 500, "SHARE_TOKEN_FAILED")
  }
}
