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

  it("păstrează statusul rejected pentru documentele respinse prin magic link", () => {
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
          id: "doc-dpa-rejected",
          documentType: "dpa",
          title: "DPA respins prin magic link",
          generatedAtISO: "2026-04-28T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-dpa",
          adoptionStatus: "rejected",
          adoptionUpdatedAtISO: "2026-04-28T11:10:00.000Z",
          adoptionEvidenceNote: "Respins cu motivare scrisă de client.",
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

    expect(normalized.generatedDocuments[0]?.adoptionStatus).toBe("rejected")
    expect(normalized.generatedDocuments[0]?.adoptionEvidenceNote).toBe(
      "Respins cu motivare scrisă de client."
    )
  })

  it("păstrează documentele ROPA în generatedDocuments", () => {
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
          id: "doc-ropa-1",
          documentType: "ropa",
          title: "Registru de Prelucrări (RoPA)",
          generatedAtISO: "2026-03-30T16:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-ropa-1",
          validationStatus: "passed",
          validatedAtISO: "2026-03-30T16:05:00.000Z",
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
    expect(normalized.generatedDocuments[0]?.documentType).toBe("ropa")
    expect(normalized.generatedDocuments[0]?.sourceFindingId).toBe("finding-ropa-1")
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

  it("normalizează protocolul fiscal și păstrează doar intrările utile", () => {
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
      fiscalProtocols: {
        "finding-ef-005": {
          findingId: "finding-ef-005",
          findingTypeId: "EF-005",
          invoiceRef: "INV-2026-204",
          actionStatus: "transmitted",
          spvReference: "MSG-7788",
          receiptStatus: "received",
          receiptReceivedAtISO: "2026-03-30T14:15:00.000Z",
          evidenceLocation: "Dosar/Fiscal/aprilie-2026",
          updatedAtISO: "2026-03-30T14:10:00.000Z",
        },
        empty: {
          findingId: "empty",
          findingTypeId: "EF-005",
          invoiceRef: "   ",
          updatedAtISO: "2026-03-30T14:10:00.000Z",
        },
      },
      driftRecords: [],
      driftSettings: {
        severityOverrides: {},
      },
      snapshotHistory: [],
      validatedBaselineSnapshotId: undefined,
      events: [],
    })

    expect(normalized.fiscalProtocols).toEqual({
      "finding-ef-005": {
        findingId: "finding-ef-005",
        findingTypeId: "EF-005",
        invoiceRef: "INV-2026-204",
        actionStatus: "transmitted",
        spvReference: "MSG-7788",
        receiptStatus: "received",
        receiptReceivedAtISO: "2026-03-30T14:15:00.000Z",
        evidenceLocation: "Dosar/Fiscal/aprilie-2026",
        updatedAtISO: "2026-03-30T14:10:00.000Z",
      },
    })
  })
})
