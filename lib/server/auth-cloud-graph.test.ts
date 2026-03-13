import { mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  loadTenancyGraphFromSupabaseMock: vi.fn(),
  shouldReadTenancyFromSupabaseMock: vi.fn(),
  syncOrganizationTenancyToSupabaseMock: vi.fn(),
  syncTenancyGraphToSupabaseMock: vi.fn(),
  syncUserTenancyToSupabaseMock: vi.fn(),
  shouldUseSupabaseTenancyAsPrimaryMock: vi.fn(),
}))

vi.mock("@/lib/server/supabase-tenancy-read", () => ({
  loadTenancyGraphFromSupabase: mocks.loadTenancyGraphFromSupabaseMock,
  shouldReadTenancyFromSupabase: mocks.shouldReadTenancyFromSupabaseMock,
}))

vi.mock("@/lib/server/supabase-tenancy", () => ({
  syncOrganizationTenancyToSupabase: mocks.syncOrganizationTenancyToSupabaseMock,
  syncTenancyGraphToSupabase: mocks.syncTenancyGraphToSupabaseMock,
  syncUserTenancyToSupabase: mocks.syncUserTenancyToSupabaseMock,
  shouldUseSupabaseTenancyAsPrimary: mocks.shouldUseSupabaseTenancyAsPrimaryMock,
}))

const ORIGINAL_ENV = {
  usersFile: process.env.COMPLISCAN_USERS_FILE,
  orgsFile: process.env.COMPLISCAN_ORGS_FILE,
  membershipsFile: process.env.COMPLISCAN_MEMBERSHIPS_FILE,
  fallback: process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK,
}

