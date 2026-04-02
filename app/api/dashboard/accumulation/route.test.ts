import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorClass: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  loadEvidenceLedgerFromSupabaseMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorClass,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: mocks.readNis2StateMock,
}))

vi.mock("@/lib/server/supabase-evidence-read", () => ({
  loadEvidenceLedgerFromSupabase: mocks.loadEvidenceLedgerFromSupabaseMock,
}))

import { GET } from "./route"

describe("GET /api/dashboard/accumulation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      orgId: "org-session",
      orgName: "Session Org",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readStateForOrgMock.mockResolvedValue({
      snapshotHistory: [{ generatedAt: "2026-03-01T10:00:00.000Z" }],
      scans: [{ createdAtISO: "2026-03-02T10:00:00.000Z" }],
      generatedDocuments: [{ id: "doc-1" }, { id: "doc-2" }],
    })
    mocks.readNis2StateMock.mockResolvedValue({ vendors: [{ id: "vendor-1" }], incidents: [] })
    mocks.loadEvidenceLedgerFromSupabaseMock.mockResolvedValue([{ id: "ev-1" }, { id: "ev-2" }])
  })

  it("agregă datele pe org-ul sesiunii", async () => {
    const response = await GET(new Request("http://localhost/api/dashboard/accumulation"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readStateForOrgMock).toHaveBeenCalledWith("org-session")
    expect(mocks.readNis2StateMock).toHaveBeenCalledWith("org-session")
    expect(mocks.loadEvidenceLedgerFromSupabaseMock).toHaveBeenCalledWith({ orgId: "org-session" })
    expect(body).toEqual(
      expect.objectContaining({
        dovediiSalvate: 2,
        rapoarteGenerate: 2,
        furnizoriMonitorizati: 1,
      })
    )
  })

  it("refuză accesul fără sesiune activă", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorClass("Ai nevoie de sesiune activa.")
    )

    const response = await GET(new Request("http://localhost/api/dashboard/accumulation"))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.code).toBe("AUTH_SESSION_REQUIRED")
  })
})
