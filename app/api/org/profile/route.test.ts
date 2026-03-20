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

import { mutateState, readState } from "@/lib/server/mvp-store"
import { GET, POST } from "./route"

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

  it("returnează prefill-ul org salvat la GET", async () => {
    vi.mocked(readState).mockResolvedValue({
      orgProfile: null,
      applicability: null,
      orgProfilePrefill: {
        normalizedCui: "RO14399840",
        companyName: "DANTE INTERNATIONAL SA",
      },
    } as never)

    const res = await GET(new Request("http://localhost/api/org/profile"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.orgProfilePrefill.normalizedCui).toBe("RO14399840")
  })

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

  it("normalizează și salvează website-ul public când este valid", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({} as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(makeRequest({ ...validBase, website: "exemplu.ro/contact" }))
    expect(res.status).toBe(200)

    const orgProfile = (saved as { orgProfile: Record<string, unknown> } | null)!.orgProfile
    expect(orgProfile.website).toBe("https://exemplu.ro")
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

  it("salvează intakeAnswers și generează findings inițiale", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({ findings: [] } as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(
      makeRequest({
        ...validBase,
        intakeAnswers: {
          sellsToConsumers: "yes",
          hasEmployees: "yes",
          processesPersonalData: "yes",
          usesExternalVendors: "yes",
          hasSiteWithForms: "yes",
          hasStandardContracts: "partial",
          hasPrivacyPolicy: "no",
          hasVendorDpas: "no",
          hasVendorDocumentation: "no",
          hasSitePrivacyPolicy: "no",
          hasCookiesConsent: "no",
        },
      })
    )
    expect(res.status).toBe(200)

    const state = saved as { intakeAnswers: Record<string, unknown>; findings: { id: string }[]; intakeCompletedAtISO?: string }
    expect(state.intakeAnswers.sellsToConsumers).toBe("yes")
    expect(state.intakeCompletedAtISO).toBeTruthy()
    expect(state.findings.some((finding) => finding.id.startsWith("intake-"))).toBe(true)
  })

  it("înlocuiește findings-urile intake vechi, fără să le dubleze", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({
        findings: [
          { id: "intake-old-a" },
          { id: "manual-existing" },
        ],
      } as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(
      makeRequest({
        ...validBase,
        intakeAnswers: {
          sellsToConsumers: "yes",
          hasEmployees: "no",
          processesPersonalData: "yes",
          usesExternalVendors: "no",
          hasSiteWithForms: "yes",
          hasStandardContracts: "partial",
          hasPrivacyPolicy: "no",
          hasSitePrivacyPolicy: "no",
          hasCookiesConsent: "no",
        },
      })
    )
    expect(res.status).toBe(200)

    const findings = (saved as { findings: { id: string }[] }).findings
    expect(findings.some((finding) => finding.id === "manual-existing")).toBe(true)
    expect(findings.some((finding) => finding.id === "intake-old-a")).toBe(false)
    expect(findings.filter((finding) => finding.id.startsWith("intake-")).length).toBeGreaterThan(0)
  })

  it("curăță findings-urile intake vechi când profilul se salvează fără intakeAnswers", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({
        findings: [
          { id: "intake-old-a" },
          { id: "manual-existing" },
        ],
        intakeAnswers: { sellsToConsumers: "yes" },
        intakeCompletedAtISO: "2026-03-20T08:00:00.000Z",
      } as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(makeRequest(validBase))
    expect(res.status).toBe(200)

    const state = saved as {
      findings: { id: string }[]
      intakeAnswers?: Record<string, unknown>
      intakeCompletedAtISO?: string
    }
    expect(state.findings).toEqual([{ id: "manual-existing" }])
    expect(state.intakeAnswers).toBeUndefined()
    expect(state.intakeCompletedAtISO).toBeUndefined()
  })

  it("păstrează prefill-ul doar când CUI-ul salvat se potrivește cu lookup-ul anterior", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({
        findings: [],
        orgProfilePrefill: {
          normalizedCui: "RO14399840",
          companyName: "DANTE INTERNATIONAL SA",
        },
      } as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(makeRequest({ ...validBase, cui: "RO14399840" }))
    expect(res.status).toBe(200)
    expect((saved as { orgProfilePrefill?: { normalizedCui: string } }).orgProfilePrefill?.normalizedCui).toBe(
      "RO14399840"
    )
  })

  it("curăță prefill-ul vechi dacă profilul se salvează cu alt CUI", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({
        findings: [],
        orgProfilePrefill: {
          normalizedCui: "RO14399840",
          companyName: "DANTE INTERNATIONAL SA",
        },
      } as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(makeRequest({ ...validBase, cui: "RO99999999" }))
    expect(res.status).toBe(200)
    expect((saved as { orgProfilePrefill?: unknown }).orgProfilePrefill).toBeUndefined()
  })

  it("păstrează prefill-ul website-only când website-ul salvat se potrivește", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({
        findings: [],
        orgProfilePrefill: {
          source: "website_signals",
          normalizedCui: null,
          normalizedWebsite: "https://exemplu.ro",
          companyName: "exemplu.ro",
        },
      } as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(makeRequest({ ...validBase, website: "https://exemplu.ro" }))
    expect(res.status).toBe(200)
    expect((saved as { orgProfilePrefill?: { normalizedWebsite: string } }).orgProfilePrefill?.normalizedWebsite).toBe(
      "https://exemplu.ro"
    )
  })

  it("curăță prefill-ul website-only dacă website-ul salvat nu se mai potrivește", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({
        findings: [],
        orgProfilePrefill: {
          source: "website_signals",
          normalizedCui: null,
          normalizedWebsite: "https://vechi.ro",
          companyName: "vechi.ro",
        },
      } as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(makeRequest({ ...validBase, website: "https://nou.ro" }))
    expect(res.status).toBe(200)
    expect((saved as { orgProfilePrefill?: unknown }).orgProfilePrefill).toBeUndefined()
  })

  it("păstrează prefill-ul intern din AI Compliance Pack chiar fără CUI sau website", async () => {
    let saved: unknown = null
    vi.mocked(mutateState).mockImplementation(async (fn) => {
      saved = fn({
        findings: [],
        orgProfilePrefill: {
          source: "ai_compliance_pack",
          normalizedCui: null,
          companyName: "Workspace Demo SRL",
        },
      } as never) as Record<string, unknown>
      return saved as never
    })

    const res = await POST(makeRequest(validBase))
    expect(res.status).toBe(200)
    expect((saved as { orgProfilePrefill?: { source: string } }).orgProfilePrefill?.source).toBe(
      "ai_compliance_pack"
    )
  })
})
