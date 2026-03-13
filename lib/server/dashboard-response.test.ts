import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  computeDashboardSummaryMock: vi.fn(),
  normalizeComplianceStateMock: vi.fn(),
  buildRemediationPlanMock: vi.fn(),
  buildCompliScanSnapshotMock: vi.fn(),
  buildAICompliancePackMock: vi.fn(),
  buildComplianceTraceRecordsMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  hydrateEvidenceAttachmentsFromSupabaseMock: vi.fn(),
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

vi.mock("@/lib/server/compliance-trace", () => ({
  buildComplianceTraceRecords: mocks.buildComplianceTraceRecordsMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/supabase-evidence-read", () => ({
  hydrateEvidenceAttachmentsFromSupabase: mocks.hydrateEvidenceAttachmentsFromSupabaseMock,
}))

import { buildDashboardPayload } from "@/lib/server/dashboard-response"

describe("lib/server/dashboard-response", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    const remediationPlan = []
    const snapshot = { snapshotId: "snap-1", generatedAt: "2026-03-13T12:00:00.000Z" }
    const compliancePack = { entries: [], summary: { openFindings: 0, sourceCoverage: [] } }
    const traceabilityMatrix = []

    mocks.getOrgContextMock.mockResolvedValue(workspace)
    mocks.hydrateEvidenceAttachmentsFromSupabaseMock.mockResolvedValue(hydratedState)
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
    expect(mocks.buildAICompliancePackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: hydratedState,
        workspace,
        snapshot,
      })
    )
    expect(mocks.buildComplianceTraceRecordsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: hydratedState,
        remediationPlan,
        snapshot,
      })
    )
    expect(payload.state.taskState["rem-task-1"].attachedEvidenceMeta.storageProvider).toBe(
      "supabase_private"
    )
    expect(payload.state.taskState["rem-task-1"].attachedEvidenceMeta.accessPath).toBe(
      "/api/tasks/rem-task-1/evidence/evidence-1"
    )
  })
})
