// ANAF Signals Phase C — C4: Filing Records CRUD
// GET: list + discipline score, POST: create, PATCH: update status

import { NextRequest, NextResponse } from "next/server"
import { readState, writeState } from "@/lib/server/mvp-store"
import type { ComplianceState } from "@/lib/compliance/types"
import type { FilingRecord, FilingType, FilingStatus } from "@/lib/compliance/filing-discipline"
import {
  computeFilingDisciplineScore,
  generateFilingReminders,
  buildOverdueFilingFindings,
  checkFilingConsistency,
} from "@/lib/compliance/filing-discipline"
import { computeSAFTHygiene } from "@/lib/compliance/saft-hygiene"

type StateWithFilings = ComplianceState & { filingRecords?: FilingRecord[] }

function uid() {
  return `filing-${Math.random().toString(36).slice(2, 10)}`
}

// GET — list all filings + score + reminders
export async function GET() {
  const state = await readState() as StateWithFilings
  const records = state.filingRecords ?? []
  const nowISO = new Date().toISOString()

  const disciplineScore = computeFilingDisciplineScore(records)
  const reminders = generateFilingReminders(records, nowISO)
  const overdueFindings = buildOverdueFilingFindings(records, nowISO)
  const consistencyIssues = checkFilingConsistency(records)
  const saftHygiene = computeSAFTHygiene(records, nowISO)

  return NextResponse.json({
    records,
    disciplineScore,
    reminders,
    overdueFindings: overdueFindings.length,
    consistencyIssues,
    saftHygiene,
  })
}

// POST — create new filing record
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    type: FilingType
    period: string
    status: FilingStatus
    dueISO: string
    filedAtISO?: string
    rectificationCount?: number
    ownerId?: string
    note?: string
  }

  if (!body.type || !body.period || !body.status || !body.dueISO) {
    return NextResponse.json({ error: "type, period, status, dueISO required" }, { status: 400 })
  }

  const record: FilingRecord = {
    id: uid(),
    type: body.type,
    period: body.period,
    status: body.status,
    dueISO: body.dueISO,
    filedAtISO: body.filedAtISO,
    rectificationCount: body.rectificationCount,
    ownerId: body.ownerId,
    note: body.note,
  }

  const state = await readState() as StateWithFilings
  state.filingRecords = [...(state.filingRecords ?? []), record]
  await writeState(state)

  return NextResponse.json({ record }, { status: 201 })
}

// PATCH — update filing status
export async function PATCH(request: NextRequest) {
  const body = await request.json() as {
    id: string
    status?: FilingStatus
    filedAtISO?: string
    rectificationCount?: number
    ownerId?: string
    note?: string
  }

  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const state = await readState() as StateWithFilings
  const records = state.filingRecords ?? []
  const idx = records.findIndex((r) => r.id === body.id)
  if (idx === -1) {
    return NextResponse.json({ error: "filing record not found" }, { status: 404 })
  }

  records[idx] = {
    ...records[idx],
    ...(body.status !== undefined && { status: body.status }),
    ...(body.filedAtISO !== undefined && { filedAtISO: body.filedAtISO }),
    ...(body.rectificationCount !== undefined && { rectificationCount: body.rectificationCount }),
    ...(body.ownerId !== undefined && { ownerId: body.ownerId }),
    ...(body.note !== undefined && { note: body.note }),
  }
  state.filingRecords = records
  await writeState(state)

  return NextResponse.json({ record: records[idx] })
}
