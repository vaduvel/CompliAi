import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createSessionTokenMock: vi.fn(),
  createWorkspacePreferenceTokenMock: vi.fn(),
  findUserByIdMock: vi.fn(),
  findUserByEmailMock: vi.fn(),
  getSessionCookieOptionsMock: vi.fn(),
  getUserModeMock: vi.fn(),
  getWorkspacePreferenceCookieOptionsMock: vi.fn(),
  hashPasswordMock: vi.fn(),
  linkUserToExternalIdentityMock: vi.fn(),
  listUserMembershipsMock: vi.fn(),
  readLastRouteFromRequestMock: vi.fn(),
  readWorkspacePreferenceFromRequestMock: vi.fn(),
  resolveUserForMembershipMock: vi.fn(),
  shouldUseSupabaseAuthMock: vi.fn(),
  signInSupabaseIdentityMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  createSessionToken: mocks.createSessionTokenMock,
  createWorkspacePreferenceToken: mocks.createWorkspacePreferenceTokenMock,
  findUserById: mocks.findUserByIdMock,
  findUserByEmail: mocks.findUserByEmailMock,
  getSessionCookieOptions: mocks.getSessionCookieOptionsMock,
  getUserMode: mocks.getUserModeMock,
  getWorkspacePreferenceCookieOptions: mocks.getWorkspacePreferenceCookieOptionsMock,
  hashPassword: mocks.hashPasswordMock,
  linkUserToExternalIdentity: mocks.linkUserToExternalIdentityMock,
  listUserMemberships: mocks.listUserMembershipsMock,
  readLastRouteFromRequest: mocks.readLastRouteFromRequestMock,
  readWorkspacePreferenceFromRequest: mocks.readWorkspacePreferenceFromRequestMock,
  resolveUserForMembership: mocks.resolveUserForMembershipMock,
  SESSION_COOKIE: "compliscan_session",
  WORKSPACE_PREF_COOKIE: "compliscan_workspace_pref",
}))

vi.mock("@/lib/server/supabase-auth", () => ({
  shouldUseSupabaseAuth: mocks.shouldUseSupabaseAuthMock,
  signInSupabaseIdentity: mocks.signInSupabaseIdentityMock,
}))

import { POST } from "./route"

