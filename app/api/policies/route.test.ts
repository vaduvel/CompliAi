import { beforeEach, describe, expect, it, vi } from "vitest"

const requireFreshRole = vi.fn()
const readPolicyAcknowledgments = vi.fn()
const jsonError = vi.fn(
  (message: string, status: number, code?: string) =>
    new Response(JSON.stringify({ error: message, code }), { status })
)

class MockAuthzError extends Error {
  status: number
  code: string

  constructor(message: string, status = 403, code = "AUTH_FORBIDDEN") {
    super(message)
    this.status = status
    this.code = code
  }
}

vi.mock("@/lib/server/auth", () => ({
  requireFreshRole,
  AuthzError: MockAuthzError,
}))

vi.mock("@/lib/server/rbac", () => ({
  READ_ROLES: ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
}))

vi.mock("@/lib/server/policy-store", () => ({
  readPolicyAcknowledgments,
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError,
}))

describe("GET /api/policies", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireFreshRole.mockResolvedValue({ orgId: "org-1", orgName: "Org Test" })
  })

  it("returns acknowledgments when storage is healthy", async () => {
    readPolicyAcknowledgments.mockResolvedValue({
      "privacy-policy": {
        userEmail: "owner@example.com",
        acknowledgedAtISO: "2026-03-20T08:00:00.000Z",
      },
    })

    const { GET } = await import("@/app/api/policies/route")
    const response = await GET(new Request("http://localhost/api/policies"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.acknowledgments["privacy-policy"].userEmail).toBe("owner@example.com")
  })

  it("falls back to an empty object when acknowledgment storage read fails", async () => {
    readPolicyAcknowledgments.mockRejectedValue(new Error("relation public.policy_acknowledgments does not exist"))

    const { GET } = await import("@/app/api/policies/route")
    const response = await GET(new Request("http://localhost/api/policies"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.acknowledgments).toEqual({})
  })

  it("returns auth errors unchanged", async () => {
    requireFreshRole.mockRejectedValueOnce(new MockAuthzError("forbidden", 403, "AUTH_FORBIDDEN"))

    const { GET } = await import("@/app/api/policies/route")
    const response = await GET(new Request("http://localhost/api/policies"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_FORBIDDEN")
  })
})
