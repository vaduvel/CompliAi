// NIS2 incident — GET / PATCH update / DELETE
// S0.1: validare secvențială 3 etape (early warning → 72h → final)
// S2.4: post-incident tracking

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { updateIncident, deleteIncident, readNis2State } from "@/lib/server/nis2-store"
import { DELETE_ROLES, READ_ROLES, WRITE_ROLES } from "@/lib/server/rbac"
import { buildAnspdcpBreachFinding, anspdcpFindingId } from "@/lib/compliance/anspdcp-breach-rescue"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { ComplianceEvent } from "@/lib/compliance/types"
import { mutateFreshStateForOrg } from "@/lib/server/mvp-store"
import { preserveRuntimeStateForSingleFinding } from "@/lib/server/preserve-finding-runtime-state"
import { mergeNis2PackageFindings } from "@/lib/server/nis2-package-sync"
import { fireDriftTrigger } from "@/lib/server/drift-trigger-engine"
import type {
  Nis2Incident,
  Nis2EarlyWarningReport,
  Nis2FullReport72h,
  Nis2FinalReport,
  Nis2PostIncidentTracking,
  AnspdcpBreachNotification,
} from "@/lib/server/nis2-store"

function eventActor(session: Awaited<ReturnType<typeof requireFreshRole>>) {
  return {
    id: session.email,
    label: session.email,
    role: session.role as ComplianceEvent["actorRole"],
    source: "session" as const,
  }
}

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, READ_ROLES, "vizualizarea incidentului")
    const { id } = await params
    const state = await readNis2State(session.orgId)
    const incident = state.incidents.find((i) => i.id === id)
    if (!incident) return jsonError("Incidentul nu a fost găsit.", 404, "NOT_FOUND")
    return NextResponse.json({ incident })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut citi incidentul.", 500, "NIS2_INCIDENT_READ_FAILED")
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "actualizarea incidentului")

    const { id } = await params
    const body = (await request.json()) as Partial<Nis2Incident> & {
      earlyWarningReport?: Nis2EarlyWarningReport
      fullReport72h?: Nis2FullReport72h
      finalReport?: Nis2FinalReport
      postIncidentTracking?: Nis2PostIncidentTracking
      anspdcpNotification?: AnspdcpBreachNotification
    }

    // Validare status
    if (body.status && !VALID_STATUSES.includes(body.status as typeof VALID_STATUSES[number])) {
      return jsonError("Status invalid.", 400, "INVALID_STATUS")
    }

    // Citește incidentul curent pentru validare secvențială
    const state = await readNis2State(session.orgId)
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

    const incident = await updateIncident(session.orgId, id, patch)
    if (!incident) return jsonError("Incidentul nu a fost găsit.", 404, "NOT_FOUND")

    // GOLD 6: sincronizează finding ANSPDCP în coada centrală la orice update
    const involvesPersonalData = incident.involvesPersonalData ?? current.involvesPersonalData
    const nowISO = new Date().toISOString()
    const eventsToAppend: ComplianceEvent[] = []
    if (
      involvesPersonalData &&
      current.anspdcpNotification?.status !== "submitted" &&
      incident.anspdcpNotification?.status === "submitted"
    ) {
      eventsToAppend.push(
        createComplianceEvent(
          {
            type: "anspdcp.notification.submitted",
            entityType: "system",
            entityId: incident.id,
            message: `Notificare ANSPDCP marcată ca trimisă: ${incident.title}`,
            createdAtISO: nowISO,
            metadata: {
              severity: incident.severity,
              submittedAtISO: incident.anspdcpNotification.submittedAtISO ?? nowISO,
            },
          },
          eventActor(session)
        )
      )
    }
    if (current.status !== incident.status) {
      eventsToAppend.push(
        createComplianceEvent(
          {
            type: "incident.status.updated",
            entityType: "system",
            entityId: incident.id,
            message: `Incident actualizat: ${incident.title} · ${incident.status}`,
            createdAtISO: nowISO,
            metadata: {
              from: current.status,
              to: incident.status,
              severity: incident.severity,
            },
          },
          eventActor(session)
        )
      )
    }

    if (involvesPersonalData) {
      const finding = buildAnspdcpBreachFinding(
        incident.id,
        incident.title,
        incident.detectedAtISO,
        incident.anspdcpNotification?.status,
        nowISO
      )
      await mutateFreshStateForOrg(
        session.orgId,
        async (s) => ({
          ...s,
          findings: mergeNis2PackageFindings(
            finding
              ? [
                  ...s.findings.filter((f) => f.id !== anspdcpFindingId(incident.id)),
                  preserveRuntimeStateForSingleFinding(s.findings, finding),
                ]
              : s.findings.filter((f) => f.id !== anspdcpFindingId(incident.id)),
            await readNis2State(session.orgId),
            nowISO
          ),
          events: eventsToAppend.length > 0 ? appendComplianceEvents(s, eventsToAppend) : s.events,
        }),
        session.orgName
      )
    } else {
      await mutateFreshStateForOrg(
        session.orgId,
        async (s) => ({
          ...s,
          findings: mergeNis2PackageFindings(
            s.findings,
            await readNis2State(session.orgId),
            nowISO
          ),
          events: eventsToAppend.length > 0 ? appendComplianceEvents(s, eventsToAppend) : s.events,
        }),
        session.orgName
      )
    }

    if (current.status !== "closed" && incident.status === "closed") {
      await fireDriftTrigger({
        orgId: session.orgId,
        trigger: "incident_closed",
        detail: `Incident închis: ${incident.title}`,
      }).catch(() => {})
    }

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
    const session = await requireFreshRole(request, DELETE_ROLES, "ștergerea incidentului")

    const { id } = await params
    const deleted = await deleteIncident(session.orgId, id)
    if (!deleted) return jsonError("Incidentul nu a fost găsit.", 404, "NOT_FOUND")

    await mutateFreshStateForOrg(
      session.orgId,
      async (s) => ({
        ...s,
        findings: mergeNis2PackageFindings(
          s.findings.filter((finding) => finding.id !== anspdcpFindingId(id)),
          await readNis2State(session.orgId),
          new Date().toISOString()
        ),
      }),
      session.orgName
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut șterge incidentul.", 500, "NIS2_INCIDENT_DELETE_FAILED")
  }
}
