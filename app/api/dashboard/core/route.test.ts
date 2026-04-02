import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorClass: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  buildDashboardCorePayloadMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorClass,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardCorePayload: mocks.buildDashboardCorePayloadMock,
}))

import { GET } from "./route"

describe("GET /api/dashboard/core", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      orgId: "org-session",
      orgName: "Session Org",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "wrong-org",
      orgName: "Wrong Org",
      workspaceLabel: "Workspace",
      workspaceOwner: "wrong@example.com",
      workspaceInitials: "WO",
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue({ findings: [] })
    mocks.buildDashboardCorePayloadMock.mockResolvedValue({
      workspace: { orgId: "org-session", orgName: "Session Org" },
      summary: { score: 91 },
    })
  })

  it("citește rezumatul pe org-ul sesiunii", async () => {
    const response = await GET(new Request("http://localhost/api/dashboard/core"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-session", "Session Org")
    expect(mocks.buildDashboardCorePayloadMock).toHaveBeenCalledWith(
      { findings: [] },
      expect.objectContaining({
        orgId: "org-session",
        orgName: "Session Org",
        workspaceOwner: "owner@example.com",
      })
    )
    expect(body.summary.score).toBe(91)
  })

  it("refuză accesul fără sesiune activă", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorClass("Ai nevoie de sesiune activa.")
    )

    const response = await GET(new Request("http://localhost/api/dashboard/core"))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.code).toBe("AUTH_SESSION_REQUIRED")
  })
})
