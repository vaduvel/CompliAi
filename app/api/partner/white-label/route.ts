// P2 — White-label config API for partner orgs.
// GET: returns current white-label config.
// PATCH: updates config fields.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import { getWhiteLabelConfig, saveWhiteLabelConfig } from "@/lib/server/white-label"

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager", "compliance", "reviewer", "viewer"], "white-label config")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("White-label e disponibil doar în modul partner.", 403, "PORTFOLIO_FORBIDDEN")
    }

    const config = await getWhiteLabelConfig(session.orgId)

    return NextResponse.json({ ok: true, config })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la citirea configurației white-label.", 500, "WHITE_LABEL_GET_FAILED")
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager"], "white-label config")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("White-label e disponibil doar în modul partner.", 403, "PORTFOLIO_FORBIDDEN")
    }

    const body = await request.json() as {
      partnerName?: string
      tagline?: string | null
      logoUrl?: string | null
      brandColor?: string
      // S1.3 — AI ON/OFF per client. Cabinet poate dezactiva AI pentru clienti sensibili.
      aiEnabled?: boolean
      // S1.5 — Signature upload (URL imagine PNG transparent, max 2MB)
      signatureUrl?: string | null
      signerName?: string | null
      // S1.6 — ICP segment selectat la onboarding
      icpSegment?: "solo" | "cabinet-dpo" | "cabinet-fiscal" | "imm-internal" | "enterprise" | null
      // S2B.1 — AI provider override per cabinet
      aiProvider?: "gemini" | "mistral" | null
    }

    // Validate brandColor format if provided
    if (body.brandColor && !/^#[0-9a-fA-F]{6}$/.test(body.brandColor)) {
      return jsonError("brandColor trebuie să fie un hex color valid (#rrggbb).", 400, "INVALID_BRAND_COLOR")
    }

    const config = await saveWhiteLabelConfig(session.orgId, {
      ...(body.partnerName !== undefined && { partnerName: body.partnerName }),
      ...(body.tagline !== undefined && { tagline: body.tagline }),
      ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
      ...(body.brandColor !== undefined && { brandColor: body.brandColor }),
      ...(typeof body.aiEnabled === "boolean" && { aiEnabled: body.aiEnabled }),
      ...(body.signatureUrl !== undefined && { signatureUrl: body.signatureUrl }),
      ...(body.signerName !== undefined && { signerName: body.signerName }),
      ...(body.icpSegment !== undefined && { icpSegment: body.icpSegment }),
      ...(body.aiProvider !== undefined && { aiProvider: body.aiProvider }),
    })

    return NextResponse.json({ ok: true, config })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la salvarea configurației white-label.", 500, "WHITE_LABEL_SAVE_FAILED")
  }
}
