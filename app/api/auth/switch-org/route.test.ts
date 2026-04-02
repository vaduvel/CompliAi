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
  requireFreshAuthenticatedSessionMock: vi.fn(),
  resolveUserForMembershipMock: vi.fn(),
  createSessionTokenMock: vi.fn(),
  createWorkspacePreferenceTokenMock: vi.fn(),
  getSessionCookieOptionsMock: vi.fn(),
  getWorkspacePreferenceCookieOptionsMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  SESSION_COOKIE: "compliscan_session",
  WORKSPACE_PREF_COOKIE: "compliscan_workspace_pref",
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
  resolveUserForMembership: mocks.resolveUserForMembershipMock,
  createSessionToken: mocks.createSessionTokenMock,
  createWorkspacePreferenceToken: mocks.createWorkspacePreferenceTokenMock,
  getSessionCookieOptions: mocks.getSessionCookieOptionsMock,
  getWorkspacePreferenceCookieOptions: mocks.getWorkspacePreferenceCookieOptionsMock,
}))

import { POST } from "./route"

describe("POST /api/auth/switch-org", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Alpha",
      email: "owner@site.ro",
      role: "owner",
      membershipId: "membership-1",
    })
    mocks.resolveUserForMembershipMock.mockResolvedValue({
      id: "user-1",
      email: "owner@site.ro",
      orgId: "org-2",
      orgName: "Org Beta",
      role: "reviewer",
      membershipId: "membership-2",
    })
    mocks.createSessionTokenMock.mockReturnValue("signed-token")
    mocks.createWorkspacePreferenceTokenMock.mockReturnValue("workspace-pref")
    mocks.getSessionCookieOptionsMock.mockReturnValue({ path: "/", httpOnly: true })
    mocks.getWorkspacePreferenceCookieOptionsMock.mockReturnValue({ path: "/", httpOnly: true })
  })

  it("schimba organizatia activa si rescrie sesiunea", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: "membership-2" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.orgId).toBe("org-2")
    expect(payload.membershipId).toBe("membership-2")
    expect(mocks.resolveUserForMembershipMock).toHaveBeenCalledWith("user-1", "membership-2")
    expect(mocks.createSessionTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceMode: "org" })
    )
    expect(response.headers.get("set-cookie")).toContain("compliscan_session=signed-token")
  })

  it("respinge membership inexistent", async () => {
    mocks.resolveUserForMembershipMock.mockRejectedValueOnce(new Error("MEMBERSHIP_NOT_FOUND"))

    const response = await POST(
      new Request("http://localhost/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: "membership-missing" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.code).toBe("AUTH_MEMBERSHIP_NOT_FOUND")
  })
})
