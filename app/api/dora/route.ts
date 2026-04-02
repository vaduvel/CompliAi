// GET /api/dora — get full DORA state
// POST /api/dora/incidents — create new ICT incident

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { READ_ROLES, WRITE_ROLES } from "@/lib/server/rbac"
import { readDoraState, createIncident } from "@/lib/server/dora-store"
import type { DoraIncidentSeverity } from "@/lib/server/dora-store"

const VALID_SEVERITIES: DoraIncidentSeverity[] = ["major", "significant", "minor"]

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, READ_ROLES, "vizualizare DORA")
    const state = await readDoraState(session.orgId)
    return NextResponse.json(state)
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la încărcare DORA.", 500, "DORA_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "crearea unui incident DORA")
    const body = await request.json() as {
      title?: string
      description?: string
      severity?: DoraIncidentSeverity
      occurredAtISO?: string
      detectedAtISO?: string
      affectedSystems?: string[]
      estimatedImpact?: string
    }
    if (!body.title?.trim()) return jsonError("Titlul este obligatoriu.", 400, "MISSING_TITLE")
    if (!body.severity || !VALID_SEVERITIES.includes(body.severity)) {
      return jsonError("Severitate invalidă.", 400, "INVALID_SEVERITY")
    }
    if (!body.description?.trim()) return jsonError("Descrierea este obligatorie.", 400, "MISSING_DESCRIPTION")
    if (!body.occurredAtISO) return jsonError("Data producerii este obligatorie.", 400, "MISSING_OCCURRED_AT")
    if (!body.detectedAtISO) return jsonError("Data detectării este obligatorie.", 400, "MISSING_DETECTED_AT")

    const incident = await createIncident(session.orgId, {
      title: body.title.trim(),
      description: body.description.trim(),
      severity: body.severity,
      occurredAtISO: body.occurredAtISO,
      detectedAtISO: body.detectedAtISO,
      affectedSystems: body.affectedSystems ?? [],
      estimatedImpact: body.estimatedImpact?.trim() ?? "",
    })
    return NextResponse.json({ incident }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut crea incidentul.", 500, "DORA_INCIDENT_CREATE_FAILED")
  }
}
