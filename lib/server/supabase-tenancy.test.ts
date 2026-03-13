import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  hasSupabaseConfigMock: vi.fn(),
  supabaseUpsertMock: vi.fn(),
}))

vi.mock("@/lib/server/supabase-rest", () => ({
  hasSupabaseConfig: mocks.hasSupabaseConfigMock,
  supabaseUpsert: mocks.supabaseUpsertMock,
}))

import {
  getConfiguredDataBackend,
  shouldMirrorTenancyToSupabase,
  syncOrganizationTenancyToSupabase,
  syncTenancyGraphToSupabase,
  syncUserTenancyToSupabase,
} from "@/lib/server/supabase-tenancy"

const ORIGINAL_DATA_BACKEND = process.env.COMPLISCAN_DATA_BACKEND

describe("lib/server/supabase-tenancy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.COMPLISCAN_DATA_BACKEND
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.supabaseUpsertMock.mockResolvedValue([])
  })

  afterEach(() => {
    if (ORIGINAL_DATA_BACKEND === undefined) delete process.env.COMPLISCAN_DATA_BACKEND
    else process.env.COMPLISCAN_DATA_BACKEND = ORIGINAL_DATA_BACKEND
  })

  it("ramane pe backend local implicit", () => {
    expect(getConfiguredDataBackend()).toBe("local")
    expect(shouldMirrorTenancyToSupabase()).toBe(false)
  })

  it("sincronizeaza userul supabase in organizations/profiles/memberships", async () => {
    process.env.COMPLISCAN_DATA_BACKEND = "hybrid"

    const result = await syncUserTenancyToSupabase({
      userId: "11111111-1111-4111-8111-111111111123",
      users: [
        {
          id: "11111111-1111-4111-8111-111111111123",
          email: "sync@site.ro",
          passwordHash: "",
          salt: "",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          authProvider: "supabase",
        },
      ],
      organizations: [
        {
          id: "org-sync",
          name: "Org Sync",
          createdAtISO: "2026-03-13T10:00:00.000Z",
        },
      ],
      memberships: [
        {
          id: "membership-sync",
          userId: "11111111-1111-4111-8111-111111111123",
          orgId: "org-sync",
          role: "owner",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          status: "active",
        },
      ],
    })

    expect(result).toEqual(
      expect.objectContaining({
        synced: true,
        organizations: 1,
        memberships: 1,
      })
    )
    expect(mocks.supabaseUpsertMock).toHaveBeenCalledTimes(3)
    expect(mocks.supabaseUpsertMock).toHaveBeenNthCalledWith(
      1,
      "organizations",
      [
        expect.objectContaining({
          id: "org-sync",
          name: "Org Sync",
        }),
      ],
      "public"
    )
  })

  it("sincronizeaza o organizatie doar cu userii supabase eligibili", async () => {
    process.env.COMPLISCAN_DATA_BACKEND = "supabase"

    const result = await syncOrganizationTenancyToSupabase({
      orgId: "org-1",
      users: [
        {
          id: "11111111-1111-4111-8111-111111111123",
          email: "owner@site.ro",
          passwordHash: "",
          salt: "",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          authProvider: "supabase",
        },
        {
          id: "legacy-user",
          email: "viewer@site.ro",
          passwordHash: "hash",
          salt: "salt",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          authProvider: "local",
        },
      ],
      organizations: [
        {
          id: "org-1",
          name: "Org One",
          createdAtISO: "2026-03-13T10:00:00.000Z",
        },
      ],
      memberships: [
        {
          id: "membership-1",
          userId: "11111111-1111-4111-8111-111111111123",
          orgId: "org-1",
          role: "owner",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          status: "active",
        },
        {
          id: "membership-legacy",
          userId: "legacy-user",
          orgId: "org-1",
          role: "viewer",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          status: "active",
        },
      ],
    })

    expect(result).toEqual(
      expect.objectContaining({
        synced: true,
        organizations: 1,
        memberships: 1,
      })
    )
  })

  it("poate seed-ui graful complet de tenancy cand cloud-ul este gol", async () => {
    process.env.COMPLISCAN_DATA_BACKEND = "supabase"

    const result = await syncTenancyGraphToSupabase({
      users: [
        {
          id: "11111111-1111-4111-8111-111111111123",
          email: "owner@site.ro",
          passwordHash: "",
          salt: "",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          authProvider: "supabase",
        },
      ],
      organizations: [
        {
          id: "org-1",
          name: "Org One",
          createdAtISO: "2026-03-13T10:00:00.000Z",
        },
      ],
      memberships: [
        {
          id: "membership-1",
          userId: "11111111-1111-4111-8111-111111111123",
          orgId: "org-1",
          role: "owner",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          status: "active",
        },
      ],
    })

    expect(result).toEqual(
      expect.objectContaining({
        synced: true,
        organizations: 1,
        memberships: 1,
        users: 1,
      })
    )
    expect(mocks.supabaseUpsertMock).toHaveBeenCalledTimes(3)
  })
})
