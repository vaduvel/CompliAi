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
  updateReportMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/whistleblowing-store", () => ({
  updateReport: mocks.updateReportMock,
}))

import { PATCH } from "./route"

describe("whistleblowing by id route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.updateReportMock.mockResolvedValue({ id: "wb-1", status: "resolved" })
  })

  it("actualizează sesizarea în org-ul activ", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/whistleblowing/wb-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ id: "wb-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.updateReportMock).toHaveBeenCalledWith(
      "org-1",
      "wb-1",
      expect.objectContaining({ status: "resolved" })
    )
    expect(payload.report.status).toBe("resolved")
  })
})
