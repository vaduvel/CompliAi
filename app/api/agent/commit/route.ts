import type { NextRequest } from "next/server"

import { buildDetectedAISystemRecord } from "@/lib/compliance/ai-inventory"
import type { AgentProposalBundle } from "@/lib/compliance/agent-os"
import {
  inferPrinciplesFromCategory,
  isCompliancePrinciple,
  normalizeComplianceSeverity,
  severityToLegacyRisk,
} from "@/lib/compliance/constitution"
import type {
  AISystemPurpose,
  ComplianceDriftChange,
  ComplianceDriftType,
  ComplianceDriftRecord,
  FindingCategory,
  ScanFinding,
} from "@/lib/compliance/types"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { requireAuthenticatedSession } from "@/lib/server/auth"
import { mutateState } from "@/lib/server/mvp-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

const AI_SYSTEM_PURPOSES: AISystemPurpose[] = [
  "hr-screening",
  "credit-scoring",
  "biometric-identification",
  "fraud-detection",
  "marketing-personalization",
  "support-chatbot",
  "document-assistant",
  "other",
]

function normalizePurpose(value: string | undefined): AISystemPurpose {
  return value && AI_SYSTEM_PURPOSES.includes(value as AISystemPurpose)
    ? (value as AISystemPurpose)
    : "other"
}

function inferCategory(bundle: AgentProposalBundle, lawReference?: string): FindingCategory {
  const ref = lawReference?.toLowerCase() ?? ""
  if (bundle.sourceId.toLowerCase().includes("efactura") || ref.includes("anaf")) return "E_FACTURA"
  if (ref.includes("gdpr")) return "GDPR"
  return "EU_AI_ACT"
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request, "/api/agent/commit")
  try {
    requireAuthenticatedSession(request, "salvarea propunerilor Agent OS")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized"
    logRouteError(context, error, {
      code: "AUTH_UNAUTHORIZED",
      durationMs: getRequestDurationMs(context),
      status: 401,
    })
    return jsonError(message, 401, "AUTH_UNAUTHORIZED", undefined, context)
  }

  try {
    const bundle = (await request.json()) as AgentProposalBundle
    const nowISO = new Date().toISOString()
    await mutateState((state) => {
      // Deduplication sets to prevent data corruption on retries
      const existingSystemIds = new Set(state.detectedAISystems.map((s) => s.id))
      const existingFindingIds = new Set(state.findings.map((f) => f.id))
      const existingDriftIds = new Set(state.driftRecords.map((d) => d.id))

      if (bundle.intake?.proposedSystems?.length) {
        const newSystems = bundle.intake.proposedSystems
          .map((system) =>
            buildDetectedAISystemRecord(
              {
                name: system.systemName || "Unnamed System",
                purpose: normalizePurpose(system.purpose),
                vendor: system.provider || "Unknown",
                modelType: system.model || "Unknown",
                usesPersonalData: system.dataUsed.some((entry) =>
                  entry.toLowerCase().includes("data")
                ),
                makesAutomatedDecisions: normalizePurpose(system.purpose) === "credit-scoring",
                impactsRights:
                  system.riskClassSuggested === "high" ||
                  normalizePurpose(system.purpose) === "hr-screening",
                hasHumanReview: system.humanOversight === "present",
                discoveryMethod: "hybrid",
                detectionStatus: "detected",
                confidence: system.confidence,
                frameworks: [],
                evidence: [...system.sourceSignals],
                sourceScanId: bundle.sourceId,
                sourceDocument: "Agent Scan",
              },
              nowISO
            )
          )
          .filter((s) => !existingSystemIds.has(s.id))

        state.detectedAISystems.push(...newSystems)
      }

      if (bundle.findings?.length) {
        const newFindings: ScanFinding[] = bundle.findings
          .map((finding) => {
            const category = inferCategory(bundle, finding.lawReference)
            const severity = normalizeComplianceSeverity(finding.severity)
            const primaryPrinciple = isCompliancePrinciple(finding.principle)
              ? [finding.principle]
              : inferPrinciplesFromCategory(category)

            return {
              id: finding.findingId || crypto.randomUUID(),
              title: finding.issue,
              detail: finding.rationale,
              category,
              severity,
              verdictConfidence: finding.confidence,
              verdictConfidenceReason: `Propunere Agent OS bazata pe ${finding.sourceSignals.length > 0 ? "semnale detectate" : "context inferat"}.`,
              risk: severityToLegacyRisk(severity),
              principles: primaryPrinciple,
              createdAtISO: nowISO,
              sourceDocument: "Agent Scan",
              scanId: bundle.sourceId,
              legalReference: finding.lawReference,
              impactSummary: finding.rationale,
              remediationHint: finding.recommendedFix,
              legalMappings: finding.lawReference
                ? [
                    {
                      regulation:
                        category === "GDPR"
                          ? "GDPR"
                          : category === "E_FACTURA"
                            ? "e-Factura"
                            : "EU AI Act",
                      article: finding.lawReference,
                      label: finding.lawReference,
                      reason: finding.rationale,
                    },
                  ]
                : [],
              ownerSuggestion: finding.ownerSuggestion,
              evidenceRequired: finding.evidence[0],
              provenance:
                finding.sourceSignals.length > 0
                  ? buildAgentFindingProvenance(finding)
                  : undefined,
            }
          })
          .filter((f) => !existingFindingIds.has(f.id))

        state.findings.push(...newFindings)
      }

      if (bundle.drifts?.length) {
        const newDrifts: ComplianceDriftRecord[] = bundle.drifts
          .map((d) => ({
            id: d.driftId || crypto.randomUUID(),
            snapshotId: `agent-${bundle.sourceId}`,
            comparedToSnapshotId: null,
            sourceDocument: "Agent Scan",
            type: inferDriftRecordType(d.driftType),
            change: normalizeDriftChange(d.driftType),
            severity: normalizeComplianceSeverity(d.severity),
            summary: d.impactSummary,
            severityReason: d.rationale,
            impactSummary: d.impactSummary,
            nextAction: d.nextAction,
            evidenceRequired: d.evidenceRequired?.[0],
            lawReference: d.lawReference,
            detectedAtISO: nowISO,
            lifecycleStatus: "open" as const,
            before: normalizeDriftSide(d.before),
            after: normalizeDriftSide(d.after),
            open: true,
          }))
          .filter((d) => !existingDriftIds.has(d.id))

        state.driftRecords.push(...newDrifts)
      }

      return state
    })

    return jsonWithRequestContext(
      {
        success: true,
        systemsCount: bundle.intake?.proposedSystems.length || 0,
        findingsCount: bundle.findings?.length || 0,
        driftsCount: bundle.drifts?.length || 0,
      },
      context
    )
  } catch (error) {
    logRouteError(context, error, {
      code: "AGENT_COMMIT_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError(
      "Internal Server Error",
      500,
      "AGENT_COMMIT_FAILED",
      { details: String(error) },
      context
    )
  }
}

