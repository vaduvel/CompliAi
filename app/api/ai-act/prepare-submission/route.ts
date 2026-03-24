// S4.3 — Prepare EU AI Database submission JSON
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { WRITE_ROLES } from "@/lib/server/rbac"
import { generateEUDatabaseEntry } from "@/lib/compliance/ai-act-exporter"
import type { AISystemPurpose } from "@/lib/compliance/types"

export async function POST(request: Request) {
  try {
    requireRole(request, WRITE_ROLES, "pregătirea înregistrării EU Database")
    const body = await request.json()

    const { systemName, purpose, description, humanOversightMeasures, memberStates } = body
    if (!systemName?.trim()) return jsonError("Numele sistemului este obligatoriu.", 400, "MISSING_FIELD")
    if (!purpose) return jsonError("Scopul sistemului este obligatoriu.", 400, "MISSING_FIELD")

    const { orgId } = await getOrgContext()

    // In a real implementation, we'd read org profile for address/email
    const entry = generateEUDatabaseEntry({
      systemName: systemName.trim(),
      purpose: purpose as AISystemPurpose,
      description,
      orgName: body.orgName ?? "Organizația mea",
      orgAddress: body.orgAddress,
      orgCountry: body.orgCountry ?? "RO",
      orgEmail: body.orgEmail,
      memberStates,
      humanOversightMeasures,
    })

    return NextResponse.json({ entry })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut pregăti înregistrarea.", 500, "AI_ACT_SUBMISSION_FAILED")
  }
}
