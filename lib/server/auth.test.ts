import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import crypto from "node:crypto"
import os from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  addOrganizationMemberByEmail,
  createSessionToken,
  findUserByEmail,
  findUserById,
  getConfiguredAuthBackend,
  linkUserToExternalIdentity,
  loadMemberships,
  loadOrganizations,
  listUserMemberships,
  readSessionFromRequest,
  readFreshSessionFromRequest,
  refreshSessionPayload,
  registerUser,
  resolveUserForMembership,
  requireFreshAuthenticatedSession,
  requireFreshRole,
  requireRole,
  updateOrganizationMemberRole,
  verifySessionToken,
  type PersistedUserRecord,
} from "@/lib/server/auth"
const ORIGINAL_ENV = {
  usersFile: process.env.COMPLISCAN_USERS_FILE,
  orgsFile: process.env.COMPLISCAN_ORGS_FILE,
  membershipsFile: process.env.COMPLISCAN_MEMBERSHIPS_FILE,
  sessionSecret: process.env.COMPLISCAN_SESSION_SECRET,
}

describe("lib/server/auth", () => {
  let tempDir = ""

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "compliscan-auth-"))
    process.env.COMPLISCAN_USERS_FILE = path.join(tempDir, "users.json")
    process.env.COMPLISCAN_ORGS_FILE = path.join(tempDir, "orgs.json")
    process.env.COMPLISCAN_MEMBERSHIPS_FILE = path.join(tempDir, "memberships.json")
    process.env.COMPLISCAN_SESSION_SECRET = "test-secret"
    process.env.COMPLISCAN_DATA_BACKEND = "local"
  })

  afterEach(async () => {
    vi.restoreAllMocks()

    if (ORIGINAL_ENV.usersFile === undefined) delete process.env.COMPLISCAN_USERS_FILE
    else process.env.COMPLISCAN_USERS_FILE = ORIGINAL_ENV.usersFile

    if (ORIGINAL_ENV.orgsFile === undefined) delete process.env.COMPLISCAN_ORGS_FILE
    else process.env.COMPLISCAN_ORGS_FILE = ORIGINAL_ENV.orgsFile

    if (ORIGINAL_ENV.membershipsFile === undefined) delete process.env.COMPLISCAN_MEMBERSHIPS_FILE
    else process.env.COMPLISCAN_MEMBERSHIPS_FILE = ORIGINAL_ENV.membershipsFile

    if (ORIGINAL_ENV.sessionSecret === undefined) delete process.env.COMPLISCAN_SESSION_SECRET
    else process.env.COMPLISCAN_SESSION_SECRET = ORIGINAL_ENV.sessionSecret

    delete process.env.COMPLISCAN_DATA_BACKEND

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it("ramane local-first cand backend-ul cloud nu este configurat complet", async () => {
    process.env.COMPLISCAN_DATA_BACKEND = "supabase"

    const user = await registerUser("cloud@site.ro", "secret123", "Org Cloud")

    expect(user.email).toBe("cloud@site.ro")
    expect(user.authProvider).toBe("local")
  })

  it("creeaza user, organizatie si membership separat la inregistrare", async () => {
    const user = await registerUser("Nou@Site.RO", "secret123", "Org Nou")

    expect(user.email).toBe("nou@site.ro")
    expect(user.orgName).toBe("Org Nou")
    expect(user.role).toBe("owner")
    expect(user.membershipId).toMatch(/^membership-/)

    const usersRaw = JSON.parse(
      await readFile(process.env.COMPLISCAN_USERS_FILE as string, "utf8")
    ) as PersistedUserRecord[]
    const orgsRaw = JSON.parse(
      await readFile(process.env.COMPLISCAN_ORGS_FILE as string, "utf8")
    ) as Array<{ id: string; name: string }>
    const membershipsRaw = JSON.parse(
      await readFile(process.env.COMPLISCAN_MEMBERSHIPS_FILE as string, "utf8")
    ) as Array<{ userId: string; orgId: string; role: string }>

    expect(usersRaw).toHaveLength(1)
    expect(usersRaw[0]?.orgId).toBeUndefined()
    expect(orgsRaw).toEqual([
      expect.objectContaining({
        id: user.orgId,
        name: "Org Nou",
      }),
    ])
    expect(membershipsRaw).toEqual([
      expect.objectContaining({
        userId: user.id,
        orgId: user.orgId,
        role: "owner",
      }),
    ])
  })

  it("permite inregistrarea cu identitate externa Supabase", async () => {
    const user = await registerUser("sync@site.ro", "secret123", "Org Sync", {
      externalUserId: "00000000-0000-0000-0000-000000000123",
      authProvider: "supabase",
    })

    expect(user.id).toBe("00000000-0000-0000-0000-000000000123")
    expect(user.authProvider).toBe("supabase")

    const usersRaw = JSON.parse(
      await readFile(process.env.COMPLISCAN_USERS_FILE as string, "utf8")
    ) as PersistedUserRecord[]
    expect(usersRaw[0]).toEqual(
      expect.objectContaining({
        id: "00000000-0000-0000-0000-000000000123",
        authProvider: "supabase",
        passwordHash: "",
        salt: "",
      })
    )
  })

  it("migreaza compatibil din users legacy catre orgs si memberships", async () => {
    const legacyUsers: PersistedUserRecord[] = [
      {
        id: "user-legacy",
        email: "legacy@example.com",
        passwordHash: "hash",
        salt: "salt",
        orgId: "org-legacy",
        orgName: "Legacy Org",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]

    await writeFile(
      process.env.COMPLISCAN_USERS_FILE as string,
      JSON.stringify(legacyUsers, null, 2),
      "utf8"
    )

    const organizations = await loadOrganizations()
    const memberships = await loadMemberships()
    const user = await findUserByEmail("legacy@example.com")

    expect(organizations).toEqual([
      expect.objectContaining({
        id: "org-legacy",
        name: "Legacy Org",
      }),
    ])
    expect(memberships).toEqual([
      expect.objectContaining({
        userId: "user-legacy",
        orgId: "org-legacy",
        role: "owner",
      }),
    ])
    expect(user).toEqual(
      expect.objectContaining({
        email: "legacy@example.com",
        orgId: "org-legacy",
        orgName: "Legacy Org",
        role: "owner",
      })
    )
  })

  it("returneaza rolul si membership-ul din structura noua", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-1",
        email: "reviewer@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]
    const orgs = [{ id: "org-1", name: "Control Org", createdAtISO: "2026-03-13T10:00:00.000Z" }]
    const memberships = [
      {
        id: "membership-1",
        userId: "user-1",
        orgId: "org-1",
        role: "reviewer",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    const user = await findUserByEmail("reviewer@example.com")

    expect(user).toEqual(
      expect.objectContaining({
        email: "reviewer@example.com",
        orgId: "org-1",
        orgName: "Control Org",
        role: "reviewer",
        membershipId: "membership-1",
      })
    )
  })

  it("accepta token legacy fara rol si il normalizeaza pe owner", () => {
    const legacyToken = createSessionToken({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "owner",
    })

    const dotIndex = legacyToken.lastIndexOf(".")
    const encoded = legacyToken.slice(0, dotIndex)
    const signature = legacyToken.slice(dotIndex + 1)
    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString()) as Record<string, unknown>
    delete decoded.role

    const legacyPayload = Buffer.from(JSON.stringify(decoded)).toString("base64url")
    const migratedSignature = crypto
      .createHmac("sha256", process.env.COMPLISCAN_SESSION_SECRET as string)
      .update(legacyPayload)
      .digest("base64url")
    expect(signature).not.toBe(migratedSignature)
    const migratedToken = `${legacyPayload}.${migratedSignature}`
    const payload = verifySessionToken(migratedToken)

    expect(payload).toEqual(
      expect.objectContaining({
        userId: "user-1",
        role: "owner",
      })
    )
  })

  it("blocheaza un rol insuficient la requireRole", () => {
    const token = createSessionToken({
      userId: "user-1",
      orgId: "org-1",
      email: "viewer@example.com",
      orgName: "Viewer Org",
      role: "viewer",
    })

    const request = new Request("http://localhost/api/private", {
      headers: { cookie: `compliscan_session=${token}` },
    })

    expect(() => requireRole(request, ["owner"], "resetarea workspace-ului")).toThrowError(
      /viewer/
    )
    expect(readSessionFromRequest(request)).toEqual(
      expect.objectContaining({
        email: "viewer@example.com",
        role: "viewer",
      })
    )
  })

  it("nu permite eliminarea ultimului owner activ din organizatie", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-1",
        email: "owner@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]
    const orgs = [{ id: "org-1", name: "Owner Org", createdAtISO: "2026-03-13T10:00:00.000Z" }]
    const memberships = [
      {
        id: "membership-1",
        userId: "user-1",
        orgId: "org-1",
        role: "owner",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    await expect(
      updateOrganizationMemberRole("org-1", "membership-1", "viewer")
    ).rejects.toThrow("LAST_OWNER_REQUIRED")
  })

  it("listeaza toate membership-urile utilizatorului", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-1",
        email: "owner@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]
    const orgs = [
      { id: "org-1", name: "Org Alpha", createdAtISO: "2026-03-13T10:00:00.000Z" },
      { id: "org-2", name: "Org Beta", createdAtISO: "2026-03-13T10:05:00.000Z" },
    ]
    const memberships = [
      {
        id: "membership-1",
        userId: "user-1",
        orgId: "org-1",
        role: "owner",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
      {
        id: "membership-2",
        userId: "user-1",
        orgId: "org-2",
        role: "reviewer",
        createdAtISO: "2026-03-13T10:05:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    const result = await listUserMemberships("user-1")

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(
      expect.objectContaining({
        membershipId: "membership-1",
        orgId: "org-1",
        orgName: "Org Alpha",
        role: "owner",
      })
    )
    expect(result[1]).toEqual(
      expect.objectContaining({
        membershipId: "membership-2",
        orgId: "org-2",
        orgName: "Org Beta",
        role: "reviewer",
      })
    )
  })

  it("adauga un utilizator existent in organizatia curenta", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-1",
        email: "owner@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
      {
        id: "user-2",
        email: "reviewer@example.com",
        passwordHash: "hash-2",
        salt: "salt-2",
        createdAtISO: "2026-03-13T10:05:00.000Z",
      },
    ]
    const orgs = [{ id: "org-1", name: "Org Alpha", createdAtISO: "2026-03-13T10:00:00.000Z" }]
    const memberships = [
      {
        id: "membership-1",
        userId: "user-1",
        orgId: "org-1",
        role: "owner",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    const member = await addOrganizationMemberByEmail("org-1", "reviewer@example.com", "reviewer")

    expect(member).toEqual(
      expect.objectContaining({
        email: "reviewer@example.com",
        role: "reviewer",
        orgId: "org-1",
      })
    )

    const nextMemberships = await loadMemberships()
    expect(nextMemberships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: "user-2",
          orgId: "org-1",
          role: "reviewer",
          status: "active",
        }),
      ])
    )
  })

  it("nu dubleaza un membru deja activ in organizatie", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-1",
        email: "owner@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
      {
        id: "user-2",
        email: "reviewer@example.com",
        passwordHash: "hash-2",
        salt: "salt-2",
        createdAtISO: "2026-03-13T10:05:00.000Z",
      },
    ]
    const orgs = [{ id: "org-1", name: "Org Alpha", createdAtISO: "2026-03-13T10:00:00.000Z" }]
    const memberships = [
      {
        id: "membership-1",
        userId: "user-1",
        orgId: "org-1",
        role: "owner",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
      {
        id: "membership-2",
        userId: "user-2",
        orgId: "org-1",
        role: "reviewer",
        createdAtISO: "2026-03-13T10:05:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    await expect(
      addOrganizationMemberByEmail("org-1", "reviewer@example.com", "reviewer")
    ).rejects.toThrow("MEMBER_ALREADY_EXISTS")
  })

  it("rezolva utilizatorul pe membership selectat pentru switch de organizatie", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-1",
        email: "owner@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]
    const orgs = [
      { id: "org-1", name: "Org Alpha", createdAtISO: "2026-03-13T10:00:00.000Z" },
      { id: "org-2", name: "Org Beta", createdAtISO: "2026-03-13T10:05:00.000Z" },
    ]
    const memberships = [
      {
        id: "membership-1",
        userId: "user-1",
        orgId: "org-1",
        role: "owner",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
      {
        id: "membership-2",
        userId: "user-1",
        orgId: "org-2",
        role: "reviewer",
        createdAtISO: "2026-03-13T10:05:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    const resolved = await resolveUserForMembership("user-1", "membership-2")

    expect(resolved).toEqual(
      expect.objectContaining({
        membershipId: "membership-2",
        orgId: "org-2",
        orgName: "Org Beta",
        role: "reviewer",
      })
    )
  })

  it("re-hidrateaza sesiunea din membership-ul curent si foloseste rolul actualizat", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-1",
        email: "owner@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]
    const orgs = [{ id: "org-1", name: "Org Alpha", createdAtISO: "2026-03-13T10:00:00.000Z" }]
    const memberships = [
      {
        id: "membership-1",
        userId: "user-1",
        orgId: "org-1",
        role: "reviewer",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    const staleSession = {
      userId: "user-1",
      orgId: "org-1",
      email: "owner@example.com",
      orgName: "Org Alpha",
      role: "owner" as const,
      membershipId: "membership-1",
      exp: Date.now() + 60_000,
    }

    const refreshed = await refreshSessionPayload(staleSession)

    expect(refreshed).toEqual(
      expect.objectContaining({
        userId: "user-1",
        orgId: "org-1",
        role: "reviewer",
        membershipId: "membership-1",
      })
    )
  })

  it("invalideaza sesiunea cand membership-ul nu mai exista", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-1",
        email: "owner@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))

    const staleSession = {
      userId: "user-1",
      orgId: "org-1",
      email: "owner@example.com",
      orgName: "Org Alpha",
      role: "owner" as const,
      membershipId: "membership-missing",
      exp: Date.now() + 60_000,
    }

    await expect(refreshSessionPayload(staleSession)).resolves.toBeNull()
  })

  it("poate citi sesiunea fresh direct din request", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-1",
        email: "owner@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]
    const orgs = [{ id: "org-1", name: "Org Alpha", createdAtISO: "2026-03-13T10:00:00.000Z" }]
    const memberships = [
      {
        id: "membership-1",
        userId: "user-1",
        orgId: "org-1",
        role: "compliance",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    const token = createSessionToken({
      userId: "user-1",
      orgId: "org-1",
      email: "owner@example.com",
      orgName: "Org Alpha",
      role: "viewer",
      membershipId: "membership-1",
    })

    const request = new Request("http://localhost/api/auth/me", {
      headers: { cookie: `compliscan_session=${token}` },
    })

    const session = await readFreshSessionFromRequest(request)

    expect(session).toEqual(
      expect.objectContaining({
        role: "compliance",
        membershipId: "membership-1",
      })
    )
  })

  it("pastreaza sesiunea demo la refresh chiar daca userul nu exista in auth graph", async () => {
    const token = createSessionToken({
      userId: "demo-user-imm",
      orgId: "org-demo-imm",
      email: "demo@demo-imm.compliscan.ro",
      orgName: "Demo Retail SRL",
      role: "owner",
    })

    const request = new Request("http://localhost/api/auth/me", {
      headers: { cookie: `compliscan_session=${token}` },
    })

    const session = await readFreshSessionFromRequest(request)

    expect(session).toEqual(
      expect.objectContaining({
        userId: "demo-user-imm",
        orgId: "org-demo-imm",
        email: "demo@demo-imm.compliscan.ro",
        orgName: "Demo Retail SRL",
        role: "owner",
      })
    )
  })

  it("cere sesiune fresh activa pentru actiuni protejate", async () => {
    const request = new Request("http://localhost/api/auth/memberships")

    await expect(
      requireFreshAuthenticatedSession(request, "vizualizarea organizatiilor disponibile")
    ).rejects.toMatchObject({
      status: 401,
      code: "AUTH_SESSION_REQUIRED",
    })
  })

  it("blocheaza rolul insuficient dupa refresh-ul fresh al sesiunii", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-1",
        email: "owner@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]
    const orgs = [{ id: "org-1", name: "Org Alpha", createdAtISO: "2026-03-13T10:00:00.000Z" }]
    const memberships = [
      {
        id: "membership-1",
        userId: "user-1",
        orgId: "org-1",
        role: "viewer",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    const token = createSessionToken({
      userId: "user-1",
      orgId: "org-1",
      email: "owner@example.com",
      orgName: "Org Alpha",
      role: "owner",
      membershipId: "membership-1",
    })

    const request = new Request("http://localhost/api/auth/members", {
      headers: { cookie: `compliscan_session=${token}` },
    })

    await expect(
      requireFreshRole(request, ["owner"], "adaugarea membrilor in organizatie")
    ).rejects.toMatchObject({
      status: 403,
      code: "AUTH_ROLE_FORBIDDEN",
    })
  })

  it("leaga un user local existent la identitatea externa si muta membership-urile", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "legacy-user",
        email: "owner@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]
    const orgs = [{ id: "org-1", name: "Org Alpha", createdAtISO: "2026-03-13T10:00:00.000Z" }]
    const memberships = [
      {
        id: "membership-1",
        userId: "legacy-user",
        orgId: "org-1",
        role: "owner",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    const linked = await linkUserToExternalIdentity(
      "owner@example.com",
      "00000000-0000-0000-0000-000000000999",
      "supabase"
    )

    expect(linked).toEqual(
      expect.objectContaining({
        id: "00000000-0000-0000-0000-000000000999",
        authProvider: "supabase",
        membershipId: "membership-1",
      })
    )

    const resolved = await findUserById("00000000-0000-0000-0000-000000000999")
    expect(resolved?.authProvider).toBe("supabase")

    const membershipsRaw = JSON.parse(
      await readFile(process.env.COMPLISCAN_MEMBERSHIPS_FILE as string, "utf8")
    ) as Array<{ userId: string }>
    expect(membershipsRaw[0]?.userId).toBe("00000000-0000-0000-0000-000000000999")
  })

  it("ramane pe backend local in lipsa configurarii explicite", () => {
    delete process.env.COMPLISCAN_AUTH_BACKEND
    expect(getConfiguredAuthBackend()).toBe("local")
  })

  it("accepta partner_manager ca rol valid in token de sesiune", () => {
    const token = createSessionToken({
      userId: "user-pm",
      orgId: "org-client",
      email: "consultant@example.com",
      orgName: "Client SRL",
      role: "partner_manager",
      membershipId: "membership-pm-1",
    })

    const payload = verifySessionToken(token)

    expect(payload).toEqual(
      expect.objectContaining({
        userId: "user-pm",
        orgId: "org-client",
        role: "partner_manager",
        membershipId: "membership-pm-1",
      })
    )
  })

  it("rezolva membership cu rol partner_manager din structura noua", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-pm",
        email: "consultant@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]
    const orgs = [
      { id: "org-own", name: "Cabinet Elena", createdAtISO: "2026-03-13T10:00:00.000Z" },
      { id: "org-client", name: "LogiTrans SRL", createdAtISO: "2026-03-13T10:05:00.000Z" },
    ]
    const memberships = [
      {
        id: "membership-own",
        userId: "user-pm",
        orgId: "org-own",
        role: "owner",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
      {
        id: "membership-client",
        userId: "user-pm",
        orgId: "org-client",
        role: "partner_manager",
        createdAtISO: "2026-03-13T10:05:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    const resolved = await resolveUserForMembership("user-pm", "membership-client")

    expect(resolved).toEqual(
      expect.objectContaining({
        membershipId: "membership-client",
        orgId: "org-client",
        orgName: "LogiTrans SRL",
        role: "partner_manager",
      })
    )

    const allMemberships = await listUserMemberships("user-pm")
    expect(allMemberships).toHaveLength(2)
    expect(allMemberships[1]).toEqual(
      expect.objectContaining({
        role: "partner_manager",
        orgName: "LogiTrans SRL",
      })
    )
  })

  it("permite partner_manager pe rute operationale via requireRole", () => {
    const token = createSessionToken({
      userId: "user-pm",
      orgId: "org-client",
      email: "consultant@example.com",
      orgName: "Client SRL",
      role: "partner_manager",
      membershipId: "membership-pm-1",
    })

    const request = new Request("http://localhost/api/scan", {
      headers: { cookie: `compliscan_session=${token}` },
    })

    const session = requireRole(
      request,
      ["owner", "partner_manager", "compliance"],
      "scanarea documentelor"
    )

    expect(session.role).toBe("partner_manager")
  })

  it("blocheaza partner_manager pe rute owner-only via requireRole", () => {
    const token = createSessionToken({
      userId: "user-pm",
      orgId: "org-client",
      email: "consultant@example.com",
      orgName: "Client SRL",
      role: "partner_manager",
      membershipId: "membership-pm-1",
    })

    const request = new Request("http://localhost/api/state/reset", {
      headers: { cookie: `compliscan_session=${token}` },
    })

    expect(() =>
      requireRole(request, ["owner"], "resetarea starii workspace-ului")
    ).toThrowError(/partner_manager/)
  })

  it("re-hidrateaza sesiunea partner_manager din membership actualizat", async () => {
    const users: PersistedUserRecord[] = [
      {
        id: "user-pm",
        email: "consultant@example.com",
        passwordHash: "hash",
        salt: "salt",
        createdAtISO: "2026-03-13T10:00:00.000Z",
      },
    ]
    const orgs = [{ id: "org-client", name: "Client SRL", createdAtISO: "2026-03-13T10:00:00.000Z" }]
    const memberships = [
      {
        id: "membership-pm-1",
        userId: "user-pm",
        orgId: "org-client",
        role: "partner_manager",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
    ]

    await writeFile(process.env.COMPLISCAN_USERS_FILE as string, JSON.stringify(users, null, 2))
    await writeFile(process.env.COMPLISCAN_ORGS_FILE as string, JSON.stringify(orgs, null, 2))
    await writeFile(
      process.env.COMPLISCAN_MEMBERSHIPS_FILE as string,
      JSON.stringify(memberships, null, 2)
    )

    const staleSession = {
      userId: "user-pm",
      orgId: "org-client",
      email: "consultant@example.com",
      orgName: "Client SRL",
      role: "owner" as const,
      membershipId: "membership-pm-1",
      exp: Date.now() + 60_000,
    }

    const refreshed = await refreshSessionPayload(staleSession)

    expect(refreshed).toEqual(
      expect.objectContaining({
        userId: "user-pm",
        role: "partner_manager",
        membershipId: "membership-pm-1",
      })
    )
  })
})
