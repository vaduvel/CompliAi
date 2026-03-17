// NIS2 Governance — individual member operations — Sprint 2.7
// DELETE: remove member + refresh findings
// PATCH: update member fields + refresh findings

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { deleteBoardMember, updateBoardMember, readBoardMembers } from "@/lib/server/nis2-store"
import type { BoardMember } from "@/lib/server/nis2-store"
import { buildGovernanceFindings } from "@/lib/compliance/governance-findings"
import { mutateState } from "@/lib/server/mvp-store"

async function refreshGovernanceFindings(orgId: string) {
  const allMembers = await readBoardMembers(orgId)
  const govFindings = buildGovernanceFindings(allMembers, new Date().toISOString())
  await mutateState((current) => ({
    ...current,
    findings: [
      ...current.findings.filter((f) => !f.id.startsWith("nis2-gov-")),
      ...govFindings,
    ],
  }))
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { id } = await params
    const body = (await request.json()) as Partial<BoardMember>
    const { orgId } = await getOrgContext()
    const updated = await updateBoardMember(orgId, id, body)
    if (!updated) return jsonError("Membrul nu a fost găsit.", 404, "NOT_FOUND")

    await refreshGovernanceFindings(orgId)
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
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { id } = await params
    const { orgId } = await getOrgContext()
    const ok = await deleteBoardMember(orgId, id)
    if (!ok) return jsonError("Membrul nu a fost găsit.", 404, "NOT_FOUND")

    await refreshGovernanceFindings(orgId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut șterge membrul.", 500, "GOVERNANCE_DELETE_FAILED")
  }
}
