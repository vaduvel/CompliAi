import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getConfiguredDataBackendMock: vi.fn(),
  hasSupabaseConfigMock: vi.fn(),
  supabaseSelectMock: vi.fn(),
}))

vi.mock("@/lib/server/supabase-tenancy", () => ({
  getConfiguredDataBackend: mocks.getConfiguredDataBackendMock,
}))

vi.mock("@/lib/server/supabase-rest", () => ({
  hasSupabaseConfig: mocks.hasSupabaseConfigMock,
  supabaseSelect: mocks.supabaseSelectMock,
}))

import {
  loadTenancyGraphFromSupabase,
  shouldReadTenancyFromSupabase,
} from "@/lib/server/supabase-tenancy-read"

describe("lib/server/supabase-tenancy-read", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.getConfiguredDataBackendMock.mockReturnValue("local")
    mocks.supabaseSelectMock.mockResolvedValue([])
  })

  it("nu citeste cloud tenancy in afara backend-ului supabase", async () => {
    expect(shouldReadTenancyFromSupabase()).toBe(false)
    const result = await loadTenancyGraphFromSupabase()
    expect(result).toEqual({
      organizations: [],
      memberships: [],
      profiles: [],
    })
    expect(mocks.supabaseSelectMock).not.toHaveBeenCalled()
  })

  it("citeste organizations, memberships si profiles din schema public", async () => {
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    mocks.supabaseSelectMock
      .mockResolvedValueOnce([
        { id: "org-db", name: "Org DB", created_at: "2026-03-13T10:00:00.000Z" },
      ])
      .mockResolvedValueOnce([
        {
          id: "membership-db",
          user_id: "11111111-1111-4111-8111-111111111123",
          org_id: "org-db",
          role: "compliance",
          status: "active",
          created_at: "2026-03-13T10:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "11111111-1111-4111-8111-111111111123",
          email: "db@site.ro",
          display_name: "DB User",
          created_at: "2026-03-13T10:00:00.000Z",
        },
      ])

    const result = await loadTenancyGraphFromSupabase()

    expect(result.organizations).toEqual([
      {
        id: "org-db",
        name: "Org DB",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ])
    expect(result.memberships).toEqual([
      {
        id: "membership-db",
        userId: "11111111-1111-4111-8111-111111111123",
        orgId: "org-db",
        role: "compliance",
        status: "active",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ])
    expect(result.profiles).toEqual([
      {
        id: "11111111-1111-4111-8111-111111111123",
        email: "db@site.ro",
        displayName: "DB User",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ])
  })
})
