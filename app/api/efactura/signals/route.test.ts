import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  getAnafModeMock: vi.fn(),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "UNAUTHORIZED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/efactura-anaf-client", () => ({
  getAnafMode: mocks.getAnafModeMock,
}))

import { GET, POST } from "./route"

describe("/api/efactura/signals", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      efacturaConnected: true,
      efacturaSyncedAtISO: "2026-04-02T10:00:00.000Z",
    })
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId, updater) =>
      updater({
        findings: [],
      })
    )
    mocks.getAnafModeMock.mockReturnValue("test")
  })

  it("citeste semnalele pe org-ul din sesiune", async () => {
    const response = await GET(new Request("http://localhost/api/efactura/signals"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-1", "Org Demo")
    expect(payload.connected).toBe(true)
    expect(payload.sandbox).toBe(true)
  })

  it("genereaza findings pe org-ul din sesiune", async () => {
    const response = await POST(new Request("http://localhost/api/efactura/signals", { method: "POST" }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
    expect(typeof payload.generated).toBe("number")
  })

  it("propaga 401 când lipsește sesiunea fresh", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Autentificare necesară.", 401, "UNAUTHORIZED")
    )

    const response = await GET(new Request("http://localhost/api/efactura/signals"))

    expect(response.status).toBe(401)
  })
})
