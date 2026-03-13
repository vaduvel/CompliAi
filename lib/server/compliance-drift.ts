import type { CompliScanFinding, CompliScanSnapshot, CompliScanSystem } from "@/lib/compliscan/schema"
import { assessDriftPolicy } from "@/lib/compliance/drift-policy"
import type { ComplianceDriftRecord, ComplianceDriftSettings } from "@/lib/compliance/types"
import { normalizeDriftLifecycleStatus } from "@/lib/compliance/drift-lifecycle"

export function buildComplianceDriftRecords(
  currentSnapshot: CompliScanSnapshot,
  previousSnapshot?: CompliScanSnapshot,
  settings?: ComplianceDriftSettings
): ComplianceDriftRecord[] {
  if (!previousSnapshot || previousSnapshot.snapshotId === currentSnapshot.snapshotId) {
    return []
  }

  const drifts: ComplianceDriftRecord[] = []
  const previousSystems = new Map(previousSnapshot.systems.map((item) => [systemKey(item), item]))
  const currentSystems = new Map(currentSnapshot.systems.map((item) => [systemKey(item), item]))

  for (const [key, system] of currentSystems) {
    const before = previousSystems.get(key)
    if (!before) {
      const policy = assessDriftPolicy({
        change: "provider_added",
        type: "operational_drift",
        system,
        settings,
        after: {
          provider: system.provider,
          model: system.model,
          riskClass: system.riskClass,
          personalDataUsed: system.personalDataUsed,
        },
      })
      drifts.push(
        buildDrift(currentSnapshot, previousSnapshot, {
          type: "operational_drift",
          change: "provider_added",
          severity: policy.severity,
          summary: `A aparut un sistem nou detectat: ${system.systemName} (${system.provider}).`,
          severityReason: policy.severityReason,
          impactSummary: policy.impactSummary,
          nextAction: policy.nextAction,
          evidenceRequired: policy.evidenceRequired,
          lawReference: policy.lawReference,
          systemLabel: system.systemName,
          after: {
            provider: system.provider,
            model: system.model,
            riskClass: system.riskClass,
          },
          ...toEscalationFields(policy),
        })
      )
      continue
    }

    if (before.provider !== system.provider) {
      const policy = assessDriftPolicy({
        change: "provider_changed",
        type: "operational_drift",
        system,
        settings,
        before: { provider: before.provider, personalDataUsed: before.personalDataUsed },
        after: { provider: system.provider, personalDataUsed: system.personalDataUsed },
      })
      drifts.push(
        buildDrift(currentSnapshot, previousSnapshot, {
          type: "operational_drift",
          change: "provider_changed",
          severity: policy.severity,
          summary: `${system.systemName} foloseste acum providerul ${system.provider} in loc de ${before.provider}.`,
          severityReason: policy.severityReason,
          impactSummary: policy.impactSummary,
          nextAction: policy.nextAction,
          evidenceRequired: policy.evidenceRequired,
          lawReference: policy.lawReference,
          systemLabel: system.systemName,
          before: { provider: before.provider },
          after: { provider: system.provider },
          ...toEscalationFields(policy),
        })
      )
    }

    if (before.model !== system.model) {
      const policy = assessDriftPolicy({
        change: "model_changed",
        type: "operational_drift",
        system,
        settings,
        before: { model: before.model, personalDataUsed: before.personalDataUsed },
        after: { model: system.model, personalDataUsed: system.personalDataUsed },
      })
      drifts.push(
        buildDrift(currentSnapshot, previousSnapshot, {
          type: "operational_drift",
          change: "model_changed",
          severity: policy.severity,
          summary: `${system.systemName} si-a schimbat modelul din ${before.model} in ${system.model}.`,
          severityReason: policy.severityReason,
          impactSummary: policy.impactSummary,
          nextAction: policy.nextAction,
          evidenceRequired: policy.evidenceRequired,
          lawReference: policy.lawReference,
          systemLabel: system.systemName,
          before: { model: before.model },
          after: { model: system.model },
          ...toEscalationFields(policy),
        })
      )
    }

    const addedFrameworks = system.frameworks.filter((framework) => !before.frameworks.includes(framework))
    if (addedFrameworks.length > 0) {
      const policy = assessDriftPolicy({
        change: "framework_added",
        type: "operational_drift",
        system,
        settings,
        after: { frameworks: addedFrameworks.join(", ") },
      })
      drifts.push(
        buildDrift(currentSnapshot, previousSnapshot, {
          type: "operational_drift",
          change: "framework_added",
          severity: policy.severity,
          summary: `${system.systemName} are framework-uri noi: ${addedFrameworks.join(", ")}.`,
          severityReason: policy.severityReason,
          impactSummary: policy.impactSummary,
          nextAction: policy.nextAction,
          evidenceRequired: policy.evidenceRequired,
          lawReference: policy.lawReference,
          systemLabel: system.systemName,
          after: { frameworks: addedFrameworks.join(", ") },
          ...toEscalationFields(policy),
        })
      )
    }

    if (!before.humanReview.present && !system.humanReview.present) {
      // no-op, we only care about changes
    } else if (before.humanReview.present && !system.humanReview.present) {
      const policy = assessDriftPolicy({
        change: "human_review_removed",
        type: "compliance_drift",
        system,
        settings,
        before: { humanReview: true },
        after: { humanReview: false },
      })
      drifts.push(
        buildDrift(currentSnapshot, previousSnapshot, {
          type: "compliance_drift",
          change: "human_review_removed",
          severity: policy.severity,
          summary: `${system.systemName} nu mai are review uman prezent in snapshot-ul curent.`,
          severityReason: policy.severityReason,
          impactSummary: policy.impactSummary,
          nextAction: policy.nextAction,
          evidenceRequired: policy.evidenceRequired,
          lawReference: policy.lawReference,
          systemLabel: system.systemName,
          before: { humanReview: true },
          after: { humanReview: false },
          ...toEscalationFields(policy),
        })
      )
    }

    if (!before.personalDataUsed && system.personalDataUsed) {
      const policy = assessDriftPolicy({
        change: "personal_data_detected",
        type: "compliance_drift",
        system,
        settings,
        before: { personalDataUsed: false },
        after: { personalDataUsed: true },
      })
      drifts.push(
        buildDrift(currentSnapshot, previousSnapshot, {
          type: "compliance_drift",
          change: "personal_data_detected",
          severity: policy.severity,
          summary: `${system.systemName} apare acum ca folosind date personale.`,
          severityReason: policy.severityReason,
          impactSummary: policy.impactSummary,
          nextAction: policy.nextAction,
          evidenceRequired: policy.evidenceRequired,
          lawReference: policy.lawReference,
          systemLabel: system.systemName,
          before: { personalDataUsed: false },
          after: { personalDataUsed: true },
          ...toEscalationFields(policy),
        })
      )
    }

    if (before.riskClass !== system.riskClass) {
      const policy = assessDriftPolicy({
        change: "risk_class_changed",
        type: "compliance_drift",
        system,
        settings,
        before: { riskClass: before.riskClass },
        after: { riskClass: system.riskClass },
      })
      drifts.push(
        buildDrift(currentSnapshot, previousSnapshot, {
          type: "compliance_drift",
          change: "risk_class_changed",
          severity: policy.severity,
          summary: `${system.systemName} si-a schimbat clasa de risc din ${before.riskClass} in ${system.riskClass}.`,
          severityReason: policy.severityReason,
          impactSummary: policy.impactSummary,
          nextAction: policy.nextAction,
          evidenceRequired: policy.evidenceRequired,
          lawReference: policy.lawReference,
          systemLabel: system.systemName,
          before: { riskClass: before.riskClass },
          after: { riskClass: system.riskClass },
          ...toEscalationFields(policy),
        })
      )
    }

    if (before.purpose !== system.purpose) {
      const policy = assessDriftPolicy({
        change: "purpose_changed",
        type: "compliance_drift",
        system,
        settings,
        before: { purpose: before.purpose },
        after: { purpose: system.purpose },
      })
      drifts.push(
        buildDrift(currentSnapshot, previousSnapshot, {
          type: "compliance_drift",
          change: "purpose_changed",
          severity: policy.severity,
          summary: `${system.systemName} are acum alt scop declarat: ${system.purpose}.`,
          severityReason: policy.severityReason,
          impactSummary: policy.impactSummary,
          nextAction: policy.nextAction,
          evidenceRequired: policy.evidenceRequired,
          lawReference: policy.lawReference,
          systemLabel: system.systemName,
          before: { purpose: before.purpose },
          after: { purpose: system.purpose },
          ...toEscalationFields(policy),
        })
      )
    }

    const beforeEvidence = readSystemEvidenceMap(before)
    const currentEvidence = readSystemEvidenceMap(system)
    const yamlDriven =
      system.frameworks.includes("compliscan-yaml") || before.frameworks.includes("compliscan-yaml")

    if (
      yamlDriven &&
      beforeEvidence.data_residency &&
      currentEvidence.data_residency &&
      beforeEvidence.data_residency !== currentEvidence.data_residency
    ) {
      const policy = assessDriftPolicy({
        change: "data_residency_changed",
        type: "compliance_drift",
        system,
        settings,
        before: { dataResidency: beforeEvidence.data_residency },
        after: { dataResidency: currentEvidence.data_residency },
      })
      drifts.push(
        buildDrift(currentSnapshot, previousSnapshot, {
          type: "compliance_drift",
          change: "data_residency_changed",
          severity: policy.severity,
          summary: `${system.systemName} si-a schimbat rezidenta datelor din ${beforeEvidence.data_residency} in ${currentEvidence.data_residency}.`,
          severityReason: policy.severityReason,
          impactSummary: policy.impactSummary,
          nextAction: policy.nextAction,
          evidenceRequired: policy.evidenceRequired,
          lawReference: policy.lawReference,
          systemLabel: system.systemName,
          before: { dataResidency: beforeEvidence.data_residency },
          after: { dataResidency: currentEvidence.data_residency },
          ...toEscalationFields(policy),
        })
      )
    }
  }

  for (const [key, system] of previousSystems) {
    if (currentSystems.has(key)) continue
    if (system.detectionStatus !== "confirmed") continue
    const policy = assessDriftPolicy({
      change: "provider_removed",
      type: "operational_drift",
      system,
      settings,
      before: {
        provider: system.provider,
        model: system.model,
        riskClass: system.riskClass,
      },
    })
    drifts.push(
      buildDrift(currentSnapshot, previousSnapshot, {
        type: "operational_drift",
        change: "provider_removed",
        severity: policy.severity,
        summary: `Sistemul ${system.systemName} nu mai apare in snapshot-ul curent.`,
        severityReason: policy.severityReason,
        impactSummary: policy.impactSummary,
        nextAction: policy.nextAction,
        evidenceRequired: policy.evidenceRequired,
        lawReference: policy.lawReference,
        systemLabel: system.systemName,
        before: {
          provider: system.provider,
          model: system.model,
        },
        ...toEscalationFields(policy),
      })
    )
  }

  const previousOpenFindings = new Set(
    previousSnapshot.findings
      .filter((item) => item.status === "open")
      .map((item) => findingKey(item))
  )

  for (const finding of currentSnapshot.findings.filter((item) => item.status === "open")) {
    if (previousOpenFindings.has(findingKey(finding))) continue

    const derived = buildFindingDrift(currentSnapshot, previousSnapshot, finding, settings)
    if (derived) drifts.push(derived)
  }

  return dedupeDrifts(drifts)
}

