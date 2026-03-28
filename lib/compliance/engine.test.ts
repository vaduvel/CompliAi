import { describe, expect, it } from "vitest"

import { normalizeComplianceState } from "@/lib/compliance/engine"

describe("normalizeComplianceState", () => {
  it("păstrează retention-policy în generatedDocuments", () => {
    const normalized = normalizeComplianceState({
      highRisk: 0,
      lowRisk: 0,
      gdprProgress: 0,
      efacturaSyncedAtISO: "",
      efacturaConnected: false,
      efacturaSignalsCount: 0,
      scannedDocuments: 0,
      alerts: [],
      findings: [],
      scans: [],
      generatedDocuments: [
        {
          id: "doc-retention-1",
          documentType: "retention-policy",
          title: "Politică și Matrice de Retenție",
          generatedAtISO: "2026-03-28T08:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-retention-1",
          approvalStatus: "approved_as_evidence",
          validatedAtISO: "2026-03-28T08:05:00.000Z",
          validationStatus: "passed",
        },
      ],
      chat: [],
      taskState: {},
      aiComplianceFieldOverrides: {},
      traceabilityReviews: {},
      aiSystems: [],
      detectedAISystems: [],
      efacturaValidations: [],
      driftRecords: [],
      driftSettings: {
        severityOverrides: {},
      },
      snapshotHistory: [],
      validatedBaselineSnapshotId: undefined,
      events: [],
    })

    expect(normalized.generatedDocuments).toHaveLength(1)
    expect(normalized.generatedDocuments[0]?.documentType).toBe("retention-policy")
    expect(normalized.generatedDocuments[0]?.sourceFindingId).toBe("finding-retention-1")
  })
})
