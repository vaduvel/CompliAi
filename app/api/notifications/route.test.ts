import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET, POST } from "./route"

const mocks = vi.hoisted(() => ({
  requireFreshAuthenticatedSessionMock: vi.fn(),
  safeListNotificationsMock: vi.fn(),
  safeCountUnreadMock: vi.fn(),
  safeMarkAllReadMock: vi.fn(),
  createRequestContextMock: vi.fn(),
  withRequestIdHeadersMock: vi.fn(),
  logRouteErrorMock: vi.fn(),
  getRequestDurationMsMock: vi.fn(),
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
  safeListNotifications: mocks.safeListNotificationsMock,
  safeCountUnread: mocks.safeCountUnreadMock,
  safeMarkAllRead: mocks.safeMarkAllReadMock,
}))

vi.mock("@/lib/server/request-context", () => ({
  createRequestContext: mocks.createRequestContextMock,
  getRequestDurationMs: mocks.getRequestDurationMsMock,
}))

vi.mock("@/lib/server/api-response", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/api-response")>("@/lib/server/api-response")
  return {
    ...actual,
    withRequestIdHeaders: mocks.withRequestIdHeadersMock,
  }
})

vi.mock("@/lib/server/operational-logger", () => ({
  logRouteError: mocks.logRouteErrorMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", orgName: "Org Test SRL", email: "owner@test.ro" }

describe("GET /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue(SESSION)
    mocks.safeListNotificationsMock.mockResolvedValue([{ id: "n1", title: "Alerte" }])
    mocks.safeCountUnreadMock.mockResolvedValue(2)
    mocks.createRequestContextMock.mockReturnValue({ requestId: "req-1" })
    mocks.withRequestIdHeadersMock.mockReturnValue(undefined)
  })

  it("citește notificările din org-ul sesiunii", async () => {
    const res = await GET(new Request("http://localhost/api/notifications"))

    expect(res.status).toBe(200)
    expect(mocks.safeListNotificationsMock).toHaveBeenCalledWith("org-1")
    expect(mocks.safeCountUnreadMock).toHaveBeenCalledWith("org-1")
  })
})

describe("POST /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue(SESSION)
    mocks.safeMarkAllReadMock.mockResolvedValue(undefined)
    mocks.createRequestContextMock.mockReturnValue({ requestId: "req-1" })
    mocks.withRequestIdHeadersMock.mockReturnValue(undefined)
  })

  it("marchează toate notificările ca citite în org-ul sesiunii", async () => {
    const res = await POST(
      new Request("http://localhost/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" }),
      })
    )

    expect(res.status).toBe(200)
    expect(mocks.safeMarkAllReadMock).toHaveBeenCalledWith("org-1")
  })

  it("respinge acțiunea invalidă", async () => {
    const res = await POST(
      new Request("http://localhost/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "other" }),
      })
    )

    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe("INVALID_ACTION")
  })
})
