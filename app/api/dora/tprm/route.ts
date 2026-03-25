// POST /api/dora/tprm — add ICT third-party provider
// PATCH /api/dora/tprm/[id] handled separately

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { WRITE_ROLES } from "@/lib/server/rbac"
import { createTprmEntry } from "@/lib/server/dora-store"
import type { TprmCriticality, TprmStatus } from "@/lib/server/dora-store"

const VALID_CRITICALITIES: TprmCriticality[] = ["critical", "important", "standard"]

export async function POST(request: Request) {
  try {
    requireRole(request, WRITE_ROLES, "adăugarea unui furnizor ICT")
    const { orgId } = await getOrgContext()
    const body = await request.json() as {
      providerName?: string
      serviceType?: string
      criticality?: TprmCriticality
      contractStartISO?: string
      contractEndISO?: string
      riskLevel?: "low" | "medium" | "high"
      notes?: string
    }
    if (!body.providerName?.trim()) return jsonError("Numele furnizorului este obligatoriu.", 400, "MISSING_NAME")
    if (!body.serviceType?.trim()) return jsonError("Tipul serviciului este obligatoriu.", 400, "MISSING_SERVICE")
    if (!body.criticality || !VALID_CRITICALITIES.includes(body.criticality)) {
      return jsonError("Criticitate invalidă.", 400, "INVALID_CRITICALITY")
    }
    if (!body.contractStartISO || !body.contractEndISO) {
      return jsonError("Datele contractului sunt obligatorii.", 400, "MISSING_CONTRACT_DATES")
    }

    const entry = await createTprmEntry(orgId, {
      providerName: body.providerName.trim(),
      serviceType: body.serviceType.trim(),
      criticality: body.criticality,
      contractStartISO: body.contractStartISO,
      contractEndISO: body.contractEndISO,
      riskLevel: body.riskLevel ?? "medium",
      status: "active" as TprmStatus,
      notes: body.notes?.trim(),
    })
    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut adăuga furnizorul.", 500, "DORA_TPRM_CREATE_FAILED")
  }
}
