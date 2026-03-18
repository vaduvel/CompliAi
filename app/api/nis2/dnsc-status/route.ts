import { NextResponse } from "next/server"

import { getOrgContext } from "@/lib/server/org-context"
import {
  getDnscRegistrationStatus,
  readNis2State,
  saveDnscRegistrationStatus,
  type DnscRegistrationStatus,
} from "@/lib/server/nis2-store"
import { detectEntityType } from "@/lib/compliance/nis2-rules"
import { buildDnscRescueFinding, DNSC_RESCUE_FINDING_ID } from "@/lib/compliance/nis2-rescue"
import { mutateState } from "@/lib/server/mvp-store"

const VALID_STATUSES: DnscRegistrationStatus[] = [
  "not-started",
  "in-progress",
  "submitted",
  "confirmed",
]

export async function GET() {
  const { orgId } = await getOrgContext()
  const status = await getDnscRegistrationStatus(orgId)
  return NextResponse.json({ status })
}

export async function PUT(req: Request) {
  const { orgId } = await getOrgContext()
  const body = (await req.json()) as { status?: string }

  if (!body.status || !VALID_STATUSES.includes(body.status as DnscRegistrationStatus)) {
    return NextResponse.json({ error: "Status invalid" }, { status: 400 })
  }

  const newStatus = body.status as DnscRegistrationStatus
  const state = await saveDnscRegistrationStatus(orgId, newStatus)

  // Sync rescue finding in central board when DNSC status changes (V3 P0.2)
  const nis2State = await readNis2State(orgId)
  const sector = nis2State.assessment?.sector ?? "general"
  const entityType = detectEntityType(sector)
  const now = new Date().toISOString()
  const rescueFinding = buildDnscRescueFinding(entityType, newStatus, now)

  await mutateState((current) => ({
    ...current,
    findings: [
      ...current.findings.filter((f) => f.id !== DNSC_RESCUE_FINDING_ID),
      ...(rescueFinding ? [rescueFinding] : []),
    ],
  }))

  return NextResponse.json({ status: state.dnscRegistrationStatus })
}
