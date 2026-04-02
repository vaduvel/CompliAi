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
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

import { DELETE, GET, POST } from "./route"

describe("org knowledge route", () => {
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
      orgKnowledge: {
        items: [{ id: "k-1", category: "ai-tool", value: "ChatGPT", source: "manual", sourceLabel: "Manual" }],
        lastUpdatedAtISO: "2026-04-02T10:00:00.000Z",
      },
    })
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId, updater, _orgName) =>
      updater({ orgKnowledge: { items: [], lastUpdatedAtISO: "2026-04-02T10:00:00.000Z" } })
    )
  })

  it("citește cunoștințele din org-ul activ", async () => {
    const response = await GET(new Request("http://localhost/api/org-knowledge"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-1", "Org Demo")
    expect(payload.knowledge.items).toHaveLength(1)
  })

  it("persistă items în org-ul activ", async () => {
    const response = await POST(
      new Request("http://localhost/api/org-knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ category: "ai-tool", value: "Copilot", source: "manual" }],
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith("org-1", expect.any(Function), "Org Demo")
  })

  it("șterge itemul din org-ul activ", async () => {
    const response = await DELETE(new Request("http://localhost/api/org-knowledge?id=k-1", { method: "DELETE" }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith("org-1", expect.any(Function), "Org Demo")
  })
})
