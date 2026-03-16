import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const getSupabaseOperationalStatus = vi.fn()

vi.mock("@/lib/server/supabase-status", () => ({
  getSupabaseOperationalStatus,
}))

describe("getApplicationHealthStatus", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.COMPLISCAN_SESSION_SECRET
    delete process.env.COMPLISCAN_AUTH_BACKEND
    delete process.env.COMPLISCAN_DATA_BACKEND
    delete process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK
    ;(process.env as Record<string, string>).NODE_ENV = "test"
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("returns degraded for local dev fallback", async () => {
    const { getApplicationHealthStatus } = await import("@/lib/server/app-health")

    const result = await getApplicationHealthStatus()

    expect(result.state).toBe("degraded")
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Secretul de sesiune"),
        expect.stringContaining("Identitatea finală"),
        expect.stringContaining("Datele aplicației"),
      ])
    )
  })

  it("returns healthy for strict supabase with healthy infra", async () => {
    process.env.COMPLISCAN_SESSION_SECRET = "secret"
    process.env.COMPLISCAN_AUTH_BACKEND = "supabase"
    process.env.COMPLISCAN_DATA_BACKEND = "supabase"
    process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK = "false"

    getSupabaseOperationalStatus.mockResolvedValue({
      summary: {
        ready: true,
        blockers: [],
      },
    })

    const { getApplicationHealthStatus } = await import("@/lib/server/app-health")
    const result = await getApplicationHealthStatus()

    expect(result.state).toBe("healthy")
    expect(result.blockers).toEqual([])
    expect(result.checks.find((check) => check.key === "supabase_operational")?.state).toBe(
      "healthy"
    )
  })

  it("returns blocked when strict supabase is configured but infra is not ready", async () => {
    process.env.COMPLISCAN_SESSION_SECRET = "secret"
    process.env.COMPLISCAN_AUTH_BACKEND = "supabase"
    process.env.COMPLISCAN_DATA_BACKEND = "supabase"
    process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK = "false"

    getSupabaseOperationalStatus.mockResolvedValue({
      summary: {
        ready: false,
        blockers: ["Schema Sprint 5 lipsește."],
      },
    })

    const { getApplicationHealthStatus } = await import("@/lib/server/app-health")
    const result = await getApplicationHealthStatus()

    expect(result.state).toBe("blocked")
    expect(result.blockers).toEqual(expect.arrayContaining(["Schema Sprint 5 lipsește."]))
  })

  it("returns blocked in production when session secret is missing", async () => {
    ;(process.env as Record<string, string>).NODE_ENV = "production"
    process.env.COMPLISCAN_AUTH_BACKEND = "local"
    process.env.COMPLISCAN_DATA_BACKEND = "local"

    const { getApplicationHealthStatus } = await import("@/lib/server/app-health")
    const result = await getApplicationHealthStatus()

    expect(result.state).toBe("blocked")
    expect(result.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining("COMPLISCAN_SESSION_SECRET")])
    )
  })
})
