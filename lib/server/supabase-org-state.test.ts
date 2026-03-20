import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ComplianceState } from "@/lib/compliance/types"

const mocks = vi.hoisted(() => ({
  getConfiguredDataBackendMock: vi.fn(),
  hasSupabaseConfigMock: vi.fn(),
  supabaseSelectMock: vi.fn(),
  supabaseUpsertMock: vi.fn(),
}))

vi.mock("@/lib/server/supabase-tenancy", () => ({
  getConfiguredDataBackend: mocks.getConfiguredDataBackendMock,
}))

vi.mock("@/lib/server/supabase-rest", () => ({
  hasSupabaseConfig: mocks.hasSupabaseConfigMock,
  supabaseSelect: mocks.supabaseSelectMock,
  supabaseUpsert: mocks.supabaseUpsertMock,
}))

import {
  loadOrgStateFromSupabase,
  persistOrgStateToSupabase,
  shouldMirrorOrgStateToSupabase,
  shouldUseSupabaseOrgStateAsPrimary,
} from "@/lib/server/supabase-org-state"

describe("lib/server/supabase-org-state", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.getConfiguredDataBackendMock.mockReturnValue("local")
    mocks.supabaseSelectMock.mockResolvedValue([])
    mocks.supabaseUpsertMock.mockResolvedValue([])
  })

  it("ramane inactiv pe backend local", async () => {
    expect(shouldMirrorOrgStateToSupabase()).toBe(false)
    expect(shouldUseSupabaseOrgStateAsPrimary()).toBe(false)
    await expect(loadOrgStateFromSupabase("org-local")).resolves.toBeNull()
    expect(mocks.supabaseSelectMock).not.toHaveBeenCalled()
  })

  it("citeste org_state din schema public cand backend-ul este supabase", async () => {
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    mocks.supabaseSelectMock.mockResolvedValueOnce([
      {
        org_id: "org-1",
        state: { scans: [{ id: "scan-1" }] },
      },
    ])

    const result = await loadOrgStateFromSupabase("org-1")

    expect(result).toEqual({ scans: [{ id: "scan-1" }] })
    expect(shouldMirrorOrgStateToSupabase()).toBe(true)
    expect(shouldUseSupabaseOrgStateAsPrimary()).toBe(true)
    expect(mocks.supabaseSelectMock).toHaveBeenCalledWith(
      "org_state",
      "select=org_id,state,updated_at&org_id=eq.org-1&limit=1",
      "public"
    )
  })

  it("oglindeste org_state in schema public cand backend-ul este hibrid", async () => {
    mocks.getConfiguredDataBackendMock.mockReturnValue("hybrid")
    const state: ComplianceState = {
      highRisk: 0,
      lowRisk: 0,
      gdprProgress: 0,
      efacturaSyncedAtISO: "",
      efacturaConnected: false,
      efacturaSignalsCount: 0,
      scannedDocuments: 0,
      alerts: [],
      findings: [],
      scans: [],
      generatedDocuments: [],
      chat: [],
      taskState: {},
      aiComplianceFieldOverrides: {},
      traceabilityReviews: {},
      aiSystems: [],
      detectedAISystems: [],
      efacturaValidations: [],
      driftRecords: [],
      driftSettings: {
        severityOverrides: {},
      },
      snapshotHistory: [],
      validatedBaselineSnapshotId: undefined,
      events: [],
    }

    const result = await persistOrgStateToSupabase("org-1", state)

    expect(result).toEqual({ synced: true })
    expect(mocks.supabaseUpsertMock).toHaveBeenCalledWith(
      "org_state",
      {
        org_id: "org-1",
        state,
      },
      "public"
    )
  })
})