describe("lib/server/auth cloud graph", () => {
  let tempDir = ""

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "compliscan-auth-cloud-"))
    process.env.COMPLISCAN_USERS_FILE = path.join(tempDir, "users.json")
    process.env.COMPLISCAN_ORGS_FILE = path.join(tempDir, "orgs.json")
    process.env.COMPLISCAN_MEMBERSHIPS_FILE = path.join(tempDir, "memberships.json")

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify([], null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify([], null, 2))
    await writeFile(process.env.COMPLISCAN_MEMBERSHIPS_FILE as string, JSON.stringify([], null, 2))

    vi.clearAllMocks()
    delete process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK
    mocks.shouldReadTenancyFromSupabaseMock.mockReturnValue(true)
    mocks.shouldUseSupabaseTenancyAsPrimaryMock.mockReturnValue(false)
    mocks.syncTenancyGraphToSupabaseMock.mockResolvedValue({
      synced: false,
      reason: "DATA_BACKEND_LOCAL",
    })
    mocks.loadTenancyGraphFromSupabaseMock.mockResolvedValue({
      organizations: [
        {
          id: "org-db",
          name: "Org DB",
          createdAtISO: "2026-03-13T10:00:00.000Z",
        },
      ],
      memberships: [
        {
          id: "membership-db",
          userId: "11111111-1111-4111-8111-111111111123",
          orgId: "org-db",
          role: "compliance",
          status: "active",
          createdAtISO: "2026-03-13T10:00:00.000Z",
        },
      ],
      profiles: [
        {
          id: "11111111-1111-4111-8111-111111111123",
          email: "db@site.ro",
          displayName: "DB User",
          createdAtISO: "2026-03-13T10:00:00.000Z",
        },
      ],
    })
  })

  afterEach(async () => {
    if (ORIGINAL_ENV.usersFile === undefined) delete process.env.COMPLISCAN_USERS_FILE
    else process.env.COMPLISCAN_USERS_FILE = ORIGINAL_ENV.usersFile

    if (ORIGINAL_ENV.orgsFile === undefined) delete process.env.COMPLISCAN_ORGS_FILE
    else process.env.COMPLISCAN_ORGS_FILE = ORIGINAL_ENV.orgsFile

    if (ORIGINAL_ENV.membershipsFile === undefined) delete process.env.COMPLISCAN_MEMBERSHIPS_FILE
    else process.env.COMPLISCAN_MEMBERSHIPS_FILE = ORIGINAL_ENV.membershipsFile

    if (ORIGINAL_ENV.fallback === undefined) delete process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK
    else process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK = ORIGINAL_ENV.fallback

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it("citeste organizatiile din cloud graph cand backend-ul este supabase", async () => {
    const { loadOrganizations } = await import("@/lib/server/auth")

    const organizations = await loadOrganizations()

    expect(organizations).toEqual([
      {
        id: "org-db",
        name: "Org DB",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ])
  })

  it("poate rezolva membri si useri din profiles + memberships cloud", async () => {
    const { findUserByEmail, listOrganizationMembers, listUserMemberships } = await import(
      "@/lib/server/auth"
    )

    const user = await findUserByEmail("db@site.ro")
    const members = await listOrganizationMembers("org-db")
    const memberships = await listUserMemberships("11111111-1111-4111-8111-111111111123")

    expect(user).toEqual(
      expect.objectContaining({
        id: "11111111-1111-4111-8111-111111111123",
        email: "db@site.ro",
        orgId: "org-db",
        orgName: "Org DB",
        role: "compliance",
        authProvider: "supabase",
      })
    )
    expect(members).toEqual([
      expect.objectContaining({
        email: "db@site.ro",
        orgId: "org-db",
        role: "compliance",
      }),
    ])
    expect(memberships).toEqual([
      expect.objectContaining({
        orgId: "org-db",
        orgName: "Org DB",
        role: "compliance",
      }),
    ])
  })

  it("trateaza sincronizarea cloud ca obligatorie cand tenancy source of truth este supabase", async () => {
    mocks.shouldUseSupabaseTenancyAsPrimaryMock.mockReturnValue(true)
    mocks.syncOrganizationTenancyToSupabaseMock.mockResolvedValue({
      synced: false,
      reason: "NO_MEMBERSHIPS",
    })

    const { updateOrganizationMemberRole } = await import("@/lib/server/auth")

    await expect(
      updateOrganizationMemberRole("org-db", "membership-db", "reviewer")
    ).rejects.toThrow(/NO_MEMBERSHIPS/)
  })

  it("blocheaza inregistrarea cand cloud-ul este sursa de adevar si sincronizarea esueaza", async () => {
    mocks.shouldUseSupabaseTenancyAsPrimaryMock.mockReturnValue(true)
    mocks.syncUserTenancyToSupabaseMock.mockResolvedValue({
      synced: false,
      reason: "USER_NOT_SYNCABLE",
    })

    const { registerUser } = await import("@/lib/server/auth")

    await expect(registerUser("cloud@site.ro", "secret123", "Org Cloud")).rejects.toThrow(
      /USER_NOT_SYNCABLE/
    )
  })

  it("seed-uieste graful cloud din local cand backend-ul supabase nu are inca tenancy initializat", async () => {
    mocks.shouldUseSupabaseTenancyAsPrimaryMock.mockReturnValue(true)
    mocks.loadTenancyGraphFromSupabaseMock
      .mockResolvedValueOnce({
        organizations: [],
        memberships: [],
        profiles: [],
      })
      .mockResolvedValueOnce({
        organizations: [
          {
            id: "org-local",
            name: "Org Local",
            createdAtISO: "2026-03-13T10:00:00.000Z",
          },
        ],
        memberships: [
          {
            id: "membership-local",
            userId: "11111111-1111-4111-8111-111111111123",
            orgId: "org-local",
            role: "owner",
            status: "active",
            createdAtISO: "2026-03-13T10:00:00.000Z",
          },
        ],
        profiles: [
          {
            id: "11111111-1111-4111-8111-111111111123",
            email: "db@site.ro",
            displayName: "DB User",
            createdAtISO: "2026-03-13T10:00:00.000Z",
          },
        ],
      })
    mocks.syncTenancyGraphToSupabaseMock.mockResolvedValue({
      synced: true,
      organizations: 1,
      memberships: 1,
      users: 1,
    })

    await writeFile(
      process.env.COMPLISCAN_USERS_FILE as string,
      JSON.stringify(
        [
          {
            id: "11111111-1111-4111-8111-111111111123",
            email: "db@site.ro",
            passwordHash: "",
            salt: "",
            createdAtISO: "2026-03-13T10:00:00.000Z",
            authProvider: "supabase",
            orgId: "org-local",
            orgName: "Org Local",
          },
        ],
        null,
        2
      )
    )

    const { loadOrganizations } = await import("@/lib/server/auth")
    const organizations = await loadOrganizations()

    expect(mocks.syncTenancyGraphToSupabaseMock).toHaveBeenCalledTimes(1)
    expect(organizations).toEqual([
      {
        id: "org-local",
        name: "Org Local",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ])
  })

  it("blocheaza fallback-ul local in modul strict cand cloud graph nu poate fi citit", async () => {
    process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK = "false"
    mocks.shouldUseSupabaseTenancyAsPrimaryMock.mockReturnValue(true)
    mocks.loadTenancyGraphFromSupabaseMock.mockRejectedValueOnce(new Error("network down"))

    const { loadOrganizations } = await import("@/lib/server/auth")

    await expect(loadOrganizations()).rejects.toThrow(/SUPABASE_TENANCY_REQUIRED/)
  })
})
