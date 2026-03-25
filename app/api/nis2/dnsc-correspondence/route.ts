import { NextResponse } from "next/server"

import { getOrgContext } from "@/lib/server/org-context"
import {
  addDnscRegistrationCorrespondenceEntry,
  deleteDnscRegistrationCorrespondenceEntry,
} from "@/lib/server/nis2-store"

export async function POST(req: Request) {
  const { orgId } = await getOrgContext()
  const body = (await req.json()) as { date?: string; direction?: string; summary?: string }

  if (!body.date || !body.direction || !body.summary?.trim()) {
    return NextResponse.json({ error: "Câmpuri lipsă: date, direction, summary" }, { status: 400 })
  }
  if (body.direction !== "sent" && body.direction !== "received") {
    return NextResponse.json({ error: "direction trebuie să fie 'sent' sau 'received'" }, { status: 400 })
  }

  const correspondence = await addDnscRegistrationCorrespondenceEntry(orgId, {
    date: body.date,
    direction: body.direction,
    summary: body.summary.trim(),
  })

  return NextResponse.json({ correspondence })
}

export async function DELETE(req: Request) {
  const { orgId } = await getOrgContext()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id lipsă" }, { status: 400 })
  }

  const correspondence = await deleteDnscRegistrationCorrespondenceEntry(orgId, id)
  return NextResponse.json({ correspondence })
}
