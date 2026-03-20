import type { OrgProfilePrefill, PrefillSuggestion } from "@/lib/compliance/org-profile-prefill"
import type { AISystemRecord, DetectedAISystemRecord } from "@/lib/compliance/types"

type AiSignalInput = {
  aiSystems: AISystemRecord[]
  detectedAISystems: DetectedAISystemRecord[]
}

export function buildAiPrefillSignals({
  aiSystems,
  detectedAISystems,
}: AiSignalInput): {
  usesAITools?: PrefillSuggestion<boolean>
  processesPersonalData?: PrefillSuggestion<boolean>
  aiUsesConfidentialData?: PrefillSuggestion<boolean>
  aiSignals?: OrgProfilePrefill["aiSignals"]
} {
  const activeDetected = getActiveDetectedSystems(detectedAISystems)
  const confirmedPersonalDataSystems = aiSystems.filter((system) => system.usesPersonalData)
  const detectedPersonalDataSystems = activeDetected.filter((system) => system.usesPersonalData)

  if (aiSystems.length === 0 && activeDetected.length === 0) {
    return {}
  }

  const topSystems = [
    ...aiSystems.map((system) => system.name.trim()).filter(Boolean),
    ...activeDetected.map((system) => system.name.trim()).filter(Boolean),
  ].slice(0, 3)

  let usesAITools: PrefillSuggestion<boolean> | undefined
  if (aiSystems.length > 0) {
    usesAITools = {
      value: true,
      confidence: "high",
      reason: buildAiToolsReason(aiSystems.length, topSystems, "confirmate în inventarul AI"),
      source: "ai_inventory",
    }
  } else if (activeDetected.length > 0) {
    usesAITools = {
      value: true,
      confidence: "medium",
      reason: buildAiToolsReason(activeDetected.length, topSystems, "detectate automat în manifeste sau documente"),
      source: "ai_inventory",
    }
  }

  let processesPersonalData: PrefillSuggestion<boolean> | undefined
  let aiUsesConfidentialData: PrefillSuggestion<boolean> | undefined
  if (confirmedPersonalDataSystems.length > 0) {
    processesPersonalData = {
      value: true,
      confidence: "high",
      reason: buildPersonalDataReason(
        confirmedPersonalDataSystems.length,
        confirmedPersonalDataSystems.map((system) => system.name.trim()).filter(Boolean).slice(0, 3),
        "confirmate"
      ),
      source: "ai_inventory",
    }
    aiUsesConfidentialData = {
      value: true,
      confidence: "high",
      reason: buildAiSensitiveDataReason(
        confirmedPersonalDataSystems.length,
        confirmedPersonalDataSystems.map((system) => system.name.trim()).filter(Boolean).slice(0, 3),
        "confirmate"
      ),
      source: "ai_inventory",
    }
  } else if (detectedPersonalDataSystems.length > 0) {
    processesPersonalData = {
      value: true,
      confidence: "medium",
      reason: buildPersonalDataReason(
        detectedPersonalDataSystems.length,
        detectedPersonalDataSystems.map((system) => system.name.trim()).filter(Boolean).slice(0, 3),
        "detectate"
      ),
      source: "ai_inventory",
    }
    aiUsesConfidentialData = {
      value: true,
      confidence: "medium",
      reason: buildAiSensitiveDataReason(
        detectedPersonalDataSystems.length,
        detectedPersonalDataSystems.map((system) => system.name.trim()).filter(Boolean).slice(0, 3),
        "detectate"
      ),
      source: "ai_inventory",
    }
  }

  return {
    usesAITools,
    processesPersonalData,
    aiUsesConfidentialData,
    aiSignals: {
      source: "ai_inventory",
      confirmedSystems: aiSystems.length,
      detectedSystems: activeDetected.length,
      personalDataSystems: confirmedPersonalDataSystems.length + detectedPersonalDataSystems.length,
      topSystems,
    },
  }
}

export function enrichOrgProfilePrefillWithAiSignals(
  prefill: OrgProfilePrefill | null,
  input: AiSignalInput
): OrgProfilePrefill | null {
  if (!prefill) return null

  const { usesAITools, processesPersonalData, aiUsesConfidentialData, aiSignals } = buildAiPrefillSignals(input)
  if (!aiSignals) return prefill

  return {
    ...prefill,
    aiSignals,
    suggestions: {
      ...prefill.suggestions,
      ...(usesAITools ? { usesAITools } : {}),
      ...(processesPersonalData ? { processesPersonalData } : {}),
      ...(aiUsesConfidentialData ? { aiUsesConfidentialData } : {}),
    },
  }
}

function getActiveDetectedSystems(detectedAISystems: DetectedAISystemRecord[]) {
  return detectedAISystems.filter(
    (system) =>
      system.detectionStatus !== "rejected" &&
      !system.confirmedSystemId &&
      (system.confidence === "high" || system.confidence === "medium")
  )
}

function buildAiToolsReason(count: number, systems: string[], qualifier: string) {
  const noun = count === 1 ? "sistem AI" : "sisteme AI"
  const examples = systems.length > 0 ? ` (${systems.join(", ")})` : ""
  return `Ai deja ${count} ${noun} ${qualifier}${examples}, deci folosești unelte AI în firmă.`
}

function buildPersonalDataReason(count: number, systems: string[], qualifier: string) {
  const noun = count === 1 ? "sistem AI" : "sisteme AI"
  const examples = systems.length > 0 ? ` (${systems.join(", ")})` : ""
  return `${count} ${noun} ${qualifier}${examples} procesează sau pot procesa date personale, deci răspunsul este foarte probabil „da”.`
}

function buildAiSensitiveDataReason(count: number, systems: string[], qualifier: string) {
  const noun = count === 1 ? "sistem AI" : "sisteme AI"
  const examples = systems.length > 0 ? ` (${systems.join(", ")})` : ""
  return `${count} ${noun} ${qualifier}${examples} folosesc sau pot folosi date personale, deci trebuie confirmat că nu intră date confidențiale în fluxurile AI.`
}
