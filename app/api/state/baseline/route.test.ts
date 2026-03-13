import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

type MockBaselineState = {
  snapshotHistory: Array<{ snapshotId: string }>
  events: unknown[]
  validatedBaselineSnapshotId?: string
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
  buildDashboardPayloadMock: vi.fn(),
  mutateStateMock: vi.fn(),
  requireRoleMock: vi.fn(),
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: mocks.mutateStateMock,
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

describe("POST /api/state/baseline", () => {
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
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
  })

  it("respinge set daca nu exista snapshot", async () => {
    mocks.mutateStateMock.mockImplementationOnce(async (updater: (state: MockBaselineState) => unknown) =>
      updater({
        snapshotHistory: [],
        events: [],
      })
    )

    const response = await POST(
      new Request("http://localhost/api/state/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toContain("cel putin un snapshot real")
  })

  it("seteaza baseline-ul pe snapshot-ul curent", async () => {
    mocks.mutateStateMock.mockImplementationOnce(async (updater: (state: MockBaselineState) => unknown) =>
      updater({
        snapshotHistory: [{ snapshotId: "snap-1" }],
        events: [],
      })
    )

    const response = await POST(
      new Request("http://localhost/api/state/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toContain("salvat ca baseline validat")
    expect(payload.state.validatedBaselineSnapshotId).toBe("snap-1")
  })

  it("permite clear pentru baseline-ul validat", async () => {
    mocks.mutateStateMock.mockImplementationOnce(async (updater: (state: MockBaselineState) => unknown) =>
      updater({
        snapshotHistory: [{ snapshotId: "snap-1" }],
        validatedBaselineSnapshotId: "snap-1",
        events: [],
      })
    )

    const response = await POST(
      new Request("http://localhost/api/state/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toContain("a fost eliminat")
    expect(payload.state.validatedBaselineSnapshotId).toBeUndefined()
  })

  it("respinge accesul pentru rol nepermis", async () => {
    mocks.requireRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await POST(
      new Request("http://localhost/api/state/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
