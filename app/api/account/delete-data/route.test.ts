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
  writeStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  writeStateForOrg: mocks.writeStateForOrgMock,
}))

import { POST } from "./route"

describe("POST /api/account/delete-data", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.writeStateForOrgMock.mockResolvedValue(undefined)
  })

  it("șterge datele în org-ul activ și scrie state-ul resetat explicit pe org", async () => {
    const response = await POST(
      new Request("http://localhost/api/account/delete-data", {
        method: "POST",
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(mocks.writeStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({
        events: expect.any(Array),
      }),
      "Org Demo"
    )
  })

  it("propagă eroarea de autorizare", async () => {
    mocks.requireFreshRoleMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    )

    const response = await POST(
      new Request("http://localhost/api/account/delete-data", {
        method: "POST",
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
