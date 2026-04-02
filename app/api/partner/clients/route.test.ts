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
  listAccessiblePortfolioMembershipsMock: vi.fn(),
  loadPortfolioBundlesMock: vi.fn(),
  buildPortfolioOverviewRowsMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/portfolio", () => ({
  listAccessiblePortfolioMemberships: mocks.listAccessiblePortfolioMembershipsMock,
  loadPortfolioBundles: mocks.loadPortfolioBundlesMock,
  buildPortfolioOverviewRows: mocks.buildPortfolioOverviewRowsMock,
}))

import { GET } from "./route"

describe("GET /api/partner/clients", () => {
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
    mocks.listAccessiblePortfolioMembershipsMock.mockResolvedValue([{ orgId: "org-1", orgName: "Client One" }])
    mocks.loadPortfolioBundlesMock.mockResolvedValue([{ membership: { orgId: "org-1", orgName: "Client One" }, state: {} }])
    mocks.buildPortfolioOverviewRowsMock.mockReturnValue([{ orgId: "org-1", orgName: "Client One" }])
  })

  it("returnează lista de clienți pentru sesiunea fresh", async () => {
    const response = await GET(new Request("http://localhost/api/partner/clients"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      clients: [{ orgId: "org-1", orgName: "Client One" }],
      total: 1,
    })
  })
})
