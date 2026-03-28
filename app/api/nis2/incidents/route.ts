// NIS2 incident log — GET list / POST create

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State, createIncident } from "@/lib/server/nis2-store"
import type { Nis2Incident, Nis2IncidentSeverity, Nis2AttackType, Nis2OperationalImpact } from "@/lib/server/nis2-store"
import { buildAnspdcpBreachFinding, anspdcpFindingId } from "@/lib/compliance/anspdcp-breach-rescue"
import { mutateState } from "@/lib/server/mvp-store"
import { executeAgent } from "@/lib/server/agent-orchestrator"
import { preserveRuntimeStateForSingleFinding } from "@/lib/server/preserve-finding-runtime-state"

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

    const { orgId } = await getOrgContext()
    const incident = await createIncident(orgId, {
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
        await mutateState((s) => ({
          ...s,
          findings: [
            ...s.findings.filter((f) => f.id !== anspdcpFindingId(incident.id)),
            preserveRuntimeStateForSingleFinding(s.findings, finding),
          ],
        }))
      }
    }

    // Event trigger: compliance_monitor imediat după creare (fire-and-forget)
    void executeAgent(orgId, "compliance_monitor").catch(() => {/* non-blocking */})

    return NextResponse.json({ incident }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut crea incidentul NIS2.", 500, "NIS2_INCIDENT_CREATE_FAILED")
  }
}
