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
  lookupOrgProfilePrefillByCuiMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/anaf-company-lookup", () => ({
  lookupOrgProfilePrefillByCui: mocks.lookupOrgProfilePrefillByCuiMock,
}))

import { GET } from "./route"

describe("GET /api/anaf/lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
  })

  it("cere autentificare", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Autentificare necesară.", 401, "UNAUTHORIZED")
    )

    const response = await GET(new Request("http://localhost/api/anaf/lookup?cui=RO123"))
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("UNAUTHORIZED")
  })

  it("returnează prefill-ul găsit", async () => {
    mocks.lookupOrgProfilePrefillByCuiMock.mockResolvedValue({
      legalName: "Demo Company SRL",
      county: "Bucuresti",
    })

    const response = await GET(new Request("http://localhost/api/anaf/lookup?cui=RO123"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.lookupOrgProfilePrefillByCuiMock).toHaveBeenCalledWith("RO123")
    expect(payload).toEqual({
      cui: "RO123",
      prefill: {
        legalName: "Demo Company SRL",
        county: "Bucuresti",
      },
    })
  })
})
