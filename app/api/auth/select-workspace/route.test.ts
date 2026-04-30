import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createSessionTokenMock: vi.fn(),
  createWorkspacePreferenceTokenMock: vi.fn(),
  getSessionCookieOptionsMock: vi.fn(),
  getWorkspacePreferenceCookieOptionsMock: vi.fn(),
  listUserMembershipsMock: vi.fn(),
  readSessionFromRequestMock: vi.fn(),
  resolveUserModeMock: vi.fn(),
  resolveUserForMembershipMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  createSessionToken: mocks.createSessionTokenMock,
  createWorkspacePreferenceToken: mocks.createWorkspacePreferenceTokenMock,
  getSessionCookieOptions: mocks.getSessionCookieOptionsMock,
  getWorkspacePreferenceCookieOptions: mocks.getWorkspacePreferenceCookieOptionsMock,
  listUserMemberships: mocks.listUserMembershipsMock,
  readSessionFromRequest: mocks.readSessionFromRequestMock,
  resolveUserMode: mocks.resolveUserModeMock,
  resolveUserForMembership: mocks.resolveUserForMembershipMock,
  SESSION_COOKIE: "compliscan_session",
  WORKSPACE_PREF_COOKIE: "compliscan_workspace_pref",
}))

import { POST } from "./route"

describe("POST /api/auth/select-workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSessionCookieOptionsMock.mockReturnValue({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    })
    mocks.getWorkspacePreferenceCookieOptionsMock.mockReturnValue({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    })
    mocks.createSessionTokenMock.mockReturnValue("new-signed-token")
    mocks.createWorkspacePreferenceTokenMock.mockReturnValue("workspace-pref")
    mocks.listUserMembershipsMock.mockResolvedValue([
      {
        membershipId: "membership-owner",
        orgId: "org-cabinet",
        orgName: "Cabinet Elena",
        role: "owner",
        status: "active",
      },
      {
        membershipId: "membership-1",
        orgId: "org-1",
        orgName: "Client activ SRL",
        role: "partner_manager",
        status: "active",
      },
    ])
    mocks.resolveUserForMembershipMock.mockResolvedValue({
      id: "user-1",
      orgId: "org-cabinet",
      email: "partner@site.ro",
      orgName: "Cabinet Elena",
      role: "owner",
      membershipId: "membership-owner",
    })
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "partner@site.ro",
      orgName: "Client activ SRL",
      role: "partner_manager",
      membershipId: "membership-1",
      workspaceMode: "org",
      exp: Date.now() + 60_000,
    })
  })

  it("returneaza 401 fara sesiune", async () => {
    mocks.readSessionFromRequestMock.mockReturnValue(null)

    const response = await POST(
      new Request("http://localhost/api/auth/select-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceMode: "portfolio" }),
      })
    )

    expect(response.status).toBe(401)
  })

  it("returneaza 400 pentru workspaceMode invalid", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/select-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceMode: "invalid" }),
      })
    )

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.code).toBe("INVALID_WORKSPACE_MODE")
  })

  it("activeaza portfolio pentru user cu userMode partner", async () => {
    mocks.resolveUserModeMock.mockResolvedValue("partner")

    const response = await POST(
      new Request("http://localhost/api/auth/select-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceMode: "portfolio" }),
      })
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.ok).toBe(true)
    expect(payload.workspaceMode).toBe("portfolio")
    expect(payload.orgId).toBe("org-cabinet")
    expect(payload.role).toBe("owner")
    expect(mocks.createSessionTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceMode: "portfolio",
        orgId: "org-cabinet",
        role: "owner",
        membershipId: "membership-owner",
      })
    )
  })

  it("revine in portfolio pe workspace-ul cabinetului cand sesiunea curenta este pe client", async () => {
    mocks.resolveUserModeMock.mockResolvedValue("partner")

    const response = await POST(
      new Request("http://localhost/api/auth/select-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceMode: "portfolio" }),
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.resolveUserForMembershipMock).toHaveBeenCalledWith("user-1", "membership-owner")
    expect(mocks.createWorkspacePreferenceTokenMock).toHaveBeenCalledWith({
      orgId: "org-cabinet",
      workspaceMode: "portfolio",
    })
  })

  it("blocheaza portfolio pentru user non-partner", async () => {
    mocks.resolveUserModeMock.mockResolvedValue("solo")

    const response = await POST(
      new Request("http://localhost/api/auth/select-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceMode: "portfolio" }),
      })
    )

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.code).toBe("WORKSPACE_PORTFOLIO_FORBIDDEN")
  })

  it("activeaza org mode cu orgId valid", async () => {
    mocks.listUserMembershipsMock.mockResolvedValue([
      {
        membershipId: "membership-2",
        orgId: "org-client",
        orgName: "Client SRL",
        role: "partner_manager",
        status: "active",
      },
    ])
    mocks.resolveUserForMembershipMock.mockResolvedValue({
      id: "user-1",
      orgId: "org-client",
      email: "partner@site.ro",
      orgName: "Client SRL",
      role: "partner_manager",
      membershipId: "membership-2",
    })

    const response = await POST(
      new Request("http://localhost/api/auth/select-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceMode: "org", orgId: "org-client" }),
      })
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.ok).toBe(true)
    expect(payload.workspaceMode).toBe("org")
    expect(payload.orgId).toBe("org-client")
    expect(mocks.createSessionTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceMode: "org", orgId: "org-client" })
    )
  })

  it("returneaza 400 pentru org mode fara orgId", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/select-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceMode: "org" }),
      })
    )

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.code).toBe("WORKSPACE_ORG_ID_REQUIRED")
  })

  it("returneaza 403 pentru org fara membership", async () => {
    mocks.listUserMembershipsMock.mockResolvedValue([])

    const response = await POST(
      new Request("http://localhost/api/auth/select-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceMode: "org", orgId: "org-unknown" }),
      })
    )

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.code).toBe("WORKSPACE_ORG_NOT_MEMBER")
  })
})
