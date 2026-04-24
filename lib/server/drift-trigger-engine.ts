import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { DriftTrigger, ScanFinding } from "@/lib/compliance/types"
import { dashboardFindingRoute } from "@/lib/compliscan/dashboard-routes"
import { classifyFinding, getReopenPolicy } from "@/lib/compliscan/finding-kernel"
import { createNotification } from "@/lib/server/notifications-store"
import {
  createReviewCycle,
  listReviewCycles,
  listDueReviewCycles,
  markReviewCycleCompleted,
  updateReviewCycle,
} from "@/lib/server/review-cycle-store"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"

function addDays(baseISO: string, days: number) {
  const date = new Date(baseISO)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

function triggerLabel(trigger: DriftTrigger) {
  switch (trigger) {
    case "legislation_change":
      return "a apărut o schimbare legislativă"
    case "new_vendor_added":
      return "a fost adăugat un vendor nou"
    case "ai_system_modified":
      return "s-a modificat un sistem AI"
    case "org_profile_change":
      return "s-a schimbat profilul firmei"
    case "incident_closed":
      return "s-a închis un incident NIS2"
    case "efactura_status_change":
      return "s-a schimbat statusul fluxului e-Factura"
    default:
      return "a trecut timpul de review"
  }
}

function buildTriggerReason(trigger: DriftTrigger, detail?: string) {
  return detail?.trim() ? detail.trim() : triggerLabel(trigger)
}

function canTriggerFinding(finding: ScanFinding, trigger: DriftTrigger, affectedFindingIds?: string[]) {
  if (affectedFindingIds?.length && !affectedFindingIds.includes(finding.id)) {
    return false
  }

  const status = finding.findingStatus ?? "open"
  if (status !== "under_monitoring" && status !== "resolved") {
    return false
  }

  const { findingTypeId } = classifyFinding(finding)
  const policy = getReopenPolicy(findingTypeId)
  return Boolean(policy?.triggers.includes(trigger))
}

async function upsertTriggerCycle(params: {
  orgId: string
  findingId: string
  findingTypeId: string
  trigger: DriftTrigger
  detail?: string
  nowISO: string
}) {
  const existing = await listReviewCycles(params.orgId, {
    findingId: params.findingId,
    status: ["upcoming", "due", "overdue"],
    reviewType: ["drift_triggered"],
    limit: 20,
  })
  const matching = existing.find((cycle) => cycle.triggerType === params.trigger)
  if (matching) {
    return (
      (await updateReviewCycle(params.orgId, matching.id, {
        status: "due",
        scheduledAt: params.nowISO,
        triggerType: params.trigger,
        triggerDetail: params.detail,
        notes: params.detail,
      })) ?? matching
    )
  }

  return createReviewCycle({
    orgId: params.orgId,
    findingId: params.findingId,
    findingTypeId: params.findingTypeId,
    reviewType: "drift_triggered",
    status: "due",
    scheduledAt: params.nowISO,
    triggerType: params.trigger,
    triggerDetail: params.detail,
    notes: params.detail,
  })
}

export async function fireDriftTrigger(params: {
  orgId: string
  trigger: DriftTrigger
  detail?: string
  affectedFindingIds?: string[]
}): Promise<{
  triggeredFindingIds: string[]
  reviewCycleIds: string[]
}> {
  const state = await readStateForOrg(params.orgId)
  if (!state) {
    return { triggeredFindingIds: [], reviewCycleIds: [] }
  }

  const nowISO = new Date().toISOString()
  const candidates = state.findings.filter((finding) =>
    canTriggerFinding(finding, params.trigger, params.affectedFindingIds)
  )

  if (candidates.length === 0) {
    return { triggeredFindingIds: [], reviewCycleIds: [] }
  }

  const reviewCycleIds: string[] = []
  const triggeredFindingIds = new Set<string>()
  const triggerReason = buildTriggerReason(params.trigger, params.detail)

  for (const finding of candidates) {
    const { findingTypeId } = classifyFinding(finding)
    const cycle = await upsertTriggerCycle({
      orgId: params.orgId,
      findingId: finding.id,
      findingTypeId,
      trigger: params.trigger,
      detail: triggerReason,
      nowISO,
    })
    reviewCycleIds.push(cycle.id)
    triggeredFindingIds.add(finding.id)
  }

  const updatedFindings = state.findings.map((finding) => {
    if (!triggeredFindingIds.has(finding.id)) return finding

    const { findingTypeId } = classifyFinding(finding)
    const policy = getReopenPolicy(findingTypeId)
    const graceExpiresAtISO = addDays(nowISO, policy?.gracePeriodDays ?? 14)

    return {
      ...finding,
      driftStatus: "active" as const,
      driftTriggerType: params.trigger,
      driftTriggerReason: triggerReason,
      driftTriggeredAtISO: nowISO,
      driftGraceExpiresAtISO: graceExpiresAtISO,
      nextMonitoringDateISO:
        !finding.nextMonitoringDateISO || finding.nextMonitoringDateISO > graceExpiresAtISO
          ? graceExpiresAtISO
          : finding.nextMonitoringDateISO,
    }
  })

  await writeStateForOrg(params.orgId, {
    ...state,
    findings: updatedFindings,
    events: appendComplianceEvents(state, [
      ...Array.from(triggeredFindingIds).map((findingId) =>
        createComplianceEvent({
          type: "finding.needs-review",
          entityType: "finding",
          entityId: findingId,
          message: `Findingul necesită reverificare: ${triggerReason}.`,
          createdAtISO: nowISO,
          metadata: {
            trigger: params.trigger,
            findingId,
          },
        })
      ),
    ]),
  })

  await Promise.all(
    Array.from(triggeredFindingIds).map(async (findingId) => {
      const finding = updatedFindings.find((item) => item.id === findingId)
      if (!finding) return

      await createNotification(params.orgId, {
        type: "drift_detected",
        title: "Finding în reverificare",
        message: `${finding.title} necesită reverificare pentru că ${triggerReason}.`,
        linkTo: dashboardFindingRoute(finding.id),
      }).catch(() => {})
    })
  )

  return {
    triggeredFindingIds: Array.from(triggeredFindingIds),
    reviewCycleIds,
  }
}

export async function runDriftSweep(nowISO = new Date().toISOString()) {
  const dueCycles = await listDueReviewCycles(nowISO)
  const processed = {
    flagged: 0,
    reopened: 0,
    completedCycles: 0,
    touchedOrgs: new Set<string>(),
  }

  for (const cycle of dueCycles) {
    processed.touchedOrgs.add(cycle.orgId)
    const state = await readStateForOrg(cycle.orgId)
    if (!state) continue

    const findingIndex = state.findings.findIndex((finding) => finding.id === cycle.findingId)
    if (findingIndex === -1) continue

    const finding = state.findings[findingIndex]
    const { findingTypeId } = classifyFinding(finding)
    const policy = getReopenPolicy(findingTypeId)
    const isPastDue = cycle.scheduledAt < nowISO
    const nextStatus = isPastDue ? "overdue" : "due"

    if (cycle.status !== nextStatus) {
      await updateReviewCycle(cycle.orgId, cycle.id, { status: nextStatus })
    }

    const graceExpired =
      Boolean(finding.driftGraceExpiresAtISO) &&
      finding.driftGraceExpiresAtISO! <= nowISO

    if (policy?.severity === "auto_reopen" && graceExpired) {
      const updatedFinding: ScanFinding = {
        ...finding,
        findingStatus: "open",
        findingStatusUpdatedAtISO: nowISO,
        reopenedFromISO: finding.findingStatusUpdatedAtISO ?? finding.reopenedFromISO ?? nowISO,
        nextMonitoringDateISO: undefined,
        driftStatus: "reopened",
        driftTriggeredAtISO: nowISO,
      }

      const findings = [...state.findings]
      findings[findingIndex] = updatedFinding

      await writeStateForOrg(cycle.orgId, {
        ...state,
        findings,
        events: appendComplianceEvents(state, [
          createComplianceEvent({
            type: "finding.reopened",
            entityType: "finding",
            entityId: finding.id,
            message: `Findingul ${finding.title} a fost redeschis automat după expirarea perioadei de reverificare.`,
            createdAtISO: nowISO,
            metadata: {
              trigger: finding.driftTriggerType ?? cycle.triggerType ?? "time_elapsed",
            },
          }),
        ]),
      })

      await markReviewCycleCompleted({
        orgId: cycle.orgId,
        cycleId: cycle.id,
        outcome: "finding_reopened",
        reopenedFindingId: finding.id,
        notes: finding.driftTriggerReason ?? cycle.triggerDetail ?? undefined,
      })

      await createNotification(cycle.orgId, {
        type: "drift_detected",
        title: "Finding redeschis automat",
        message: `${finding.title} a fost redeschis automat și cere reverificare imediată.`,
        linkTo: dashboardFindingRoute(finding.id),
      }).catch(() => {})

      processed.reopened += 1
      processed.completedCycles += 1
      continue
    }

    if (finding.driftStatus !== "active") {
      const findings = [...state.findings]
      findings[findingIndex] = {
        ...finding,
        driftStatus: "active",
        driftTriggerType: finding.driftTriggerType ?? cycle.triggerType,
        driftTriggerReason: finding.driftTriggerReason ?? cycle.triggerDetail ?? cycle.notes ?? "Review scadent",
        driftTriggeredAtISO: finding.driftTriggeredAtISO ?? nowISO,
      }

      await writeStateForOrg(cycle.orgId, {
        ...state,
        findings,
        events: appendComplianceEvents(state, [
          createComplianceEvent({
            type: "finding.needs-review",
            entityType: "finding",
            entityId: finding.id,
            message: `Findingul ${finding.title} a intrat în reverificare.`,
            createdAtISO: nowISO,
          }),
        ]),
      })

      await createNotification(cycle.orgId, {
        type: "drift_detected",
        title: "Review scadent",
        message: `${finding.title} a depășit termenul de reverificare.`,
        linkTo: dashboardFindingRoute(finding.id),
      }).catch(() => {})

      processed.flagged += 1
    }
  }

  return {
    flagged: processed.flagged,
    reopened: processed.reopened,
    completedCycles: processed.completedCycles,
    orgsProcessed: processed.touchedOrgs.size,
    checkedAtISO: nowISO,
  }
}
