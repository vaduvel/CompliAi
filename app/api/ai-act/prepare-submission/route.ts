// S4.3 — Prepare EU AI Database submission JSON
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { WRITE_ROLES } from "@/lib/server/rbac"
import { generateEUDatabaseEntry } from "@/lib/compliance/ai-act-exporter"
import type { AISystemPurpose } from "@/lib/compliance/types"

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "pregătirea înregistrării EU Database")
    const body = await request.json()

    const { systemName, purpose, description, humanOversightMeasures, memberStates } = body
    if (!systemName?.trim()) return jsonError("Numele sistemului este obligatoriu.", 400, "MISSING_FIELD")
    if (!purpose) return jsonError("Scopul sistemului este obligatoriu.", 400, "MISSING_FIELD")

    const entry = generateEUDatabaseEntry({
      systemName: systemName.trim(),
      purpose: purpose as AISystemPurpose,
      description,
      orgName: body.orgName?.trim() || session.orgName,
      orgAddress: body.orgAddress,
      orgCountry: body.orgCountry ?? "RO",
      orgEmail: body.orgEmail ?? session.email,
      memberStates,
      humanOversightMeasures,
    })

    return NextResponse.json({ entry })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut pregăti înregistrarea.", 500, "AI_ACT_SUBMISSION_FAILED")
  }
}
