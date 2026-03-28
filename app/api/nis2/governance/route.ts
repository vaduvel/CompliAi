// NIS2 Governance / Board Training Tracker — Sprint 2.7
// GET: list board members
// POST: create member + regenerate governance findings

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readBoardMembers, createBoardMember } from "@/lib/server/nis2-store"
import type { BoardMember } from "@/lib/server/nis2-store"
import { buildGovernanceFindings } from "@/lib/compliance/governance-findings"
import { mutateState } from "@/lib/server/mvp-store"
import { preserveRuntimeStateForRegeneratedFindings } from "@/lib/server/preserve-finding-runtime-state"

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { orgId } = await getOrgContext()
    const members = await readBoardMembers(orgId)
    return NextResponse.json({ members })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca membrii conducerii.", 500, "GOVERNANCE_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as Partial<BoardMember>

    if (!body.name?.trim() || !body.role?.trim()) {
      return jsonError("Câmpuri obligatorii: name, role.", 400, "MISSING_FIELDS")
    }

    const { orgId } = await getOrgContext()
    const member = await createBoardMember(orgId, {
      name: body.name.trim(),
      role: body.role.trim(),
      ...(body.nis2TrainingCompleted !== undefined && { nis2TrainingCompleted: body.nis2TrainingCompleted }),
      ...(body.cisoCertification !== undefined && { cisoCertification: body.cisoCertification }),
      ...(body.cisoCertExpiry !== undefined && { cisoCertExpiry: body.cisoCertExpiry }),
      ...(body.notes !== undefined && { notes: body.notes }),
    })

    // Regenerate governance findings after member change
    const allMembers = await readBoardMembers(orgId)
    const govFindings = buildGovernanceFindings(allMembers, new Date().toISOString())
    await mutateState((current) => ({
      ...current,
      findings: [
        ...current.findings.filter((f) => !f.id.startsWith("nis2-gov-")),
        ...preserveRuntimeStateForRegeneratedFindings(current.findings, govFindings),
      ],
    }))

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut adăuga membrul.", 500, "GOVERNANCE_CREATE_FAILED")
  }
}
