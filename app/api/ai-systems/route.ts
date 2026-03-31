import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { AISystemApprovalStatus, AISystemAttestationStatus, AISystemPurpose, ComplianceAlert } from "@/lib/compliance/types"
import { buildAISystemRecord } from "@/lib/compliance/ai-inventory"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { DELETE_ROLES, WRITE_ROLES } from "@/lib/server/rbac"

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
  try {
    requireRole(request, WRITE_ROLES, "adăugarea sistemului AI")
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    throw error
  }

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

  // R-4: dacă vânzătorul e extern (nu "Necunoscut"), creăm o alertă de review DPA
  const hasExternalVendor =
    body.vendor?.trim() && body.vendor.trim().toLowerCase() !== "necunoscut"

  const dpaAlert: ComplianceAlert | null = hasExternalVendor
    ? {
        id: `alert-dpa-${record.id}`,
        message: `Sistem AI adăugat cu furnizor extern (${record.vendor}) — verifică dacă există un DPA (Data Processing Agreement) semnat cu acest furnizor.`,
        severity: "medium",
        open: true,
        createdAtISO: nowISO,
        findingId: record.id,
      }
    : null

  const nextState = await mutateState((current) => ({
    ...current,
    aiSystems: [record, ...current.aiSystems].slice(0, 50),
    alerts: dpaAlert
      ? [dpaAlert, ...current.alerts].slice(0, 200)
      : current.alerts,
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
  try {
    requireRole(request, DELETE_ROLES, "ștergerea sistemului AI")
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    throw error
  }
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

type PatchPayload = {
  id?: string
  approvalStatus?: AISystemApprovalStatus
  policyAttestationStatus?: AISystemAttestationStatus
}

function isApprovalStatus(v: unknown): v is AISystemApprovalStatus {
  return ["pending", "approved", "rejected"].includes(String(v))
}

function isAttestationStatus(v: unknown): v is AISystemAttestationStatus {
  return ["not-attested", "attested"].includes(String(v))
}

export async function PATCH(request: Request) {
  try {
    requireRole(request, WRITE_ROLES, "actualizarea sistemului AI")
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    throw error
  }

  const body = (await request.json()) as PatchPayload
  const actor = await resolveOptionalEventActor(request)

  if (!body.id) {
    return NextResponse.json({ error: "ID-ul sistemului este obligatoriu." }, { status: 400 })
  }

  const hasApproval = body.approvalStatus !== undefined
  const hasAttestation = body.policyAttestationStatus !== undefined

  if (!hasApproval && !hasAttestation) {
    return NextResponse.json({ error: "Nicio modificare trimisă." }, { status: 400 })
  }

  if (hasApproval && !isApprovalStatus(body.approvalStatus)) {
    return NextResponse.json({ error: "Status aprobare invalid." }, { status: 400 })
  }

  if (hasAttestation && !isAttestationStatus(body.policyAttestationStatus)) {
    return NextResponse.json({ error: "Status atestare invalid." }, { status: 400 })
  }

  const nowISO = new Date().toISOString()
  const actorEmail = actor?.label ?? "necunoscut"
  const events: ReturnType<typeof createComplianceEvent>[] = []

  const nextState = await mutateState((current) => {
    const idx = current.aiSystems.findIndex((s) => s.id === body.id)
    if (idx === -1) return current

    const system = { ...current.aiSystems[idx] }

    if (hasApproval) {
      system.approvalStatus = body.approvalStatus
      system.approvedAtISO = nowISO
      system.approvedByEmail = actorEmail
      events.push(
        createComplianceEvent({
          type: "system.updated",
          entityType: "system",
          entityId: system.id,
          message: `Sistem AI „${system.name}" — aprobare: ${body.approvalStatus}.`,
          createdAtISO: nowISO,
          metadata: { approvalStatus: body.approvalStatus ?? "pending" },
        }, actor)
      )
    }

    if (hasAttestation) {
      system.policyAttestationStatus = body.policyAttestationStatus
      system.policyAttestedAtISO = nowISO
      system.policyAttestedByEmail = actorEmail
      events.push(
        createComplianceEvent({
          type: "system.updated",
          entityType: "system",
          entityId: system.id,
          message: `Sistem AI „${system.name}" — atestare politică: ${body.policyAttestationStatus}.`,
          createdAtISO: nowISO,
          metadata: { policyAttestationStatus: body.policyAttestationStatus ?? "not-attested" },
        }, actor)
      )
    }

    const aiSystems = [...current.aiSystems]
    aiSystems[idx] = system

    return {
      ...current,
      aiSystems,
      events: appendComplianceEvents(current, events),
    }
  })

  return NextResponse.json({
    ...(await buildDashboardPayload(nextState)),
    message: "Sistemul AI a fost actualizat.",
  })
}
