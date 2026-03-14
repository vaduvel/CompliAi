import { describe, expect, it, vi } from "vitest"

const getApplicationHealthStatus = vi.fn()
const requireAuthenticatedSession = vi.fn()

class MockAuthzError extends Error {
  status: number
  code: string

  constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
    super(message)
    this.status = status
    this.code = code
  }
}

vi.mock("@/lib/server/app-health", () => ({
  getApplicationHealthStatus,
}))

vi.mock("@/lib/server/auth", () => ({
  requireAuthenticatedSession,
  AuthzError: MockAuthzError,
}))

describe("GET /api/health", () => {
  it("returns ok=true for healthy or degraded app states", async () => {
    getApplicationHealthStatus.mockResolvedValue({
      state: "degraded",
      summary: "degraded",
      blockers: [],
      warnings: ["warn"],
      checks: [],
      config: {
        authBackend: "local",
        dataBackend: "local",
        localFallbackAllowed: true,
        production: false,
      },
    })

    const { GET } = await import("@/app/api/health/route")
    const response = await GET(new Request("http://localhost/api/health"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.ok).toBe(true)
    expect(payload.state).toBe("degraded")
  })

  it("returns ok=false when app health is blocked", async () => {
    getApplicationHealthStatus.mockResolvedValue({
      state: "blocked",
      summary: "blocked",
      blockers: ["blocked"],
      warnings: [],
      checks: [],
      config: {
        authBackend: "supabase",
        dataBackend: "supabase",
        localFallbackAllowed: false,
        production: true,
      },
    })

    const { GET } = await import("@/app/api/health/route")
    const response = await GET(new Request("http://localhost/api/health"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.ok).toBe(false)
    expect(payload.state).toBe("blocked")
  })

  it("returns auth error when session is missing", async () => {
    requireAuthenticatedSession.mockImplementation(() => {
      throw new MockAuthzError("session required")
    })

    const { GET } = await import("@/app/api/health/route")
    const response = await GET(new Request("http://localhost/api/health"))
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.code).toBe("AUTH_SESSION_REQUIRED")
  })
})
