// NIS2 incident log — GET list / POST create

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State, createIncident } from "@/lib/server/nis2-store"
import type { Nis2Incident, Nis2IncidentSeverity } from "@/lib/server/nis2-store"

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { orgId } = await getOrgContext()
    const state = await readNis2State(orgId)
    return NextResponse.json({ incidents: state.incidents })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut incarca incidentele NIS2.", 500, "NIS2_INCIDENTS_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as Partial<
      Pick<Nis2Incident, "title" | "description" | "severity" | "affectedSystems" | "detectedAtISO">
    >

    if (!body.title?.trim()) return jsonError("Titlul incidentului este obligatoriu.", 400, "MISSING_TITLE")

    const VALID_SEVERITIES: Nis2IncidentSeverity[] = ["low", "medium", "high", "critical"]
    if (!body.severity || !VALID_SEVERITIES.includes(body.severity)) {
      return jsonError("Severitate invalidă.", 400, "INVALID_SEVERITY")
    }

    const { orgId } = await getOrgContext()
    const incident = await createIncident(orgId, {
      title: body.title.trim(),
      description: (body.description ?? "").trim(),
      severity: body.severity,
      affectedSystems: body.affectedSystems ?? [],
      detectedAtISO: body.detectedAtISO,
    })

    return NextResponse.json({ incident }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut crea incidentul NIS2.", 500, "NIS2_INCIDENT_CREATE_FAILED")
  }
}
