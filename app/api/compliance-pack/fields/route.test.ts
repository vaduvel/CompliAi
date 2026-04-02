import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  buildDashboardPayloadMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  requireFreshRoleMock: vi.fn(),
  resolveOptionalEventActorMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/event-actor", () => ({
  resolveOptionalEventActor: mocks.resolveOptionalEventActorMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

import { POST } from "./route"

describe("POST /api/compliance-pack/fields", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-pack",
      orgName: "Org Pack",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.resolveOptionalEventActorMock.mockResolvedValue({
      id: "user-1",
      label: "owner@example.com",
      role: "owner",
      source: "session",
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "wrong-org",
      orgName: "Wrong Org",
      workspaceLabel: "Wrong Org",
      workspaceOwner: "owner@example.com",
      workspaceInitials: "WO",
      userRole: "owner",
    })
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId: string, updater: (state: Record<string, unknown>) => Record<string, unknown>) => {
      const current = {
        aiSystems: [{ id: "sys-1" }],
        detectedAISystems: [],
        aiComplianceFieldOverrides: {},
        events: [],
      }
      return updater(current)
    })
    mocks.buildDashboardPayloadMock.mockResolvedValue({
      state: { ok: true },
      summary: { score: 88 },
    })
  })

  it("validează payload-ul înainte de mutație", async () => {
    const response = await POST(
      new Request("http://localhost/api/compliance-pack/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "provider", value: "OpenAI" }),
      })
    )

    expect(response.status).toBe(400)
    expect(mocks.mutateStateForOrgMock).not.toHaveBeenCalled()
  })

  it("salvează override-ul pe org-ul din sesiune și construiește payload-ul cu workspace override corect", async () => {
    const response = await POST(
      new Request("http://localhost/api/compliance-pack/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: "sys-1",
          field: "provider",
          value: "OpenAI",
          action: "save",
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toContain("actualizat")
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-pack",
      expect.any(Function),
      "Org Pack"
    )
    expect(mocks.buildDashboardPayloadMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        orgId: "org-pack",
        orgName: "Org Pack",
        userRole: "owner",
      })
    )
  })
})
