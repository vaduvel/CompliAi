import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { initialComplianceState } from "@/lib/compliance/engine"

const mocks = vi.hoisted(() => ({
  getOrgContextMock: vi.fn(),
  hasSupabaseConfigMock: vi.fn(),
  supabaseSelectMock: vi.fn(),
  supabaseUpsertMock: vi.fn(),
  loadOrgStateFromSupabaseMock: vi.fn(),
  persistOrgStateToSupabaseMock: vi.fn(),
  shouldUseSupabaseOrgStateAsPrimaryMock: vi.fn(),
  getConfiguredDataBackendMock: vi.fn(),
}))

const ORIGINAL_FALLBACK = process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/supabase-rest", () => ({
  hasSupabaseConfig: mocks.hasSupabaseConfigMock,
  supabaseSelect: mocks.supabaseSelectMock,
  supabaseUpsert: mocks.supabaseUpsertMock,
}))

vi.mock("@/lib/server/supabase-org-state", () => ({
  loadOrgStateFromSupabase: mocks.loadOrgStateFromSupabaseMock,
  persistOrgStateToSupabase: mocks.persistOrgStateToSupabaseMock,
  shouldUseSupabaseOrgStateAsPrimary: mocks.shouldUseSupabaseOrgStateAsPrimaryMock,
}))

vi.mock("@/lib/server/supabase-tenancy", () => ({
  getConfiguredDataBackend: mocks.getConfiguredDataBackendMock,
}))

describe("lib/server/mvp-store", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-1",
      orgName: "Org 1",
    })
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    mocks.shouldUseSupabaseOrgStateAsPrimaryMock.mockReturnValue(true)
    mocks.loadOrgStateFromSupabaseMock.mockResolvedValue(null)
    mocks.persistOrgStateToSupabaseMock.mockResolvedValue({ synced: true })
    mocks.supabaseSelectMock.mockResolvedValue([])
    mocks.supabaseUpsertMock.mockResolvedValue([])
    delete process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK
  })

  afterEach(() => {
    if (ORIGINAL_FALLBACK === undefined) delete process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK
    else process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK = ORIGINAL_FALLBACK
  })

  it("initializeaza org_state in public cand backend-ul supabase nu are inca snapshot", async () => {
    const { readState } = await import("@/lib/server/mvp-store")

    const state = await readState()

    expect(state).toEqual(expect.objectContaining(initialComplianceState))
    expect(mocks.persistOrgStateToSupabaseMock).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining(initialComplianceState)
    )
    expect(mocks.supabaseSelectMock).not.toHaveBeenCalled()
  })

  it("scrie direct in public.org_state cand backend-ul supabase este sursa primara", async () => {
    const { writeState } = await import("@/lib/server/mvp-store")

    await writeState(initialComplianceState)

    expect(mocks.persistOrgStateToSupabaseMock).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining(initialComplianceState)
    )
    expect(mocks.supabaseUpsertMock).not.toHaveBeenCalled()
  })

  it("blocheaza fallback-ul local in modul strict cand org_state cloud nu poate fi citit", async () => {
    process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK = "false"
    mocks.loadOrgStateFromSupabaseMock.mockRejectedValueOnce(new Error("RLS denied"))

    const { readState } = await import("@/lib/server/mvp-store")

    await expect(readState()).rejects.toThrow(/SUPABASE_ORG_STATE_REQUIRED/)
  })
})
