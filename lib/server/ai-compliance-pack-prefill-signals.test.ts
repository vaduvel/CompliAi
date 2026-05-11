import { describe, expect, it } from "vitest"

import type { AICompliancePack, AICompliancePackEntry } from "@/lib/compliance/ai-compliance-pack"
import {
  buildAICompliancePackPrefillSignals,
  enrichOrgProfilePrefillWithAICompliancePackSignals,
} from "@/lib/server/ai-compliance-pack-prefill-signals"

describe("ai-compliance-pack-prefill-signals", () => {
  it("derivează sugestii high confidence din sisteme confirmate în AI Compliance Pack", () => {
    const pack = buildPack([
      buildEntry({
        systemName: "ChatGPT Support Assistant",
        governance: {
          personalDataUsed: true,
        } as never,
      }),
    ])

    const result = buildAICompliancePackPrefillSignals(pack)

    expect(result.aiCompliancePackSignals).toEqual({
      source: "ai_compliance_pack",
      totalEntries: 1,
      auditReadyEntries: 0,
      confirmedEntries: 1,
      personalDataEntries: 1,
      topSystems: ["ChatGPT Support Assistant"],
    })
    expect(result.suggestions.usesAITools).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
        source: "ai_compliance_pack",
      })
    )
    expect(result.suggestions.processesPersonalData).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
        source: "ai_compliance_pack",
      })
    )
    expect(result.suggestions.aiUsesConfidentialData).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
        source: "ai_compliance_pack",
      })
    )
  })

  it("poate porni un prefill nou direct din AI Compliance Pack", () => {
    const pack = buildPack([
      buildEntry({
        systemName: "Copilot drafting",
        discoveryMethod: "auto",
        detectionStatus: "detected",
        confidenceModel: {
          state: "inferred",
          reason: "Detectat din documente.",
        },
        governance: {
          personalDataUsed: false,
        } as never,
        prefill: {
          fieldStatus: [
            buildFieldStatus("personal_data", "Date personale", "Nu", "inferred", false, "inferred") as never,
          ],
        } as never,
      }),
    ])

    const result = enrichOrgProfilePrefillWithAICompliancePackSignals(null, pack)

    expect(result).toEqual(
      expect.objectContaining({
        source: "ai_compliance_pack",
        companyName: "Workspace Demo SRL",
      })
    )
    expect(result?.suggestions.usesAITools).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "medium",
        source: "ai_compliance_pack",
      })
    )
    expect(result?.suggestions.processesPersonalData).toBeUndefined()
    expect(result?.aiCompliancePackSignals?.topSystems).toEqual(["Copilot drafting"])
  })
})

function buildPack(entries: AICompliancePackEntry[]): AICompliancePack {
  return {
    version: "4.0",
    generatedAt: "2026-03-20T10:00:00.000Z",
    workspace: {
      orgId: "org-1",
      orgName: "Workspace Demo SRL",
      workspaceLabel: "Workspace Demo",
      workspaceOwner: "Owner Demo",
    },
    snapshotId: "snap-1",
    comparedToSnapshotId: null,
    summary: {
      totalEntries: entries.length,
      auditReadyEntries: entries.filter((entry) => entry.readiness === "audit_ready").length,
      reviewRequiredEntries: entries.filter((entry) => entry.readiness === "review_required").length,
      openFindings: 0,
      openDrifts: 0,
      missingEvidenceItems: 0,
      averageCompletenessScore: 82,
      annexLiteReadyEntries: entries.length,
      bundleReadyEntries: 0,
      confidenceCoverage: {
        detected: entries.filter((entry) => entry.confidenceModel.state === "detected").length,
        inferred: entries.filter((entry) => entry.confidenceModel.state === "inferred").length,
        confirmedByUser: entries.filter((entry) => entry.confidenceModel.state === "confirmed_by_user").length,
      },
      fieldConfidenceCoverage: {
        confirmed: entries.length,
        inferred: 0,
        missing: 0,
      },
      sourceCoverage: {
        document: 0,
        manifest: entries.length,
        yaml: 0,
      },
    },
    entries,
  }
}

