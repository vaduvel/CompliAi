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
  buildPayGapReportMock: vi.fn(),
  buildPayGapReportMarkdownMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/pay-transparency-store", () => ({
  buildPayGapReport: mocks.buildPayGapReportMock,
  buildPayGapReportMarkdown: mocks.buildPayGapReportMarkdownMock,
}))

import { POST } from "./route"

describe("POST /api/pay-transparency/report", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.buildPayGapReportMock.mockResolvedValue({
      id: "report-1",
      periodYear: 2026,
      generatedAtISO: "2026-04-02T08:00:00.000Z",
    })
    mocks.buildPayGapReportMarkdownMock.mockReturnValue("# Raport")
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId, updater) =>
      updater({
        generatedDocuments: [],
        events: [],
      })
    )
  })

  it("genereaza documentul pe org-ul din sesiune", async () => {
    const response = await POST(
      new Request("http://localhost/api/pay-transparency/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ year: 2026 }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.buildPayGapReportMock).toHaveBeenCalledWith("org-1", 2026)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
    expect(payload.documentId).toBe("pay-gap-doc-report-1")
  })
})