describe("POST /api/auth/login", () => {
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
    mocks.createSessionTokenMock.mockReturnValue("signed-token")
    mocks.createWorkspacePreferenceTokenMock.mockReturnValue("workspace-pref")
    mocks.shouldUseSupabaseAuthMock.mockReturnValue(false)
    mocks.getUserModeMock.mockResolvedValue("solo")
    mocks.listUserMembershipsMock.mockResolvedValue([])
    mocks.readLastRouteFromRequestMock.mockReturnValue(null)
    mocks.readWorkspacePreferenceFromRequestMock.mockReturnValue(null)
  })

  it("cere email si parola", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "", password: "" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("AUTH_REQUIRED_FIELDS")
  })

  it("respinge credentialele invalide", async () => {
    mocks.findUserByEmailMock.mockResolvedValueOnce(null)

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@site.ro", password: "secret123" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("AUTH_INVALID_CREDENTIALS")
  })

  it("seteaza cookie-ul pentru sesiune valida", async () => {
    mocks.findUserByEmailMock.mockResolvedValueOnce({
      id: "user-1",
      email: "demo@site.ro",
      passwordHash: "hashed",
      salt: "salt",
      authProvider: "local",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
    })
    mocks.hashPasswordMock.mockReturnValueOnce("hashed")

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@site.ro", password: "secret123" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.orgId).toBe("org-1")
    expect(payload.role).toBe("owner")
    expect(payload.destination).toBe("/dashboard")
    expect(response.headers.get("set-cookie")).toContain("compliscan_session=signed-token")
    expect(response.headers.get("set-cookie")).toContain("compliscan_workspace_pref=workspace-pref")
    expect(mocks.createSessionTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "owner", workspaceMode: "org" })
    )
  })

  it("restaureaza org-ul preferat daca userul are membership activ acolo", async () => {
    mocks.findUserByEmailMock.mockResolvedValueOnce({
      id: "user-1",
      email: "demo@site.ro",
      passwordHash: "hashed",
      salt: "salt",
      authProvider: "local",
      orgId: "org-default",
      orgName: "Org Default",
      role: "owner",
      membershipId: "membership-default",
    })
    mocks.hashPasswordMock.mockReturnValueOnce("hashed")
    mocks.getUserModeMock.mockResolvedValueOnce("partner")
    mocks.readWorkspacePreferenceFromRequestMock.mockReturnValueOnce({
      orgId: "org-client",
      workspaceMode: "portfolio",
    })
    mocks.listUserMembershipsMock.mockResolvedValueOnce([
      {
        membershipId: "membership-client",
        orgId: "org-client",
        orgName: "Org Client",
        role: "partner_manager",
        status: "active",
      },
    ])
    mocks.resolveUserForMembershipMock.mockResolvedValueOnce({
      id: "user-1",
      email: "demo@site.ro",
      orgId: "org-client",
      orgName: "Org Client",
      role: "partner_manager",
      membershipId: "membership-client",
    })

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@site.ro", password: "secret123" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.orgId).toBe("org-client")
    expect(payload.workspaceMode).toBe("portfolio")
    expect(payload.destination).toBe("/portfolio")
    expect(mocks.resolveUserForMembershipMock).toHaveBeenCalledWith("user-1", "membership-client")
    expect(mocks.createSessionTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "org-client", workspaceMode: "portfolio" })
    )
  })

  it("folosește ultima rută salvată dacă nu există next explicit", async () => {
    mocks.findUserByEmailMock.mockResolvedValueOnce({
      id: "user-1",
      email: "demo@site.ro",
      passwordHash: "hashed",
      salt: "salt",
      authProvider: "local",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
      membershipId: "membership-1",
    })
    mocks.hashPasswordMock.mockReturnValueOnce("hashed")
    mocks.readLastRouteFromRequestMock.mockReturnValueOnce("/dashboard/resolve/finding-123")

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@site.ro", password: "secret123" }),
      })
    )

    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.destination).toBe("/dashboard/resolve/finding-123")
  })

  it("preferă next explicit din request față de ultima rută", async () => {
    mocks.findUserByEmailMock.mockResolvedValueOnce({
      id: "user-1",
      email: "demo@site.ro",
      passwordHash: "hashed",
      salt: "salt",
      authProvider: "local",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
      membershipId: "membership-1",
    })
    mocks.hashPasswordMock.mockReturnValueOnce("hashed")
    mocks.readLastRouteFromRequestMock.mockReturnValueOnce("/dashboard/resolve/finding-123")

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@site.ro",
          password: "secret123",
          next: "/dashboard/fiscal?tab=transmitere",
        }),
      })
    )

    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.destination).toBe("/dashboard/fiscal?tab=transmitere")
  })

  it("foloseste Supabase Auth pentru user migrat", async () => {
    mocks.findUserByEmailMock.mockResolvedValueOnce({
      id: "legacy-user",
      email: "demo@site.ro",
      passwordHash: "",
      salt: "",
      authProvider: "supabase",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
      membershipId: "membership-1",
    })
    mocks.shouldUseSupabaseAuthMock.mockReturnValueOnce(true)
    mocks.signInSupabaseIdentityMock.mockResolvedValueOnce({
      id: "supabase-user-1",
      email: "demo@site.ro",
    })
    mocks.findUserByIdMock.mockResolvedValueOnce(null)
    mocks.linkUserToExternalIdentityMock.mockResolvedValueOnce({
      id: "supabase-user-1",
      email: "demo@site.ro",
      passwordHash: "",
      salt: "",
      authProvider: "supabase",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
      membershipId: "membership-1",
    })

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@site.ro", password: "secret123" }),
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.signInSupabaseIdentityMock).toHaveBeenCalledWith("demo@site.ro", "secret123")
    expect(mocks.linkUserToExternalIdentityMock).toHaveBeenCalledWith(
      "demo@site.ro",
      "supabase-user-1",
      "supabase"
    )
  })

  it("intoarce eroare clara daca identitatea nu este mapata in CompliScan", async () => {
    mocks.findUserByEmailMock.mockResolvedValueOnce(null)
    mocks.shouldUseSupabaseAuthMock.mockReturnValueOnce(true)
    mocks.signInSupabaseIdentityMock.mockResolvedValueOnce({
      id: "supabase-user-1",
      email: "demo@site.ro",
    })
    mocks.findUserByIdMock.mockResolvedValueOnce(null)
    mocks.linkUserToExternalIdentityMock.mockRejectedValueOnce(new Error("USER_NOT_FOUND"))

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@site.ro", password: "secret123" }),
      })
    )

    const payload = await response.json()
    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_IDENTITY_NOT_MAPPED")
  })

  it("mapeaza erorile neasteptate ca AUTH_LOGIN_FAILED", async () => {
    mocks.findUserByEmailMock.mockRejectedValueOnce(new Error("users store unavailable"))

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@site.ro", password: "secret123" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.code).toBe("AUTH_LOGIN_FAILED")
  })
})
