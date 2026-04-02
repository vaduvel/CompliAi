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
  mutateStateForOrgMock: vi.fn(),
  requireFreshRoleMock: vi.fn(),
  writePolicyAcknowledgmentMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/policy-store", () => ({
  writePolicyAcknowledgment: mocks.writePolicyAcknowledgmentMock,
}))

import { POST } from "./route"

describe("POST /api/policies/acknowledge", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "compliance",
      exp: Date.now() + 1000,
    })
    mocks.writePolicyAcknowledgmentMock.mockResolvedValue([
      { policyId: "privacy-policy", acknowledgedBy: "demo@site.ro" },
    ])
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId: string, updater: (state: { events: unknown[] }) => unknown) =>
      updater({ events: [] })
    )
  })

  it("salvează confirmarea pentru org-ul din sesiune", async () => {
    const response = await POST(
      new Request("http://localhost/api/policies/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId: "privacy-policy" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.acknowledgments).toHaveLength(1)
    expect(mocks.writePolicyAcknowledgmentMock).toHaveBeenCalledWith(
      "org-1",
      "privacy-policy",
      "demo@site.ro"
    )
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith("org-1", expect.any(Function), "Org Demo")
  })

  it("respinge lipsa policyId", async () => {
    const response = await POST(
      new Request("http://localhost/api/policies/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("POLICY_ID_REQUIRED")
  })
})
