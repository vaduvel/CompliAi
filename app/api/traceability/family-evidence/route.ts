import { NextResponse } from "next/server"

import {
  canReuseEvidenceWithinFamily,
  getControlFamilyReusePolicySummary,
} from "@/lib/compliance/control-families"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { mutateState, readState } from "@/lib/server/mvp-store"

type FamilyEvidencePayload = {
  familyKey?: string
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as FamilyEvidencePayload
  const familyKey = body.familyKey?.trim()

  if (!familyKey) {
    return NextResponse.json({ error: "Familia de controale este obligatorie." }, { status: 400 })
  }

  const current = await readState()
  const payload = await buildDashboardPayload(current)
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
      const taskState = current.taskState[taskId]
      return Boolean(taskState?.attachedEvidenceMeta && taskState.validationStatus === "passed")
    })

  if (!sourceTaskId) {
    return NextResponse.json(
      { error: "Familia nu are încă o dovadă validată care poate fi reutilizată." },
      { status: 400 }
    )
  }

  const sourceEvidence = current.taskState[sourceTaskId]?.attachedEvidenceMeta
  if (!sourceEvidence) {
    return NextResponse.json({ error: "Dovada sursă nu mai este disponibilă." }, { status: 400 })
  }

  const sourceTask = remediationByTaskId.get(sourceTaskId)
  const eligibleTargets: Array<{ taskId: string; reason: string }> = []
  const blockedTargets: Array<{ taskId: string; reason: string }> = []

  for (const record of familyRecords) {
    const taskId = record.entryId
    if (taskId === sourceTaskId) continue

    const taskState = current.taskState[taskId]
    if (taskState?.attachedEvidenceMeta && taskState.validationStatus === "passed") continue

    const remediation = remediationByTaskId.get(taskId)
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
  const nextState = await mutateState((state) => {
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
        }),
      ]),
    }
  })

  return NextResponse.json({
    ...(await buildDashboardPayload(nextState)),
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
}
