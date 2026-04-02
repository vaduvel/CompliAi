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
  readFreshStateForOrgMock: vi.fn(),
  requireFreshRoleMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

import { GET } from "./route"

describe("GET /api/audit-log", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-audit",
      orgName: "Org Audit",
      email: "viewer@example.com",
      role: "viewer",
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      events: [{ id: "evt-1", type: "demo", message: "ok" }],
    })
  })

  it("citește logul de audit de pe org-ul din sesiune", async () => {
    const response = await GET(new Request("http://localhost/api/audit-log"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.events).toEqual([{ id: "evt-1", type: "demo", message: "ok" }])
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-audit", "Org Audit")
  })

  it("propagă eroarea de autorizare", async () => {
    mocks.requireFreshRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Interzis", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await GET(new Request("http://localhost/api/audit-log"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
