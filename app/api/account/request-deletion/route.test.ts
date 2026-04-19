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
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

import { POST } from "./route"

describe("POST /api/account/request-deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
  })

  it("înregistrează cererea pentru owner-ul autenticat", async () => {
    const response = await POST(
      new Request("http://localhost/api/account/request-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Nu mai folosim workspace-ul." }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.message).toContain("Cererea ta de ștergere")
  })

  it("propagă eroarea de autorizare", async () => {
    mocks.requireFreshRoleMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    )

    const response = await POST(
      new Request("http://localhost/api/account/request-deletion", {
        method: "POST",
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