function buildFindingDrift(
  currentSnapshot: CompliScanSnapshot,
  previousSnapshot: CompliScanSnapshot,
  finding: CompliScanFinding,
  settings?: ComplianceDriftSettings
) {
  const text = `${finding.issue} ${finding.evidence} ${finding.tags.join(" ")}`.toLowerCase()
  const sourceDocument =
    currentSnapshot.sources.find((item) => item.id === finding.sourceId)?.name || finding.sourceId

  if (finding.regulatoryArea === "gdpr" && includesAny(text, ["tracking", "cookie", "consim"])) {
    const policy = assessDriftPolicy({
      change: "tracking_detected",
      type: "compliance_drift",
      findingSeverity: finding.severity,
      settings,
    })
    return buildDrift(currentSnapshot, previousSnapshot, {
      type: "compliance_drift",
      change: "tracking_detected",
      severity: policy.severity,
      summary: `A aparut un nou semnal de tracking / consimtamant in ${finding.issue}.`,
      severityReason: policy.severityReason,
      impactSummary: policy.impactSummary,
      nextAction: policy.nextAction,
      evidenceRequired: policy.evidenceRequired,
      lawReference: policy.lawReference,
      sourceDocument,
      after: { issue: finding.issue, severity: finding.severity },
      ...toEscalationFields(policy),
    })
  }

  if (finding.regulatoryArea === "eu_ai_act" && finding.severity !== "low") {
    const policy = assessDriftPolicy({
      change: "high_risk_signal_detected",
      type: "compliance_drift",
      findingSeverity: finding.severity,
      settings,
    })
    return buildDrift(currentSnapshot, previousSnapshot, {
      type: "compliance_drift",
      change: "high_risk_signal_detected",
      severity: policy.severity,
      summary: `A aparut un nou semnal AI Act cu impact ridicat: ${finding.issue}.`,
      severityReason: policy.severityReason,
      impactSummary: policy.impactSummary,
      nextAction: policy.nextAction,
      evidenceRequired: policy.evidenceRequired,
      lawReference: policy.lawReference,
      sourceDocument,
      after: { issue: finding.issue, severity: finding.severity },
      ...toEscalationFields(policy),
    })
  }

  if (finding.regulatoryArea === "e_factura") {
    const policy = assessDriftPolicy({
      change: "invoice_flow_signal_detected",
      type: "operational_drift",
      findingSeverity: finding.severity,
      settings,
    })
    return buildDrift(currentSnapshot, previousSnapshot, {
      type: "operational_drift",
      change: "invoice_flow_signal_detected",
      severity: policy.severity,
      summary: `A aparut un nou semnal operational e-Factura: ${finding.issue}.`,
      severityReason: policy.severityReason,
      impactSummary: policy.impactSummary,
      nextAction: policy.nextAction,
      evidenceRequired: policy.evidenceRequired,
      lawReference: policy.lawReference,
      sourceDocument,
      after: { issue: finding.issue, severity: finding.severity },
      ...toEscalationFields(policy),
    })
  }

  return null
}

