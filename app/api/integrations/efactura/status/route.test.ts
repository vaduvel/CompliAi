// Sprint 8 — ANAF Live Readiness smoke test
import { describe, it, expect, vi, beforeEach } from "vitest"

import { GET } from "./route"

const mocks = vi.hoisted(() => ({
  getAnafModeMock: vi.fn(),
  getAnafEnvironmentMock: vi.fn(),
  isAnafProductionUnlockedMock: vi.fn(),
  loadTokenFromSupabaseMock: vi.fn(),
  listSubmissionsMock: vi.fn(),
  diagnoseAnafSubmissionErrorMock: vi.fn(),
  readFreshSessionFromRequestMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/anaf-spv-client", () => ({
  loadTokenFromSupabase: mocks.loadTokenFromSupabaseMock,
}))

vi.mock("@/lib/server/auth", () => ({
  readFreshSessionFromRequest: mocks.readFreshSessionFromRequestMock,
}))

vi.mock("@/lib/server/efactura-anaf-client", () => ({
  getAnafMode: mocks.getAnafModeMock,
  getAnafEnvironment: mocks.getAnafEnvironmentMock,
  isAnafProductionUnlocked: mocks.isAnafProductionUnlockedMock,
}))

vi.mock("@/lib/server/anaf-submit-flow", () => ({
  listSubmissions: mocks.listSubmissionsMock,
  diagnoseAnafSubmissionError: mocks.diagnoseAnafSubmissionErrorMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
}))

const BASE_STATE = {
  efacturaConnected: false,
  efacturaSyncedAtISO: null,
}

