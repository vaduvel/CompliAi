import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { AISystemPurpose } from "@/lib/compliance/types"
import { buildAISystemRecord } from "@/lib/compliance/ai-inventory"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"

type AISystemPayload = {
  name?: string
  purpose?: AISystemPurpose
  vendor?: string
  modelType?: string
  usesPersonalData?: boolean
  makesAutomatedDecisions?: boolean
  impactsRights?: boolean
  hasHumanReview?: boolean
}

function isPurpose(value: unknown): value is AISystemPurpose {
  return [
    "hr-screening",
    "credit-scoring",
    "biometric-identification",
    "fraud-detection",
    "marketing-personalization",
    "support-chatbot",
    "document-assistant",
    "other",
  ].includes(String(value))
}

export async function POST(request: Request) {
  const body = (await request.json()) as AISystemPayload
  const actor = await resolveOptionalEventActor(request)

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Numele sistemului este obligatoriu." }, { status: 400 })
  }

  if (!isPurpose(body.purpose)) {
    return NextResponse.json({ error: "Scopul sistemului este invalid." }, { status: 400 })
  }

  const nowISO = new Date().toISOString()
  const record = buildAISystemRecord(
    {
      name: body.name,
      purpose: body.purpose,
      vendor: body.vendor?.trim() || "Necunoscut",
      modelType: body.modelType?.trim() || "Nespecificat",
      usesPersonalData: Boolean(body.usesPersonalData),
      makesAutomatedDecisions: Boolean(body.makesAutomatedDecisions),
      impactsRights: Boolean(body.impactsRights),
      hasHumanReview: Boolean(body.hasHumanReview),
    },
    nowISO
  )

  const nextState = await mutateState((current) => ({
    ...current,
    aiSystems: [record, ...current.aiSystems].slice(0, 50),
    events: appendComplianceEvents(current, [
      createComplianceEvent({
        type: "system.created",
        entityType: "system",
        entityId: record.id,
        message: `Sistem AI adaugat: ${record.name}.`,
        createdAtISO: nowISO,
        metadata: {
          riskLevel: record.riskLevel,
          purpose: record.purpose,
        },
      }, actor),
    ]),
  }))

  return NextResponse.json({
    ...(await buildDashboardPayload(nextState)),
    aiSystem: record,
    message: "Sistemul AI a fost adaugat in inventar.",
  })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const actor = await resolveOptionalEventActor(request)

  if (!id) {
    return NextResponse.json({ error: "ID-ul sistemului este obligatoriu." }, { status: 400 })
  }

  const nowISO = new Date().toISOString()
  const nextState = await mutateState((current) => {
    const exists = current.aiSystems.some((s) => s.id === id)
    if (!exists) return current

    return {
      ...current,
      aiSystems: current.aiSystems.filter((s) => s.id !== id),
      events: appendComplianceEvents(current, [
        createComplianceEvent({
          type: "system.deleted",
          entityType: "system",
          entityId: id,
          message: `Sistem AI eliminat din inventar.`,
          createdAtISO: nowISO,
        }, actor),
      ]),
    }
  })

  return NextResponse.json({
    ...(await buildDashboardPayload(nextState)),
    message: "Sistemul AI a fost eliminat din inventar.",
  })
}
