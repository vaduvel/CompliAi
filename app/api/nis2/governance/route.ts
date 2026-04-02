// NIS2 Governance / Board Training Tracker — Sprint 2.7
// GET: list board members
// POST: create member + regenerate governance findings

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { readBoardMembers, createBoardMember } from "@/lib/server/nis2-store"
import type { BoardMember } from "@/lib/server/nis2-store"
import { buildGovernanceFindings } from "@/lib/compliance/governance-findings"
import { mutateFreshStateForOrg } from "@/lib/server/mvp-store"
import { preserveRuntimeStateForRegeneratedFindings } from "@/lib/server/preserve-finding-runtime-state"
import { READ_ROLES, WRITE_ROLES } from "@/lib/server/rbac"

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, READ_ROLES, "citirea guvernanței NIS2")
    const members = await readBoardMembers(session.orgId)
    return NextResponse.json({ members })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca membrii conducerii.", 500, "GOVERNANCE_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "actualizarea guvernanței NIS2")

    const body = (await request.json()) as Partial<BoardMember>

    if (!body.name?.trim() || !body.role?.trim()) {
      return jsonError("Câmpuri obligatorii: name, role.", 400, "MISSING_FIELDS")
    }

    const member = await createBoardMember(session.orgId, {
      name: body.name.trim(),
      role: body.role.trim(),
      ...(body.nis2TrainingCompleted !== undefined && { nis2TrainingCompleted: body.nis2TrainingCompleted }),
      ...(body.cisoCertification !== undefined && { cisoCertification: body.cisoCertification }),
      ...(body.cisoCertExpiry !== undefined && { cisoCertExpiry: body.cisoCertExpiry }),
      ...(body.notes !== undefined && { notes: body.notes }),
    })

    // Regenerate governance findings after member change
    const allMembers = await readBoardMembers(session.orgId)
    const govFindings = buildGovernanceFindings(allMembers, new Date().toISOString())
    await mutateFreshStateForOrg(
      session.orgId,
      (current) => ({
        ...current,
        findings: [
          ...current.findings.filter((f) => !f.id.startsWith("nis2-gov-")),
          ...preserveRuntimeStateForRegeneratedFindings(current.findings, govFindings),
        ],
      }),
      session.orgName
    )

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut adăuga membrul.", 500, "GOVERNANCE_CREATE_FAILED")
  }
}
