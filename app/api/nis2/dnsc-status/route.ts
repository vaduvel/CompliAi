import { NextResponse } from "next/server"

import { getOrgContext } from "@/lib/server/org-context"
import {
  getDnscRegistrationStatus,
  saveDnscRegistrationStatus,
  type DnscRegistrationStatus,
} from "@/lib/server/nis2-store"

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

  const state = await saveDnscRegistrationStatus(orgId, body.status as DnscRegistrationStatus)
  return NextResponse.json({ status: state.dnscRegistrationStatus })
}
