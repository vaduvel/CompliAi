import { describe, expect, it, vi } from "vitest"

const getApplicationHealthStatus = vi.fn()
const getSupabaseOperationalStatus = vi.fn()
const getRlsVerificationReadiness = vi.fn()

vi.mock("@/lib/server/app-health", () => ({
  getApplicationHealthStatus,
}))

vi.mock("@/lib/server/supabase-status", () => ({
  getSupabaseOperationalStatus,
}))

vi.mock("@/lib/server/rls-verification-status", () => ({
  getRlsVerificationReadiness,
}))

describe("getReleaseReadinessStatus", () => {
  it("returns ready when app health is healthy and strict supabase preflight passes", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service"
    process.env.COMPLISCAN_AUTH_BACKEND = "supabase"
    process.env.COMPLISCAN_DATA_BACKEND = "supabase"
    process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK = "false"

    getApplicationHealthStatus.mockResolvedValue({
      state: "healthy",
      summary: "healthy",
      blockers: [],
      warnings: [],
      checks: [],
      config: {
        authBackend: "supabase",
        dataBackend: "supabase",
        localFallbackAllowed: false,
        production: true,
      },
    })

    getSupabaseOperationalStatus.mockResolvedValue({
      tables: {
        organizations: { ok: true },
        memberships: { ok: true },
        profiles: { ok: true },
        org_state: { ok: true },
        evidence_objects: { ok: true },
      },
      bucket: { ok: true, name: "compliscan-evidence-private" },
    })
    getRlsVerificationReadiness.mockResolvedValue({
      ready: true,
      state: "healthy",
      summary: "ok",
      blockers: [],
      checkedAtISO: new Date().toISOString(),
      ageHours: 0,
    })

    const { getReleaseReadinessStatus } = await import("@/lib/server/release-readiness")
    const result = await getReleaseReadinessStatus()

    expect(result.state).toBe("ready")
    expect(result.ready).toBe(true)
  })

  it("returns review when strict preflight is not ready", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service"
    process.env.COMPLISCAN_AUTH_BACKEND = "local"
    process.env.COMPLISCAN_DATA_BACKEND = "local"
    delete process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK

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

    getSupabaseOperationalStatus.mockResolvedValue({
      tables: {
        organizations: { ok: true },
        memberships: { ok: true },
        profiles: { ok: true },
        org_state: { ok: true },
        evidence_objects: { ok: true },
      },
      bucket: { ok: true, name: "compliscan-evidence-private" },
    })
    getRlsVerificationReadiness.mockResolvedValue({
      ready: true,
      state: "healthy",
      summary: "ok",
      blockers: [],
      checkedAtISO: new Date().toISOString(),
      ageHours: 0,
    })

    const { getReleaseReadinessStatus } = await import("@/lib/server/release-readiness")
    const result = await getReleaseReadinessStatus()

    expect(result.state).toBe("review")
    expect(result.ready).toBe(false)
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("COMPLISCAN_AUTH_BACKEND"),
      ])
    )
  })

  it("returns blocked when app health is blocked", async () => {
    getApplicationHealthStatus.mockResolvedValue({
      state: "blocked",
      summary: "blocked",
      blockers: ["secret missing"],
      warnings: [],
      checks: [],
      config: {
        authBackend: "supabase",
        dataBackend: "supabase",
        localFallbackAllowed: false,
        production: true,
      },
    })

    getSupabaseOperationalStatus.mockResolvedValue({
      tables: {},
      bucket: null,
    })
    getRlsVerificationReadiness.mockResolvedValue({
      ready: false,
      state: "degraded",
      summary: "missing",
      blockers: ["missing"],
      checkedAtISO: null,
      ageHours: null,
    })

    const { getReleaseReadinessStatus } = await import("@/lib/server/release-readiness")
    const result = await getReleaseReadinessStatus()

    expect(result.state).toBe("blocked")
    expect(result.blockers).toEqual(expect.arrayContaining(["secret missing"]))
  })

  it("returns review when RLS verification is missing even if strict preflight is healthy", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service"
    process.env.COMPLISCAN_AUTH_BACKEND = "supabase"
    process.env.COMPLISCAN_DATA_BACKEND = "supabase"
    process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK = "false"

    getApplicationHealthStatus.mockResolvedValue({
      state: "healthy",
      summary: "healthy",
      blockers: [],
      warnings: [],
      checks: [],
      config: {
        authBackend: "supabase",
        dataBackend: "supabase",
        localFallbackAllowed: false,
        production: true,
      },
    })

    getSupabaseOperationalStatus.mockResolvedValue({
      tables: {
        organizations: { ok: true },
        memberships: { ok: true },
        profiles: { ok: true },
        org_state: { ok: true },
        evidence_objects: { ok: true },
      },
      bucket: { ok: true, name: "compliscan-evidence-private" },
    })
    getRlsVerificationReadiness.mockResolvedValue({
      ready: false,
      state: "degraded",
      summary: "stale",
      blockers: ["run verify:supabase:rls"],
      checkedAtISO: null,
      ageHours: null,
    })

    const { getReleaseReadinessStatus } = await import("@/lib/server/release-readiness")
    const result = await getReleaseReadinessStatus()

    expect(result.state).toBe("review")
    expect(result.warnings).toEqual(expect.arrayContaining(["run verify:supabase:rls"]))
    expect(result.checks.find((entry) => entry.key === "live_rls_verification")?.state).toBe(
      "degraded"
    )
  })
})
