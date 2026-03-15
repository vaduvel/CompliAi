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
  listUserMembershipsMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
  listUserMemberships: mocks.listUserMembershipsMock,
}))

import { GET } from "./route"

describe("GET /api/auth/memberships", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Alpha",
      email: "owner@site.ro",
      role: "owner",
      membershipId: "membership-1",
    })
  })

  it("returneaza membership-urile utilizatorului", async () => {
    mocks.listUserMembershipsMock.mockResolvedValueOnce([
      {
        membershipId: "membership-1",
        orgId: "org-1",
        orgName: "Org Alpha",
        role: "owner",
        createdAtISO: "2026-03-13T10:00:00.000Z",
        status: "active",
      },
      {
        membershipId: "membership-2",
        orgId: "org-2",
        orgName: "Org Beta",
        role: "reviewer",
        createdAtISO: "2026-03-13T10:05:00.000Z",
        status: "active",
      },
    ])

    const response = await GET(new Request("http://localhost/api/auth/memberships"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.memberships).toHaveLength(2)
    expect(payload.currentMembershipId).toBe("membership-1")
    expect(mocks.listUserMembershipsMock).toHaveBeenCalledWith("user-1")
  })

  it("respinge fara sesiune valida", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Ai nevoie de sesiune.", 401, "AUTH_SESSION_REQUIRED")
    )

    const response = await GET(new Request("http://localhost/api/auth/memberships"))
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("AUTH_SESSION_REQUIRED")
  })
})
