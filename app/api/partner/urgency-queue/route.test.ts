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
  buildPortfolioAlertRows: mocks.buildPortfolioAlertRowsMock,
}))

import { GET } from "./route"

describe("GET /api/partner/urgency-queue", () => {
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
    mocks.loadPortfolioBundlesMock.mockResolvedValue([
      {
        membership: { orgId: "org-1", orgName: "Client One" },
        state: {
          findings: [
            {
              id: "finding-1",
              title: "Incident critic",
              severity: "critical",
              category: "NIS2",
              legalReference: "Art. 21",
            },
          ],
        },
      },
    ])
    mocks.buildPortfolioAlertRowsMock.mockReturnValue([])
  })

  it("returnează coada de urgențe ordonată", async () => {
    const response = await GET(new Request("http://localhost/api/partner/urgency-queue"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.total).toBe(1)
    expect(payload.items[0]).toEqual(
      expect.objectContaining({
        orgId: "org-1",
        title: "Incident critic",
        severity: "critical",
      })
    )
  })
})
