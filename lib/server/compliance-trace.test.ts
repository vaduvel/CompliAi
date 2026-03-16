import { describe, expect, it } from "vitest"

import { buildComplianceTraceRecords } from "@/lib/server/compliance-trace"
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
    why: "Trebuie blocat tracking-ul pana la accept explicit.",
    actions: [],
    evidence: "Screenshot si log de consimtamant.",
    owner: "Marketing Ops",
    dueDate: "2026-03-20",
    readyTextLabel: "Text recomandat",
    readyText: "Acest site foloseste cookie-uri numai dupa consimtamant.",
    validationKind: "tracking-consent",
    remediationMode: "rapid",
    relatedFindingIds: ["finding-1"],
    relatedDriftIds: [],
    lawReference: "GDPR Art. 7",
    sourceDocument: "policy.pdf",
    evidenceTypes: ["screenshot"],
    principles: ["privacy_data_governance"],
  }
}

describe("lib/server/compliance-trace", () => {
  it("nu marcheaza controlul ca validat daca dovada atasata este slaba", () => {
    const state = createState()
    state.taskState["rem-task-1"] = {
      status: "todo",
      updatedAtISO: "2026-03-13T12:00:00.000Z",
      validationStatus: "passed",
      validationBasis: "direct_signal",
      validationConfidence: "high",
      attachedEvidenceMeta: {
        id: "evidence-1",
        fileName: "proof.txt",
        mimeType: "application/octet-stream",
        sizeBytes: 64,
        uploadedAtISO: "2026-03-13T10:00:00.000Z",
        kind: "other",
        quality: {
          status: "weak",
          summary: "Dovada cere review: tip generic de dovadă, MIME neclar.",
          reasonCodes: ["generic_kind", "unknown_mime"],
          checkedAtISO: "2026-03-13T10:00:00.000Z",
        },
      },
    }

    const [record] = buildComplianceTraceRecords({
      state,
      remediationPlan: [createTask()],
      snapshot: null,
    })

    expect(record.traceStatus).toBe("action_required")
    expect(record.auditDecision).toBe("review")
    expect(record.auditGateCodes).toContain("weak_evidence")
    expect(record.bundleCoverageStatus).toBe("partial")
    expect(record.evidence.quality?.status).toBe("weak")
    expect(record.evidence.validationBasis).toBe("direct_signal")
    expect(record.nextStep).toContain("Dovada este marcată ca slabă")
  })

  it("marcheaza controlul ca validat doar cand dovada este suficienta si validarea a trecut", () => {
    const state = createState()
    state.taskState["rem-task-1"] = {
      status: "todo",
      updatedAtISO: "2026-03-13T12:00:00.000Z",
      validationStatus: "passed",
      validationBasis: "direct_signal",
      validationConfidence: "high",
      attachedEvidenceMeta: {
        id: "evidence-1",
        fileName: "consent-banner-proof.pdf",
        mimeType: "application/pdf",
        sizeBytes: 48_000,
        uploadedAtISO: "2026-03-13T10:00:00.000Z",
        kind: "document_bundle",
        quality: {
          status: "sufficient",
          summary: "Dovada pare suficientă pentru tipul selectat și poate intra în pachetul de audit.",
          reasonCodes: [],
          checkedAtISO: "2026-03-13T10:00:00.000Z",
        },
      },
    }

    const [record] = buildComplianceTraceRecords({
      state,
      remediationPlan: [createTask()],
      snapshot: null,
    })

    expect(record.traceStatus).toBe("validated")
    expect(record.auditDecision).toBe("pass")
    expect(record.auditGateCodes).toEqual([])
    expect(record.bundleCoverageStatus).toBe("covered")
    expect(record.evidence.quality?.status).toBe("sufficient")
    expect(record.evidence.validationConfidence).toBe("high")
  })

  it("poate bloca auditul pe control validat dacă există drift deschis", () => {
    const state = createState()
    state.taskState["rem-task-1"] = {
      status: "todo",
      updatedAtISO: "2026-03-13T12:00:00.000Z",
      validationStatus: "passed",
      validationBasis: "direct_signal",
      validationConfidence: "high",
      attachedEvidenceMeta: {
        id: "evidence-1",
        fileName: "consent-banner-proof.pdf",
        mimeType: "application/pdf",
        sizeBytes: 48_000,
        uploadedAtISO: "2026-03-13T10:00:00.000Z",
        kind: "document_bundle",
        quality: {
          status: "sufficient",
          summary: "Dovada pare suficientă pentru tipul selectat și poate intra în pachetul de audit.",
          reasonCodes: [],
          checkedAtISO: "2026-03-13T10:00:00.000Z",
        },
      },
    }
    state.driftRecords = [
      {
        id: "drift-1",
        snapshotId: "snap-1",
        comparedToSnapshotId: null,
        type: "compliance_drift",
        change: "tracking_detected",
        severity: "high",
        summary: "Tracking nou detectat",
        lawReference: "GDPR Art. 7",
        detectedAtISO: "2026-03-13T13:00:00.000Z",
        sourceDocument: "policy.pdf",
        open: true,
        lifecycleStatus: "open",
      },
    ]

    const [record] = buildComplianceTraceRecords({
      state,
      remediationPlan: [{ ...createTask(), relatedDriftIds: ["drift-1"] }],
      snapshot: null,
    })

    expect(record.traceStatus).toBe("validated")
    expect(record.auditDecision).toBe("blocked")
    expect(record.auditGateCodes).toContain("unresolved_drift")
    expect(record.nextStep).toContain("drift")
  })
})
