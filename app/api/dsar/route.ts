// S2.3 — DSAR CRUD: GET list + POST create
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { createDsar, readDsarState, updateDsar } from "@/lib/server/dsar-store"
import { generateDsarDraft, generateDsarProcessPack } from "@/lib/compliance/dsar-drafts"
import { WRITE_ROLES } from "@/lib/server/rbac"
import type { DsarRequestType } from "@/lib/server/dsar-store"

const VALID_TYPES: DsarRequestType[] = [
  "access", "rectification", "erasure", "portability", "objection", "restriction",
]

export async function GET(request: Request) {
  try {
    requireRole(request, WRITE_ROLES, "vizualizarea cererilor DSAR")
    const { orgId, orgName } = await getOrgContext()
    const state = await readDsarState(orgId)
    return NextResponse.json({
      requests: state.requests,
      processPack: generateDsarProcessPack({ orgName: orgName || orgId }),
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca cererile DSAR.", 500, "DSAR_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    requireRole(request, WRITE_ROLES, "crearea unei cereri DSAR")
    const body = await request.json()

    const { requesterName, requesterEmail, requestType, receivedAtISO, notes } = body
    if (!requesterName?.trim()) return jsonError("Numele solicitantului este obligatoriu.", 400, "MISSING_FIELD")
    if (!requesterEmail?.trim()) return jsonError("Email-ul solicitantului este obligatoriu.", 400, "MISSING_FIELD")
    if (!VALID_TYPES.includes(requestType)) return jsonError("Tip cerere invalid.", 400, "INVALID_TYPE")

    const { orgId, orgName } = await getOrgContext()
    const dsar = await createDsar(orgId, {
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim(),
      requestType,
      receivedAtISO,
      notes,
    })

    // A1 — Auto-generate draft on creation
    const draft = generateDsarDraft({
      requestType: dsar.requestType,
      requesterName: dsar.requesterName,
      orgName: orgName || orgId,
    })
    const updatedDsar = await updateDsar(orgId, dsar.id, { draftResponseGenerated: true })

    return NextResponse.json({ request: updatedDsar ?? dsar, draft }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut crea cererea DSAR.", 500, "DSAR_CREATE_FAILED")
  }
}
