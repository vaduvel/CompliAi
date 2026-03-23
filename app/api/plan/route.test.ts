import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshAuthenticatedSessionMock: vi.fn(),
  getUserModeMock: vi.fn(),
  listUserMembershipsMock: vi.fn(),
  getOrgPlanMock: vi.fn(),
  getOrgPlanRecordMock: vi.fn(),
  getPartnerAccountPlanStatusMock: vi.fn(),
  hasLegacyPartnerOrgPlanMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
  getUserMode: mocks.getUserModeMock,
  listUserMemberships: mocks.listUserMembershipsMock,
}))

vi.mock("@/lib/server/plan", () => ({
  getOrgPlan: mocks.getOrgPlanMock,
  getOrgPlanRecord: mocks.getOrgPlanRecordMock,
  getPartnerAccountPlanStatus: mocks.getPartnerAccountPlanStatusMock,
  hasLegacyPartnerOrgPlan: mocks.hasLegacyPartnerOrgPlanMock,
}))

import { GET } from "./route"

describe("GET /api/plan", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      email: "partner@example.com",
      orgName: "Cabinet Elena",
      role: "partner_manager",
    })
    mocks.getOrgPlanMock.mockResolvedValue("pro")
    mocks.getOrgPlanRecordMock.mockResolvedValue({
      orgId: "org-1",
      plan: "pro",
      updatedAtISO: "2026-03-23T10:00:00.000Z",
      stripeCustomerId: "cus_org",
      stripeSubscriptionId: "sub_org",
    })
    mocks.listUserMembershipsMock.mockResolvedValue([
      { membershipId: "m-1", orgId: "org-1", orgName: "Cabinet Elena", role: "partner_manager", createdAtISO: "2026-03-01T00:00:00.000Z", status: "active" },
      { membershipId: "m-2", orgId: "org-2", orgName: "Client SRL", role: "partner_manager", createdAtISO: "2026-03-02T00:00:00.000Z", status: "active" },
    ])
    mocks.hasLegacyPartnerOrgPlanMock.mockResolvedValue(false)
  })

  it("returneaza si contractul de partner account billing pentru user partner", async () => {
    mocks.getUserModeMock.mockResolvedValue("partner")
    mocks.getPartnerAccountPlanStatusMock.mockResolvedValue({
      planType: "partner_25",
      maxOrgs: 25,
      currentOrgs: 2,
      canAddOrg: true,
      hasStripeCustomer: true,
      hasActiveSubscription: true,
      updatedAtISO: "2026-03-23T11:00:00.000Z",
      source: "account",
    })

    const response = await GET(new Request("http://localhost/api/plan"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.plan).toBe("pro")
    expect(payload.userMode).toBe("partner")
    expect(payload.planType).toBe("partner_25")
    expect(payload.maxOrgs).toBe(25)
    expect(payload.currentOrgs).toBe(2)
    expect(payload.canAddOrg).toBe(true)
    expect(payload.canManageOrgBilling).toBe(false)
    expect(payload.canManagePartnerBilling).toBe(true)
  })

  it("ramane compatibil pentru user non-partner", async () => {
    mocks.getUserModeMock.mockResolvedValue("solo")
    mocks.getPartnerAccountPlanStatusMock.mockResolvedValue({
      planType: null,
      maxOrgs: null,
      currentOrgs: 1,
      canAddOrg: false,
      hasStripeCustomer: false,
      hasActiveSubscription: false,
      updatedAtISO: null,
      source: "none",
    })

    const response = await GET(new Request("http://localhost/api/plan"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.userMode).toBe("solo")
    expect(payload.planType).toBeNull()
    expect(payload.billingScope).toBe("org")
    expect(payload.canManagePartnerBilling).toBe(false)
  })
})
