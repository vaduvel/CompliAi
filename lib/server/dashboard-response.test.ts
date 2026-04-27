import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  computeDashboardSummaryMock: vi.fn(),
  normalizeComplianceStateMock: vi.fn(),
  buildRemediationPlanMock: vi.fn(),
  buildCompliScanSnapshotMock: vi.fn(),
  buildAICompliancePackMock: vi.fn(),
  buildAuditPackMock: vi.fn(),
  buildComplianceTraceRecordsMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  hydrateEvidenceAttachmentsFromSupabaseMock: vi.fn(),
  loadEvidenceLedgerFromSupabaseMock: vi.fn(),
  buildOrgKnowledgeStaleFindingMock: vi.fn(),
  readDsarStateMock: vi.fn(),
}))

vi.mock("@/lib/compliance/engine", () => ({
  computeDashboardSummary: mocks.computeDashboardSummaryMock,
  normalizeComplianceState: mocks.normalizeComplianceStateMock,
}))

vi.mock("@/lib/compliance/remediation", () => ({
  buildRemediationPlan: mocks.buildRemediationPlanMock,
}))

vi.mock("@/lib/server/compliscan-export", () => ({
  buildCompliScanSnapshot: mocks.buildCompliScanSnapshotMock,
}))

vi.mock("@/lib/server/ai-compliance-pack", () => ({
  buildAICompliancePack: mocks.buildAICompliancePackMock,
}))

vi.mock("@/lib/server/audit-pack", () => ({
  buildAuditPack: mocks.buildAuditPackMock,
}))

vi.mock("@/lib/server/compliance-trace", () => ({
  buildComplianceTraceRecords: mocks.buildComplianceTraceRecordsMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/supabase-evidence-read", () => ({
  hydrateEvidenceAttachmentsFromSupabase: mocks.hydrateEvidenceAttachmentsFromSupabaseMock,
  loadEvidenceLedgerFromSupabase: mocks.loadEvidenceLedgerFromSupabaseMock,
}))

vi.mock("@/lib/compliance/org-knowledge", () => ({
  buildOrgKnowledgeStaleFinding: mocks.buildOrgKnowledgeStaleFindingMock,
}))

vi.mock("@/lib/server/dsar-store", () => ({
  readDsarState: mocks.readDsarStateMock,
}))

import { buildDashboardPayload } from "@/lib/server/dashboard-response"

