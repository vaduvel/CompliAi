import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string

    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireRoleMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  approvePayGapReportMock: vi.fn(),
  publishPayGapReportMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/pay-transparency-store", () => ({
  approvePayGapReport: mocks.approvePayGapReportMock,
  publishPayGapReport: mocks.publishPayGapReportMock,
}))

import { PATCH } from "./route"

describe("PATCH /api/pay-transparency/report/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.approvePayGapReportMock.mockResolvedValue({
      id: "report-1",
      periodYear: 2026,
    })
    mocks.publishPayGapReportMock.mockResolvedValue({
      id: "report-1",
      periodYear: 2026,
    })
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId, updater) =>
      updater({
        findings: [
          {
            id: "PAY-001",
            findingStatus: "open",
            severity: "medium",
            title: "Gap salarial",
          },
        ],
        generatedDocuments: [
          {
            id: "pay-gap-doc-report-1",
            approvalStatus: "draft",
            validationStatus: "pending",
          },
        ],
      })
    )
  })

  it("actualizeaza finding-ul si documentul pe org-ul din sesiune", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/pay-transparency/report/report-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: Promise.resolve({ id: "report-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.approvePayGapReportMock).toHaveBeenCalledWith("org-1", "report-1")
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
    expect(payload.documentId).toBe("pay-gap-doc-report-1")
  })
})