function buildDrift(
  currentSnapshot: CompliScanSnapshot,
  previousSnapshot: CompliScanSnapshot,
  input: Omit<ComplianceDriftRecord, "id" | "snapshotId" | "comparedToSnapshotId" | "detectedAtISO" | "open">
): ComplianceDriftRecord {
  const id = buildDriftId(input)

  return {
    id,
    snapshotId: currentSnapshot.snapshotId,
    comparedToSnapshotId: previousSnapshot.snapshotId,
    detectedAtISO: currentSnapshot.generatedAt,
    open: true,
    lifecycleStatus: "open",
    lastStatusUpdatedAtISO: currentSnapshot.generatedAt,
    ...input,
  }
}

function toEscalationFields(
  policy: ReturnType<typeof assessDriftPolicy>
) {
  return {
    escalationOwner: policy.ownerSuggestion,
    escalationTier: policy.escalationTier,
    escalationSlaHours: policy.escalationSlaHours,
    escalationDueAtISO: policy.escalationDueAtISO ?? undefined,
    blocksAudit: policy.blocksAudit,
    blocksBaseline: policy.blocksBaseline,
    requiresHumanApproval: policy.requiresHumanApproval,
  }
}

function dedupeDrifts(drifts: ComplianceDriftRecord[]) {
  const seen = new Set<string>()
  return drifts.filter((item) => {
    const key = [item.type, item.change, item.systemLabel, item.summary].join("::")
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function mergeDriftRecords(
  previousDrifts: ComplianceDriftRecord[],
  generatedDrifts: ComplianceDriftRecord[],
  nowISO = new Date().toISOString()
) {
  const previousById = new Map(previousDrifts.map((item) => [item.id, item]))
  const events: Array<{
    type: "detected" | "breached"
    driftId: string
    message: string
  }> = []

  const drifts = generatedDrifts.map((drift) => {
    const previous = previousById.get(drift.id)
    const lifecycleStatus = normalizeDriftLifecycleStatus(
      previous?.lifecycleStatus,
      previous?.open !== false
    )
    const escalationBreachedAtISO =
      previous?.escalationBreachedAtISO ??
      (isEscalationBreached(drift, lifecycleStatus, nowISO) ? nowISO : undefined)

    const merged: ComplianceDriftRecord = {
      ...drift,
      open:
        lifecycleStatus === "resolved" || lifecycleStatus === "waived"
          ? false
          : true,
      lifecycleStatus,
      acknowledgedAtISO: previous?.acknowledgedAtISO,
      acknowledgedBy: previous?.acknowledgedBy,
      inProgressAtISO: previous?.inProgressAtISO,
      resolvedAtISO: previous?.resolvedAtISO,
      waivedAtISO: previous?.waivedAtISO,
      waivedReason: previous?.waivedReason,
      escalationBreachedAtISO,
      lastStatusUpdatedAtISO: previous?.lastStatusUpdatedAtISO ?? drift.lastStatusUpdatedAtISO,
    }

    if (!previous) {
      events.push({
        type: "detected",
        driftId: drift.id,
        message: `Drift nou detectat: ${drift.summary}`,
      })
    } else if (!previous.escalationBreachedAtISO && escalationBreachedAtISO) {
      events.push({
        type: "breached",
        driftId: drift.id,
        message: `SLA depășit pentru drift: ${drift.summary}`,
      })
    }

    return merged
  })

  return { drifts, events }
}

function systemKey(system: CompliScanSystem) {
  const evidenceMap = readSystemEvidenceMap(system)
  if (evidenceMap.system_id) return `system-id::${slug(evidenceMap.system_id)}`
  return `${slug(system.systemName)}::${slug(system.provider)}`
}

function findingKey(finding: CompliScanFinding) {
  return `${finding.regulatoryArea}::${slug(finding.issue)}::${finding.sourceId || "none"}`
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle))
}

function buildDriftId(
  input: Pick<
    ComplianceDriftRecord,
    "type" | "change" | "systemLabel" | "sourceDocument" | "before" | "after" | "summary"
  >
) {
  const payload = [
    input.type,
    input.change,
    input.systemLabel ?? "",
    input.sourceDocument ?? "",
    stableSerialize(input.before),
    stableSerialize(input.after),
    input.summary,
  ].join("::")

  return `drift-${hashString(payload)}`
}

function stableSerialize(value: unknown): string {
  if (!value || typeof value !== "object") return String(value ?? "")

  return JSON.stringify(
    Object.fromEntries(
      Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
        left.localeCompare(right)
      )
    )
  )
}

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash.toString(36)
}

function isEscalationBreached(
  drift: ComplianceDriftRecord,
  lifecycleStatus: ComplianceDriftRecord["lifecycleStatus"],
  nowISO: string
) {
  if (!drift.escalationDueAtISO) return false
  if (lifecycleStatus === "resolved" || lifecycleStatus === "waived") return false
  return drift.escalationDueAtISO.localeCompare(nowISO) < 0
}

function readSystemEvidenceMap(system: CompliScanSystem) {
  return Object.fromEntries(
    system.evidence
      .map((item) => item.value)
      .filter((value) => value.includes("="))
      .map((value) => {
        const [rawKey, ...rest] = value.split("=")
        return [rawKey.trim(), rest.join("=").trim()]
      })
      .filter(([key, value]) => key && value)
  ) as Record<string, string>
}
