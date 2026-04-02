import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  resolveUserModeMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  createScheduledReportMock: vi.fn(),
  listScheduledReportsMock: vi.fn(),
  hasSupabaseConfigMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 403, code = "AUTH_ERROR") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshRole: mocks.requireFreshRoleMock,
  resolveUserMode: mocks.resolveUserModeMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
}))

vi.mock("@/lib/server/supabase-rest", () => ({
  hasSupabaseConfig: mocks.hasSupabaseConfigMock,
}))

vi.mock("@/lib/server/scheduled-reports", () => ({
  createScheduledReport: mocks.createScheduledReportMock,
  listScheduledReports: mocks.listScheduledReportsMock,
}))

import { GET, POST } from "./route"

describe("scheduled reports route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      orgId: "partner-org-session",
      userId: "user-session",
      email: "partner@example.com",
      role: "partner_manager",
    })
    mocks.resolveUserModeMock.mockResolvedValue("partner")
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.readStateForOrgMock.mockResolvedValue({
      events: [
        {
          id: "evt-1",
          type: "report.scheduled_run",
          createdAtISO: "2026-04-02T09:00:00.000Z",
          message: "Raport lansat automat.",
          metadata: {
            scheduledReportId: "report-1",
            reportType: "compliance_summary",
            executionMode: "approved",
          },
        },
      ],
    })
  })

  it("GET folosește org-ul sesiunii și expune runtime status", async () => {
    mocks.listScheduledReportsMock.mockResolvedValue([
      {
        id: "report-1",
        orgId: "partner-org-session",
        userId: "user-session",
        reportType: "compliance_summary",
        frequency: "monthly",
        clientOrgIds: ["client-1"],
        recipientEmails: ["owner@example.com"],
        requiresApproval: true,
        enabled: true,
        nextRunAt: "2026-05-01T05:00:00.000Z",
        lastRunAt: null,
        createdAtISO: "2026-04-02T08:00:00.000Z",
        updatedAtISO: "2026-04-02T08:00:00.000Z",
      },
    ])

    const response = await GET(
      new Request("http://localhost/api/reports/scheduled", {
        headers: {
          "x-compliscan-org-id": "wrong-org",
        },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.listScheduledReportsMock).toHaveBeenCalledWith("partner-org-session")
    expect(mocks.readStateForOrgMock).toHaveBeenCalledWith("partner-org-session")
    expect(body.runtimeStatus).toEqual({
      storageBackend: "supabase",
      persistenceStatus: "synced",
    })
    expect(body.recentRuns).toEqual([
      expect.objectContaining({
        status: "approved_then_executed",
        scheduledReportId: "report-1",
      }),
    ])
  })

  it("POST creează raportul pe org-ul și userul sesiunii, nu din headere", async () => {
    mocks.createScheduledReportMock.mockResolvedValue({
      id: "report-2",
      orgId: "partner-org-session",
      userId: "user-session",
      reportType: "audit_pack",
      frequency: "monthly",
      clientOrgIds: ["client-1"],
      recipientEmails: ["owner@example.com"],
      requiresApproval: true,
      enabled: true,
      nextRunAt: "2026-05-01T05:00:00.000Z",
      lastRunAt: null,
      createdAtISO: "2026-04-02T08:05:00.000Z",
      updatedAtISO: "2026-04-02T08:05:00.000Z",
    })

    const response = await POST(
      new Request("http://localhost/api/reports/scheduled", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-compliscan-org-id": "wrong-org",
          "x-compliscan-user-id": "wrong-user",
        },
        body: JSON.stringify({
          reportType: "audit_pack",
          frequency: "monthly",
          clientOrgIds: ["client-1"],
          recipientEmails: ["owner@example.com"],
          requiresApproval: true,
        }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(mocks.createScheduledReportMock).toHaveBeenCalledWith({
      orgId: "partner-org-session",
      userId: "user-session",
      reportType: "audit_pack",
      frequency: "monthly",
      clientOrgIds: ["client-1"],
      recipientEmails: ["owner@example.com"],
      requiresApproval: true,
    })
    expect(body.report.orgId).toBe("partner-org-session")
  })
})
