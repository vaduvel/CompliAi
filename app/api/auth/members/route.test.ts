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
  listOrganizationMembersMock: vi.fn(),
  addOrganizationMemberByEmailMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  appendComplianceEventsMock: vi.fn(),
  createComplianceEventMock: vi.fn(),
  eventActorFromSessionMock: vi.fn(),
  formatEventActorLabelMock: vi.fn(),
}))

vi.mock("@/lib/compliance/events", () => ({
  appendComplianceEvents: mocks.appendComplianceEventsMock,
  createComplianceEvent: mocks.createComplianceEventMock,
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
  listOrganizationMembers: mocks.listOrganizationMembersMock,
  addOrganizationMemberByEmail: mocks.addOrganizationMemberByEmailMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/event-actor", () => ({
  eventActorFromSession: mocks.eventActorFromSessionMock,
  formatEventActorLabel: mocks.formatEventActorLabelMock,
}))

import { GET, POST } from "./route"

describe("/api/auth/members", () => {
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

  it("returneaza membrii organizatiei", async () => {
    mocks.listOrganizationMembersMock.mockResolvedValueOnce([
      {
        membershipId: "membership-1",
        userId: "user-1",
        email: "owner@site.ro",
        role: "owner",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        orgId: "org-1",
        orgName: "Org Demo",
      },
    ])

    const response = await GET(new Request("http://localhost/api/auth/members"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.members).toHaveLength(1)
    expect(payload.actorRole).toBe("owner")
    expect(mocks.listOrganizationMembersMock).toHaveBeenCalledWith("org-1")
  })

  it("respinge rolul nepermis", async () => {
    mocks.requireFreshRoleMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    )

    const response = await GET(new Request("http://localhost/api/auth/members"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })

  it("adauga un membru existent din workspace", async () => {
    mocks.addOrganizationMemberByEmailMock.mockResolvedValueOnce({
      membershipId: "membership-2",
      userId: "user-2",
      email: "reviewer@site.ro",
      role: "reviewer",
      createdAtISO: "2026-03-15T10:00:00.000Z",
      orgId: "org-1",
      orgName: "Org Demo",
    })

    const response = await POST(
      new Request("http://localhost/api/auth/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "reviewer@site.ro", role: "reviewer" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.ok).toBe(true)
    expect(payload.member.email).toBe("reviewer@site.ro")
    expect(mocks.addOrganizationMemberByEmailMock).toHaveBeenCalledWith(
      "org-1",
      "reviewer@site.ro",
      "reviewer"
    )
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
    expect(mocks.createComplianceEventMock).toHaveBeenCalledTimes(1)
  })

  it("valideaza emailul pentru adaugare", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid", role: "reviewer" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("AUTH_INVALID_EMAIL")
  })

  it("respinge utilizatorul inexistent in workspace", async () => {
    mocks.addOrganizationMemberByEmailMock.mockRejectedValueOnce(new Error("USER_NOT_FOUND"))

    const response = await POST(
      new Request("http://localhost/api/auth/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nou@site.ro", role: "viewer" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.code).toBe("AUTH_MEMBER_USER_NOT_FOUND")
  })
})
