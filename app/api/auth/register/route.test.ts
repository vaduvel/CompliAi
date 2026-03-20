import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createSessionTokenMock: vi.fn(),
  getSessionCookieOptionsMock: vi.fn(),
  registerUserMock: vi.fn(),
  registerSupabaseIdentityMock: vi.fn(),
  shouldUseSupabaseAuthMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  createSessionToken: mocks.createSessionTokenMock,
  getSessionCookieOptions: mocks.getSessionCookieOptionsMock,
  registerUser: mocks.registerUserMock,
  SESSION_COOKIE: "compliscan_session",
}))

vi.mock("@/lib/server/supabase-auth", () => ({
  registerSupabaseIdentity: mocks.registerSupabaseIdentityMock,
  shouldUseSupabaseAuth: mocks.shouldUseSupabaseAuthMock,
}))

import { POST } from "./route"

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSessionCookieOptionsMock.mockReturnValue({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    })
    mocks.createSessionTokenMock.mockReturnValue("signed-token")
    mocks.shouldUseSupabaseAuthMock.mockReturnValue(false)
  })

  it("cere email si parola", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "", password: "" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("AUTH_REQUIRED_FIELDS")
  })

  it("respinge parolele prea scurte", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nou@site.ro", password: "1234567" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("AUTH_PASSWORD_TOO_SHORT")
  })

  it("seteaza sesiunea pentru user nou", async () => {
    mocks.registerUserMock.mockResolvedValueOnce({
      id: "user-2",
      email: "nou@site.ro",
      orgId: "org-2",
      orgName: "Org Nou",
      role: "owner",
      membershipId: "membership-2",
    })

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nou@site.ro",
          password: "secret123",
          orgName: "Org Nou",
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.orgName).toBe("Org Nou")
    expect(payload.role).toBe("owner")
    expect(response.headers.get("set-cookie")).toContain("compliscan_session=signed-token")
    expect(mocks.createSessionTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "owner" })
    )
  })

  it("creeaza identitatea in Supabase cand backend-ul o cere", async () => {
    mocks.shouldUseSupabaseAuthMock.mockReturnValueOnce(true)
    mocks.registerSupabaseIdentityMock.mockResolvedValueOnce({
      id: "supabase-user-2",
      email: "nou@site.ro",
    })
    mocks.registerUserMock.mockResolvedValueOnce({
      id: "supabase-user-2",
      email: "nou@site.ro",
      orgId: "org-2",
      orgName: "Org Nou",
      role: "owner",
      membershipId: "membership-2",
    })

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nou@site.ro",
          password: "secret123",
          orgName: "Org Nou",
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.registerSupabaseIdentityMock).toHaveBeenCalledWith("nou@site.ro", "secret123")
    expect(mocks.registerUserMock).toHaveBeenCalledWith("nou@site.ro", "secret123", "Org Nou", {
      externalUserId: "supabase-user-2",
      authProvider: "supabase",
    })
  })

  it("mapeaza erorile din register", async () => {
    mocks.registerUserMock.mockRejectedValueOnce(new Error("Adresa de email este deja inregistrata."))

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nou@site.ro",
          password: "secret123",
          orgName: "Org Nou",
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("AUTH_EMAIL_ALREADY_REGISTERED")
  })
})
