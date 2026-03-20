import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readSessionMock: vi.fn(),
  readStateMock: vi.fn(),
  lookupOrgProfilePrefillByCuiMock: vi.fn(),
  mutateStateMock: vi.fn(async (fn: (state: Record<string, unknown>) => unknown) => fn({})),
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

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
  mutateState: mocks.mutateStateMock,
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
    mocks.readStateMock.mockResolvedValue({ efacturaValidations: [] })
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
    let saved: unknown = null
    mocks.mutateStateMock.mockImplementation(async (fn: (state: Record<string, unknown>) => unknown) => {
      saved = fn({ orgProfile: null }) as Record<string, unknown>
      return saved
    })
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
    mocks.readStateMock.mockResolvedValue({
      efacturaValidations: [
        {
          supplierName: "Amazon Web Services EMEA SARL",
          supplierCui: "RO12345678",
        },
      ],
    })

    const res = await POST(makeRequest({ cui: "RO14399840" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.prefill.companyName).toBe("DANTE INTERNATIONAL SA")
    expect(body.prefill.suggestions.usesExternalVendors).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
      })
    )
    expect(body.prefill.vendorSignals.topVendors).toEqual(["Amazon Web Services EMEA SARL"])
    expect((saved as { orgProfilePrefill?: { normalizedCui: string } }).orgProfilePrefill?.normalizedCui).toBe(
      "RO14399840"
    )
  })

  it("intoarce prefill null cand lookup-ul nu gaseste firma", async () => {
    let saved: unknown = null
    mocks.mutateStateMock.mockImplementation(async (fn: (state: Record<string, unknown>) => unknown) => {
      saved = fn({
        orgProfilePrefill: {
          normalizedCui: "RO99999999",
        },
      }) as Record<string, unknown>
      return saved
    })
    mocks.lookupOrgProfilePrefillByCuiMock.mockResolvedValue(null)

    const res = await POST(makeRequest({ cui: "RO12345678" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.prefill).toBeNull()
    expect((saved as { orgProfilePrefill?: unknown }).orgProfilePrefill).toBeUndefined()
  })
})
