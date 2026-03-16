import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/server/compliance-trace", () => ({
  buildComplianceTraceRecords: vi.fn(() => []),
}))

import type {
  ComplianceDriftRecord,
  ComplianceState,
  RemediationAction,
  WorkspaceContext,
} from "@/lib/compliance/types"
import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import { buildAuditPack } from "@/lib/server/audit-pack"
import { buildClientAuditPackDocument } from "@/lib/server/audit-pack-client"

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
    events: [],
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

describe("lib/server/audit-pack-client", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-13T12:00:00.000Z"))
  })

  it("afișează decizia blocked și gate-urile pentru control când există drift nerezolvat", () => {
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
              verdictBasis: "direct_signal",
              signalSource: "keyword",
              signalConfidence: "high",
            },
          },
        ],
        taskState: {
          "rem-task-1": {
            status: "done",
            updatedAtISO: "2026-03-13T10:00:00.000Z",
            validationStatus: "passed",
            validationBasis: "direct_signal",
            attachedEvidenceMeta: {
              id: "evidence-1",
              fileName: "proof.png",
              mimeType: "image/png",
              sizeBytes: 1024,
              uploadedAtISO: "2026-03-13T08:00:00.000Z",
              kind: "screenshot",
              quality: {
                status: "sufficient",
                summary: "Dovadă suficientă.",
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

    const document = buildClientAuditPackDocument(auditPack)

    expect(document.html).toContain("blocat")
    expect(document.html).toContain("drift nerezolvat")
  })

  it("afișează decizia pass când controlul este gata pentru audit", () => {
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
              verdictBasis: "direct_signal",
              signalSource: "keyword",
              signalConfidence: "high",
            },
          },
        ],
        taskState: {
          "rem-task-1": {
            status: "done",
            updatedAtISO: "2026-03-13T10:00:00.000Z",
            validationStatus: "passed",
            validationBasis: "direct_signal",
            attachedEvidenceMeta: {
              id: "evidence-1",
              fileName: "proof.png",
              mimeType: "image/png",
              sizeBytes: 1024,
              uploadedAtISO: "2026-03-13T10:00:00.000Z",
              kind: "screenshot",
              quality: {
                status: "sufficient",
                summary: "Dovadă suficientă.",
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

    const document = buildClientAuditPackDocument(auditPack)

    expect(document.html).toContain("gata pentru audit")
    expect(document.html).not.toContain("dovadă lipsă")
  })
})
