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
  readSessionFromRequestMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  readSessionFromRequest: mocks.readSessionFromRequestMock,
}))

import { GET } from "./route"

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returneaza user null fara cookie", async () => {
    const response = await GET(new Request("http://localhost/api/auth/me"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.user).toBeNull()
    expect(mocks.readSessionFromRequestMock).toHaveBeenCalledTimes(1)
  })

  it("returneaza user null pentru token invalid", async () => {
    mocks.readSessionFromRequestMock.mockReturnValueOnce(null)

    const response = await GET(
      new Request("http://localhost/api/auth/me", {
        headers: { cookie: "compliscan_session=bad-token" },
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.user).toBeNull()
  })

  it("returneaza userul din sesiune valida", async () => {
    mocks.readSessionFromRequestMock.mockReturnValueOnce({
      email: "demo@site.ro",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "compliance",
    })

    const response = await GET(
      new Request("http://localhost/api/auth/me", {
        headers: { cookie: "compliscan_session=signed-token" },
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.user).toEqual({
      email: "demo@site.ro",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "compliance",
      membershipId: null,
    })
  })

  it("mapeaza erorile neasteptate", async () => {
    mocks.readSessionFromRequestMock.mockImplementationOnce(() => {
      throw new Error("token verify crashed")
    })

    const response = await GET(
      new Request("http://localhost/api/auth/me", {
        headers: { cookie: "compliscan_session=signed-token" },
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.code).toBe("AUTH_SESSION_FAILED")
    expect(payload.user).toBeNull()
  })

  it("mapeaza erorile de autorizare controlat", async () => {
    mocks.readSessionFromRequestMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await GET(
      new Request("http://localhost/api/auth/me", {
        headers: { cookie: "compliscan_session=signed-token" },
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
    expect(payload.user).toBeNull()
  })
})
