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
  mutateStateForOrgMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  scoreAssessmentMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/compliance/ai-conformity-assessment", () => ({
  scoreAssessment: mocks.scoreAssessmentMock,
}))

import { GET, POST } from "./route"

describe("/api/ai-conformity", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-ai",
      orgName: "Org AI",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      aiComplianceFieldOverrides: {
        "sys-1": {
          conformity_assessment: {
            value: JSON.stringify({ humanOversight: "yes" }),
          },
        },
      },
    })
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId, updater, orgName) =>
      updater({
        aiComplianceFieldOverrides: {},
        orgName,
      })
    )
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-fallback",
      orgName: "Workspace fallback",
      workspaceLabel: "Workspace local",
      workspaceOwner: "Owner",
      workspaceInitials: "OW",
      userRole: "viewer",
    })
    mocks.buildDashboardPayloadMock.mockResolvedValue({
      state: { ok: true },
      workspace: { orgName: "Org AI" },
    })
    mocks.scoreAssessmentMock.mockReturnValue({ score: 64, label: "medium" })
  })

  it("citește evaluarea din org-ul explicit al sesiunii", async () => {
    const response = await GET(new Request("http://localhost/api/ai-conformity?systemId=sys-1"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-ai", "Org AI")
    expect(payload.systemId).toBe("sys-1")
    expect(payload.result).toEqual({ score: 64, label: "medium" })
  })

  it("salvează evaluarea și construiește payload-ul cu workspace override corect", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai-conformity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: "sys-1",
          answers: { humanOversight: "yes" },
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-ai",
      expect.any(Function),
      "Org AI"
    )
    expect(mocks.buildDashboardPayloadMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        orgId: "org-ai",
        orgName: "Org AI",
        userRole: "owner",
      })
    )
    expect(payload.systemId).toBe("sys-1")
  })
})
