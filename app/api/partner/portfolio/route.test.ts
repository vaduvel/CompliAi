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
  resolveUserModeMock: vi.fn(),
  listAccessiblePortfolioMembershipsMock: vi.fn(),
  loadPortfolioBundlesMock: vi.fn(),
  buildPortfolioOverviewRowsMock: vi.fn(),
  buildPortfolioAlertRowsMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
  resolveUserMode: mocks.resolveUserModeMock,
}))

vi.mock("@/lib/server/portfolio", () => ({
  listAccessiblePortfolioMemberships: mocks.listAccessiblePortfolioMembershipsMock,
  loadPortfolioBundles: mocks.loadPortfolioBundlesMock,
  buildPortfolioOverviewRows: mocks.buildPortfolioOverviewRowsMock,
  buildPortfolioAlertRows: mocks.buildPortfolioAlertRowsMock,
}))

import { GET } from "./route"

describe("GET /api/partner/portfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-partner",
      orgName: "Partner Org",
      email: "partner@example.com",
      role: "partner_manager",
      userMode: "partner",
    })
    mocks.resolveUserModeMock.mockResolvedValue("partner")
    mocks.listAccessiblePortfolioMembershipsMock.mockResolvedValue([{ orgId: "org-1", orgName: "Client One" }])
    mocks.loadPortfolioBundlesMock.mockResolvedValue([{ membership: { orgId: "org-1", orgName: "Client One" }, state: {} }])
    mocks.buildPortfolioOverviewRowsMock.mockReturnValue([
      {
        orgId: "org-1",
        orgName: "Client One",
        compliance: { hasData: true, score: 81, criticalFindings: 1, openAlerts: 2, activeDsarCount: 0 },
      },
    ])
    mocks.buildPortfolioAlertRowsMock.mockReturnValue([
      { orgId: "org-1", orgName: "Client One", alertId: "alert-1", title: "Alert", severity: "critical", framework: "GDPR" },
    ])
  })

  it("cere sesiune fresh", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Autentificare necesară.", 401, "UNAUTHORIZED")
    )

    const response = await GET(new Request("http://localhost/api/partner/portfolio"))
    expect(response.status).toBe(401)
  })

  it("returnează sumarul de portofoliu pentru partner", async () => {
    const response = await GET(new Request("http://localhost/api/partner/portfolio"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.totalClients).toBe(1)
    expect(payload.criticalCount).toBe(1)
    expect(payload.avgScore).toBe(81)
    expect(mocks.listAccessiblePortfolioMembershipsMock).toHaveBeenCalled()
  })
})
