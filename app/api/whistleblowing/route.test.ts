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
  readWhistleblowingStateMock: vi.fn(),
  createReportMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/whistleblowing-store", () => ({
  readWhistleblowingState: mocks.readWhistleblowingStateMock,
  createReport: mocks.createReportMock,
}))

import { GET, POST } from "./route"

describe("whistleblowing route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readWhistleblowingStateMock.mockResolvedValue({
      reports: [{ id: "wb-1" }],
      publicToken: "public-token",
    })
    mocks.createReportMock.mockResolvedValue({ id: "wb-2" })
  })

  it("citește sesizările din org-ul activ", async () => {
    const response = await GET(new Request("http://localhost/api/whistleblowing"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readWhistleblowingStateMock).toHaveBeenCalledWith("org-1")
    expect(payload.publicToken).toBe("public-token")
  })

  it("creează sesizare în org-ul activ", async () => {
    const response = await POST(
      new Request("http://localhost/api/whistleblowing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "privacy",
          description: "Aceasta este o descriere suficient de lungă pentru test.",
        }),
      })
    )

    expect(response.status).toBe(201)
    expect(mocks.createReportMock).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ category: "privacy" })
    )
  })
})
