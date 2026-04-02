import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createNotificationMock: vi.fn(),
  executeBatchActionForOrgMock: vi.fn(),
  executeScheduledReportDeliveryMock: vi.fn(),
  markReportRunMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  writeStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/notifications-store", () => ({
  createNotification: mocks.createNotificationMock,
}))

vi.mock("@/lib/server/batch-executor", () => ({
  executeBatchActionForOrg: mocks.executeBatchActionForOrgMock,
}))

vi.mock("@/lib/server/scheduled-report-runtime", () => ({
  executeScheduledReportDelivery: mocks.executeScheduledReportDeliveryMock,
}))

vi.mock("@/lib/server/scheduled-reports", () => ({
  markReportRun: mocks.markReportRunMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
  writeStateForOrg: mocks.writeStateForOrgMock,
}))

import { dispatchAutoExecutedAction } from "@/lib/server/semi-auto-dispatcher"

describe("semi-auto dispatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createNotificationMock.mockResolvedValue(null)
  })

  it("execută batch_action real pentru target org când aprobarea vine din portfolio", async () => {
    mocks.executeBatchActionForOrgMock.mockResolvedValue({
      success: true,
      detail: "Audit Pack evaluat: gata de export (82/100).",
    })

    const result = await dispatchAutoExecutedAction({
      id: "approval-1",
      orgId: "partner-org",
      userId: "user-1",
      actionType: "batch_action",
      riskLevel: "medium",
      status: "approved",
      originalData: null,
      proposedData: {
        actionType: "export_audit_pack",
        targetOrgId: "client-org",
        targetOrgName: "Client Org",
      },
      diffSummary: null,
      explanation: null,
      sourceFindingId: null,
      sourceDocumentId: null,
      createdAt: "2026-04-02T08:00:00.000Z",
      expiresAt: null,
      decidedAt: null,
      decidedBy: null,
      decidedByEmail: null,
      decisionNote: null,
      executedAt: null,
      executionResult: null,
      auditTrail: [],
    })

    expect(mocks.executeBatchActionForOrgMock).toHaveBeenCalledWith(
      "client-org",
      "export_audit_pack",
      {}
    )
    expect(result).toEqual({
      executed: true,
      detail: "Audit Pack evaluat: gata de export (82/100).",
    })
  })

  it("execută scheduled report după aprobare și marchează run-ul", async () => {
    mocks.executeScheduledReportDeliveryMock.mockResolvedValue({
      success: true,
      detail: "Sumar conformitate generat pentru 2 firme.",
    })
    mocks.markReportRunMock.mockResolvedValue(undefined)

    const result = await dispatchAutoExecutedAction({
      id: "approval-2",
      orgId: "partner-org",
      userId: "user-1",
      actionType: "batch_action",
      riskLevel: "medium",
      status: "approved",
      originalData: null,
      proposedData: {
        scheduledReportId: "sched-1",
        reportType: "compliance_summary",
        frequency: "monthly",
        clientOrgIds: ["client-1", "client-2"],
        recipientEmails: ["owner@example.com"],
      },
      diffSummary: null,
      explanation: null,
      sourceFindingId: null,
      sourceDocumentId: null,
      createdAt: "2026-04-02T08:00:00.000Z",
      expiresAt: null,
      decidedAt: null,
      decidedBy: null,
      decidedByEmail: null,
      decisionNote: null,
      executedAt: null,
      executionResult: null,
      auditTrail: [],
    })

    expect(mocks.executeScheduledReportDeliveryMock).toHaveBeenCalledWith({
      orgId: "partner-org",
      orgName: "partner-org",
      scheduledReportId: "sched-1",
      reportType: "compliance_summary",
      frequency: "monthly",
      clientOrgIds: ["client-1", "client-2"],
      recipientEmails: ["owner@example.com"],
      executionMode: "approved",
    })
    expect(mocks.markReportRunMock).toHaveBeenCalledWith("partner-org", "sched-1", "monthly")
    expect(result).toEqual({
      executed: true,
      detail: "Sumar conformitate generat pentru 2 firme.",
    })
  })
})
