import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

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
  buildDashboardPayloadMock: vi.fn(),
  requireRoleMock: vi.fn(),
  writeStateMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  writeState: mocks.writeStateMock,
}))

describe("POST /api/state/reset", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "owner@site.ro",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 1000,
    })
    mocks.buildDashboardPayloadMock.mockResolvedValue({ state: { ok: true } })
    mocks.writeStateMock.mockResolvedValue(undefined)
  })

  it("permite reset pentru owner local", async () => {
    const response = await POST(
      new Request("http://localhost/api/state/reset", {
        method: "POST",
        headers: { host: "localhost:3000" },
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toContain("Starea a fost resetată")
    expect(mocks.writeStateMock).toHaveBeenCalledTimes(1)
  })

  it("respinge resetul pentru rol nepermis", async () => {
    mocks.requireRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await POST(
      new Request("http://localhost/api/state/reset", {
        method: "POST",
        headers: { host: "localhost:3000" },
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })

  it("blocheaza resetul in afara localhost fara cheie", async () => {
    const response = await POST(
      new Request("https://example.com/api/state/reset", {
        method: "POST",
        headers: { host: "example.com" },
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("RESET_BLOCKED")
  })
})
