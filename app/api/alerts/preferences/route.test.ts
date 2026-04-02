import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET, POST } from "./route"

const mocks = vi.hoisted(() => ({
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readAlertPreferencesMock: vi.fn(),
  writeAlertPreferencesMock: vi.fn(),
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

vi.mock("@/lib/server/alert-preferences-store", () => ({
  readAlertPreferences: mocks.readAlertPreferencesMock,
  writeAlertPreferences: mocks.writeAlertPreferencesMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", orgName: "Org Test SRL", email: "owner@test.ro" }

const BASE_PREFS = {
  emailEnabled: true,
  emailAddress: "alerts@test.ro",
  webhookEnabled: false,
  webhookUrl: "",
  events: { drifts: true, approvals: true },
  updatedAtISO: "2026-04-02T10:00:00.000Z",
}

describe("GET /api/alerts/preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue(SESSION)
    mocks.readAlertPreferencesMock.mockResolvedValue(BASE_PREFS)
  })

  it("citește preferințele din org-ul sesiunii", async () => {
    const res = await GET(new Request("http://localhost/api/alerts/preferences"))

    expect(res.status).toBe(200)
    expect(mocks.readAlertPreferencesMock).toHaveBeenCalledWith("org-1")
  })
})

describe("POST /api/alerts/preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue(SESSION)
    mocks.readAlertPreferencesMock.mockResolvedValue(BASE_PREFS)
    mocks.writeAlertPreferencesMock.mockImplementation(async (_orgId: string, prefs: unknown) => prefs)
  })

  it("salvează preferințele în org-ul sesiunii", async () => {
    const res = await POST(
      new Request("http://localhost/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookEnabled: true, webhookUrl: "https://example.com/hook" }),
      })
    )

    expect(res.status).toBe(200)
    expect(mocks.writeAlertPreferencesMock).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({
        webhookEnabled: true,
        webhookUrl: "https://example.com/hook",
      })
    )
  })

  it("respinge webhook invalid", async () => {
    const res = await POST(
      new Request("http://localhost/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookEnabled: true, webhookUrl: "ftp://invalid" }),
      })
    )

    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe("INVALID_WEBHOOK_URL")
  })
})
