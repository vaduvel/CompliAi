import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string

    constructor(message: string, status = 401, code = "AUTH_UNAUTHENTICATED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshAuthenticatedSessionMock: vi.fn(),
  listUserMembershipsMock: vi.fn(),
  deactivateOrganizationMemberMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  safeListReviewsMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
  listUserMemberships: mocks.listUserMembershipsMock,
  deactivateOrganizationMember: mocks.deactivateOrganizationMemberMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: mocks.readNis2StateMock,
}))

vi.mock("@/lib/server/vendor-review-store", () => ({
  safeListReviews: mocks.safeListReviewsMock,
}))

import { DELETE, GET } from "./route"

describe("/api/partner/clients/[orgId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "portfolio-org",
      orgName: "Partner Workspace",
      email: "owner@example.com",
      role: "partner_manager",
    })
    mocks.listUserMembershipsMock.mockResolvedValue([
      {
        membershipId: "mem-1",
        orgId: "org-client",
        orgName: "Client Org SRL",
        role: "reviewer",
        status: "active",
      },
    ])
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      findings: [],
      alerts: [],
      aiSystems: [],
      scannedDocuments: 0,
      gdprProgress: 0,
      highRisk: false,
      efacturaConnected: false,
    })
    mocks.readNis2StateMock.mockResolvedValue({
      dnscRegistrationStatus: "registered",
      incidents: [],
      vendors: [],
      assessment: null,
    })
    mocks.safeListReviewsMock.mockResolvedValue([])
    mocks.deactivateOrganizationMemberMock.mockResolvedValue(undefined)
  })

  it("citește clientul din membership și starea din org-ul cerut", async () => {
    const response = await GET(new Request("http://localhost/api/partner/clients/org-client"), {
      params: Promise.resolve({ orgId: "org-client" }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-client", "Client Org SRL")
    expect(payload.orgName).toBe("Client Org SRL")
  })

  it("dezactivează membership-ul clientului pentru org-ul cerut", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/partner/clients/org-client", { method: "DELETE" }),
      {
        params: Promise.resolve({ orgId: "org-client" }),
      }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ removed: true, orgId: "org-client" })
    expect(mocks.deactivateOrganizationMemberMock).toHaveBeenCalledWith(
      "org-client",
      "mem-1"
    )
  })
})
