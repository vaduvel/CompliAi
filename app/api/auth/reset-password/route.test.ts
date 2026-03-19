import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  consumeResetTokenMock: vi.fn(),
  createSessionTokenMock: vi.fn(),
  findUserByEmailMock: vi.fn(),
  findUserByIdMock: vi.fn(),
  getSessionCookieOptionsMock: vi.fn(),
  hashPasswordMock: vi.fn(),
  linkUserToExternalIdentityMock: vi.fn(),
  readFileMock: vi.fn(),
  updateSupabasePasswordWithAccessTokenMock: vi.fn(),
  writeFileSafeMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  createSessionToken: mocks.createSessionTokenMock,
  findUserByEmail: mocks.findUserByEmailMock,
  findUserById: mocks.findUserByIdMock,
  getSessionCookieOptions: mocks.getSessionCookieOptionsMock,
  hashPassword: mocks.hashPasswordMock,
  linkUserToExternalIdentity: mocks.linkUserToExternalIdentityMock,
  SESSION_COOKIE: "compliscan_session",
}))

vi.mock("@/lib/server/reset-tokens", () => ({
  consumeResetToken: mocks.consumeResetTokenMock,
}))

vi.mock("@/lib/server/fs-safe", () => ({
  writeFileSafe: mocks.writeFileSafeMock,
}))

vi.mock("node:fs", () => ({
  promises: {
    readFile: mocks.readFileMock,
  },
}))

vi.mock("@/lib/server/supabase-auth", () => ({
  updateSupabasePasswordWithAccessToken:
    mocks.updateSupabasePasswordWithAccessTokenMock,
}))

import { POST } from "./route"

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSessionCookieOptionsMock.mockReturnValue({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    })
    mocks.createSessionTokenMock.mockReturnValue("signed-token")
  })

  it("cere token sau access token si parola", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("AUTH_REQUIRED_FIELDS")
  })

  it("reseteaza parola prin access token Supabase si recreeaza sesiunea", async () => {
    mocks.updateSupabasePasswordWithAccessTokenMock.mockResolvedValueOnce({
      id: "supabase-user-1",
      email: "demo@site.ro",
    })
    mocks.findUserByIdMock.mockResolvedValueOnce({
      id: "supabase-user-1",
      email: "demo@site.ro",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
      membershipId: "membership-1",
    })

    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: "access-token",
          password: "ParolaNoua123",
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(mocks.updateSupabasePasswordWithAccessTokenMock).toHaveBeenCalledWith(
      "access-token",
      "ParolaNoua123"
    )
    expect(response.headers.get("set-cookie")).toContain(
      "compliscan_session=signed-token"
    )
  })

  it("intoarce invalid token pentru recovery session expirata", async () => {
    mocks.updateSupabasePasswordWithAccessTokenMock.mockRejectedValueOnce(
      new Error("AUTH_INVALID_RECOVERY_SESSION")
    )

    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: "expired-token",
          password: "ParolaNoua123",
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("AUTH_RESET_TOKEN_INVALID")
  })

  it("pastreaza fallback-ul local pentru tokenurile vechi", async () => {
    mocks.consumeResetTokenMock.mockResolvedValueOnce({ email: "local@site.ro" })
    mocks.findUserByEmailMock.mockResolvedValueOnce({
      id: "user-local",
      email: "local@site.ro",
      orgId: "org-local",
      orgName: "Org Local",
      role: "owner",
      membershipId: "membership-local",
    })
    mocks.readFileMock.mockResolvedValueOnce(
      JSON.stringify([
        {
          id: "user-local",
          email: "local@site.ro",
          salt: "old-salt",
          passwordHash: "old-hash",
        },
      ])
    )
    mocks.hashPasswordMock.mockReturnValueOnce("hashed-password")
    mocks.writeFileSafeMock.mockResolvedValueOnce(true)

    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "legacy-token",
          password: "ParolaNoua123",
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.updateSupabasePasswordWithAccessTokenMock).not.toHaveBeenCalled()
    expect(mocks.writeFileSafeMock).toHaveBeenCalled()
  })
})
