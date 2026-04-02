/**
 * GOLD 4 — Generate response draft for a DSAR request.
 * GET /api/dsar/[id]/draft → returns draft markdown
 */
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { readDsarState, updateDsar } from "@/lib/server/dsar-store"
import { generateDsarDraft } from "@/lib/compliance/dsar-drafts"
import { WRITE_ROLES } from "@/lib/server/rbac"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "generare draft DSAR")
    const { id } = await params

    const state = await readDsarState(session.orgId)
    const dsarReq = state.requests.find((r) => r.id === id)
    if (!dsarReq) {
      return jsonError("Cererea DSAR nu a fost găsită.", 404, "NOT_FOUND")
    }

    const draft = generateDsarDraft({
      requestType: dsarReq.requestType,
      requesterName: dsarReq.requesterName,
      orgName: session.orgName || session.orgId,
    })

    // Mark draft as generated
    await updateDsar(session.orgId, id, { draftResponseGenerated: true })

    return NextResponse.json({ draft })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la generarea draft-ului.", 500, "DRAFT_FAILED")
  }
}
