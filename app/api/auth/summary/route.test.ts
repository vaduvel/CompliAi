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
  listUserMembershipsMock: vi.fn(),
  readFreshSessionFromRequestMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  listUserMemberships: mocks.listUserMembershipsMock,
  readFreshSessionFromRequest: mocks.readFreshSessionFromRequestMock,
}))

import { GET } from "./route"

describe("GET /api/auth/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returneaza sumar gol fara sesiune", async () => {
    mocks.readFreshSessionFromRequestMock.mockResolvedValueOnce(null)

    const response = await GET(new Request("http://localhost/api/auth/summary"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      user: null,
      memberships: [],
      currentMembershipId: null,
      currentOrgId: null,
    })
  })

  it("returneaza userul fresh si membership-urile curente", async () => {
    mocks.readFreshSessionFromRequestMock.mockResolvedValueOnce({
      userId: "user-1",
      email: "demo@site.ro",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "compliance",
      membershipId: "membership-1",
    })
    mocks.listUserMembershipsMock.mockResolvedValueOnce([
      {
        membershipId: "membership-1",
        orgId: "org-1",
        orgName: "Org Demo",
        role: "compliance",
        createdAtISO: "2026-03-15T10:00:00.000Z",
        status: "active",
      },
    ])

    const response = await GET(new Request("http://localhost/api/auth/summary"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.listUserMembershipsMock).toHaveBeenCalledWith("user-1")
    expect(payload.user).toEqual({
      email: "demo@site.ro",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "compliance",
      membershipId: "membership-1",
    })
    expect(payload.currentMembershipId).toBe("membership-1")
    expect(payload.currentOrgId).toBe("org-1")
    expect(payload.memberships).toHaveLength(1)
  })

  it("mapeaza erorile de autorizare controlat", async () => {
    mocks.readFreshSessionFromRequestMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    )

    const response = await GET(new Request("http://localhost/api/auth/summary"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })

  it("mapeaza erorile neasteptate", async () => {
    mocks.readFreshSessionFromRequestMock.mockRejectedValueOnce(new Error("graph down"))

    const response = await GET(new Request("http://localhost/api/auth/summary"))
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.code).toBe("AUTH_SUMMARY_FETCH_FAILED")
  })
})