describe("lib/server/dashboard-response", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildOrgKnowledgeStaleFindingMock.mockReturnValue(null)
    mocks.readDsarStateMock.mockResolvedValue({ requests: [] })
    mocks.buildAuditPackMock.mockReturnValue({
      executiveSummary: {
        auditReadiness: "review_required",
        baselineStatus: "missing",
        complianceScore: 77,
        riskLabel: "medium",
        topBlockers: ["Nu exista baseline validat pentru comparatie auditabila."],
        nextActions: ["Valideaza snapshot-ul curent ca baseline pentru comparatii viitoare."],
        activeDrifts: 0,
        openFindings: 1,
        remediationOpen: 1,
        validatedEvidenceItems: 0,
        missingEvidenceItems: 1,
        evidenceLedgerSummary: {
          total: 0,
          sufficient: 0,
          weak: 0,
          unrated: 0,
        },
        auditQualityDecision: "review",
        blockedQualityGates: 0,
        reviewQualityGates: 1,
      },
      bundleEvidenceSummary: {
        status: "review_required",
      },
    })
  })

  it("hidrateaza state-ul din registrul cloud inainte sa construiasca pachetul pentru dashboard si audit", async () => {
    const sourceState = {
      taskState: {
        "rem-task-1": {
          validationStatus: "passed",
          attachedEvidenceMeta: {
            id: "evidence-1",
            fileName: "proof.pdf",
            mimeType: "application/pdf",
            sizeBytes: 42,
            uploadedAtISO: "2026-03-13T12:00:00.000Z",
            kind: "document_bundle",
            storageProvider: "local_private",
          },
        },
      },
      snapshotHistory: [],
    }

    const hydratedState = {
      ...sourceState,
      taskState: {
        "rem-task-1": {
          validationStatus: "passed",
          attachedEvidenceMeta: {
            id: "evidence-1",
            fileName: "proof.pdf",
            mimeType: "application/pdf",
            sizeBytes: 42,
            uploadedAtISO: "2026-03-13T12:00:00.000Z",
            kind: "document_bundle",
            storageProvider: "supabase_private",
            storageKey: "org-1/rem-task-1/proof.pdf",
            accessPath: "/api/tasks/rem-task-1/evidence/evidence-1",
          },
        },
      },
      snapshotHistory: [],
    }

    const workspace = {
      orgId: "org-1",
      orgName: "Org Demo",
      workspaceOwner: "Owner Demo",
    }

    const summary = { score: 91, riskLabel: "low" }
    const remediationPlan: unknown[] = []
    const snapshot = { snapshotId: "snap-1", generatedAt: "2026-03-13T12:00:00.000Z" }
    const compliancePack = { entries: [], summary: { openFindings: 0, sourceCoverage: [] } }
    const traceabilityMatrix: unknown[] = []

    mocks.getOrgContextMock.mockResolvedValue(workspace)
    mocks.hydrateEvidenceAttachmentsFromSupabaseMock.mockResolvedValue(hydratedState)
    mocks.loadEvidenceLedgerFromSupabaseMock.mockResolvedValue([])
    mocks.normalizeComplianceStateMock.mockImplementation((state) => state)
    mocks.computeDashboardSummaryMock.mockReturnValue(summary)
    mocks.buildRemediationPlanMock.mockReturnValue(remediationPlan)
    mocks.buildCompliScanSnapshotMock.mockReturnValue(snapshot)
    mocks.buildAICompliancePackMock.mockReturnValue(compliancePack)
    mocks.buildComplianceTraceRecordsMock.mockReturnValue(traceabilityMatrix)

    const payload = await buildDashboardPayload(sourceState as never)

    expect(mocks.hydrateEvidenceAttachmentsFromSupabaseMock).toHaveBeenCalledWith(
      sourceState,
      "org-1"
    )
    expect(mocks.loadEvidenceLedgerFromSupabaseMock).toHaveBeenCalledWith({ orgId: "org-1" })
    expect(mocks.buildAICompliancePackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.objectContaining(hydratedState),
        workspace,
        snapshot,
      })
    )
    expect(mocks.buildComplianceTraceRecordsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.objectContaining(hydratedState),
        remediationPlan,
        snapshot,
      })
    )
    expect(mocks.buildAuditPackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.objectContaining(hydratedState),
        remediationPlan,
        workspace,
        compliancePack,
        snapshot,
      })
    )
    expect(payload.auditReadinessSummary).toEqual({
      auditReadiness: "review_required",
      baselineStatus: "missing",
      complianceScore: 77,
      riskLabel: "medium",
      topBlockers: ["Nu exista baseline validat pentru comparatie auditabila."],
      nextActions: ["Valideaza snapshot-ul curent ca baseline pentru comparatii viitoare."],
      activeDrifts: 0,
      openFindings: 1,
      remediationOpen: 1,
      validatedEvidenceItems: 0,
      missingEvidenceItems: 1,
      evidenceLedgerSummary: {
        total: 0,
        sufficient: 0,
        weak: 0,
        unrated: 0,
      },
      auditQualityDecision: "review",
      blockedQualityGates: 0,
      reviewQualityGates: 1,
      bundleStatus: "review_required",
    })
    expect(payload.state.taskState["rem-task-1"]?.attachedEvidenceMeta?.storageProvider).toBe(
      "supabase_private"
    )
    expect(payload.state.taskState["rem-task-1"]?.attachedEvidenceMeta?.accessPath).toBe(
      "/api/tasks/rem-task-1/evidence/evidence-1"
    )
  })

  it("normalizează suggestedDocumentType la adevărul canonic din finding payload", async () => {
    const sourceState = {
      findings: [
        {
          id: "finding-retention",
          title: "Lipsa justificării perioadei de retenție",
          detail: "Nu este clar cât timp păstrăm datele și când se execută ștergerea.",
          category: "GDPR",
          severity: "medium",
          risk: "low",
          principles: [],
          createdAtISO: "2026-03-27T10:00:00.000Z",
          sourceDocument: "scan.pdf",
          provenance: { ruleId: "GDPR-RET-001" },
          suggestedDocumentType: "privacy-policy",
        },
      ],
      snapshotHistory: [],
    }

    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-1",
      orgName: "Org Demo",
      workspaceOwner: "Owner Demo",
    })
    mocks.hydrateEvidenceAttachmentsFromSupabaseMock.mockResolvedValue(sourceState)
    mocks.loadEvidenceLedgerFromSupabaseMock.mockResolvedValue([])
    mocks.normalizeComplianceStateMock.mockImplementation((state) => state)
    mocks.computeDashboardSummaryMock.mockReturnValue({ score: 77, riskLabel: "medium" })
    mocks.buildRemediationPlanMock.mockReturnValue([])
    mocks.buildCompliScanSnapshotMock.mockReturnValue({ snapshotId: "snap-2", generatedAt: "2026-03-27T10:00:00.000Z" })
    mocks.buildAICompliancePackMock.mockReturnValue({ entries: [], summary: { openFindings: 1, sourceCoverage: [] } })
    mocks.buildComplianceTraceRecordsMock.mockReturnValue([])

    const payload = await buildDashboardPayload(sourceState as never)

    expect(payload.state.findings[0]?.suggestedDocumentType).toBe("retention-policy")
  })
})
