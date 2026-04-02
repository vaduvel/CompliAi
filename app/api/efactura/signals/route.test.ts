import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readSessionFromRequestMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  getAnafModeMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  readSessionFromRequest: mocks.readSessionFromRequestMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/efactura-anaf-client", () => ({
  getAnafMode: mocks.getAnafModeMock,
}))

import { GET, POST } from "./route"

describe("/api/efactura/signals", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readStateForOrgMock.mockResolvedValue({
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
    expect(mocks.readStateForOrgMock).toHaveBeenCalledWith("org-1")
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
})
