// POST /api/org/partner-workspace
// Saves minimal partner workspace data — skips full compliance analysis.
// Sets a lightweight orgProfile so the onboarding gate passes.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { trackEvent } from "@/lib/server/analytics"
import type { OrgProfile } from "@/lib/compliance/applicability"

type PartnerWorkspaceBody = {
  orgName?: string
  cui?: string
  clientScale?: "1-5" | "5-20" | "20+"
}

const VALID_CLIENT_SCALES = ["1-5", "5-20", "20+"] as const

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as PartnerWorkspaceBody

    if (!body.clientScale || !VALID_CLIENT_SCALES.includes(body.clientScale as never)) {
      return jsonError("Câmp obligatoriu: clientScale.", 400, "MISSING_CLIENT_SCALE")
    }

    const orgName = typeof body.orgName === "string" ? body.orgName.trim() : undefined
    const cuiRaw = typeof body.cui === "string" ? body.cui.trim() : undefined
    const cui = cuiRaw && /^(RO)?\d{2,10}$/i.test(cuiRaw) ? cuiRaw.toUpperCase() : undefined

    // Minimal orgProfile — marks onboarding as complete without compliance analysis.
    // Partners analyse their clients' compliance, not their own.
    const orgProfile: OrgProfile = {
      sector: "professional-services",
      employeeCount: "1-9",
      usesAITools: false,
      requiresEfactura: false,
      ...(cui ? { cui } : {}),
      completedAtISO: new Date().toISOString(),
    }

    await mutateStateForOrg(session.orgId, (current) => ({
      ...current,
      orgProfile,
      // Store partner workspace metadata separately for future use
      partnerWorkspace: {
        orgName: orgName ?? current.partnerWorkspace?.orgName,
        clientScale: body.clientScale,
        configuredAtISO: new Date().toISOString(),
      },
    }), session.orgName)

    void trackEvent(session.orgId, "completed_partner_workspace", {
      clientScale: body.clientScale,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut salva spațiul de lucru.", 500, "PARTNER_WORKSPACE_SAVE_FAILED")
  }
}
