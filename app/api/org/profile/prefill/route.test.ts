import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readSessionMock: vi.fn(),
  lookupOrgProfilePrefillByCuiMock: vi.fn(),
  jsonErrorMock: vi.fn((message: string, status: number, code: string) =>
    new Response(JSON.stringify({ error: message, code }), { status })
  ),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "UNAUTHORIZED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  readSessionFromRequest: mocks.readSessionMock,
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: mocks.jsonErrorMock,
}))

vi.mock("@/lib/server/anaf-company-lookup", () => ({
  lookupOrgProfilePrefillByCui: mocks.lookupOrgProfilePrefillByCuiMock,
}))

import { POST } from "./route"

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/org/profile/prefill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/org/profile/prefill", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue({ orgId: "org-1", userId: "user-1" })
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)

    const res = await POST(makeRequest({ cui: "RO14399840" }))

    expect(res.status).toBe(401)
  })

  it("respinge CUI invalid", async () => {
    const res = await POST(makeRequest({ cui: "abc" }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("INVALID_CUI")
  })

  it("intoarce prefill-ul cand lookup-ul reuseste", async () => {
    mocks.lookupOrgProfilePrefillByCuiMock.mockResolvedValue({
      source: "anaf_vat_registry",
      fetchedAtISO: "2026-03-20T10:00:00.000Z",
      normalizedCui: "RO14399840",
      companyName: "DANTE INTERNATIONAL SA",
      address: "BUCURESTI",
      legalForm: "SA",
      mainCaen: "4754",
      fiscalStatus: "INREGISTRAT",
      vatRegistered: true,
      vatOnCashAccounting: false,
      efacturaRegistered: true,
      inactive: false,
      suggestions: {
        sector: {
          value: "retail",
          confidence: "high",
          reason: "Codul CAEN principal indică retail direct către clienți finali.",
        },
      },
    })

    const res = await POST(makeRequest({ cui: "RO14399840" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.prefill.companyName).toBe("DANTE INTERNATIONAL SA")
  })

  it("intoarce prefill null cand lookup-ul nu gaseste firma", async () => {
    mocks.lookupOrgProfilePrefillByCuiMock.mockResolvedValue(null)

    const res = await POST(makeRequest({ cui: "RO12345678" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.prefill).toBeNull()
  })
})
