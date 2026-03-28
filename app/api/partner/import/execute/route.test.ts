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
  resolveUserModeMock: vi.fn(),
  listUserMembershipsMock: vi.fn(),
  createOrganizationForExistingUserMock: vi.fn(),
  createClaimInviteMock: vi.fn(),
  evaluateApplicabilityMock: vi.fn(),
  getPartnerAccountPlanStatusMock: vi.fn(),
  hasLegacyPartnerOrgPlanMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  writeStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
  resolveUserMode: mocks.resolveUserModeMock,
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

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
  writeStateForOrg: mocks.writeStateForOrgMock,
}))

import { POST } from "./route"

describe("POST /api/partner/import/execute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-partner",
      orgId: "org-consulting",
      orgName: "Consulting Hub",
      email: "consultant@example.com",
      role: "partner_manager",
    })
    mocks.resolveUserModeMock.mockResolvedValue("partner")
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
      planType: null,
      maxOrgs: 3,
      currentOrgs: 1,
      canAddOrg: true,
      hasStripeCustomer: false,
      hasActiveSubscription: false,
      updatedAtISO: null,
      source: "trial",
    })
    mocks.createOrganizationForExistingUserMock.mockResolvedValue({
      orgId: "org-client",
      orgName: "Client SRL",
      membershipId: "membership-client",
    })
    mocks.createClaimInviteMock.mockResolvedValue({
      id: "claim-1",
      orgId: "org-client",
      invitedEmail: "ceo@client.ro",
    })
    mocks.evaluateApplicabilityMock.mockReturnValue({
      tags: ["gdpr", "nis2"],
    })
    mocks.readStateForOrgMock.mockResolvedValue({
      orgId: "org-client",
      findings: [],
      generatedDocuments: [],
    })
    mocks.writeStateForOrgMock.mockResolvedValue(undefined)
  })

  it("permite importul în trialul partner pentru primele firme", async () => {
    const response = await POST(
      new Request("http://localhost/api/partner/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: [
            {
              orgName: "Client SRL",
              cui: "RO12345678",
              sector: "professional-services",
              employeeCount: "10-49",
              email: "ceo@client.ro",
            },
          ],
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.imported).toBe(1)
    expect(mocks.createOrganizationForExistingUserMock).toHaveBeenCalledWith(
      "user-partner",
      "Client SRL",
      "partner_manager"
    )
  })

  it("blochează trialul când limita de firme este atinsă", async () => {
    mocks.getPartnerAccountPlanStatusMock.mockResolvedValueOnce({
      planType: null,
      maxOrgs: 3,
      currentOrgs: 3,
      canAddOrg: false,
      hasStripeCustomer: false,
      hasActiveSubscription: false,
      updatedAtISO: null,
      source: "trial",
    })

    const response = await POST(
      new Request("http://localhost/api/partner/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: [
            {
              orgName: "Client SRL",
              cui: "RO12345678",
              sector: "professional-services",
              employeeCount: "10-49",
              email: "ceo@client.ro",
            },
          ],
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("PARTNER_TRIAL_LIMIT_REACHED")
    expect(mocks.createOrganizationForExistingUserMock).not.toHaveBeenCalled()
  })
})
