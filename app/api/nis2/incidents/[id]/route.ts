// NIS2 incident — PATCH update / DELETE
// S0.1: validare secvențială 3 etape (early warning → 72h → final)
// S2.4: post-incident tracking

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { updateIncident, deleteIncident, readNis2State } from "@/lib/server/nis2-store"
import { DELETE_ROLES, WRITE_ROLES } from "@/lib/server/rbac"
import type {
  Nis2Incident,
  Nis2EarlyWarningReport,
  Nis2FullReport72h,
  Nis2FinalReport,
  Nis2PostIncidentTracking,
} from "@/lib/server/nis2-store"

const VALID_STATUSES = ["open", "reported-24h", "reported-72h", "closed"] as const
const STATUS_ORDER: Record<string, number> = {
  "open": 0,
  "reported-24h": 1,
  "reported-72h": 2,
  "closed": 3,
}

function validateStageSequence(
  incident: Nis2Incident,
  patch: Partial<Nis2Incident>
): string | null {
  // Validare: nu poți trimite raport 72h fără early warning
  if (patch.fullReport72h && !incident.earlyWarningReport && !patch.earlyWarningReport) {
    return "Nu poți trimite raportul 72h fără alertă inițială (early warning)."
  }
  // Validare: nu poți trimite raport final fără raport 72h
  if (patch.finalReport && !incident.fullReport72h && !patch.fullReport72h) {
    return "Nu poți trimite raportul final fără raportul complet (72h)."
  }
  // Validare: nu poți închide fără raport final
  if (patch.status === "closed" && !incident.finalReport && !patch.finalReport) {
    return "Nu poți închide incidentul fără raportul final."
  }
  // Validare: status nu poate regresa
  if (patch.status) {
    const currentOrder = STATUS_ORDER[incident.status] ?? 0
    const newOrder = STATUS_ORDER[patch.status] ?? 0
    if (newOrder < currentOrder) {
      return `Nu poți regresa statusul de la "${incident.status}" la "${patch.status}".`
    }
  }
  return null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireRole(request, WRITE_ROLES, "actualizarea incidentului")

    const { id } = await params
    const body = (await request.json()) as Partial<Nis2Incident> & {
      earlyWarningReport?: Nis2EarlyWarningReport
      fullReport72h?: Nis2FullReport72h
      finalReport?: Nis2FinalReport
      postIncidentTracking?: Nis2PostIncidentTracking
    }

    // Validare status
    if (body.status && !VALID_STATUSES.includes(body.status as typeof VALID_STATUSES[number])) {
      return jsonError("Status invalid.", 400, "INVALID_STATUS")
    }

    const { orgId } = await getOrgContext()

    // Citește incidentul curent pentru validare secvențială
    const state = await readNis2State(orgId)
    const current = state.incidents.find((i) => i.id === id)
    if (!current) return jsonError("Incidentul nu a fost găsit.", 404, "NOT_FOUND")

    // Auto-advance status pe baza raportului trimis
    const patch = { ...body }
    if (patch.earlyWarningReport && current.status === "open") {
      patch.status = "reported-24h"
      patch.reportedAtISO = patch.earlyWarningReport.submittedAtISO
    }
    if (patch.fullReport72h && (current.status === "open" || current.status === "reported-24h")) {
      patch.status = "reported-72h"
    }
    if (patch.finalReport && current.status !== "closed") {
      patch.status = "closed"
      patch.resolvedAtISO = patch.finalReport.submittedAtISO
    }

    // Validare secvență
    const sequenceError = validateStageSequence(current, patch)
    if (sequenceError) {
      return jsonError(sequenceError, 400, "STAGE_SEQUENCE_VIOLATION")
    }

    const incident = await updateIncident(orgId, id, patch)
    if (!incident) return jsonError("Incidentul nu a fost găsit.", 404, "NOT_FOUND")

    return NextResponse.json({ incident })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza incidentul.", 500, "NIS2_INCIDENT_UPDATE_FAILED")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, DELETE_ROLES, "ștergerea incidentului")

    const { id } = await params
    const { orgId } = await getOrgContext()
    const deleted = await deleteIncident(orgId, id)
    if (!deleted) return jsonError("Incidentul nu a fost găsit.", 404, "NOT_FOUND")

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut șterge incidentul.", 500, "NIS2_INCIDENT_DELETE_FAILED")
  }
}
