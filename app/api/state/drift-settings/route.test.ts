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
  mutateStateMock: vi.fn(),
  requireRoleMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: mocks.mutateStateMock,
}))

describe("POST /api/state/drift-settings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "compliance@site.ro",
      orgName: "Org Demo",
      role: "compliance",
      exp: Date.now() + 1000,
    })
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
    mocks.mutateStateMock.mockImplementation(async (updater: (state: { driftSettings: object }) => unknown) =>
      updater({ driftSettings: {} })
    )
  })

  it("actualizeaza override-urile valide", async () => {
    const response = await POST(
      new Request("http://localhost/api/state/drift-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          severityOverrides: {
            model_changed: "high",
            purpose_changed: "critical",
            invalid_value: "default",
          },
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toContain("actualizate")
    expect(payload.state.driftSettings.severityOverrides).toEqual({
      model_changed: "high",
      purpose_changed: "critical",
    })
  })

  it("respinge rolul nepermis", async () => {
    mocks.requireRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await POST(
      new Request("http://localhost/api/state/drift-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
