import { formatEvidenceQualityReason } from "@/lib/compliance/evidence-quality"
import type {
  ComplianceState,
  EvidenceQualityAssessment,
  RemediationAction,
} from "@/lib/compliance/types"

export type AuditQualityGateCode =
  | "missing_evidence"
  | "pending_validation"
  | "weak_evidence"
  | "stale_evidence"
  | "unresolved_drift"
  | "inferred_only_finding"

export type AuditQualityGateDecision = "pass" | "review" | "blocked"

export type AuditQualityGate = {
  taskId: string
  title: string
  code: AuditQualityGateCode
  decision: AuditQualityGateDecision
  detail: string
  lawReference: string | null
  sourceDocument: string | null
  evidenceId: string | null
}

export type AuditQualityGateSummary = {
  decision: AuditQualityGateDecision
  blockedCount: number
  reviewCount: number
  passCount: number
  items: AuditQualityGate[]
}

type BuildAuditQualityGatesInput = {
  state: ComplianceState
  remediationPlan: RemediationAction[]
  nowISO?: string
}

const STALE_EVIDENCE_DAYS = 90

export function buildAuditQualityGates({
  state,
  remediationPlan,
  nowISO = new Date().toISOString(),
}: BuildAuditQualityGatesInput): AuditQualityGateSummary {
  const items: AuditQualityGate[] = []

  for (const task of remediationPlan) {
    const taskId = `rem-${task.id}`
    const taskState = state.taskState[taskId]
    const evidence = taskState?.attachedEvidenceMeta
    const openRelatedDrifts = state.driftRecords.filter(
      (drift) => drift.open && (task.relatedDriftIds ?? []).includes(drift.id)
    )
    const relatedFindings = state.findings.filter((finding) =>
      (task.relatedFindingIds ?? []).includes(finding.id)
    )

    if (!evidence) {
      items.push(
        buildGate(task, "missing_evidence", "blocked", {
          detail: "Controlul nu are încă dovadă atașată. Audit Pack-ul rămâne blocat pentru acest task.",
          evidenceId: null,
        })
      )
      continue
    }

    if (taskState?.validationStatus === "needs_review") {
      items.push(
        buildGate(task, "pending_validation", "review", {
          detail:
            taskState.validationMessage?.trim() ||
            "Controlul are dovadă atașată, dar încă așteaptă validare finală înainte de export.",
          evidenceId: evidence.id,
        })
      )
    }

    if (evidence.quality?.status === "weak") {
      items.push(
        buildGate(task, "weak_evidence", "review", {
          detail: formatWeakEvidenceDetail(evidence.quality),
          evidenceId: evidence.id,
        })
      )
    }

    if (isEvidenceStale(evidence.uploadedAtISO, nowISO, openRelatedDrifts)) {
      items.push(
        buildGate(task, "stale_evidence", "review", {
          detail: buildStaleEvidenceDetail(evidence.uploadedAtISO, openRelatedDrifts),
          evidenceId: evidence.id,
        })
      )
    }

    if (openRelatedDrifts.length > 0) {
      items.push(
        buildGate(task, "unresolved_drift", "blocked", {
          detail: `${openRelatedDrifts.length} drift-uri legate de acest control sunt încă deschise și cer remediere sau aprobare explicită.`,
          evidenceId: evidence.id,
        })
      )
    }

    if (
      relatedFindings.length > 0 &&
      relatedFindings.every((finding) => finding.provenance?.verdictBasis === "inferred_signal") &&
      taskState?.validationBasis !== "direct_signal"
    ) {
      items.push(
        buildGate(task, "inferred_only_finding", "review", {
          detail:
            "Controlul se bazează doar pe semnale inferate. Păstrează o dovadă mai puternică sau confirmare umană înainte de export.",
          evidenceId: evidence.id,
        })
      )
    }
  }

  const blockedCount = items.filter((item) => item.decision === "blocked").length
  const reviewCount = items.filter((item) => item.decision === "review").length
  const passCount = Math.max(remediationPlan.length - new Set(items.map((item) => item.taskId)).size, 0)

  return {
    decision: blockedCount > 0 ? "blocked" : reviewCount > 0 ? "review" : "pass",
    blockedCount,
    reviewCount,
    passCount,
    items,
  }
}

function buildGate(
  task: RemediationAction,
  code: AuditQualityGateCode,
  decision: AuditQualityGateDecision,
  input: { detail: string; evidenceId: string | null }
): AuditQualityGate {
  return {
    taskId: `rem-${task.id}`,
    title: task.title,
    code,
    decision,
    detail: input.detail,
    lawReference: task.lawReference ?? null,
    sourceDocument: task.sourceDocument ?? null,
    evidenceId: input.evidenceId,
  }
}

function formatWeakEvidenceDetail(quality: EvidenceQualityAssessment) {
  if (quality.reasonCodes.length === 0) {
    return quality.summary
  }

  return `Dovada este marcată ca slabă: ${quality.reasonCodes
    .map(formatEvidenceQualityReason)
    .join(", ")}.`
}

function isEvidenceStale(
  uploadedAtISO: string,
  nowISO: string,
  openRelatedDrifts: ComplianceState["driftRecords"]
) {
  const uploadedAt = Date.parse(uploadedAtISO)
  const now = Date.parse(nowISO)
  if (!Number.isFinite(uploadedAt) || !Number.isFinite(now)) {
    return false
  }

  const ageDays = (now - uploadedAt) / (1000 * 60 * 60 * 24)
  if (ageDays > STALE_EVIDENCE_DAYS) {
    return true
  }

  return openRelatedDrifts.some((drift) => {
    const driftAt = Date.parse(drift.detectedAtISO)
    return Number.isFinite(driftAt) && driftAt > uploadedAt
  })
}

function buildStaleEvidenceDetail(
  uploadedAtISO: string,
  openRelatedDrifts: ComplianceState["driftRecords"]
) {
  const newerOpenDrift = openRelatedDrifts
    .map((drift) => drift.detectedAtISO)
    .sort()
    .at(-1)

  if (newerOpenDrift) {
    return `Dovada a fost încărcată înaintea unui drift deschis detectat la ${newerOpenDrift}. Revalidează controlul pe ultima stare.`
  }

  return `Dovada este mai veche de ${STALE_EVIDENCE_DAYS} de zile și cere reverificare înainte de audit.`
}
