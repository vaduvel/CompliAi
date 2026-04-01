import { NextResponse } from "next/server"

import { getOrgContext } from "@/lib/server/org-context"
import {
  getDnscRegistrationStatus,
  readNis2State,
  saveDnscRegistrationNumber,
  saveDnscRegistrationStatus,
  type DnscRegistrationStatus,
} from "@/lib/server/nis2-store"
import { detectEntityType } from "@/lib/compliance/nis2-rules"
import { buildDnscRescueFinding, DNSC_RESCUE_FINDING_ID } from "@/lib/compliance/nis2-rescue"
import { mutateFreshState } from "@/lib/server/mvp-store"
import { mergeNis2PackageFindings } from "@/lib/server/nis2-package-sync"
import { preserveRuntimeStateForSingleFinding } from "@/lib/server/preserve-finding-runtime-state"

const VALID_STATUSES: DnscRegistrationStatus[] = [
  "not-started",
  "in-progress",
  "submitted",
  "confirmed",
]

export async function GET() {
  const { orgId } = await getOrgContext()
  const nis2State = await readNis2State(orgId)
  return NextResponse.json({
    status: nis2State.dnscRegistrationStatus ?? "not-started",
    registrationNumber: nis2State.dnscRegistrationNumber ?? null,
    correspondence: nis2State.dnscRegistrationCorrespondence ?? [],
  })
}

export async function PUT(req: Request) {
  const { orgId } = await getOrgContext()
  const body = (await req.json()) as { status?: string; registrationNumber?: string }

  // Update registration number if provided (without changing status)
  if (body.registrationNumber !== undefined && !body.status) {
    await saveDnscRegistrationNumber(orgId, body.registrationNumber)
    return NextResponse.json({ ok: true })
  }

  if (!body.status || !VALID_STATUSES.includes(body.status as DnscRegistrationStatus)) {
    return NextResponse.json({ error: "Status invalid" }, { status: 400 })
  }

  const newStatus = body.status as DnscRegistrationStatus
  const state = await saveDnscRegistrationStatus(orgId, newStatus)
  if (body.registrationNumber !== undefined) {
    await saveDnscRegistrationNumber(orgId, body.registrationNumber)
  }

  // Sync rescue finding in central board when DNSC status changes (V3 P0.2)
  const nis2State = await readNis2State(orgId)
  const sector = nis2State.assessment?.sector ?? "general"
  const entityType = detectEntityType(sector)
  const now = new Date().toISOString()
  const rescueFinding = buildDnscRescueFinding(entityType, newStatus, now)

  await mutateFreshState((current) => ({
    ...current,
    findings: mergeNis2PackageFindings(
      [
        ...current.findings.filter((f) => f.id !== DNSC_RESCUE_FINDING_ID),
        ...(rescueFinding ? [preserveRuntimeStateForSingleFinding(current.findings, rescueFinding)] : []),
      ],
      nis2State,
      now
    ),
  }))

  return NextResponse.json({ status: state.dnscRegistrationStatus })
}
