import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, type UserRole } from "@/lib/server/auth"
import {
  readNis2State,
  saveDnscRegistrationNumber,
  saveDnscRegistrationStatus,
  type DnscRegistrationStatus,
} from "@/lib/server/nis2-store"
import { detectEntityType } from "@/lib/compliance/nis2-rules"
import { buildDnscRescueFinding, DNSC_RESCUE_FINDING_ID } from "@/lib/compliance/nis2-rescue"
import { mutateFreshStateForOrg } from "@/lib/server/mvp-store"
import { mergeNis2PackageFindings } from "@/lib/server/nis2-package-sync"
import { preserveRuntimeStateForSingleFinding } from "@/lib/server/preserve-finding-runtime-state"
import { WRITE_ROLES } from "@/lib/server/rbac"

const VALID_STATUSES: DnscRegistrationStatus[] = [
  "not-started",
  "in-progress",
  "submitted",
  "confirmed",
]

const READ_ROLES: UserRole[] = ["owner", "partner_manager", "compliance", "reviewer", "viewer"]

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, READ_ROLES, "citirea statusului DNSC")
    const nis2State = await readNis2State(session.orgId)

    return NextResponse.json({
      status: nis2State.dnscRegistrationStatus ?? "not-started",
      registrationNumber: nis2State.dnscRegistrationNumber ?? null,
      correspondence: nis2State.dnscRegistrationCorrespondence ?? [],
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca statusul DNSC.", 500, "DNSC_STATUS_READ_FAILED")
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireFreshRole(req, WRITE_ROLES, "actualizarea statusului DNSC")
    const body = (await req.json()) as { status?: string; registrationNumber?: string }

    if (body.registrationNumber !== undefined && !body.status) {
      await saveDnscRegistrationNumber(session.orgId, body.registrationNumber)
      return NextResponse.json({ ok: true })
    }

    if (!body.status || !VALID_STATUSES.includes(body.status as DnscRegistrationStatus)) {
      return jsonError("Status invalid.", 400, "INVALID_DNSC_STATUS")
    }

    const newStatus = body.status as DnscRegistrationStatus
    const state = await saveDnscRegistrationStatus(session.orgId, newStatus)
    if (body.registrationNumber !== undefined) {
      await saveDnscRegistrationNumber(session.orgId, body.registrationNumber)
    }

    const nis2State = await readNis2State(session.orgId)
    const sector = nis2State.assessment?.sector ?? "general"
    const entityType = detectEntityType(sector)
    const now = new Date().toISOString()
    const rescueFinding = buildDnscRescueFinding(entityType, newStatus, now)

    await mutateFreshStateForOrg(
      session.orgId,
      (current) => ({
        ...current,
        findings: mergeNis2PackageFindings(
          [
            ...current.findings.filter((f) => f.id !== DNSC_RESCUE_FINDING_ID),
            ...(rescueFinding ? [preserveRuntimeStateForSingleFinding(current.findings, rescueFinding)] : []),
          ],
          nis2State,
          now
        ),
      }),
      session.orgName
    )

    return NextResponse.json({ status: state.dnscRegistrationStatus })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza statusul DNSC.", 500, "DNSC_STATUS_UPDATE_FAILED")
  }
}
