import { beforeEach, describe, expect, it, vi } from "vitest"

import { PATCH } from "./route"

const mocks = vi.hoisted(() => ({
  requireFreshAuthenticatedSessionMock: vi.fn(),
  markNotificationReadMock: vi.fn(),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/notifications-store", () => ({
  markNotificationRead: mocks.markNotificationReadMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", orgName: "Org Test SRL", email: "owner@test.ro" }

describe("PATCH /api/notifications/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue(SESSION)
    mocks.markNotificationReadMock.mockResolvedValue({ id: "n1", read: true })
  })

  it("marchează notificarea din org-ul sesiunii", async () => {
    const res = await PATCH(new Request("http://localhost/api/notifications/n1", { method: "PATCH" }), {
      params: Promise.resolve({ id: "n1" }),
    })

    expect(res.status).toBe(200)
    expect(mocks.markNotificationReadMock).toHaveBeenCalledWith("org-1", "n1")
  })

  it("returnează 404 dacă notificarea nu există", async () => {
    mocks.markNotificationReadMock.mockResolvedValueOnce(null)

    const res = await PATCH(new Request("http://localhost/api/notifications/missing", { method: "PATCH" }), {
      params: Promise.resolve({ id: "missing" }),
    })

    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe("NOT_FOUND")
  })
})
