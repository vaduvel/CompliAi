// ANAF Signals Phase C — C4: e-TVA Discrepancy CRUD
// GET: list discrepancies, POST: create, PATCH: transition

import { NextRequest, NextResponse } from "next/server"
import { readState, writeState } from "@/lib/server/mvp-store"
import type { ComplianceState } from "@/lib/compliance/types"
import type { ETVADiscrepancy, ETVADiscrepancyType, DiscrepancyTransition } from "@/lib/compliance/etva-discrepancy"
import {
  classifyDiscrepancySeverity,
  computeDefaultDeadline,
  applyDiscrepancyTransition,
  detectOverdueDiscrepancies,
} from "@/lib/compliance/etva-discrepancy"

type StateWithDiscrepancies = ComplianceState & { etvaDiscrepancies?: ETVADiscrepancy[] }

function uid() {
  return `etva-${Math.random().toString(36).slice(2, 10)}`
}

// GET — list all discrepancies
export async function GET() {
  const state = await readState() as StateWithDiscrepancies
  const discrepancies = state.etvaDiscrepancies ?? []
  const nowISO = new Date().toISOString()
  const updated = detectOverdueDiscrepancies(discrepancies, nowISO)
  return NextResponse.json({ discrepancies: updated })
}

// POST — create new discrepancy
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    type: ETVADiscrepancyType
    period: string
    description: string
    amountDifference?: number
    vatAmountDifference?: number
    deadlineISO?: string
    ownerId?: string
  }

  if (!body.type || !body.period || !body.description) {
    return NextResponse.json({ error: "type, period, description required" }, { status: 400 })
  }

  const nowISO = new Date().toISOString()
  const severity = classifyDiscrepancySeverity(body.type, body.amountDifference)

  const discrepancy: ETVADiscrepancy = {
    id: uid(),
    type: body.type,
    severity,
    status: "detected",
    period: body.period,
    description: body.description,
    amountDifference: body.amountDifference,
    vatAmountDifference: body.vatAmountDifference,
    detectedAtISO: nowISO,
    deadlineISO: body.deadlineISO ?? computeDefaultDeadline(nowISO),
    ownerId: body.ownerId,
  }

  const state = await readState() as StateWithDiscrepancies
  state.etvaDiscrepancies = [...(state.etvaDiscrepancies ?? []), discrepancy]
  await writeState(state)

  return NextResponse.json({ discrepancy }, { status: 201 })
}

// PATCH — transition discrepancy status
export async function PATCH(request: NextRequest) {
  const body = await request.json() as {
    id: string
    transition: DiscrepancyTransition
  }

  if (!body.id || !body.transition) {
    return NextResponse.json({ error: "id and transition required" }, { status: 400 })
  }

  const state = await readState() as StateWithDiscrepancies
  const discrepancies = state.etvaDiscrepancies ?? []
  const idx = discrepancies.findIndex((d) => d.id === body.id)
  if (idx === -1) {
    return NextResponse.json({ error: "discrepancy not found" }, { status: 404 })
  }

  const updated = applyDiscrepancyTransition(discrepancies[idx], body.transition)
  discrepancies[idx] = updated
  state.etvaDiscrepancies = discrepancies
  await writeState(state)

  return NextResponse.json({ discrepancy: updated })
}
