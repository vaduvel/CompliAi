import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { AICompliancePackFieldKey } from "@/lib/compliance/ai-compliance-pack"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { requireFreshRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateStateForOrg } from "@/lib/server/mvp-store"

type FieldUpdateAction = "save" | "confirm" | "clear"

type FieldUpdatePayload = {
  systemId?: string
  field?: AICompliancePackFieldKey
  value?: string | null
  action?: FieldUpdateAction
}

const ALLOWED_FIELDS = new Set<AICompliancePackFieldKey>([
  "provider",
  "model",
  "purpose",
  "risk_class",
  "personal_data",
  "human_oversight",
  "data_residency",
  "retention_days",
  "legal_mapping",
])

export async function POST(request: Request) {
  const session = await requireFreshRole(
    request,
    ["owner", "partner_manager", "compliance", "reviewer"],
    "actualizarea AI Compliance Pack"
  )
  const body = (await request.json().catch(() => ({}))) as FieldUpdatePayload

  if (!body.systemId?.trim()) {
    return NextResponse.json({ error: "System ID este obligatoriu." }, { status: 400 })
  }

  if (!body.field || !ALLOWED_FIELDS.has(body.field)) {
    return NextResponse.json({ error: "Câmpul selectat este invalid." }, { status: 400 })
  }

  const action = body.action ?? "save"
  const normalizedValue =
    typeof body.value === "string" ? body.value.trim() : body.value === null ? null : null

  if (action !== "clear" && (normalizedValue === null || normalizedValue === "")) {
    return NextResponse.json(
      { error: "Valoarea câmpului este obligatorie pentru această acțiune." },
      { status: 400 }
    )
  }

  const nowISO = new Date().toISOString()
  const actor = await resolveOptionalEventActor(request)
  const nextState = await mutateStateForOrg(session.orgId, (current) => {
    const currentSystem = current.aiSystems.find((item) => item.id === body.systemId)
    const detectedSystem = current.detectedAISystems.find((item) => item.id === body.systemId)

    if (!currentSystem && !detectedSystem) {
      return current
    }

    const overrides = {
      ...(current.aiComplianceFieldOverrides ?? {}),
    }
    const systemOverrides = {
      ...(overrides[body.systemId!] ?? {}),
    }

    if (action === "clear") {
      delete systemOverrides[body.field!]
      if (Object.keys(systemOverrides).length === 0) delete overrides[body.systemId!]
      else overrides[body.systemId!] = systemOverrides
    } else {
      systemOverrides[body.field!] = {
        value: normalizedValue,
        confirmedByUser: true,
        updatedAtISO: nowISO,
      }
      overrides[body.systemId!] = systemOverrides
    }

    const nextType =
      action === "clear"
        ? "pack.field-cleared"
        : action === "confirm"
          ? "pack.field-confirmed"
          : "pack.field-saved"
    const nextMessage =
      action === "clear"
        ? `Override eliminat pentru câmpul ${body.field}.`
        : action === "confirm"
          ? `Câmp confirmat în AI Compliance Pack: ${body.field}.`
          : `Câmp actualizat în AI Compliance Pack: ${body.field}.`

    return {
      ...current,
      aiComplianceFieldOverrides: overrides,
      events: appendComplianceEvents(current, [
        createComplianceEvent({
          type: nextType,
          entityType: "system",
          entityId: body.systemId!,
          message: nextMessage,
          createdAtISO: nowISO,
          metadata: {
            field: body.field!,
            action,
          },
        }, actor),
      ]),
    }
  }, session.orgName)

  const workspaceOverride = {
    ...(await getOrgContext({ request })),
    orgId: session.orgId,
    orgName: session.orgName,
    userRole: session.role,
  }

  return NextResponse.json({
    ...(await buildDashboardPayload(nextState, workspaceOverride)),
    message:
      action === "clear"
        ? "Override-ul de câmp a fost eliminat."
        : action === "confirm"
          ? "Câmpul a fost confirmat și salvat în pack."
          : "Câmpul a fost actualizat și salvat în pack.",
  })
}
