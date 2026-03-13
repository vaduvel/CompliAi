import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getConfiguredAuthBackendMock: vi.fn(),
  getConfiguredDataBackendMock: vi.fn(),
  hasSupabaseConfigMock: vi.fn(),
  hasSupabaseStorageConfigMock: vi.fn(),
  getSupabaseBucketStatusMock: vi.fn(),
  supabaseSelectMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  getConfiguredAuthBackend: mocks.getConfiguredAuthBackendMock,
}))

vi.mock("@/lib/server/supabase-tenancy", () => ({
  getConfiguredDataBackend: mocks.getConfiguredDataBackendMock,
}))

vi.mock("@/lib/server/supabase-rest", () => ({
  hasSupabaseConfig: mocks.hasSupabaseConfigMock,
  supabaseSelect: mocks.supabaseSelectMock,
}))

vi.mock("@/lib/server/supabase-storage", () => ({
  hasSupabaseStorageConfig: mocks.hasSupabaseStorageConfigMock,
  getSupabaseBucketStatus: mocks.getSupabaseBucketStatusMock,
}))

import { getSupabaseOperationalStatus } from "@/lib/server/supabase-status"

describe("lib/server/supabase-status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getConfiguredAuthBackendMock.mockReturnValue("supabase")
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.hasSupabaseStorageConfigMock.mockReturnValue(true)
    mocks.getSupabaseBucketStatusMock.mockResolvedValue({
      ok: true,
      name: "compliscan-evidence-private",
      state: "present",
    })
    mocks.supabaseSelectMock.mockResolvedValue([])
    delete process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK
  })

  it("raporteaza toate tabelele critice ca sanatoase cand select-ul reuseste", async () => {
    const result = await getSupabaseOperationalStatus()

    expect(result.summary).toEqual({
      healthyTables: 5,
      totalTables: 5,
      schemaReady: true,
      bucketReady: true,
      blockers: [],
      ready: true,
    })
    expect(result.localFallbackAllowed).toBe(true)
    expect(result.tables.organizations).toEqual({ ok: true, state: "healthy" })
    expect(mocks.supabaseSelectMock).toHaveBeenCalledTimes(5)
  })

  it("marcheaza tabelul ca degradat cand select-ul esueaza", async () => {
    mocks.supabaseSelectMock
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("403 RLS failure"))
      .mockResolvedValue([])

    const result = await getSupabaseOperationalStatus()

    expect(result.summary.ready).toBe(false)
    expect(result.tables.memberships).toEqual(
      expect.objectContaining({
        ok: false,
        state: "error",
        error: expect.stringContaining("403 RLS failure"),
      })
    )
  })

  it("raporteaza explicit cand fallback-ul local este blocat", async () => {
    process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK = "false"

    const result = await getSupabaseOperationalStatus()

    expect(result.localFallbackAllowed).toBe(false)
  })

  it("marcheaza schema lipsa si bucket-ul lipsa ca blocaje reale", async () => {
    mocks.supabaseSelectMock.mockRejectedValue(
      new Error("Supabase error 404: Could not find the table 'public.organizations' in the schema cache")
    )
    mocks.getSupabaseBucketStatusMock.mockResolvedValue({
      ok: false,
      name: "compliscan-evidence-private",
      state: "missing_bucket",
      error: "Bucket not found",
    })

    const result = await getSupabaseOperationalStatus()

    expect(result.summary.schemaReady).toBe(false)
    expect(result.summary.bucketReady).toBe(false)
    expect(result.summary.ready).toBe(false)
    expect(result.tables.organizations?.state).toBe("missing_schema")
    expect(result.summary.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining("Schema Sprint 5 lipseste")])
    )
    expect(result.summary.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining("Bucket-ul privat")])
    )
  })
})
