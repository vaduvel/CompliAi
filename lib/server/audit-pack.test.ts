import fs from "node:fs"
import path from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/server/compliance-trace", () => ({
  buildComplianceTraceRecords: vi.fn(() => []),
}))

import { simulateFindings } from "@/lib/compliance/engine"
import { buildAuditPack } from "@/lib/server/audit-pack"
import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import type {
  ComplianceDriftRecord,
  ComplianceEvent,
  ComplianceState,
  RemediationAction,
  WorkspaceContext,
} from "@/lib/compliance/types"

function readFixture(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", ...segments), "utf8")
}

function createWorkspace(): WorkspaceContext {
  return {
    orgId: "org-1",
    orgName: "Org Demo",
    workspaceLabel: "Org Demo Workspace",
    workspaceOwner: "Ion Popescu",
    workspaceInitials: "OD",
  }
}

function createCompliancePack(
  overrides?: Partial<AICompliancePack["summary"]>
): AICompliancePack {
  return {
    version: "4.0",
    generatedAt: "2026-03-13T10:00:00.000Z",
    workspace: {
      orgId: "org-1",
      orgName: "Org Demo",
      workspaceLabel: "Org Demo Workspace",
      workspaceOwner: "Ion Popescu",
    },
    snapshotId: "snap-1",
    comparedToSnapshotId: null,
    summary: {
      totalEntries: 0,
      auditReadyEntries: 0,
      reviewRequiredEntries: 0,
      openFindings: 0,
      openDrifts: 0,
      missingEvidenceItems: 0,
      averageCompletenessScore: 100,
      annexLiteReadyEntries: 0,
      bundleReadyEntries: 0,
      confidenceCoverage: {
        detected: 0,
        inferred: 0,
        confirmedByUser: 0,
      },
      sourceCoverage: [],
      systemsByRisk: {
        minimal: 0,
        limited: 0,
        high: 0,
      },
      regulatoryCoverage: [],
      topGaps: [],
      driftSummary: {
        operational: 0,
        compliance: 0,
        highSeverity: 0,
      },
      evidenceBundleSummary: {
        bundleReady: 0,
        partial: 0,
        missingEvidence: 0,
      },
      ...overrides,
    },
    entries: [],
  } as AICompliancePack
}

function createTask(overrides?: Partial<RemediationAction>): RemediationAction {
  return {
    id: "task-1",
    title: "Controleaza bannerul de consimtamant",
    priority: "P1",
    severity: "high",
    remediationMode: "rapid",
    principles: ["privacy_data_governance"],
    owner: "Marketing Ops",
    dueDate: "2026-03-20",
    why: "Tracking-ul trebuie blocat pana la accept explicit.",
    actions: ["Blocheaza scripturile pana la accept."],
    evidence: "Screenshot si log de consimtamant.",
    sourceDocument: "policy.pdf",
    detectedIssue: "Tracking fara consimtamant clar.",
    triggerSnippet: "analytics, tracking",
    lawReference: "GDPR Art. 7",
    fixPreview: "Adauga blocarea explicita a scripturilor.",
    readyTextLabel: "Text recomandat",
    readyText: "Acest site foloseste cookie-uri numai dupa consimtamant.",
    relatedFindingIds: ["finding-1"],
    relatedDriftIds: [],
    validationKind: "tracking-consent",
    evidenceTypes: ["screenshot"],
    ...overrides,
  }
}

function createState(
  overrides?: Partial<ComplianceState> & {
    taskState?: ComplianceState["taskState"]
    driftRecords?: ComplianceState["driftRecords"]
    findings?: ComplianceState["findings"]
    snapshotHistory?: ComplianceState["snapshotHistory"]
    events?: ComplianceEvent[]
  }
): ComplianceState {
  return {
    highRisk: 0,
    lowRisk: 0,
    gdprProgress: 0,
    efacturaSyncedAtISO: "",
    efacturaConnected: false,
    efacturaSignalsCount: 0,
    scannedDocuments: 0,
    alerts: [],
    findings: overrides?.findings ?? [],
    scans: [],
    chat: [],
    taskState: overrides?.taskState ?? {},
    aiComplianceFieldOverrides: {},
    traceabilityReviews: {},
    aiSystems: [],
    detectedAISystems: [],
    efacturaValidations: [],
    driftRecords: overrides?.driftRecords ?? [],
    driftSettings: { severityOverrides: {} },
    snapshotHistory: overrides?.snapshotHistory ?? [],
    validatedBaselineSnapshotId: overrides?.validatedBaselineSnapshotId,
    events: overrides?.events ?? [],
  }
}

