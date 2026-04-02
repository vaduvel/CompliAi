import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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
  getOrgContextMock: vi.fn(),
  requireFreshRoleMock: vi.fn(),
  writeStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  writeStateForOrg: mocks.writeStateForOrgMock,
}))

describe("POST /api/state/reset", () => {
  const originalResetKey = process.env.COMPLISCAN_RESET_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    if (originalResetKey === undefined) delete process.env.COMPLISCAN_RESET_KEY
    else process.env.COMPLISCAN_RESET_KEY = originalResetKey
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      email: "owner@site.ro",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 1000,
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-ctx",
      orgName: "Workspace Org",
      workspaceLabel: "Workspace",
      workspaceOwner: "Owner",
      workspaceInitials: "WO",
      userRole: "owner",
    })
    mocks.buildDashboardPayloadMock.mockResolvedValue({ state: { ok: true } })
    mocks.writeStateForOrgMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    if (originalResetKey === undefined) delete process.env.COMPLISCAN_RESET_KEY
    else process.env.COMPLISCAN_RESET_KEY = originalResetKey
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
    expect(mocks.writeStateForOrgMock).toHaveBeenCalledWith("org-1", expect.any(Object), "Org Demo")
  })

  it("permite reset pentru owner autenticat si in productie fara cheie", async () => {
    const response = await POST(
      new Request("https://example.com/api/state/reset", {
        method: "POST",
        headers: { host: "example.com" },
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toContain("Starea a fost resetată")
    expect(mocks.writeStateForOrgMock).toHaveBeenCalledWith("org-1", expect.any(Object), "Org Demo")
  })

  it("respinge resetul pentru rol nepermis", async () => {
    mocks.requireFreshRoleMock.mockImplementationOnce(() => {
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

  it("blocheaza resetul cand cheia furnizata este invalida", async () => {
    process.env.COMPLISCAN_RESET_KEY = "reset-secret"

    const response = await POST(
      new Request("https://example.com/api/state/reset", {
        method: "POST",
        headers: {
          host: "example.com",
          "x-compliscan-reset-key": "gresit",
        },
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("RESET_BLOCKED")
  })
})