function buildEntry(
  overrides: Partial<AICompliancePackEntry> & {
    governance?: Partial<AICompliancePackEntry["governance"]>
    confidenceModel?: Partial<AICompliancePackEntry["confidenceModel"]>
    prefill?: Partial<AICompliancePackEntry["prefill"]> & {
      fieldStatus?: AICompliancePackEntry["prefill"]["fieldStatus"]
    }
  } = {}
): AICompliancePackEntry {
  const systemName = overrides.systemName ?? "ChatGPT Support Assistant"
  return {
    id: overrides.id ?? `pack-${systemName}`,
    systemId: overrides.systemId ?? `sys-${systemName}`,
    systemName,
    readiness: overrides.readiness ?? "review_required",
    discoveryMethod: overrides.discoveryMethod ?? "manual",
    detectionStatus: overrides.detectionStatus ?? "confirmed",
    confidence: overrides.confidence ?? "high",
    confidenceModel: {
      state: overrides.confidenceModel?.state ?? "confirmed_by_user",
      reason: overrides.confidenceModel?.reason ?? "Confirmat în AI inventory.",
    },
    identity: overrides.identity ?? {
      provider: "OpenAI",
      model: "gpt-4.1",
      purpose: "support-chatbot",
      frameworks: ["eu_ai_act"],
    },
    governance: {
      riskClass: overrides.governance?.riskClass ?? "limited",
      personalDataUsed: overrides.governance?.personalDataUsed ?? true,
      automatedDecisions: overrides.governance?.automatedDecisions ?? false,
      impactsRights: overrides.governance?.impactsRights ?? false,
      humanReviewRequired: overrides.governance?.humanReviewRequired ?? true,
      humanReviewPresent: overrides.governance?.humanReviewPresent ?? true,
      dataResidency: overrides.governance?.dataResidency ?? "EU",
      retentionDays: overrides.governance?.retentionDays ?? 30,
      owner: overrides.governance?.owner ?? "Ops",
    },
    compliance: overrides.compliance ?? {
      principles: [],
      regulatoryAreas: [],
      highestSeverity: null,
      openFindings: 0,
      openDrifts: 0,
      legalReferences: [],
      requiredControls: [],
      suggestedControls: [],
    },
    evidence: overrides.evidence ?? {
      attachedCount: 0,
      validatedCount: 0,
      missingCount: 0,
      missingItems: [],
      validationStatus: "idle",
    },
    evidenceBundle: overrides.evidenceBundle ?? {
      status: "partial",
      requiredItems: 0,
      attachedItems: 0,
      validatedItems: 0,
      pendingItems: 0,
      evidenceKinds: [],
      lawReferences: [],
      files: [],
      controls: [],
      lawCoverage: [],
      familyCoverage: [],
    },
    traceSummary: overrides.traceSummary ?? {
      controlsCovered: 0,
      validatedControls: 0,
      linkedFindings: 0,
      linkedDrifts: 0,
      linkedLegalReferences: 0,
      baselineLinked: false,
      traceStatus: "action_required",
    },
    sourceSignals: overrides.sourceSignals ?? {
      capabilities: [],
      dataCategories: [],
      residencySignals: [],
      oversightSignals: [],
    },
    prefill: {
      completenessScore: overrides.prefill?.completenessScore ?? 85,
      filledFields: overrides.prefill?.filledFields ?? ["provider", "model", "purpose", "personal_data"],
      missingFields: overrides.prefill?.missingFields ?? [],
      fieldStatus: (overrides.prefill?.fieldStatus ?? [
        buildFieldStatus("personal_data", "Date personale", "Da", "confirmed", true, "confirmed_by_user"),
      ]) as never,
    },
    annexLiteDraft: overrides.annexLiteDraft ?? {
      systemDescription: "Descriere",
      systemScope: "Scope",
      intendedPurpose: "Purpose",
      intendedUsersAndAffectedPersons: "Users",
      dataAndGovernance: "Governance",
      riskAndRightsImpact: "Risk",
      humanOversight: "Human oversight",
      technicalDependencies: "Dependencies",
      monitoringAndControls: "Controls",
      evidenceAndValidation: "Evidence",
    },
    sources: overrides.sources ?? [],
    suggestedNextStep: overrides.suggestedNextStep ?? "Confirmă sistemul.",
  }
}

function buildFieldStatus(
  field: AICompliancePackEntry["prefill"]["fieldStatus"][number]["field"],
  label: string,
  value: string,
  status: AICompliancePackEntry["prefill"]["fieldStatus"][number]["status"],
  userConfirmed: boolean,
  confidenceState: AICompliancePackEntry["prefill"]["fieldStatus"][number]["confidenceModel"]["state"]
) {
  return {
    field,
    label,
    value,
    status,
    sources: ["manifest"],
    confidence: status === "confirmed" ? "high" : "medium",
    userConfirmed,
    confidenceModel: {
      state: confidenceState,
      reason: "Semnal de test.",
    },
  }
}
