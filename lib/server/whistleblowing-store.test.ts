import { beforeEach, describe, expect, it, vi } from "vitest"

const stateMap = vi.hoisted(() => new Map<string, unknown>())

const mocks = vi.hoisted(() => ({
  readMock: vi.fn(async (orgId: string) => stateMap.get(orgId) ?? null),
  writeMock: vi.fn(async (orgId: string, state: unknown) => {
    stateMap.set(orgId, JSON.parse(JSON.stringify(state)))
  }),
}))

vi.mock("@/lib/server/storage-adapter", () => ({
  createAdaptiveStorage: () => ({
    read: mocks.readMock,
    write: mocks.writeMock,
  }),
}))

import { readWhistleblowingState, resolveOrgByToken } from "@/lib/server/whistleblowing-store"

function legacyToken(orgId: string): string {
  return Buffer.from(orgId).toString("base64url").slice(0, 16)
}

describe("whistleblowing-store", () => {
  beforeEach(() => {
    stateMap.clear()
    vi.clearAllMocks()
  })

  it("generează și persistă token random pentru org nou", async () => {
    const state = await readWhistleblowingState("org-new")

    expect(state.publicToken).toHaveLength(24)
    expect(state.publicToken).not.toBe(legacyToken("org-new"))
    expect(state.legacyPublicToken).toBeUndefined()
    expect(mocks.writeMock).toHaveBeenCalledOnce()
  })

  it("migrează tokenul legacy și păstrează fallback temporar", async () => {
    const oldToken = legacyToken("org-legacy")
    stateMap.set("org-legacy", {
      reports: [],
      publicToken: oldToken,
      updatedAtISO: "2026-04-01T10:00:00.000Z",
    })

    const state = await readWhistleblowingState("org-legacy")

    expect(state.publicToken).not.toBe(oldToken)
    expect(state.legacyPublicToken).toBe(oldToken)
    expect(state.legacyTokenValidUntilISO).toBeTruthy()
    expect(new Date(state.legacyTokenValidUntilISO!).getTime()).toBeGreaterThan(Date.now())
  })

  it("acceptă tokenul legacy doar pentru org deja migrat", async () => {
    const oldToken = legacyToken("org-migrated")
    stateMap.set("org-migrated", {
      reports: [],
      publicToken: oldToken,
      updatedAtISO: "2026-04-01T10:00:00.000Z",
    })

    const resolved = await resolveOrgByToken(oldToken, ["org-migrated"])

    expect(resolved).toBe("org-migrated")
    const migrated = stateMap.get("org-migrated") as {
      publicToken: string
      legacyPublicToken?: string
    }
    expect(migrated.publicToken).not.toBe(oldToken)
    expect(migrated.legacyPublicToken).toBe(oldToken)
  })

  it("nu acceptă token determinist pentru org fără state existent", async () => {
    const resolved = await resolveOrgByToken(legacyToken("org-fresh"), ["org-fresh"])

    expect(resolved).toBeNull()
    expect(stateMap.has("org-fresh")).toBe(false)
  })
})
