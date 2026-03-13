import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { AISystemPurpose } from "@/lib/compliance/types"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import {
  confirmDetectedSystem,
  findDetectedSystem,
  updateDetectedSystem,
} from "@/lib/server/detected-ai-systems"
import { mutateState } from "@/lib/server/mvp-store"

type CandidateAction = "review" | "confirm" | "reject" | "restore" | "edit"
type CandidateEditPayload = {
  name?: string
  purpose?: AISystemPurpose
  vendor?: string
  modelType?: string
  usesPersonalData?: boolean
  makesAutomatedDecisions?: boolean
  impactsRights?: boolean
  hasHumanReview?: boolean
  confidence?: "low" | "medium" | "high"
  frameworks?: string[]
  evidence?: string[]
}

const PURPOSES = new Set<AISystemPurpose>([
  "hr-screening",
  "credit-scoring",
  "biometric-identification",
  "fraud-detection",
  "marketing-personalization",
  "support-chatbot",
  "document-assistant",
  "other",
])

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = (await request.json()) as { action?: CandidateAction; updates?: CandidateEditPayload }

  if (!body.action || !["review", "confirm", "reject", "restore", "edit"].includes(body.action)) {
    return NextResponse.json({ error: "Actiunea pentru sistemul detectat este invalida." }, { status: 400 })
  }

  const nowISO = new Date().toISOString()
  const actor = await resolveOptionalEventActor(request)

  try {
    const nextState = await mutateState((current) => {
      const candidate = findDetectedSystem(current, id)
      if (!candidate) throw new Error("DETECTED_SYSTEM_NOT_FOUND")

      if (body.action === "edit") {
        const updates = sanitizeEditPayload(body.updates)
        const edited = updateDetectedSystem(candidate, updates)

        return {
          ...current,
          detectedAISystems: current.detectedAISystems.map((item) =>
            item.id === id ? edited : item
          ),
          events: appendComplianceEvents(current, [
            createComplianceEvent({
              type: "system.edited",
              entityType: "system",
              entityId: id,
              message: `Detectia a fost ajustata inainte de confirmare: ${edited.name}.`,
              createdAtISO: nowISO,
              metadata: {
                riskLevel: edited.riskLevel,
                confidence: edited.confidence,
              },
            }, actor),
          ]),
        }
      }

      if (body.action === "confirm") {
        const aiSystem = confirmDetectedSystem(candidate, nowISO)
        return {
          ...current,
          aiSystems: [aiSystem, ...current.aiSystems].slice(0, 50),
          detectedAISystems: current.detectedAISystems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  detectionStatus: "confirmed",
                  confirmedSystemId: aiSystem.id,
                }
              : item
          ),
          events: appendComplianceEvents(current, [
            createComplianceEvent({
              type: "system.confirmed",
              entityType: "system",
              entityId: aiSystem.id,
              message: `Sistem confirmat in inventar: ${aiSystem.name}.`,
              createdAtISO: nowISO,
              metadata: {
                riskLevel: aiSystem.riskLevel,
              },
            }, actor),
          ]),
        }
      }

      const nextStatus =
        body.action === "review"
          ? "reviewed"
          : body.action === "reject"
            ? "rejected"
            : "detected"

      return {
        ...current,
        detectedAISystems: current.detectedAISystems.map((item) =>
          item.id === id
            ? {
                ...item,
                detectionStatus: nextStatus,
              }
            : item
        ),
        events: appendComplianceEvents(current, [
          createComplianceEvent({
            type: `system.${body.action}`,
            entityType: "system",
            entityId: id,
            message:
              body.action === "review"
                ? `Sistem detectat marcat ca revizuit: ${candidate.name}.`
                : body.action === "reject"
                ? `Sistem detectat respins: ${candidate.name}.`
                : `Sistem detectat repus in lucru: ${candidate.name}.`,
            createdAtISO: nowISO,
          }, actor),
        ]),
      }
    })

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message:
        body.action === "confirm"
          ? "Sistemul detectat a fost confirmat in inventar."
          : body.action === "edit"
            ? "Detectia a fost actualizata si reclasificata."
          : body.action === "reject"
            ? "Sistemul detectat a fost respins."
            : body.action === "review"
              ? "Sistemul detectat a fost marcat pentru review."
              : "Sistemul detectat a fost repus in lista activa.",
    })
  } catch (error) {
    if (error instanceof Error && error.message === "DETECTED_SYSTEM_NOT_FOUND") {
      return NextResponse.json({ error: "Sistemul detectat nu exista." }, { status: 404 })
    }
    if (error instanceof Error && error.message === "DETECTED_SYSTEM_INVALID_UPDATES") {
      return NextResponse.json(
        { error: "Editarile pentru sistemul detectat sunt invalide sau incomplete." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Eroare la actualizarea sistemului detectat." },
      { status: 400 }
    )
  }
}

function sanitizeEditPayload(updates: CandidateEditPayload | undefined) {
  if (!updates || typeof updates !== "object") {
    throw new Error("DETECTED_SYSTEM_INVALID_UPDATES")
  }

  const next = {
    name: trimOptional(updates.name),
    purpose: updates.purpose,
    vendor: trimOptional(updates.vendor),
    modelType: trimOptional(updates.modelType),
    usesPersonalData:
      typeof updates.usesPersonalData === "boolean" ? updates.usesPersonalData : undefined,
    makesAutomatedDecisions:
      typeof updates.makesAutomatedDecisions === "boolean"
        ? updates.makesAutomatedDecisions
        : undefined,
    impactsRights:
      typeof updates.impactsRights === "boolean" ? updates.impactsRights : undefined,
    hasHumanReview:
      typeof updates.hasHumanReview === "boolean" ? updates.hasHumanReview : undefined,
    confidence:
      updates.confidence && ["low", "medium", "high"].includes(updates.confidence)
        ? updates.confidence
        : undefined,
    frameworks: sanitizeStringArray(updates.frameworks),
    evidence: sanitizeStringArray(updates.evidence),
  }

  if (next.purpose && !PURPOSES.has(next.purpose)) {
    throw new Error("DETECTED_SYSTEM_INVALID_UPDATES")
  }

  if (next.name !== undefined && !next.name) throw new Error("DETECTED_SYSTEM_INVALID_UPDATES")
  if (next.vendor !== undefined && !next.vendor) throw new Error("DETECTED_SYSTEM_INVALID_UPDATES")
  if (next.modelType !== undefined && !next.modelType) throw new Error("DETECTED_SYSTEM_INVALID_UPDATES")

  return next
}

function trimOptional(value: string | undefined) {
  if (typeof value !== "string") return undefined
  return value.trim()
}

function sanitizeStringArray(value: string[] | undefined) {
  if (!Array.isArray(value)) return undefined
  return value.map((item) => item.trim()).filter(Boolean)
}
