import type { AICompliancePack, AICompliancePackEntry } from "@/lib/compliance/ai-compliance-pack"
import type { OrgProfilePrefill, PrefillSuggestion } from "@/lib/compliance/org-profile-prefill"
import type { ComplianceState } from "@/lib/compliance/types"
import { buildAICompliancePack } from "@/lib/server/ai-compliance-pack"
import { buildDashboardCorePayload } from "@/lib/server/dashboard-response"

type AICompliancePackSuggestions = Partial<
  Pick<
    OrgProfilePrefill["suggestions"],
    "usesAITools" | "processesPersonalData" | "aiUsesConfidentialData"
  >
>

export function buildAICompliancePackPrefillSignals(pack: AICompliancePack): {
  suggestions: AICompliancePackSuggestions
  aiCompliancePackSignals?: OrgProfilePrefill["aiCompliancePackSignals"]
} {
  if (pack.entries.length === 0) {
    return { suggestions: {} }
  }

  const strongEntries = pack.entries.filter(isStrongAICompliancePackEntry)
  const personalDataEntries = pack.entries.filter((entry) => entry.governance.personalDataUsed)
  const strongPersonalDataEntries = personalDataEntries.filter((entry) => isStrongPersonalDataEntry(entry))
  const topSystems = uniqueSystemNames(pack.entries)

  const suggestions: AICompliancePackSuggestions = {
    usesAITools: buildUsesAIToolsSuggestion(pack.entries, strongEntries, topSystems),
  }

  if (personalDataEntries.length > 0) {
    suggestions.processesPersonalData = buildPersonalDataSuggestion(
      personalDataEntries,
      strongPersonalDataEntries
    )
    suggestions.aiUsesConfidentialData = buildSensitiveDataSuggestion(
      personalDataEntries,
      strongPersonalDataEntries
    )
  }

  return {
    suggestions,
    aiCompliancePackSignals: {
      source: "ai_compliance_pack",
      totalEntries: pack.summary.totalEntries,
      auditReadyEntries: pack.summary.auditReadyEntries,
      confirmedEntries: strongEntries.length,
      personalDataEntries: personalDataEntries.length,
      topSystems,
    },
  }
}

export function enrichOrgProfilePrefillWithAICompliancePackSignals(
  prefill: OrgProfilePrefill | null,
  pack: AICompliancePack
): OrgProfilePrefill | null {
  const { suggestions, aiCompliancePackSignals } = buildAICompliancePackPrefillSignals(pack)
  if (!aiCompliancePackSignals) return prefill

  const basePrefill = prefill ?? createAICompliancePackSeedPrefill(pack)

  return {
    ...basePrefill,
    aiCompliancePackSignals,
    suggestions: {
      ...suggestions,
      ...basePrefill.suggestions,
      usesAITools: basePrefill.suggestions.usesAITools ?? suggestions.usesAITools,
      processesPersonalData:
        basePrefill.suggestions.processesPersonalData ?? suggestions.processesPersonalData,
      aiUsesConfidentialData:
        basePrefill.suggestions.aiUsesConfidentialData ?? suggestions.aiUsesConfidentialData,
    },
  }
}

export async function enrichOrgProfilePrefillWithAICompliancePack(
  prefill: OrgProfilePrefill | null,
  state: ComplianceState
): Promise<OrgProfilePrefill | null> {
  if (!hasAICompliancePackCandidates(state)) return prefill

  try {
    const core = await buildDashboardCorePayload(state)
    const pack = buildAICompliancePack({
      state: core.state,
      remediationPlan: core.remediationPlan,
      workspace: core.workspace,
      snapshot: core.snapshot,
    })

    return enrichOrgProfilePrefillWithAICompliancePackSignals(prefill, pack)
  } catch {
    return prefill
  }
}

function hasAICompliancePackCandidates(state: ComplianceState) {
  return (
    state.aiSystems.length > 0 ||
    state.detectedAISystems.length > 0 ||
    state.snapshotHistory.some((snapshot) => snapshot.systems.length > 0)
  )
}