function createOpenDrift(): ComplianceDriftRecord {
  return {
    id: "drift-1",
    snapshotId: "snap-1",
    comparedToSnapshotId: null,
    type: "compliance_drift",
    change: "tracking_detected",
    severity: "high",
    summary: "Tracking detectat dupa ultima validare.",
    detectedAtISO: "2026-03-13T09:00:00.000Z",
    blocksAudit: true,
    blocksBaseline: false,
    requiresHumanApproval: false,
    open: true,
    before: {},
    after: {},
  }
}

describe("lib/server/audit-pack", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-13T12:00:00.000Z"))
  })

  it("blocheaza audit pack-ul cand lipseste dovada", () => {
    const auditPack = buildAuditPack({
      state: createState(),
      remediationPlan: [createTask()],
      workspace: createWorkspace(),
      compliancePack: createCompliancePack(),
      snapshot: null,
    })

    expect(auditPack.executiveSummary.auditReadiness).toBe("review_required")
    expect(auditPack.executiveSummary.auditQualityDecision).toBe("blocked")
    expect(auditPack.auditQualityGates.items.map((item) => item.code)).toContain("missing_evidence")
  })

  it("marcheaza review cand dovada este slaba si controlul ramane inferat", () => {
    const auditPack = buildAuditPack({
      state: createState({
        findings: [
          {
            id: "finding-1",
            title: "Tracking detectat",
            detail: "Text de tracking detectat in politica.",
            category: "GDPR",
            severity: "medium",
            risk: "high",
            principles: ["privacy_data_governance"],
            createdAtISO: "2026-03-13T09:00:00.000Z",
            sourceDocument: "policy.pdf",
            provenance: {
              ruleId: "RULE_001",
              verdictBasis: "inferred_signal",
              signalSource: "keyword",
              signalConfidence: "medium",
            },
          },
        ],
        taskState: {
          "rem-task-1": {
            status: "todo",
            updatedAtISO: "2026-03-13T10:00:00.000Z",
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
          },
        },
      }),
      remediationPlan: [createTask()],
      workspace: createWorkspace(),
      compliancePack: createCompliancePack(),
      snapshot: null,
    })

    expect(auditPack.executiveSummary.auditReadiness).toBe("review_required")
    expect(auditPack.executiveSummary.auditQualityDecision).toBe("review")
    expect(auditPack.auditQualityGates.items.map((item) => item.code)).toEqual(
      expect.arrayContaining(["weak_evidence", "inferred_only_finding"])
    )
    expect(auditPack.controlsMatrix[0].auditDecision).toBe("review")
    expect(auditPack.controlsMatrix[0].auditGateCodes).toEqual(
      expect.arrayContaining(["weak_evidence", "inferred_only_finding"])
    )
    expect(auditPack.bundleEvidenceSummary.familyCoverage[0]?.reuseAvailable).toBe(false)
  })

  it("iese audit_ready cand exista baseline validat, dovada suficienta si nu exista drift sau review gates", () => {
    const auditPack = buildAuditPack({
      state: createState({
        snapshotHistory: [
          {
            snapshotId: "snap-validated",
            generatedAt: "2026-03-13T08:00:00.000Z",
            highRisk: 0,
            lowRisk: 0,
            gdprProgress: 100,
            efacturaConnected: true,
            scannedDocuments: 1,
          } as unknown as ComplianceState["snapshotHistory"][number],
        ],
        validatedBaselineSnapshotId: "snap-validated",
        taskState: {
          "rem-task-1": {
            status: "done",
            updatedAtISO: "2026-03-13T10:00:00.000Z",
            validationStatus: "passed",
            validationBasis: "direct_signal",
            validatedAtISO: "2026-03-13T10:05:00.000Z",
            attachedEvidenceMeta: {
              id: "evidence-1",
              fileName: "consent-banner-proof.pdf",
              mimeType: "application/pdf",
              sizeBytes: 100_000,
              uploadedAtISO: "2026-03-13T10:00:00.000Z",
              kind: "document_bundle",
              quality: {
                status: "sufficient",
                summary: "Dovada pare suficientă.",
                reasonCodes: [],
                checkedAtISO: "2026-03-13T10:00:00.000Z",
              },
            },
          },
        },
      }),
      remediationPlan: [createTask()],
      workspace: createWorkspace(),
      compliancePack: createCompliancePack(),
      snapshot: null,
    })

    expect(auditPack.executiveSummary.auditReadiness).toBe("audit_ready")
    expect(auditPack.executiveSummary.auditQualityDecision).toBe("pass")
    expect(auditPack.auditQualityGates.items).toHaveLength(0)
    expect(auditPack.controlsMatrix[0].auditDecision).toBe("pass")
  })

  it("forteaza blocked cand exista drift deschis care blocheaza auditul chiar daca dovada exista", () => {
    const auditPack = buildAuditPack({
      state: createState({
        taskState: {
          "rem-task-1": {
            status: "todo",
            updatedAtISO: "2026-03-13T10:00:00.000Z",
            attachedEvidenceMeta: {
              id: "evidence-1",
              fileName: "consent-banner-proof.pdf",
              mimeType: "application/pdf",
              sizeBytes: 100_000,
              uploadedAtISO: "2026-03-13T10:00:00.000Z",
              kind: "document_bundle",
              quality: {
                status: "sufficient",
                summary: "Dovada pare suficientă.",
                reasonCodes: [],
                checkedAtISO: "2026-03-13T10:00:00.000Z",
              },
            },
          },
        },
        driftRecords: [createOpenDrift()],
      }),
      remediationPlan: [createTask({ relatedDriftIds: ["drift-1"] })],
      workspace: createWorkspace(),
      compliancePack: createCompliancePack(),
      snapshot: null,
    })

    expect(auditPack.executiveSummary.auditReadiness).toBe("review_required")
    expect(auditPack.executiveSummary.auditQualityDecision).toBe("blocked")
    expect(auditPack.auditQualityGates.items.map((item) => item.code)).toContain("unresolved_drift")
    expect(auditPack.controlsMatrix[0].auditDecision).toBe("blocked")
    expect(auditPack.controlsMatrix[0].auditGateCodes).toContain("unresolved_drift")
    expect(auditPack.bundleEvidenceSummary.familyCoverage[0]?.reuseAvailable).toBe(false)
  })

  it("ramane blocked pe un pachet high-risk de recrutare fara dovezi atasate", () => {
    const content = readFixture("documents", "recruitment-high-risk-bundle.txt")
    const findings = simulateFindings(
      "recruitment-high-risk-bundle.txt",
      content,
      "2026-03-13T09:00:00.000Z",
      "scan-risky"
    ).findings

    const remediationPlan = findings.slice(0, 2).map((finding, index) =>
      createTask({
        id: `fixture-task-${index + 1}`,
        title: finding.title,
        severity: finding.severity === "critical" ? "critical" : "high",
        why: finding.detail,
        sourceDocument: finding.sourceDocument,
        lawReference: finding.legalReference,
        relatedFindingIds: [finding.id],
      })
    )

    const auditPack = buildAuditPack({
      state: createState({ findings }),
      remediationPlan,
      workspace: createWorkspace(),
      compliancePack: createCompliancePack({
        openFindings: findings.length,
      }),
      snapshot: null,
    })

    expect(findings.length).toBeGreaterThanOrEqual(5)
    expect(auditPack.executiveSummary.auditReadiness).toBe("review_required")
    expect(auditPack.executiveSummary.auditQualityDecision).toBe("blocked")
    expect(auditPack.auditQualityGates.items.map((item) => item.code)).toEqual(
      expect.arrayContaining(["missing_evidence"])
    )
  })

  it("ramane review cand family reuse a copiat dovada, dar controlul tinta asteapta validare finala", () => {
    const auditPack = buildAuditPack({
      state: createState({
        taskState: {
          "rem-task-1": {
            status: "todo",
            updatedAtISO: "2026-03-13T10:00:00.000Z",
            validationStatus: "needs_review",
            validationMessage: "Reuse permis doar dupa confirmare umana finala.",
            attachedEvidenceMeta: {
              id: "evidence-1",
              fileName: "oversight-proof.pdf",
              mimeType: "application/pdf",
              sizeBytes: 90_000,
              uploadedAtISO: "2026-03-13T09:50:00.000Z",
              kind: "document_bundle",
              quality: {
                status: "sufficient",
                summary: "Dovada pare suficienta.",
                reasonCodes: [],
                checkedAtISO: "2026-03-13T09:50:00.000Z",
              },
            },
          },
        },
      }),
      remediationPlan: [
        createTask({
          title: "Valideaza reuse-ul de evidence pentru family oversight",
          validationKind: "human-oversight",
        }),
      ],
      workspace: createWorkspace(),
      compliancePack: createCompliancePack(),
      snapshot: null,
    })

    expect(auditPack.executiveSummary.auditReadiness).toBe("review_required")
    expect(auditPack.executiveSummary.auditQualityDecision).toBe("review")
    expect(auditPack.auditQualityGates.items.map((item) => item.code)).toContain("pending_validation")
    expect(auditPack.controlsMatrix[0].auditDecision).toBe("review")
    expect(auditPack.controlsMatrix[0].auditGateCodes).toContain("pending_validation")
  })
})
