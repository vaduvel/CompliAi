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
          source: "anaf_vat_registry",
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
      aiSystems: [
        {
          id: "ai-1",
          name: "ChatGPT Support Assistant",
          purpose: "support-chatbot",
          vendor: "OpenAI",
          modelType: "gpt-4.1",
          usesPersonalData: true,
          makesAutomatedDecisions: false,
          impactsRights: false,
          hasHumanReview: true,
          riskLevel: "limited",
          recommendedActions: [],
          createdAtISO: "2026-03-20T10:00:00.000Z",
        },
      ],
      detectedAISystems: [],
      generatedDocuments: [
        {
          id: "doc-cookie",
          documentType: "cookie-policy",
          title: "Politică de Cookies",
          generatedAtISO: "2026-03-20T09:30:00.000Z",
          llmUsed: false,
        },
        {
          id: "doc-dpa",
          documentType: "dpa",
          title: "Acord de Prelucrare a Datelor (DPA)",
          generatedAtISO: "2026-03-20T09:45:00.000Z",
          llmUsed: true,
        },
      ],
      scans: [
        {
          id: "scan-contract",
          documentName: "Contract_furnizor_2026.pdf",
          contentPreview: "contract furnizor cu clauze DPA",
          contentExtracted: "contract furnizor cu clauze DPA",
          createdAtISO: "2026-03-20T09:50:00.000Z",
          findingsCount: 0,
          sourceKind: "document",
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
    expect(body.prefill.suggestions.usesAITools).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
      })
    )
    expect(body.prefill.suggestions.processesPersonalData).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
      })
    )
    expect(body.prefill.suggestions.hasSiteWithForms).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
      })
    )
    expect(body.prefill.suggestions.hasStandardContracts).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "medium",
      })
    )
    expect(body.prefill.vendorSignals.topVendors).toEqual(["Amazon Web Services EMEA SARL"])
    expect(body.prefill.aiSignals).toEqual({
      source: "ai_inventory",
      confirmedSystems: 1,
      detectedSystems: 0,
      personalDataSystems: 1,
      topSystems: ["ChatGPT Support Assistant"],
    })
    expect(body.prefill.documentSignals).toEqual({
      source: "document_memory",
      generatedCount: 2,
      uploadedCount: 1,
      matchedSignals: ["site cu cookies sau formulare", "vendori externi", "contracte standard"],
      topDocuments: [
        "Politică de Cookies",
        "Acord de Prelucrare a Datelor (DPA)",
        "Contract_furnizor_2026.pdf",
      ],
    })
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
