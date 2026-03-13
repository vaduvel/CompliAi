import { describe, expect, it } from "vitest"

import { buildAuditQualityGates } from "@/lib/compliance/audit-quality-gates"
import type { ComplianceState, RemediationAction } from "@/lib/compliance/types"

function createState(): ComplianceState {
  return {
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
    chat: [],
    taskState: {},
    aiComplianceFieldOverrides: {},
    traceabilityReviews: {},
    aiSystems: [],
    detectedAISystems: [],
    efacturaValidations: [],
    driftRecords: [],
    driftSettings: { severityOverrides: {} },
    snapshotHistory: [],
    validatedBaselineSnapshotId: undefined,
    events: [],
  }
}

function createTask(): RemediationAction {
  return {
    id: "task-1",
    title: "Controleaza bannerul de consimtamant",
    priority: "P1",
    severity: "high",
    summary: "Tracking fara claritate suficienta.",
    why: "Trebuie blocat tracking-ul pana la accept explicit.",
    evidence: "Screenshot si log de consimtamant.",
    owner: "Marketing Ops",
    dueDateISO: "2026-03-20T10:00:00.000Z",
    readyTextLabel: "Text recomandat",
    readyText: "Acest site foloseste cookie-uri numai dupa consimtamant.",
    category: "gdpr_tracking",
    validationKind: "tracking_consent",
    remediationMode: "rapid",
    relatedFindingIds: ["finding-1"],
    relatedDriftIds: ["drift-1"],
    lawReference: "GDPR Art. 7",
    sourceDocument: "policy.pdf",
    evidenceTypes: ["screenshot"],
    principles: ["privacy_data_governance"],
  }
}

describe("lib/compliance/audit-quality-gates", () => {
  it("blocheaza controalele fara dovada", () => {
    const result = buildAuditQualityGates({
      state: createState(),
      remediationPlan: [createTask()],
      nowISO: "2026-03-13T12:00:00.000Z",
    })

    expect(result.decision).toBe("blocked")
    expect(result.blockedCount).toBe(1)
    expect(result.items[0]?.code).toBe("missing_evidence")
  })

  it("marcheaza review pentru dovada slaba si finding inferat", () => {
    const state = createState()
    state.findings = [
      {
        id: "finding-1",
        title: "Tracking detectat",
        severity: "medium",
        category: "gdpr_tracking",
        summary: "Semnale de tracking detectate.",
        sourceDocument: "policy.pdf",
        provenance: {
          sourceType: "document",
          sourceId: "src-1",
          matchedKeywords: ["tracking"],
          matchedManifestKeys: [],
          matchedSnippet: "tracking analytics",
          confidence: "medium",
          confidenceReason: "Keyword match",
          verdictBasis: "inferred_signal",
        },
      } as ComplianceState["findings"][number],
    ]
    state.taskState["rem-task-1"] = {
      status: "todo",
      updatedAtISO: "2026-03-13T12:00:00.000Z",
      validationBasis: "inferred_signal",
      attachedEvidenceMeta: {
        id: "evidence-1",
        fileName: "proof.txt",
        mimeType: "application/octet-stream",
        sizeBytes: 64,
        uploadedAtISO: "2026-03-13T10:00:00.000Z",
        kind: "other",
        quality: {
          status: "weak",
          summary: "Dovada cere review.",
          reasonCodes: ["generic_kind", "unknown_mime"],
          checkedAtISO: "2026-03-13T10:00:00.000Z",
        },
      },
    }

    const result = buildAuditQualityGates({
      state,
      remediationPlan: [createTask()],
      nowISO: "2026-03-13T12:00:00.000Z",
    })

    expect(result.decision).toBe("review")
    expect(result.reviewCount).toBe(2)
    expect(result.items.map((item) => item.code)).toEqual(
      expect.arrayContaining(["weak_evidence", "inferred_only_finding"])
    )
  })

  it("marcheaza review cand dovada exista, dar controlul asteapta validare finala", () => {
    const state = createState()
    state.taskState["rem-task-1"] = {
      status: "todo",
      updatedAtISO: "2026-03-13T12:00:00.000Z",
      validationStatus: "needs_review",
      validationMessage: "Reuse permis doar dupa confirmare umana finala.",
      attachedEvidenceMeta: {
        id: "evidence-1",
        fileName: "oversight-proof.pdf",
        mimeType: "application/pdf",
        sizeBytes: 10_000,
        uploadedAtISO: "2026-03-13T10:00:00.000Z",
        kind: "document_bundle",
        quality: {
          status: "sufficient",
          summary: "Dovada pare suficienta.",
          reasonCodes: [],
          checkedAtISO: "2026-03-13T10:00:00.000Z",
        },
      },
    }

    const result = buildAuditQualityGates({
      state,
      remediationPlan: [createTask()],
      nowISO: "2026-03-13T12:00:00.000Z",
    })

    expect(result.decision).toBe("review")
    expect(result.items.map((item) => item.code)).toContain("pending_validation")
  })

  it("marcheaza stale si unresolved drift cand dovada e depasita de schimbari", () => {
    const state = createState()
    state.taskState["rem-task-1"] = {
      status: "todo",
      updatedAtISO: "2026-03-13T12:00:00.000Z",
      attachedEvidenceMeta: {
        id: "evidence-1",
        fileName: "consent-proof.pdf",
        mimeType: "application/pdf",
        sizeBytes: 10_000,
        uploadedAtISO: "2026-01-01T10:00:00.000Z",
        kind: "document_bundle",
        quality: {
          status: "sufficient",
          summary: "Dovada pare suficientă.",
          reasonCodes: [],
          checkedAtISO: "2026-01-01T10:00:00.000Z",
        },
      },
    }
    state.driftRecords = [
      {
        id: "drift-1",
        type: "compliance_drift",
        change: "tracking_detected",
        severity: "high",
        summary: "Tracking detectat din nou.",
        detectedAtISO: "2026-03-12T09:00:00.000Z",
        open: true,
        before: {},
        after: {},
      } as ComplianceState["driftRecords"][number],
    ]

    const result = buildAuditQualityGates({
      state,
      remediationPlan: [createTask()],
      nowISO: "2026-03-13T12:00:00.000Z",
    })

    expect(result.decision).toBe("blocked")
    expect(result.items.map((item) => item.code)).toEqual(
      expect.arrayContaining(["stale_evidence", "unresolved_drift"])
    )
  })
})
