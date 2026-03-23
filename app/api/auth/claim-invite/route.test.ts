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
  getOrganizationOwnershipMock: vi.fn(),
  createClaimInviteMock: vi.fn(),
  mutateStateMock: vi.fn(),
  appendComplianceEventsMock: vi.fn(),
  createComplianceEventMock: vi.fn(),
  eventActorFromSessionMock: vi.fn(),
  formatEventActorLabelMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
  getOrganizationOwnership: mocks.getOrganizationOwnershipMock,
}))

vi.mock("@/lib/server/claim-ownership", () => ({
  createClaimInvite: mocks.createClaimInviteMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: mocks.mutateStateMock,
}))

vi.mock("@/lib/compliance/events", () => ({
  appendComplianceEvents: mocks.appendComplianceEventsMock,
  createComplianceEvent: mocks.createComplianceEventMock,
}))

vi.mock("@/lib/server/event-actor", () => ({
  eventActorFromSession: mocks.eventActorFromSessionMock,
  formatEventActorLabel: mocks.formatEventActorLabelMock,
}))

import { POST } from "./route"

describe("POST /api/auth/claim-invite", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-pm",
      orgId: "org-1",
      orgName: "Client SRL",
      email: "consultant@site.ro",
      role: "partner_manager",
    })
    mocks.getOrganizationOwnershipMock.mockResolvedValue({
      orgId: "org-1",
      orgName: "Client SRL",
      ownerState: "system",
      owner: { type: "system", label: "system" },
    })
    mocks.createClaimInviteMock.mockResolvedValue({
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
    mocks.eventActorFromSessionMock.mockReturnValue({
      id: "user-pm",
      label: "consultant@site.ro",
      role: "partner_manager",
      source: "session",
    })
    mocks.formatEventActorLabelMock.mockReturnValue("consultant@site.ro (partner_manager)")
    mocks.createComplianceEventMock.mockReturnValue({ id: "evt-claim" })
    mocks.appendComplianceEventsMock.mockReturnValue([{ id: "evt-claim" }])
    mocks.mutateStateMock.mockImplementation(async (updater: (current: { events: unknown[] }) => unknown) => {
      updater({ events: [] })
      return { events: [] }
    })
  })

  it("creeaza invitatia de claim pentru org neclaim-uit", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/claim-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ceo@client.ro" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.ok).toBe(true)
    expect(payload.invite.invitedEmail).toBe("ceo@client.ro")
    expect(mocks.createClaimInviteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-1",
        invitedEmail: "ceo@client.ro",
      })
    )
  })

  it("blocheaza claim-ul cand exista deja owner real", async () => {
    mocks.getOrganizationOwnershipMock.mockResolvedValueOnce({
      orgId: "org-1",
      orgName: "Client SRL",
      ownerState: "claimed",
      owner: {
        type: "user",
        membershipId: "membership-owner",
        userId: "user-owner",
        email: "owner@client.ro",
        createdAtISO: "2026-03-23T09:00:00.000Z",
      },
    })

    const response = await POST(
      new Request("http://localhost/api/auth/claim-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ceo@client.ro" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.code).toBe("CLAIM_ALREADY_OWNED")
  })
})
