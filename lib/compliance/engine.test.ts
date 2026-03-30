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

  it("păstrează și tipurile noi de document împreună cu urma de adoptare", () => {
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
          id: "doc-contract-1",
          documentType: "contract-template",
          title: "Contract-cadru Prestări Servicii",
          generatedAtISO: "2026-03-30T10:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-contract-1",
          approvalStatus: "approved_as_evidence",
          adoptionStatus: "sent_for_signature",
          adoptionUpdatedAtISO: "2026-03-30T11:00:00.000Z",
          adoptionEvidenceNote: "Trimis la semnare către client.",
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
    expect(normalized.generatedDocuments[0]?.documentType).toBe("contract-template")
    expect(normalized.generatedDocuments[0]?.adoptionStatus).toBe("sent_for_signature")
    expect(normalized.generatedDocuments[0]?.adoptionEvidenceNote).toBe("Trimis la semnare către client.")
  })

  it("normalizează reconcilierea REGES și elimină intrările goale", () => {
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
      generatedDocuments: [],
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
      hrRegistryReconciliations: {
        "intake-hr-registry": {
          findingId: "intake-hr-registry",
          rosterSnapshot: "Ana Popescu — CIM activ",
          registryChecklistText: "Verifică modificarea salarială din martie",
          updatedAtISO: "2026-03-30T14:00:00.000Z",
        },
        empty: {
          findingId: "empty",
          rosterSnapshot: "   ",
          registryChecklistText: "",
          updatedAtISO: "2026-03-30T14:00:00.000Z",
        },
      },
    })

    expect(normalized.hrRegistryReconciliations).toEqual({
      "intake-hr-registry": {
        findingId: "intake-hr-registry",
        rosterSnapshot: "Ana Popescu — CIM activ",
        registryChecklistText: "Verifică modificarea salarială din martie",
        updatedAtISO: "2026-03-30T14:00:00.000Z",
      },
    })
  })
})
