import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createResetTokenMock: vi.fn(),
  createSupabaseRecoveryLinkMock: vi.fn(),
  findUserByEmailMock: vi.fn(),
  shouldUseSupabaseAuthMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  findUserByEmail: mocks.findUserByEmailMock,
}))

vi.mock("@/lib/server/reset-tokens", () => ({
  createResetToken: mocks.createResetTokenMock,
}))

vi.mock("@/lib/server/supabase-auth", () => ({
  createSupabaseRecoveryLink: mocks.createSupabaseRecoveryLinkMock,
  shouldUseSupabaseAuth: mocks.shouldUseSupabaseAuthMock,
}))

import { POST } from "./route"

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.shouldUseSupabaseAuthMock.mockReturnValue(false)
  })

  it("cere email", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("AUTH_REQUIRED_FIELDS")
  })

  it("intoarce succes generic chiar daca userul nu exista", async () => {
    mocks.findUserByEmailMock.mockResolvedValueOnce(null)

    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nou@site.ro" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(mocks.createResetTokenMock).not.toHaveBeenCalled()
    expect(mocks.createSupabaseRecoveryLinkMock).not.toHaveBeenCalled()
  })

  it("foloseste recovery link din Supabase pentru userii cloud", async () => {
    mocks.findUserByEmailMock.mockResolvedValueOnce({
      email: "cloud@site.ro",
      authProvider: "supabase",
    })
    mocks.shouldUseSupabaseAuthMock.mockReturnValueOnce(true)
    mocks.createSupabaseRecoveryLinkMock.mockResolvedValueOnce(
      "https://example.com/reset"
    )

    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "cloud@site.ro" }),
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.createSupabaseRecoveryLinkMock).toHaveBeenCalledWith(
      "cloud@site.ro",
      expect.stringContaining("/reset-password")
    )
    expect(mocks.createResetTokenMock).not.toHaveBeenCalled()
  })

  it("pastreaza tokenul local doar pentru fallback local", async () => {
    mocks.findUserByEmailMock.mockResolvedValueOnce({
      email: "local@site.ro",
      authProvider: "local",
    })
    mocks.createResetTokenMock.mockResolvedValueOnce("token-local")

    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "local@site.ro" }),
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.createResetTokenMock).toHaveBeenCalledWith("local@site.ro")
    expect(mocks.createSupabaseRecoveryLinkMock).not.toHaveBeenCalled()
  })
})
