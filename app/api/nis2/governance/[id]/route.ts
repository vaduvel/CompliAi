// NIS2 Governance — individual member operations — Sprint 2.7
// DELETE: remove member + refresh findings
// PATCH: update member fields + refresh findings

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { deleteBoardMember, updateBoardMember, readBoardMembers } from "@/lib/server/nis2-store"
import type { BoardMember } from "@/lib/server/nis2-store"
import { buildGovernanceFindings } from "@/lib/compliance/governance-findings"
import { mutateFreshStateForOrg } from "@/lib/server/mvp-store"
import { preserveRuntimeStateForRegeneratedFindings } from "@/lib/server/preserve-finding-runtime-state"
import { DELETE_ROLES, WRITE_ROLES } from "@/lib/server/rbac"

async function refreshGovernanceFindings(orgId: string, orgName?: string) {
  const allMembers = await readBoardMembers(orgId)
  const govFindings = buildGovernanceFindings(allMembers, new Date().toISOString())
  await mutateFreshStateForOrg(
    orgId,
    (current) => ({
      ...current,
      findings: [
        ...current.findings.filter((f) => !f.id.startsWith("nis2-gov-")),
        ...preserveRuntimeStateForRegeneratedFindings(current.findings, govFindings),
      ],
    }),
    orgName
  )
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "actualizarea guvernanței NIS2")

    const { id } = await params
    const body = (await request.json()) as Partial<BoardMember>
    const updated = await updateBoardMember(session.orgId, id, body)
    if (!updated) return jsonError("Membrul nu a fost găsit.", 404, "NOT_FOUND")

    await refreshGovernanceFindings(session.orgId, session.orgName)
    return NextResponse.json({ member: updated })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza membrul.", 500, "GOVERNANCE_UPDATE_FAILED")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, DELETE_ROLES, "ștergerea membrului de guvernanță NIS2")

    const { id } = await params
    const ok = await deleteBoardMember(session.orgId, id)
    if (!ok) return jsonError("Membrul nu a fost găsit.", 404, "NOT_FOUND")

    await refreshGovernanceFindings(session.orgId, session.orgName)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut șterge membrul.", 500, "GOVERNANCE_DELETE_FAILED")
  }
}
