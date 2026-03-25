// NIS2 vendor risk register — GET list / POST create

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State, createVendor } from "@/lib/server/nis2-store"
import type { Nis2VendorRiskLevel } from "@/lib/server/nis2-store"
import { executeAgent } from "@/lib/server/agent-orchestrator"

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { orgId } = await getOrgContext()
    const state = await readNis2State(orgId)
    return NextResponse.json({ vendors: state.vendors })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut incarca lista de vendori.", 500, "NIS2_VENDORS_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as {
      name?: string
      service?: string
      riskLevel?: Nis2VendorRiskLevel
      hasSecurityClause?: boolean
      hasIncidentNotification?: boolean
      hasAuditRight?: boolean
      contractReviewAtISO?: string
      notes?: string
    }

    if (!body.name?.trim()) return jsonError("Numele furnizorului este obligatoriu.", 400, "MISSING_NAME")

    const VALID_RISKS: Nis2VendorRiskLevel[] = ["low", "medium", "high", "critical"]
    if (!body.riskLevel || !VALID_RISKS.includes(body.riskLevel)) {
      return jsonError("Nivel de risc invalid.", 400, "INVALID_RISK_LEVEL")
    }

    const { orgId } = await getOrgContext()
    const vendor = await createVendor(orgId, {
      name: body.name.trim(),
      service: (body.service ?? "").trim(),
      riskLevel: body.riskLevel,
      hasSecurityClause: body.hasSecurityClause ?? false,
      hasIncidentNotification: body.hasIncidentNotification ?? false,
      hasAuditRight: body.hasAuditRight ?? false,
      contractReviewAtISO: body.contractReviewAtISO,
      notes: (body.notes ?? "").trim(),
    })

    // Event trigger: run vendor_risk after new vendor is added (fire-and-forget).
    // Checks for missing DPA, contract gaps, re-scores existing vendors in context.
    void executeAgent(orgId, "vendor_risk").catch(() => {/* non-blocking */})

    return NextResponse.json({ vendor }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut crea furnizorul.", 500, "NIS2_VENDOR_CREATE_FAILED")
  }
}