function createAICompliancePackSeedPrefill(pack: AICompliancePack): OrgProfilePrefill {
  return {
    source: "ai_compliance_pack",
    fetchedAtISO: pack.generatedAt,
    normalizedCui: null,
    companyName: pack.workspace.orgName || pack.workspace.workspaceLabel || "Workspace CompliScan",
    address: null,
    legalForm: null,
    mainCaen: null,
    caenDescription: null,
    fiscalStatus: null,
    vatRegistered: false,
    vatOnCashAccounting: false,
    efacturaRegistered: false,
    inactive: false,
    suggestions: {},
  }
}

function buildUsesAIToolsSuggestion(
  entries: AICompliancePackEntry[],
  strongEntries: AICompliancePackEntry[],
  topSystems: string[]
): PrefillSuggestion<boolean> {
  const confidence = strongEntries.length > 0 ? "high" : "medium"
  const qualifier =
    confidence === "high"
      ? "confirmate sau documentate solid în AI Compliance Pack"
      : "detectate sau inferate în AI Compliance Pack"

  return {
    value: true,
    confidence,
    reason: `AI Compliance Pack conține ${entries.length} ${entries.length === 1 ? "sistem AI" : "sisteme AI"} ${qualifier}${formatExamples(topSystems)}, deci utilizarea tool-urilor AI este deja foarte probabilă în workspace.`,
    source: "ai_compliance_pack",
  }
}

function buildPersonalDataSuggestion(
  personalDataEntries: AICompliancePackEntry[],
  strongPersonalDataEntries: AICompliancePackEntry[]
): PrefillSuggestion<boolean> {
  const confidence = strongPersonalDataEntries.length > 0 ? "high" : "medium"
  const systems = uniqueSystemNames(personalDataEntries)
  const qualifier =
    confidence === "high"
      ? "au utilizarea de date personale confirmată în pack"
      : "au semnal de date personale în pack"

  return {
    value: true,
    confidence,
    reason: `${personalDataEntries.length} ${personalDataEntries.length === 1 ? "sistem AI" : "sisteme AI"} ${qualifier}${formatExamples(systems)}, deci prelucrarea de date personale este foarte probabilă.`,
    source: "ai_compliance_pack",
  }
}

function buildSensitiveDataSuggestion(
  personalDataEntries: AICompliancePackEntry[],
  strongPersonalDataEntries: AICompliancePackEntry[]
): PrefillSuggestion<boolean> {
  const confidence = strongPersonalDataEntries.length > 0 ? "high" : "medium"
  const systems = uniqueSystemNames(personalDataEntries)

  return {
    value: true,
    confidence,
    reason: `AI Compliance Pack arată că ${personalDataEntries.length} ${personalDataEntries.length === 1 ? "sistem AI folosește" : "sisteme AI folosesc"} sau pot folosi date personale${formatExamples(systems)}, deci merită confirmat explicit dacă intră și date confidențiale în fluxurile AI.`,
    source: "ai_compliance_pack",
  }
}

function isStrongAICompliancePackEntry(entry: AICompliancePackEntry) {
  return (
    entry.confidenceModel.state === "confirmed_by_user" ||
    entry.detectionStatus === "confirmed" ||
    entry.discoveryMethod === "manual"
  )
}

function isStrongPersonalDataEntry(entry: AICompliancePackEntry) {
  const personalDataField = entry.prefill.fieldStatus.find((field) => field.field === "personal_data")
  return (
    isStrongAICompliancePackEntry(entry) ||
    personalDataField?.status === "confirmed" ||
    personalDataField?.userConfirmed === true ||
    personalDataField?.confidenceModel.state === "confirmed_by_user"
  )
}

function uniqueSystemNames(entries: AICompliancePackEntry[]) {
  return [...new Set(entries.map((entry) => entry.systemName.trim()).filter(Boolean))].slice(0, 3)
}

function formatExamples(values: string[]) {
  return values.length > 0 ? ` (${values.join(", ")})` : ""
}
