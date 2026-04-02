import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  resolveUserModeMock: vi.fn(),
  getScheduledReportMock: vi.fn(),
  updateScheduledReportMock: vi.fn(),
  deleteScheduledReportMock: vi.fn(),
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

vi.mock("@/lib/server/scheduled-reports", () => ({
  getScheduledReport: mocks.getScheduledReportMock,
  updateScheduledReport: mocks.updateScheduledReportMock,
  deleteScheduledReport: mocks.deleteScheduledReportMock,
}))

import { DELETE, GET, PATCH } from "./route"

describe("scheduled reports by id route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      orgId: "partner-org-session",
      userId: "user-session",
      email: "partner@example.com",
      role: "partner_manager",
    })
    mocks.resolveUserModeMock.mockResolvedValue("partner")
  })

  it("GET citește raportul din org-ul sesiunii", async () => {
    mocks.getScheduledReportMock.mockResolvedValue({
      id: "report-1",
      orgId: "partner-org-session",
    })

    const response = await GET(
      new Request("http://localhost/api/reports/scheduled/report-1", {
        headers: { "x-compliscan-org-id": "wrong-org" },
      }),
      { params: Promise.resolve({ id: "report-1" }) }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.getScheduledReportMock).toHaveBeenCalledWith("partner-org-session", "report-1")
    expect(body.report.orgId).toBe("partner-org-session")
  })

  it("PATCH actualizează raportul pe org-ul sesiunii", async () => {
    mocks.updateScheduledReportMock.mockResolvedValue({
      id: "report-1",
      orgId: "partner-org-session",
      enabled: false,
    })

    const response = await PATCH(
      new Request("http://localhost/api/reports/scheduled/report-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-compliscan-org-id": "wrong-org",
        },
        body: JSON.stringify({ enabled: false }),
      }),
      { params: Promise.resolve({ id: "report-1" }) }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.updateScheduledReportMock).toHaveBeenCalledWith(
      "partner-org-session",
      "report-1",
      { enabled: false }
    )
    expect(body.report.enabled).toBe(false)
  })

  it("DELETE șterge raportul din org-ul sesiunii", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/reports/scheduled/report-1", {
        method: "DELETE",
        headers: { "x-compliscan-org-id": "wrong-org" },
      }),
      { params: Promise.resolve({ id: "report-1" }) }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.deleteScheduledReportMock).toHaveBeenCalledWith("partner-org-session", "report-1")
    expect(body.ok).toBe(true)
  })
})
