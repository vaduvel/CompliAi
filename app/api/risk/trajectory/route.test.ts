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
  requireFreshRoleMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  getAgentLogMock: vi.fn(),
  calculateRiskTrajectoryMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

vi.mock("@/lib/server/agent-run-store", () => ({
  getAgentLog: mocks.getAgentLogMock,
}))

vi.mock("@/lib/compliance/risk-trajectory", () => ({
  calculateRiskTrajectory: mocks.calculateRiskTrajectoryMock,
}))

import { GET } from "./route"

describe("GET /api/risk/trajectory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-risk",
      orgName: "Org Risk",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue({ findings: [] })
    mocks.getAgentLogMock.mockResolvedValue([])
    mocks.calculateRiskTrajectoryMock.mockReturnValue({
      currentScore: 72,
      currentOpenFindings: 3,
      trajectory: [],
      iminentRisks: [],
      trend: "stable",
      summaryLabel: "Stabil",
    })
  })

  it("citește starea și logul agentului din org-ul explicit al sesiunii", async () => {
    const response = await GET(new Request("http://localhost/api/risk/trajectory"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-risk", "Org Risk")
    expect(mocks.getAgentLogMock).toHaveBeenCalledWith("org-risk")
    expect(payload.summaryLabel).toBe("Stabil")
  })

  it("propagă erorile de autorizare coerent", async () => {
    mocks.requireFreshRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Interzis", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await GET(new Request("http://localhost/api/risk/trajectory"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
