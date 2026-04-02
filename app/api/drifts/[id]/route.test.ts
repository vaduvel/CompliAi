import { beforeEach, describe, expect, it, vi } from "vitest"

import { PATCH } from "./route"

type MockDriftState = {
  driftRecords: Array<{
    id: string
    summary: string
    lifecycleStatus: "open" | "acknowledged" | "in_progress" | "resolved" | "waived"
    open: boolean
  }>
  events: unknown[]
}

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
  mutateStateForOrgMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  requireRoleMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

describe("PATCH /api/drifts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "compliance",
      exp: Date.now() + 1000,
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-local-workspace",
      orgName: "Magazin Online S.R.L.",
      workspaceLabel: "Workspace local",
      workspaceOwner: "Ion Popescu",
      workspaceInitials: "IP",
    })
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
  })

  it("respinge actiunile invalide", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/drifts/drift-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invalid" }),
      }),
      { params: Promise.resolve({ id: "drift-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("INVALID_DRIFT_ACTION")
    expect(mocks.mutateStateForOrgMock).not.toHaveBeenCalled()
  })

  it("cere justificare pentru waive", async () => {
    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: MockDriftState) => unknown) =>
      updater({
        driftRecords: [
          {
            id: "drift-1",
            summary: "Provider nou detectat",
            lifecycleStatus: "open",
            open: true,
          },
        ],
        events: [],
      })
    )

    const response = await PATCH(
      new Request("http://localhost/api/drifts/drift-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "waive" }),
      }),
      { params: Promise.resolve({ id: "drift-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("WAIVE_NOTE_REQUIRED")
  })

  it("respinge tranzitiile invalide de lifecycle", async () => {
    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: MockDriftState) => unknown) =>
      updater({
        driftRecords: [
          {
            id: "drift-1",
            summary: "Provider nou detectat",
            lifecycleStatus: "resolved",
            open: false,
          },
        ],
        events: [],
      })
    )

    const response = await PATCH(
      new Request("http://localhost/api/drifts/drift-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      }),
      { params: Promise.resolve({ id: "drift-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.code).toBe("INVALID_DRIFT_TRANSITION")
  })

  it("permite acknowledge pe drift deschis", async () => {
    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: MockDriftState) => unknown) =>
      updater({
        driftRecords: [
          {
            id: "drift-1",
            summary: "Provider nou detectat",
            lifecycleStatus: "open",
            open: true,
          },
        ],
        events: [],
      })
    )

    const response = await PATCH(
      new Request("http://localhost/api/drifts/drift-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acknowledge" }),
      }),
      { params: Promise.resolve({ id: "drift-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toBe("Drift preluat de owner.")
    expect(payload.state.driftRecords[0].lifecycleStatus).toBe("acknowledged")
    expect(payload.state.driftRecords[0].acknowledgedBy).toBe("demo@site.ro (compliance)")
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith("org-1", expect.any(Function), "Org Demo")
  })

  it("respinge waive pentru rol nepermis", async () => {
    mocks.requireRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await PATCH(
      new Request("http://localhost/api/drifts/drift-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "waive", note: "nu este relevant" }),
      }),
      { params: Promise.resolve({ id: "drift-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
