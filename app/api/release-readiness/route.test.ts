import { describe, expect, it, vi } from "vitest"

const requireFreshRole = vi.fn()
const getReleaseReadinessStatus = vi.fn()

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

vi.mock("@/lib/server/release-readiness", () => ({
  getReleaseReadinessStatus,
}))

describe("GET /api/release-readiness", () => {
  it("returns ok=false when readiness is review", async () => {
    requireFreshRole.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    getReleaseReadinessStatus.mockResolvedValue({
      state: "review",
      ready: false,
      summary: "review",
      blockers: [],
      warnings: [],
      checks: [],
    })

    const { GET } = await import("@/app/api/release-readiness/route")
    const response = await GET(new Request("http://localhost/api/release-readiness"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.ok).toBe(false)
    expect(payload.state).toBe("review")
  })

  it("returns auth error when role is blocked", async () => {
    requireFreshRole.mockImplementation(async () => {
      throw new MockAuthzError("forbidden", 403, "AUTH_FORBIDDEN")
    })

    const { GET } = await import("@/app/api/release-readiness/route")
    const response = await GET(new Request("http://localhost/api/release-readiness"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.code).toBe("AUTH_FORBIDDEN")
  })
})
