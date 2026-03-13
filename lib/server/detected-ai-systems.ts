import { buildAISystemRecord, buildDetectedAISystemRecord } from "@/lib/compliance/ai-inventory"
import type {
  AISystemRecord,
  ComplianceState,
  DetectedAISystemRecord,
} from "@/lib/compliance/types"

export type DetectedAISystemUpdates = Partial<
  Pick<
    DetectedAISystemRecord,
    | "name"
    | "purpose"
    | "vendor"
    | "modelType"
    | "usesPersonalData"
    | "makesAutomatedDecisions"
    | "impactsRights"
    | "hasHumanReview"
    | "confidence"
    | "frameworks"
    | "evidence"
  >
>

export function mergeDetectedAISystems(
  existing: DetectedAISystemRecord[],
  incoming: DetectedAISystemRecord[]
) {
  const byKey = new Map<string, DetectedAISystemRecord>()

  for (const item of existing) byKey.set(candidateKey(item), item)

  for (const item of incoming) {
    const key = candidateKey(item)
    const previous = byKey.get(key)
    byKey.set(
      key,
      previous
        ? {
            ...previous,
            ...item,
            id: previous.id,
            detectionStatus:
              previous.detectionStatus === "confirmed"
                ? "confirmed"
                : previous.detectionStatus === "reviewed"
                  ? "reviewed"
                  : item.detectionStatus,
            confirmedSystemId: previous.confirmedSystemId || item.confirmedSystemId,
          }
        : item
    )
  }

  return [...byKey.values()]
    .sort((left, right) => right.detectedAtISO.localeCompare(left.detectedAtISO))
    .slice(0, 80)
}

export function findDetectedSystem(state: ComplianceState, id: string) {
  return state.detectedAISystems.find((item) => item.id === id)
}

export function confirmDetectedSystem(candidate: DetectedAISystemRecord, nowISO: string): AISystemRecord {
  return buildAISystemRecord(
    {
      name: candidate.name,
      purpose: candidate.purpose,
      vendor: candidate.vendor,
      modelType: candidate.modelType,
      usesPersonalData: candidate.usesPersonalData,
      makesAutomatedDecisions: candidate.makesAutomatedDecisions,
      impactsRights: candidate.impactsRights,
      hasHumanReview: candidate.hasHumanReview,
    },
    nowISO
  )
}

export function updateDetectedSystem(
  candidate: DetectedAISystemRecord,
  updates: DetectedAISystemUpdates
): DetectedAISystemRecord {
  const rebuilt = buildDetectedAISystemRecord(
    {
      name: updates.name ?? candidate.name,
      purpose: updates.purpose ?? candidate.purpose,
      vendor: updates.vendor ?? candidate.vendor,
      modelType: updates.modelType ?? candidate.modelType,
      usesPersonalData: updates.usesPersonalData ?? candidate.usesPersonalData,
      makesAutomatedDecisions:
        updates.makesAutomatedDecisions ?? candidate.makesAutomatedDecisions,
      impactsRights: updates.impactsRights ?? candidate.impactsRights,
      hasHumanReview: updates.hasHumanReview ?? candidate.hasHumanReview,
      discoveryMethod: candidate.discoveryMethod,
      detectionStatus:
        candidate.detectionStatus === "rejected" ? "reviewed" : candidate.detectionStatus,
      confidence: updates.confidence ?? candidate.confidence,
      frameworks: updates.frameworks ?? candidate.frameworks,
      evidence: updates.evidence ?? candidate.evidence,
      sourceScanId: candidate.sourceScanId,
      sourceDocument: candidate.sourceDocument,
    },
    candidate.detectedAtISO
  )

  return {
    ...rebuilt,
    id: candidate.id,
    createdAtISO: candidate.createdAtISO,
    detectedAtISO: candidate.detectedAtISO,
    confirmedSystemId: candidate.confirmedSystemId,
  }
}

function candidateKey(candidate: DetectedAISystemRecord) {
  return [candidate.sourceDocument, candidate.vendor, candidate.modelType, candidate.purpose]
    .join("::")
    .toLowerCase()
}
