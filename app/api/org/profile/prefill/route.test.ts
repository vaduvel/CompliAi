import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  lookupOrgProfilePrefillByCuiMock: vi.fn(),
  enrichWebsitePrefillMock: vi.fn(async (prefill: unknown) => prefill),
  enrichAICompliancePackPrefillMock: vi.fn(async (prefill: unknown) => prefill),
  mutateStateForOrgMock: vi.fn(
    async (_orgId: string, fn: (state: Record<string, unknown>) => unknown) => fn({})
  ),
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
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: mocks.jsonErrorMock,
}))

vi.mock("@/lib/server/anaf-company-lookup", () => ({
  lookupOrgProfilePrefillByCui: mocks.lookupOrgProfilePrefillByCuiMock,
}))

vi.mock("@/lib/server/website-prefill-signals", () => ({
  enrichOrgProfilePrefillWithWebsiteSignals: mocks.enrichWebsitePrefillMock,
}))

vi.mock("@/lib/server/ai-compliance-pack-prefill-signals", () => ({
  enrichOrgProfilePrefillWithAICompliancePack: mocks.enrichAICompliancePackPrefillMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
  mutateStateForOrg: mocks.mutateStateForOrgMock,
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
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      orgId: "org-1",
      orgName: "Demo Org",
      userId: "user-1",
      email: "owner@test.ro",
    })
    mocks.readStateForOrgMock.mockResolvedValue({ efacturaValidations: [] })
    mocks.enrichWebsitePrefillMock.mockImplementation(async (prefill: unknown) => prefill)
    mocks.enrichAICompliancePackPrefillMock.mockImplementation(async (prefill: unknown) => prefill)
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Autentificare necesară.", 401, "UNAUTHORIZED")
    )

    const res = await POST(makeRequest({ cui: "RO14399840" }))

    expect(res.status).toBe(401)
  })

  it("respinge CUI invalid", async () => {
    const res = await POST(makeRequest({ cui: "abc" }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("INVALID_CUI")
  })

  it("respinge request-ul fără CUI sau website valid", async () => {
    const res = await POST(makeRequest({ website: "nu-este-url" }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("INVALID_PREFILL_INPUT")
  })

  it("poate porni prefill-ul direct din AI Compliance Pack fără CUI sau website", async () => {
    mocks.lookupOrgProfilePrefillByCuiMock.mockResolvedValue(null)
    mocks.enrichAICompliancePackPrefillMock.mockResolvedValue({
      source: "ai_compliance_pack",
      fetchedAtISO: "2026-03-20T10:00:00.000Z",
      normalizedCui: null,
      companyName: "Workspace Demo SRL",
      address: null,
      legalForm: null,
      mainCaen: null,
      fiscalStatus: null,
      vatRegistered: false,
      vatOnCashAccounting: false,
      efacturaRegistered: false,
      inactive: false,
      aiCompliancePackSignals: {
        source: "ai_compliance_pack",
        totalEntries: 2,
        auditReadyEntries: 1,
        confirmedEntries: 1,
        personalDataEntries: 1,
        topSystems: ["ChatGPT Support Assistant", "Copilot drafting"],
      },
      suggestions: {
        usesAITools: {
          value: true,
          confidence: "high",
          reason: "Pack-ul confirmă utilizarea AI.",
          source: "ai_compliance_pack",
        },
      },
    })

    const res = await POST(makeRequest({}))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.prefill.source).toBe("ai_compliance_pack")
    expect(body.prefill.aiCompliancePackSignals).toEqual({
      source: "ai_compliance_pack",
      totalEntries: 2,
      auditReadyEntries: 1,
      confirmedEntries: 1,
      personalDataEntries: 1,
      topSystems: ["ChatGPT Support Assistant", "Copilot drafting"],
    })
  })

  it("intoarce prefill-ul cand lookup-ul reuseste", async () => {
    let saved: unknown = null
    mocks.mutateStateForOrgMock.mockImplementation(
      async (_orgId: string, fn: (state: Record<string, unknown>) => unknown) => {
        saved = fn({ orgProfile: null }) as Record<string, unknown>
        return saved
      }
    )
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
    mocks.readStateForOrgMock.mockResolvedValue({
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
    expect(body.prefill.suggestions.aiUsesConfidentialData).toEqual(
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
    expect(body.prefill.suggestions.hasVendorDpas).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "medium",
      })
    )
    expect(body.prefill.suggestions.hasVendorDocumentation).toEqual(
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
      matchedSignals: [
        "site cu cookies sau formulare",
        "vendori externi",
        "contracte standard",
        "DPA-uri pentru vendori",
        "documentație vendor",
        "vendori care procesează date personale",
      ],
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

  it("poate porni prefill-ul doar din website", async () => {
    mocks.lookupOrgProfilePrefillByCuiMock.mockResolvedValue(null)
    mocks.enrichWebsitePrefillMock.mockResolvedValue({
      source: "website_signals",
      fetchedAtISO: "2026-03-20T10:00:00.000Z",
      normalizedCui: null,
      normalizedWebsite: "https://exemplu.ro",
      companyName: "exemplu.ro",
      address: null,
      legalForm: null,
      mainCaen: null,
      fiscalStatus: null,
      vatRegistered: false,
      vatOnCashAccounting: false,
      efacturaRegistered: false,
      inactive: false,
      websiteSignals: {
        source: "website_signals",
        normalizedWebsite: "https://exemplu.ro",
        pagesChecked: 3,
        matchedSignals: ["privacy policy publică", "cookies / consent banner"],
        topPages: ["exemplu.ro", "/privacy-policy", "/cookies"],
      },
      suggestions: {
        hasSiteWithForms: {
          value: true,
          confidence: "high",
          reason: "Am detectat un banner de cookies și suprafață publică cu colectare.",
          source: "website_signals",
        },
        hasSitePrivacyPolicy: {
          value: true,
          confidence: "high",
          reason: "Am găsit o pagină publică de privacy policy.",
          source: "website_signals",
        },
      },
    })

    const res = await POST(makeRequest({ website: "exemplu.ro" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.prefill.normalizedWebsite).toBe("https://exemplu.ro")
    expect(body.prefill.websiteSignals).toEqual({
      source: "website_signals",
      normalizedWebsite: "https://exemplu.ro",
      pagesChecked: 3,
      matchedSignals: ["privacy policy publică", "cookies / consent banner"],
      topPages: ["exemplu.ro", "/privacy-policy", "/cookies"],
    })
  })

  it("intoarce prefill null cand lookup-ul nu gaseste firma", async () => {
    let saved: unknown = null
    mocks.mutateStateForOrgMock.mockImplementation(
      async (_orgId: string, fn: (state: Record<string, unknown>) => unknown) => {
        saved = fn({
          orgProfilePrefill: {
            normalizedCui: "RO99999999",
          },
        }) as Record<string, unknown>
        return saved
      }
    )
    mocks.lookupOrgProfilePrefillByCuiMock.mockResolvedValue(null)

    const res = await POST(makeRequest({ cui: "RO12345678" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.prefill).toBeNull()
    expect((saved as { orgProfilePrefill?: unknown }).orgProfilePrefill).toBeUndefined()
  })
})