function normalizeDriftChange(value: string): ComplianceDriftChange {
  const changes: ComplianceDriftChange[] = [
    "provider_added",
    "provider_changed",
    "model_changed",
    "framework_added",
    "human_review_removed",
    "personal_data_detected",
    "risk_class_changed",
    "purpose_changed",
    "data_residency_changed",
    "provider_removed",
    "tracking_detected",
    "high_risk_signal_detected",
    "invoice_flow_signal_detected",
  ]

  return changes.includes(value as ComplianceDriftChange)
    ? (value as ComplianceDriftChange)
    : "provider_added"
}

function inferDriftRecordType(value: string): ComplianceDriftType {
  const change = normalizeDriftChange(value)

  if (
    change === "human_review_removed" ||
    change === "personal_data_detected" ||
    change === "risk_class_changed" ||
    change === "purpose_changed" ||
    change === "data_residency_changed" ||
    change === "tracking_detected" ||
    change === "high_risk_signal_detected" ||
    change === "invoice_flow_signal_detected"
  ) {
    return "compliance_drift"
  }

  return "operational_drift"
}

function normalizeDriftSide(
  value: Record<string, unknown>
): Record<string, string | number | boolean | null> | undefined {
  const entries = Object.entries(value).flatMap(([key, entryValue]) => {
    if (
      typeof entryValue === "string" ||
      typeof entryValue === "number" ||
      typeof entryValue === "boolean" ||
      entryValue === null
    ) {
      return [[key, entryValue] as const]
    }

    if (entryValue === undefined) {
      return []
    }

    return [[key, JSON.stringify(entryValue)] as const]
  })

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function buildAgentFindingProvenance(finding: AgentProposalBundle["findings"][number]) {
  const verdictBasis: "direct_signal" | "inferred_signal" =
    finding.confidence === "high" ? "direct_signal" : "inferred_signal"
  const signalConfidence: "high" | "medium" =
    finding.confidence === "low" ? "medium" : finding.confidence

  return {
    ruleId: "agent-os",
    matchedKeyword: finding.sourceSignals[0],
    signalSource: "keyword" as const,
    verdictBasis,
    signalConfidence,
  }
}
