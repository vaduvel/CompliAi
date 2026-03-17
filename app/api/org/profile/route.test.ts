import { beforeEach, describe, expect, it, vi } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/server/mvp-store", () => ({
  readState: vi.fn(async () => ({ orgProfile: null, applicability: null })),
  mutateState: vi.fn(async (fn: (s: unknown) => unknown) => fn({ orgProfile: null, applicability: null })),
}))

vi.mock("@/lib/server/auth", () => ({
  readSessionFromRequest: vi.fn(() => ({ orgId: "org-1", userEmail: "test@test.com" })),
  AuthzError: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "UNAUTHORIZED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: vi.fn((msg: string, status: number) =>
    new Response(JSON.stringify({ error: msg }), { status })
  ),
}))

import { mutateState } from "@/lib/server/mvp-store"
import { POST } from "./route"

// ── Helper ────────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/org/profile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

const validBase = {
  sector: "retail",
  employeeCount: "10-49",
  usesAITools: false,
  requiresEfactura: false,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/org/profile — CUI", () => {
  beforeEach(() => vi.clearAllMocks())

  it("salvează CUI valid (format RO + cifre)", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({} as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(makeRequest({ ...validBase, cui: "RO12345678" }))
    expect(res.status).toBe(200)

    const orgProfile = (saved as { orgProfile: Record<string, unknown> } | null)!.orgProfile
    expect(orgProfile.cui).toBe("RO12345678")
  })

  it("salvează CUI valid fără prefix RO", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({} as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(makeRequest({ ...validBase, cui: "12345678" }))
    expect(res.status).toBe(200)

    const orgProfile = (saved as { orgProfile: Record<string, unknown> } | null)!.orgProfile
    expect(orgProfile.cui).toBe("12345678")
  })

  it("salvează profil fără CUI când câmpul lipsește", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({} as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(makeRequest(validBase))
    expect(res.status).toBe(200)

    const orgProfile = (saved as { orgProfile: Record<string, unknown> } | null)!.orgProfile
    expect(orgProfile.cui).toBeUndefined()
  })

  it("ignoră CUI gol (string gol sau doar spații)", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({} as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(makeRequest({ ...validBase, cui: "   " }))
    expect(res.status).toBe(200)

    const orgProfile = (saved as { orgProfile: Record<string, unknown> } | null)!.orgProfile
    expect(orgProfile.cui).toBeUndefined()
  })

  it("ignoră CUI cu format invalid (litere aleatorii)", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({} as never) as Record<string, unknown>
      return saved as never
    })

    // Format invalid — nu blochează, se ignoră silențios
    const res = await POST(makeRequest({ ...validBase, cui: "INVALID-CUI-FORMAT" }))
    expect(res.status).toBe(200)

    const orgProfile = (saved as { orgProfile: Record<string, unknown> } | null)!.orgProfile
    expect(orgProfile.cui).toBeUndefined()
  })

  it("returnează 400 când sector lipsește", async () => {
    const res = await POST(makeRequest({ ...validBase, sector: undefined }))
    expect(res.status).toBe(400)
  })
})
