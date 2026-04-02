import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string

    constructor(message: string, status = 401, code = "AUTH_UNAUTHENTICATED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshAuthenticatedSessionMock: vi.fn(),
  trackEventMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/analytics", () => ({
  trackEvent: mocks.trackEventMock,
}))

import { POST } from "./route"

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
    })
    mocks.trackEventMock.mockResolvedValue(undefined)
  })

  it("trimite feedback-ul pe org-ul explicit din sesiune", async () => {
    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({ context: "fiscal", value: "down" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true })
    expect(mocks.trackEventMock).toHaveBeenCalledWith("org-1", "submitted_feedback", {
      feedbackContext: "fiscal",
      feedbackValue: "down",
    })
  })

  it("returneaza codul de auth daca sesiunea lipseste", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Autentificare necesară.", 401, "AUTH_UNAUTHENTICATED")
    )

    const response = await POST(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({}),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload).toEqual({ ok: false, code: "AUTH_UNAUTHENTICATED" })
  })
})
