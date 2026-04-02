import { NextResponse } from "next/server"

import {
  canReuseEvidenceWithinFamily,
  getControlFamilyReusePolicySummary,
} from "@/lib/compliance/control-families"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateStateForOrg, readStateForOrg } from "@/lib/server/mvp-store"

type FamilyEvidencePayload = {
  familyKey?: string
}

export async function POST(request: Request) {
  try {
    const session = requireRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "reutilizarea dovezilor intre controale"
    )
    const body = (await request.json().catch(() => ({}))) as FamilyEvidencePayload
    const familyKey = body.familyKey?.trim()

    if (!familyKey) {
      return NextResponse.json({ error: "Familia de controale este obligatorie." }, { status: 400 })
    }

    const current = await readStateForOrg(session.orgId)
    if (!current) {
      return NextResponse.json(
        { error: "Nu am găsit starea organizației pentru această familie de controale." },
        { status: 404 }
      )
    }

    const workspace = {
      ...(await getOrgContext()),
      orgId: session.orgId,
      orgName: session.orgName,
      userRole: session.role,
    }
    const payload = await buildDashboardPayload(current, workspace)
    const hydratedState = payload.state
    const actor = await resolveOptionalEventActor(request)
    const remediationByTaskId = new Map<string, (typeof payload.remediationPlan)[number]>(
      payload.remediationPlan.map((task) => [`rem-${task.id}`, task] as const)
    )
    const familyRecords = payload.traceabilityMatrix.filter(
      (record) => record.entryKind === "control_task" && record.controlFamily.key === familyKey
    )

    if (familyRecords.length === 0) {
      return NextResponse.json(
        { error: "Nu am găsit controale în această familie." },
        { status: 404 }
      )
    }

    const sourceTaskId = familyRecords
      .map((record) => record.entryId)
      .find((taskId) => {
        const taskState = hydratedState.taskState[taskId]
        return Boolean(taskState?.attachedEvidenceMeta && taskState.validationStatus === "passed")
      })

    if (!sourceTaskId) {
      return NextResponse.json(
        { error: "Familia nu are încă o dovadă validată care poate fi reutilizată." },
        { status: 400 }
      )
    }

    const sourceEvidence = hydratedState.taskState[sourceTaskId]?.attachedEvidenceMeta
    const sourceTaskState = hydratedState.taskState[sourceTaskId]
    if (!sourceEvidence) {
      return NextResponse.json({ error: "Dovada sursă nu mai este disponibilă." }, { status: 400 })
    }
    if (sourceEvidence.quality?.status === "weak") {
      return NextResponse.json(
        {
          error:
            "Dovada sursă este marcată ca slabă. Înlocuiește dovada sau validează una mai puternică înainte de reuse.",
        },
        { status: 400 }
      )
    }
    if (sourceTaskState?.validationBasis === "inferred_signal") {
      return NextResponse.json(
        {
          error:
            "Controlul sursă este validat doar pe semnal inferat. Refolosirea cere mai întâi dovadă directă sau confirmare umană mai puternică.",
        },
        { status: 400 }
      )
    }

    const sourceTask = remediationByTaskId.get(sourceTaskId)
    const eligibleTargets: Array<{ taskId: string; reason: string }> = []
    const blockedTargets: Array<{ taskId: string; reason: string }> = []

    for (const record of familyRecords) {
      const taskId = record.entryId
      if (taskId === sourceTaskId) continue

      const taskState = hydratedState.taskState[taskId]
      if (taskState?.attachedEvidenceMeta && taskState.validationStatus === "passed") continue

      const remediation = remediationByTaskId.get(taskId)
      const openRelatedDrifts = (hydratedState.driftRecords ?? []).filter(
        (drift) => drift.open && (remediation?.relatedDriftIds ?? []).includes(drift.id)
      )
      if (openRelatedDrifts.length > 0) {
        blockedTargets.push({
          taskId,
          reason:
            "Controlul țintă are drift-uri deschise. Închide mai întâi schimbările active înainte de reuse.",
        })
        continue
      }

      const decision = canReuseEvidenceWithinFamily({
        familyKey,
        sourceEvidenceKind: sourceEvidence.kind,
        sourceLawReference: sourceTask?.lawReference ?? record.lawReferences[0] ?? null,
        sourceValidationKind: sourceTask?.validationKind ?? null,
        targetEvidenceKinds: remediation?.evidenceTypes ?? [],
        targetLawReference: remediation?.lawReference ?? record.lawReferences[0] ?? null,
        targetValidationKind: remediation?.validationKind ?? null,
      })

      if (decision.allowed) {
        eligibleTargets.push({ taskId, reason: decision.reason })
      } else {
        blockedTargets.push({ taskId, reason: decision.reason })
      }
    }

    if (eligibleTargets.length === 0) {
      const fallbackReason =
        blockedTargets[0]?.reason ?? "Nu există controale eligibile pentru reuse în această familie."
      return NextResponse.json(
        { error: fallbackReason },
        { status: 400 }
      )
    }

    const nowISO = new Date().toISOString()
    const nextState = await mutateStateForOrg(session.orgId, (state) => {
      const nextTaskState = { ...state.taskState }

      for (const target of eligibleTargets) {
        const taskId = target.taskId
        const previous =
          nextTaskState[taskId] ?? {
            status: "todo" as const,
            updatedAtISO: nowISO,
          }

        nextTaskState[taskId] = {
          ...previous,
          attachedEvidence: sourceEvidence.fileName,
          attachedEvidenceMeta: sourceEvidence,
          updatedAtISO: nowISO,
          validationStatus: "needs_review",
          validationMessage: target.reason,
          validatedAtISO: undefined,
          lastRescanAtISO: undefined,
        }
      }

      return {
        ...state,
        taskState: nextTaskState,
        events: appendComplianceEvents(state, [
          createComplianceEvent({
            type: "trace.family-evidence-reused",
            entityType: "task",
            entityId: familyKey,
            message: `Dovada validată a fost reutilizată pentru ${eligibleTargets.length} controale din familia ${familyKey}.`,
            createdAtISO: nowISO,
            metadata: {
              familyKey,
              sourceTaskId,
              reusedControls: eligibleTargets.length,
              blockedControls: blockedTargets.length,
              fileName: sourceEvidence.fileName,
            },
          }, actor),
        ]),
      }
    }, session.orgName)

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState, workspace)),
      familyBundle: {
        familyKey,
        reusePolicy: getControlFamilyReusePolicySummary(familyKey),
        sourceTaskId,
        reusedControls: eligibleTargets.length,
        blockedControls: blockedTargets.length,
        fileName: sourceEvidence.fileName,
      },
      message:
        blockedTargets.length > 0
          ? `Dovada a fost reutilizată pentru ${eligibleTargets.length} controale. ${blockedTargets.length} controale au rămas separate deoarece cer alt tip de dovadă sau alt context legal.`
          : `Dovada a fost reutilizată pentru ${eligibleTargets.length} controale din familie.`,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    throw error
  }
}
