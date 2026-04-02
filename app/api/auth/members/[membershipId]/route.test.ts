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
  deactivateOrganizationMemberMock: vi.fn(),
  updateOrganizationMemberRoleMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  appendComplianceEventsMock: vi.fn(),
  createComplianceEventMock: vi.fn(),
  eventActorFromSessionMock: vi.fn(),
  formatEventActorLabelMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  deactivateOrganizationMember: mocks.deactivateOrganizationMemberMock,
  requireFreshRole: mocks.requireFreshRoleMock,
  updateOrganizationMemberRole: mocks.updateOrganizationMemberRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/compliance/events", () => ({
  appendComplianceEvents: mocks.appendComplianceEventsMock,
  createComplianceEvent: mocks.createComplianceEventMock,
}))

vi.mock("@/lib/server/event-actor", () => ({
  eventActorFromSession: mocks.eventActorFromSessionMock,
  formatEventActorLabel: mocks.formatEventActorLabelMock,
}))

import { DELETE, PATCH } from "./route"

describe("PATCH /api/auth/members/[membershipId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@site.ro",
      role: "owner",
    })
    mocks.eventActorFromSessionMock.mockReturnValue({
      id: "user-1",
      label: "owner@site.ro",
      role: "owner",
      source: "session",
    })
    mocks.formatEventActorLabelMock.mockReturnValue("owner@site.ro (owner)")
    mocks.createComplianceEventMock.mockReturnValue({ id: "evt-1" })
    mocks.appendComplianceEventsMock.mockReturnValue([{ id: "evt-1" }])
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId, updater: (current: { events: unknown[] }) => unknown) => {
      updater({ events: [] })
      return { events: [] }
    })
  })

  it("actualizeaza rolul membrului", async () => {
    mocks.updateOrganizationMemberRoleMock.mockResolvedValueOnce({
      membershipId: "membership-2",
      userId: "user-2",
      email: "reviewer@site.ro",
      role: "reviewer",
      createdAtISO: "2026-03-13T10:00:00.000Z",
      orgId: "org-1",
      orgName: "Org Demo",
    })

    const response = await PATCH(
      new Request("http://localhost/api/auth/members/membership-2", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "reviewer" }),
      }),
      { params: Promise.resolve({ membershipId: "membership-2" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.member.role).toBe("reviewer")
    expect(mocks.updateOrganizationMemberRoleMock).toHaveBeenCalledWith(
      "org-1",
      "membership-2",
      "reviewer"
    )
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
    expect(mocks.createComplianceEventMock).toHaveBeenCalledTimes(1)
    expect(mocks.appendComplianceEventsMock).toHaveBeenCalledTimes(1)
  })

  it("respinge rolurile invalide", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/auth/members/membership-2", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "super-admin" }),
      }),
      { params: Promise.resolve({ membershipId: "membership-2" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("AUTH_INVALID_ROLE")
  })

  it("respinge accesul pentru rol nepermis", async () => {
    mocks.requireFreshRoleMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    )

    const response = await PATCH(
      new Request("http://localhost/api/auth/members/membership-2", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "viewer" }),
      }),
      { params: Promise.resolve({ membershipId: "membership-2" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })

  it("respinge eliminarea ultimului owner", async () => {
    mocks.updateOrganizationMemberRoleMock.mockRejectedValueOnce(new Error("LAST_OWNER_REQUIRED"))

    const response = await PATCH(
      new Request("http://localhost/api/auth/members/membership-2", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "viewer" }),
      }),
      { params: Promise.resolve({ membershipId: "membership-2" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.code).toBe("AUTH_LAST_OWNER_REQUIRED")
  })

  it("permite owner-ului sa elimine consultantul", async () => {
    mocks.deactivateOrganizationMemberMock.mockResolvedValueOnce({
      membershipId: "membership-3",
      userId: "user-3",
      email: "consultant@site.ro",
      role: "partner_manager",
      createdAtISO: "2026-03-13T10:00:00.000Z",
      orgId: "org-1",
      orgName: "Org Demo",
    })

    const response = await DELETE(
      new Request("http://localhost/api/auth/members/membership-3", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ membershipId: "membership-3" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(mocks.deactivateOrganizationMemberMock).toHaveBeenCalledWith("org-1", "membership-3")
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
  })
})