describe("GET /api/integrations/efactura/status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readStateForOrgMock.mockResolvedValue(BASE_STATE)
    mocks.listSubmissionsMock.mockResolvedValue([])
    mocks.diagnoseAnafSubmissionErrorMock.mockImplementation((errorDetail: string | null | undefined) => {
      if (!errorDetail) return null
      if (/401|unauthorized/i.test(errorDetail)) {
        return {
          category: "reauth_required",
          userMessage: "ANAF a refuzat tokenul curent pentru upload sau status.",
          nextStep: "Reautentifică firma în ANAF înainte de o nouă transmitere.",
          reauthRequired: true,
        }
      }
      if (/xml-ul nu mai este disponibil|xml no longer cached/i.test(errorDetail)) {
        return {
          category: "draft_missing",
          userMessage: "Transmiterea nu mai are XML-ul original atașat.",
          nextStep: "Reinițiază transmiterea din formular și aprobă din nou draftul.",
          reauthRequired: false,
        }
      }
      if (/fetch failed|network|timeout|503|502|service unavailable/i.test(errorDetail)) {
        return {
          category: "service_unavailable",
          userMessage: "Serviciul ANAF sau conexiunea către el nu a răspuns stabil.",
          nextStep: "Încearcă din nou mai târziu și verifică dacă ANAF are mentenanță.",
          reauthRequired: false,
        }
      }
      return {
        category: "unknown",
        userMessage: "Transmiterea ANAF a eșuat dintr-un motiv care cere verificare manuală.",
        nextStep: "Verifică eroarea completă, apoi retrimite sau reautentifică dacă este necesar.",
        reauthRequired: false,
      }
    })
    mocks.getAnafModeMock.mockReturnValue("mock")
    mocks.getAnafEnvironmentMock.mockReturnValue("test")
    mocks.isAnafProductionUnlockedMock.mockReturnValue(false)
    mocks.readFreshSessionFromRequestMock.mockResolvedValue({ orgId: "org-1" })
    mocks.loadTokenFromSupabaseMock.mockResolvedValue(null)
    delete process.env.ANAF_CLIENT_ID
    delete process.env.ANAF_CLIENT_SECRET
    delete process.env.ANAF_CUI
  })

  it("returnează mode=mock când lipsesc credențialele", async () => {
    const res = await GET(new Request("http://localhost/api/integrations/efactura/status"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.mode).toBe("mock")
    expect(body.ready).toBe(false)
    expect(body.tokenState).toBe("missing")
    expect(body.operationalState).toBe("demo_only")
    expect(body.missingConfig).toContain("ANAF_CLIENT_ID")
    expect(body.missingConfig).toContain("ANAF_CLIENT_SECRET")
  })

  it("returnează mode=real și ready=true când toate env sunt setate", async () => {
    process.env.ANAF_CLIENT_ID = "test-id"
    process.env.ANAF_CLIENT_SECRET = "test-secret"
    process.env.ANAF_CUI = "RO12345678"
    mocks.getAnafModeMock.mockReturnValue("real")
    mocks.getAnafEnvironmentMock.mockReturnValue("prod")
    mocks.isAnafProductionUnlockedMock.mockReturnValue(true)

    const res = await GET(new Request("http://localhost/api/integrations/efactura/status"))
    const body = await res.json()

    expect(body.mode).toBe("real")
    expect(body.ready).toBe(true)
    expect(body.productionReady).toBe(true)
    expect(body.missingConfig).toHaveLength(0)
  })

  it("returnează mode=test când credențialele există dar producția nu este deblocată", async () => {
    process.env.ANAF_CLIENT_ID = "test-id"
    process.env.ANAF_CLIENT_SECRET = "test-secret"
    process.env.ANAF_CUI = "RO12345678"
    mocks.getAnafModeMock.mockReturnValue("test")
    mocks.getAnafEnvironmentMock.mockReturnValue("test")

    const res = await GET(new Request("http://localhost/api/integrations/efactura/status"))
    const body = await res.json()

    expect(body.mode).toBe("test")
    expect(body.ready).toBe(true)
    expect(body.productionReady).toBe(false)
    expect(body.message).toContain("TEST")
  })

  it("returnează connected din state", async () => {
    process.env.ANAF_CLIENT_ID = "test-id"
    process.env.ANAF_CLIENT_SECRET = "test-secret"
    process.env.ANAF_CUI = "RO12345678"
    mocks.getAnafModeMock.mockReturnValue("test")
    mocks.getAnafEnvironmentMock.mockReturnValue("test")
    const recentSyncISO = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    mocks.readStateForOrgMock.mockResolvedValue({
      ...BASE_STATE,
      efacturaConnected: true,
      efacturaSyncedAtISO: recentSyncISO,
    })
    mocks.loadTokenFromSupabaseMock.mockResolvedValue({
      orgId: "org-1",
      accessToken: "token",
      refreshToken: "refresh",
      expiresAtISO: "2099-03-17T10:00:00.000Z",
      tokenType: "Bearer",
      scope: "SPV",
      createdAtISO: "2026-03-17T09:00:00.000Z",
      lastUsedAtISO: null,
    })

    const res = await GET(new Request("http://localhost/api/integrations/efactura/status"))
    const body = await res.json()

    expect(body.connected).toBe(true)
    expect(body.syncedAtISO).toBe(recentSyncISO)
    expect(body.tokenState).toBe("present")
    expect(body.operationalState).toBe("authorized_pending_sync")
  })

  it("degradează la reautentificare necesară când ultima execuție a picat cu unauthorized", async () => {
    process.env.ANAF_CLIENT_ID = "test-id"
    process.env.ANAF_CLIENT_SECRET = "test-secret"
    process.env.ANAF_CUI = "RO12345678"
    mocks.getAnafModeMock.mockReturnValue("test")
    mocks.getAnafEnvironmentMock.mockReturnValue("test")
    mocks.readStateForOrgMock.mockResolvedValue({
      ...BASE_STATE,
      efacturaConnected: true,
      efacturaSyncedAtISO: new Date().toISOString(),
    })
    mocks.loadTokenFromSupabaseMock.mockResolvedValue({
      orgId: "org-1",
      accessToken: "token",
      refreshToken: "refresh",
      expiresAtISO: "2099-03-17T10:00:00.000Z",
      tokenType: "Bearer",
      scope: "SPV",
      createdAtISO: "2026-03-17T09:00:00.000Z",
      lastUsedAtISO: null,
    })
    mocks.listSubmissionsMock.mockResolvedValue([
      {
        id: "sub-1",
        orgId: "org-1",
        invoiceId: "TEST-401",
        xmlSnippet: "<xml />",
        cif: "RO12345678",
        approvalActionId: "approval-1",
        status: "error",
        indexDescarcare: null,
        anafStatus: null,
        anafMessage: null,
        downloadId: null,
        createdAtISO: "2026-04-02T08:00:00.000Z",
        submittedAtISO: "2026-04-02T08:01:00.000Z",
        resolvedAtISO: "2026-04-02T08:01:30.000Z",
        sourceFindingId: null,
        errorDetail: "ANAF error (T001): Upload failed 401: {\"message\":\"Unauthorized\",\"status\":\"401\"}",
      },
    ])

    const res = await GET(new Request("http://localhost/api/integrations/efactura/status"))
    const body = await res.json()

    expect(body.operationalState).toBe("reauth_required")
    expect(body.canAttemptUpload).toBe(false)
    expect(body.lastSubmissionStatus).toBe("error")
    expect(body.lastSubmissionError).toContain("Unauthorized")
    expect(body.lastSubmissionErrorCategory).toBe("reauth_required")
    expect(body.lastSubmissionNextStep).toContain("Reautentifică")
  })

  it("marchează operațional când ultima execuție a ajuns la ANAF", async () => {
    process.env.ANAF_CLIENT_ID = "test-id"
    process.env.ANAF_CLIENT_SECRET = "test-secret"
    process.env.ANAF_CUI = "RO12345678"
    mocks.getAnafModeMock.mockReturnValue("test")
    mocks.getAnafEnvironmentMock.mockReturnValue("test")
    mocks.readStateForOrgMock.mockResolvedValue({
      ...BASE_STATE,
      efacturaConnected: true,
      efacturaSyncedAtISO: new Date().toISOString(),
    })
    mocks.loadTokenFromSupabaseMock.mockResolvedValue({
      orgId: "org-1",
      accessToken: "token",
      refreshToken: "refresh",
      expiresAtISO: "2099-03-17T10:00:00.000Z",
      tokenType: "Bearer",
      scope: "SPV",
      createdAtISO: "2026-03-17T09:00:00.000Z",
      lastUsedAtISO: "2026-04-02T08:03:00.000Z",
    })
    mocks.listSubmissionsMock.mockResolvedValue([
      {
        id: "sub-2",
        orgId: "org-1",
        invoiceId: "TEST-OK",
        xmlSnippet: "<xml />",
        cif: "RO12345678",
        approvalActionId: "approval-2",
        status: "ok",
        indexDescarcare: "index-123",
        anafStatus: "ok",
        anafMessage: "Factura a fost acceptată.",
        downloadId: "download-1",
        createdAtISO: "2026-04-02T08:00:00.000Z",
        submittedAtISO: "2026-04-02T08:01:00.000Z",
        resolvedAtISO: "2026-04-02T08:02:00.000Z",
        sourceFindingId: null,
        errorDetail: null,
      },
    ])

    const res = await GET(new Request("http://localhost/api/integrations/efactura/status"))
    const body = await res.json()

    expect(body.operationalState).toBe("operational")
    expect(body.canAttemptUpload).toBe(true)
    expect(body.lastSubmissionStatus).toBe("ok")
  })

  it("diagnostichează draft_missing și arată următorul pas corect", async () => {
    process.env.ANAF_CLIENT_ID = "test-id"
    process.env.ANAF_CLIENT_SECRET = "test-secret"
    process.env.ANAF_CUI = "RO12345678"
    mocks.getAnafModeMock.mockReturnValue("test")
    mocks.getAnafEnvironmentMock.mockReturnValue("test")
    mocks.readStateForOrgMock.mockResolvedValue({
      ...BASE_STATE,
      efacturaConnected: true,
      efacturaSyncedAtISO: new Date().toISOString(),
    })
    mocks.loadTokenFromSupabaseMock.mockResolvedValue({
      orgId: "org-1",
      accessToken: "token",
      refreshToken: "refresh",
      expiresAtISO: "2099-03-17T10:00:00.000Z",
      tokenType: "Bearer",
      scope: "SPV",
      createdAtISO: "2026-03-17T09:00:00.000Z",
      lastUsedAtISO: null,
    })
    mocks.listSubmissionsMock.mockResolvedValue([
      {
        id: "sub-draft",
        orgId: "org-1",
        invoiceId: "TEST-DRAFT",
        xmlSnippet: "<xml />",
        cif: "RO12345678",
        approvalActionId: "approval-draft",
        status: "error",
        indexDescarcare: null,
        anafStatus: null,
        anafMessage: null,
        downloadId: null,
        createdAtISO: "2026-04-02T08:00:00.000Z",
        submittedAtISO: null,
        resolvedAtISO: "2026-04-02T08:01:30.000Z",
        sourceFindingId: null,
        errorDetail: "XML-ul nu mai este disponibil. Reinițiază transmiterea.",
      },
    ])

    const res = await GET(new Request("http://localhost/api/integrations/efactura/status"))
    const body = await res.json()

    expect(body.operationalState).toBe("attention_required")
    expect(body.lastSubmissionErrorCategory).toBe("draft_missing")
    expect(body.lastSubmissionNextStep).toContain("Reinițiază")
    expect(body.statusDetail).toContain("XML-ul original")
  })

  it("diagnostichează service_unavailable când ANAF sau rețeaua nu răspunde stabil", async () => {
    process.env.ANAF_CLIENT_ID = "test-id"
    process.env.ANAF_CLIENT_SECRET = "test-secret"
    process.env.ANAF_CUI = "RO12345678"
    mocks.getAnafModeMock.mockReturnValue("test")
    mocks.getAnafEnvironmentMock.mockReturnValue("test")
    mocks.readStateForOrgMock.mockResolvedValue({
      ...BASE_STATE,
      efacturaConnected: true,
      efacturaSyncedAtISO: new Date().toISOString(),
    })
    mocks.loadTokenFromSupabaseMock.mockResolvedValue({
      orgId: "org-1",
      accessToken: "token",
      refreshToken: "refresh",
      expiresAtISO: "2099-03-17T10:00:00.000Z",
      tokenType: "Bearer",
      scope: "SPV",
      createdAtISO: "2026-03-17T09:00:00.000Z",
      lastUsedAtISO: null,
    })
    mocks.listSubmissionsMock.mockResolvedValue([
      {
        id: "sub-net",
        orgId: "org-1",
        invoiceId: "TEST-NET",
        xmlSnippet: "<xml />",
        cif: "RO12345678",
        approvalActionId: "approval-net",
        status: "error",
        indexDescarcare: null,
        anafStatus: null,
        anafMessage: null,
        downloadId: null,
        createdAtISO: "2026-04-02T08:00:00.000Z",
        submittedAtISO: "2026-04-02T08:01:00.000Z",
        resolvedAtISO: "2026-04-02T08:01:30.000Z",
        sourceFindingId: null,
        errorDetail: "fetch failed",
      },
    ])

    const res = await GET(new Request("http://localhost/api/integrations/efactura/status"))
    const body = await res.json()

    expect(body.operationalState).toBe("attention_required")
    expect(body.lastSubmissionErrorCategory).toBe("service_unavailable")
    expect(body.lastSubmissionNextStep).toContain("mai târziu")
    expect(body.statusDetail).toContain("nu a răspuns stabil")
  })

  it("include mesaj clar pentru fiecare mod", async () => {
    const res = await GET(new Request("http://localhost/api/integrations/efactura/status"))
    const body = await res.json()
    expect(body.message).toContain("demo")

    mocks.getAnafModeMock.mockReturnValue("real")
    mocks.getAnafEnvironmentMock.mockReturnValue("prod")
    mocks.isAnafProductionUnlockedMock.mockReturnValue(true)
    process.env.ANAF_CLIENT_ID = "x"
    process.env.ANAF_CLIENT_SECRET = "y"
    process.env.ANAF_CUI = "z"
    const res2 = await GET(new Request("http://localhost/api/integrations/efactura/status"))
    const body2 = await res2.json()
    expect(body2.message).toContain("real")
  })
})
