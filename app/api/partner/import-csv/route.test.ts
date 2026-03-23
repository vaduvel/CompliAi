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
  requireFreshRoleMock: vi.fn(),
  getUserModeMock: vi.fn(),
  listUserMembershipsMock: vi.fn(),
  createOrganizationForExistingUserMock: vi.fn(),
  createClaimInviteMock: vi.fn(),
  evaluateApplicabilityMock: vi.fn(),
  getPartnerAccountPlanStatusMock: vi.fn(),
  hasLegacyPartnerOrgPlanMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
  getUserMode: mocks.getUserModeMock,
  listUserMemberships: mocks.listUserMembershipsMock,
  createOrganizationForExistingUser: mocks.createOrganizationForExistingUserMock,
}))

vi.mock("@/lib/server/claim-ownership", () => ({
  createClaimInvite: mocks.createClaimInviteMock,
}))

vi.mock("@/lib/compliance/applicability", () => ({
  evaluateApplicability: mocks.evaluateApplicabilityMock,
}))

vi.mock("@/lib/server/plan", () => ({
  getPartnerAccountPlanStatus: mocks.getPartnerAccountPlanStatusMock,
  hasLegacyPartnerOrgPlan: mocks.hasLegacyPartnerOrgPlanMock,
}))

import { POST } from "./route"

describe("POST /api/partner/import-csv", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-partner",
      orgId: "org-consulting",
      orgName: "Consulting Hub",
      email: "consultant@example.com",
      role: "partner_manager",
    })
    mocks.getUserModeMock.mockResolvedValue("partner")
    mocks.createOrganizationForExistingUserMock.mockResolvedValue({
      orgId: "org-client",
      orgName: "Client SRL",
      membershipId: "membership-client",
    })
    mocks.listUserMembershipsMock.mockResolvedValue([
      {
        membershipId: "membership-consulting",
        orgId: "org-consulting",
        orgName: "Consulting Hub",
        role: "partner_manager",
        status: "active",
      },
    ])
    mocks.hasLegacyPartnerOrgPlanMock.mockResolvedValue(false)
    mocks.getPartnerAccountPlanStatusMock.mockResolvedValue({
      planType: "partner_25",
      maxOrgs: 25,
      currentOrgs: 1,
      canAddOrg: true,
      hasStripeCustomer: true,
      hasActiveSubscription: true,
      updatedAtISO: "2026-03-23T10:00:00.000Z",
      source: "account",
    })
    mocks.createClaimInviteMock.mockResolvedValue({
      id: "claim-1",
      orgId: "org-client",
      invitedEmail: "ceo@client.ro",
    })
    mocks.evaluateApplicabilityMock.mockReturnValue({
      tags: ["gdpr", "nis2"],
    })
  })

  it("importa un client si pregateste claim invite", async () => {
    const response = await POST(
      new Request("http://localhost/api/partner/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: "orgName,cui,sector,employeeCount,email\nClient SRL,RO12345678,professional-services,10-49,ceo@client.ro",
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.imported).toBe(1)
    expect(payload.errors).toEqual([])
    expect(mocks.createOrganizationForExistingUserMock).toHaveBeenCalledWith(
      "user-partner",
      "Client SRL",
      "partner_manager"
    )
    expect(mocks.createClaimInviteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-client",
        invitedEmail: "ceo@client.ro",
        invitedByUserId: "user-partner",
      })
    )
  })

  it("blocheaza importul daca userul nu este in modul partner", async () => {
    mocks.getUserModeMock.mockResolvedValueOnce("solo")

    const response = await POST(
      new Request("http://localhost/api/partner/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: "Client SRL,RO12345678,professional-services,10-49,ceo@client.ro",
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("PORTFOLIO_FORBIDDEN")
    expect(mocks.createOrganizationForExistingUserMock).not.toHaveBeenCalled()
  })

  it("blocheaza importul cand limita planului este atinsa", async () => {
    mocks.getPartnerAccountPlanStatusMock.mockResolvedValueOnce({
      planType: "partner_10",
      maxOrgs: 10,
      currentOrgs: 10,
      canAddOrg: false,
      hasStripeCustomer: true,
      hasActiveSubscription: true,
      updatedAtISO: "2026-03-23T10:00:00.000Z",
      source: "account",
    })

    const response = await POST(
      new Request("http://localhost/api/partner/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: "Client SRL,RO12345678,professional-services,10-49,ceo@client.ro",
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("PARTNER_PLAN_LIMIT_REACHED")
    expect(mocks.createOrganizationForExistingUserMock).not.toHaveBeenCalled()
  })
})
