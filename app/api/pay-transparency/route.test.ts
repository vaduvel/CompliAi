import { beforeEach, describe, expect, it, vi } from "vitest"

import { PAY_TRANSPARENCY_FINDING_ID } from "@/lib/compliance/pay-transparency-rule"

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
  requireFreshRoleMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  listSalaryRecordsMock: vi.fn(),
  listPayGapReportsMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

vi.mock("@/lib/server/pay-transparency-store", () => ({
  listSalaryRecords: mocks.listSalaryRecordsMock,
  listPayGapReports: mocks.listPayGapReportsMock,
}))

import { GET } from "./route"

describe("GET /api/pay-transparency", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      findings: [
        {
          id: PAY_TRANSPARENCY_FINDING_ID,
          findingStatus: "under_monitoring",
          reviewState: "under_monitoring",
        },
      ],
    })
    mocks.listSalaryRecordsMock.mockResolvedValue([{ id: "salary-1" }])
    mocks.listPayGapReportsMock.mockResolvedValue([{ id: "report-1" }])
  })

  it("citește datele din org-ul activ și întoarce findingul real", async () => {
    const response = await GET(new Request("http://localhost/api/pay-transparency"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-1", "Org Demo")
    expect(payload.records).toEqual([{ id: "salary-1" }])
    expect(payload.latestReport).toEqual({ id: "report-1" })
    expect(payload.findingStatus).toBe("under_monitoring")
  })
})
