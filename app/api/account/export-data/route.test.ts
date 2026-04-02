import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string

    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  computeDashboardSummaryMock: vi.fn(),
  normalizeComplianceStateMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: mocks.readNis2StateMock,
}))

vi.mock("@/lib/compliance/engine", async () => {
  const actual = await vi.importActual<typeof import("@/lib/compliance/engine")>(
    "@/lib/compliance/engine"
  )
  return {
    ...actual,
    computeDashboardSummary: mocks.computeDashboardSummaryMock,
    normalizeComplianceState: mocks.normalizeComplianceStateMock,
  }
})

import { GET } from "./route"

describe("GET /api/account/export-data", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      findings: [],
      scans: [],
      generatedDocuments: [],
      aiSystems: [],
      alerts: [],
      events: [],
      orgProfile: { sector: "retail" },
      orgProfilePrefill: { companyName: "Org Demo" },
    })
    mocks.readNis2StateMock.mockResolvedValue({ vendors: [], incidents: [] })
    mocks.computeDashboardSummaryMock.mockReturnValue({ score: 91, riskLabel: "low" })
    mocks.normalizeComplianceStateMock.mockImplementation((value: unknown) => value)
  })

  it("cere sesiune fresh și exportă datele din org-ul activ", async () => {
    const response = await GET(new Request("http://localhost/api/account/export-data"))
    const payload = JSON.parse(await response.text())

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-1", "Org Demo")
    expect(payload._meta.orgId).toBe("org-1")
    expect(payload.profile.email).toBe("owner@example.com")
  })

  it("propagă eroarea de autentificare", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValue(
      new mocks.AuthzErrorMock("Autentificare necesară.", 401, "UNAUTHORIZED")
    )

    const response = await GET(new Request("http://localhost/api/account/export-data"))
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("UNAUTHORIZED")
  })
})
