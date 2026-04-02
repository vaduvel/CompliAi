// NIS2 incident log — GET list / POST create

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { readNis2State, createIncident } from "@/lib/server/nis2-store"
import type { Nis2Incident, Nis2IncidentSeverity, Nis2AttackType, Nis2OperationalImpact } from "@/lib/server/nis2-store"
import { buildAnspdcpBreachFinding, anspdcpFindingId } from "@/lib/compliance/anspdcp-breach-rescue"
import { mutateFreshStateForOrg } from "@/lib/server/mvp-store"
import { executeAgent } from "@/lib/server/agent-orchestrator"
import { preserveRuntimeStateForSingleFinding } from "@/lib/server/preserve-finding-runtime-state"
import { mergeNis2PackageFindings } from "@/lib/server/nis2-package-sync"
import { READ_ROLES, WRITE_ROLES } from "@/lib/server/rbac"

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, READ_ROLES, "citirea incidentelor NIS2")
    const state = await readNis2State(session.orgId)
    return NextResponse.json({ incidents: state.incidents })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut incarca incidentele NIS2.", 500, "NIS2_INCIDENTS_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "crearea incidentului NIS2")

    const body = (await request.json()) as Partial<
      Pick<Nis2Incident,
        | "title" | "description" | "severity" | "affectedSystems" | "detectedAtISO"
        | "attackType" | "attackVector" | "operationalImpact" | "operationalImpactDetails"
        | "measuresTaken" | "involvesPersonalData"
      >
    >

    if (!body.title?.trim()) return jsonError("Titlul incidentului este obligatoriu.", 400, "MISSING_TITLE")

    const VALID_SEVERITIES: Nis2IncidentSeverity[] = ["low", "medium", "high", "critical"]
    if (!body.severity || !VALID_SEVERITIES.includes(body.severity)) {
      return jsonError("Severitate invalidă.", 400, "INVALID_SEVERITY")
    }

    const VALID_ATTACK_TYPES: Nis2AttackType[] = [
      "ransomware", "ddos", "phishing", "supply-chain", "insider",
      "unauthorized-access", "data-breach", "unknown", "other",
    ]
    if (body.attackType && !VALID_ATTACK_TYPES.includes(body.attackType)) {
      return jsonError("Tip de atac invalid.", 400, "INVALID_ATTACK_TYPE")
    }

    const VALID_IMPACTS: Nis2OperationalImpact[] = ["none", "partial", "full"]
    if (body.operationalImpact && !VALID_IMPACTS.includes(body.operationalImpact)) {
      return jsonError("Impact operațional invalid.", 400, "INVALID_OPERATIONAL_IMPACT")
    }

    const incident = await createIncident(session.orgId, {
      title: body.title.trim(),
      description: (body.description ?? "").trim(),
      severity: body.severity,
      affectedSystems: body.affectedSystems ?? [],
      detectedAtISO: body.detectedAtISO,
      attackType: body.attackType,
      attackVector: body.attackVector?.trim(),
      operationalImpact: body.operationalImpact,
      operationalImpactDetails: body.operationalImpactDetails?.trim(),
      measuresTaken: body.measuresTaken?.trim(),
      involvesPersonalData: body.involvesPersonalData,
    })
    const nextNis2State = await readNis2State(session.orgId)

    // GOLD 6: dacă incidentul implică date personale → inject finding ANSPDCP
    if (incident.involvesPersonalData) {
      const finding = buildAnspdcpBreachFinding(
        incident.id,
        incident.title,
        incident.detectedAtISO,
        incident.anspdcpNotification?.status,
        new Date().toISOString()
      )
      if (finding) {
        await mutateFreshStateForOrg(
          session.orgId,
          (s) => ({
            ...s,
            findings: mergeNis2PackageFindings(
              [
                ...s.findings.filter((f) => f.id !== anspdcpFindingId(incident.id)),
                preserveRuntimeStateForSingleFinding(s.findings, finding),
              ],
              nextNis2State,
              new Date().toISOString()
            ),
          }),
          session.orgName
        )
      }
    } else {
      await mutateFreshStateForOrg(
        session.orgId,
        (s) => ({
          ...s,
          findings: mergeNis2PackageFindings(s.findings, nextNis2State, new Date().toISOString()),
        }),
        session.orgName
      )
    }

    // Event trigger: compliance_monitor imediat după creare (fire-and-forget)
    void executeAgent(session.orgId, "compliance_monitor").catch(() => {/* non-blocking */})

    return NextResponse.json({ incident }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut crea incidentul NIS2.", 500, "NIS2_INCIDENT_CREATE_FAILED")
  }
}
