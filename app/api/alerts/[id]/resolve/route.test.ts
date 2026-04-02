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
  buildDashboardPayloadMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  requireRoleMock: vi.fn(),
  resolveOptionalEventActorMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/event-actor", () => ({
  resolveOptionalEventActor: mocks.resolveOptionalEventActorMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

import { PATCH } from "./route"

describe("PATCH /api/alerts/[id]/resolve", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "reviewer",
      exp: Date.now() + 1000,
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-ctx",
      orgName: "Workspace Org",
      workspaceLabel: "Workspace",
      workspaceOwner: "Owner",
      workspaceInitials: "WO",
      userRole: "reviewer",
    })
    mocks.resolveOptionalEventActorMock.mockResolvedValue({
      actorId: "user-1",
      actorLabel: "Ion Popescu",
      actorRole: "reviewer",
      actorSource: "session",
    })
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId: string, updater: (state: { alerts: Array<{ id: string; open: boolean }>; events: unknown[] }) => unknown) =>
      updater({
        alerts: [{ id: "alert-1", open: true }],
        events: [],
      })
    )
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
  })

  it("rezolvă alerta în org-ul sesiunii", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/alerts/alert-1/resolve", { method: "PATCH" }),
      { params: Promise.resolve({ id: "alert-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.state.alerts[0].open).toBe(false)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith("org-1", expect.any(Function), "Org Demo")
  })
})
