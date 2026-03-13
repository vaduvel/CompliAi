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
  requireRoleMock: vi.fn(),
  listOrganizationMembersMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
  listOrganizationMembers: mocks.listOrganizationMembersMock,
}))

import { GET } from "./route"

describe("GET /api/auth/members", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@site.ro",
      role: "owner",
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
    mocks.requireRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await GET(new Request("http://localhost/api/auth/members"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
