import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readFreshSessionFromRequestMock: vi.fn(),
  listUserMembershipsMock: vi.fn(),
  getOrganizationOwnershipMock: vi.fn(),
  getActiveClaimInviteForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  readFreshSessionFromRequest: mocks.readFreshSessionFromRequestMock,
  listUserMemberships: mocks.listUserMembershipsMock,
  getOrganizationOwnership: mocks.getOrganizationOwnershipMock,
}))

vi.mock("@/lib/server/claim-ownership", () => ({
  getActiveClaimInviteForOrg: mocks.getActiveClaimInviteForOrgMock,
}))

import { GET } from "./route"

describe("GET /api/auth/claim-status/[orgId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readFreshSessionFromRequestMock.mockResolvedValue({
      userId: "user-pm",
      orgId: "org-1",
      email: "consultant@site.ro",
      orgName: "Client SRL",
      role: "partner_manager",
      membershipId: "membership-pm",
      workspaceMode: "org",
    })
    mocks.listUserMembershipsMock.mockResolvedValue([
      {
        membershipId: "membership-pm",
        orgId: "org-1",
        orgName: "Client SRL",
        role: "partner_manager",
        status: "active",
      },
    ])
    mocks.getOrganizationOwnershipMock.mockResolvedValue({
      orgId: "org-1",
      orgName: "Client SRL",
      ownerState: "system",
      owner: { type: "system", label: "system" },
    })
    mocks.getActiveClaimInviteForOrgMock.mockResolvedValue(null)
  })

  it("returneaza ownership si invite pending pentru membru activ", async () => {
    mocks.getActiveClaimInviteForOrgMock.mockResolvedValueOnce({
      id: "claim-1",
      orgId: "org-1",
      orgName: "Client SRL",
      invitedEmail: "ceo@client.ro",
      createdAtISO: "2026-03-23T10:00:00.000Z",
      expiresAtISO: "2026-03-30T10:00:00.000Z",
      token: "claim-token",
      claimUrl: "http://localhost:3000/claim?token=claim-token",
      status: "pending",
    })

    const response = await GET(
      new Request("http://localhost/api/auth/claim-status/org-1"),
      { params: Promise.resolve({ orgId: "org-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ownership.ownerState).toBe("system")
    expect(payload.pendingInvite.invitedEmail).toBe("ceo@client.ro")
  })

  it("blocheaza accesul fara membership activ", async () => {
    mocks.listUserMembershipsMock.mockResolvedValueOnce([])

    const response = await GET(
      new Request("http://localhost/api/auth/claim-status/org-1"),
      { params: Promise.resolve({ orgId: "org-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
