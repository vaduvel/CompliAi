import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET, POST } from "./route"

const mocks = vi.hoisted(() => ({
  readSessionMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  readAlertPrefsMock: vi.fn(),
  writeAlertPrefsMock: vi.fn(),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  readSessionFromRequest: mocks.readSessionMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/alert-preferences-store", () => ({
  readAlertPreferences: mocks.readAlertPrefsMock,
  writeAlertPreferences: mocks.writeAlertPrefsMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", email: "test@site.ro" }
const ORG_CTX = { orgId: "org-1" }
const DEFAULT_PREFS = {
  emailEnabled: false,
  emailAddress: "",
  webhookEnabled: false,
  webhookUrl: "",
  events: { "drift.detected": true, "task.overdue": true, "alert.critical": true },
  updatedAtISO: "2026-03-17T10:00:00.000Z",
}

describe("GET /api/alerts/preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.readAlertPrefsMock.mockResolvedValue(DEFAULT_PREFS)
  })

  it("returneaza preferintele pentru sesiune valida", async () => {
    const res = await GET(new Request("http://localhost/api/alerts/preferences"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.prefs).toEqual(DEFAULT_PREFS)
    expect(mocks.readAlertPrefsMock).toHaveBeenCalledWith("org-1")
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await GET(new Request("http://localhost/api/alerts/preferences"))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.code).toBe("UNAUTHORIZED")
  })
})

describe("POST /api/alerts/preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.readAlertPrefsMock.mockResolvedValue(DEFAULT_PREFS)
    mocks.writeAlertPrefsMock.mockImplementation(async (_orgId: string, prefs: object) => ({
      ...prefs,
      updatedAtISO: new Date().toISOString(),
    }))
  })

  it("salveaza preferintele de email", async () => {
    const body = { emailEnabled: true, emailAddress: "alert@companie.ro" }
    const res = await POST(
      new Request("http://localhost/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    )

    expect(res.status).toBe(200)
    expect(mocks.writeAlertPrefsMock).toHaveBeenCalledOnce()
    const saved = mocks.writeAlertPrefsMock.mock.calls[0][1]
    expect(saved.emailEnabled).toBe(true)
    expect(saved.emailAddress).toBe("alert@companie.ro")
  })

  it("respinge URL webhook invalid (protocol gresit)", async () => {
    const res = await POST(
      new Request("http://localhost/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookEnabled: true, webhookUrl: "ftp://example.com/hook" }),
      })
    )
    const payload = await res.json()

    expect(res.status).toBe(400)
    expect(payload.code).toBe("INVALID_WEBHOOK_URL")
  })

  it("respinge URL webhook complet invalid", async () => {
    const res = await POST(
      new Request("http://localhost/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookEnabled: true, webhookUrl: "nu-este-url" }),
      })
    )
    const payload = await res.json()

    expect(res.status).toBe(400)
    expect(payload.code).toBe("INVALID_WEBHOOK_URL")
  })

  it("accepta URL webhook valid https", async () => {
    const res = await POST(
      new Request("http://localhost/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookEnabled: true, webhookUrl: "https://hooks.slack.com/services/abc" }),
      })
    )

    expect(res.status).toBe(200)
    expect(mocks.writeAlertPrefsMock).toHaveBeenCalledOnce()
  })

  it("face merge cu preferintele existente (nu suprascrie campurile netrimise)", async () => {
    const res = await POST(
      new Request("http://localhost/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailEnabled: true }),
      })
    )

    expect(res.status).toBe(200)
    const saved = mocks.writeAlertPrefsMock.mock.calls[0][1]
    // Camp nemodificat pastreaza valoarea din DEFAULT_PREFS
    expect(saved.webhookEnabled).toBe(false)
    expect(saved.events["drift.detected"]).toBe(true)
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await POST(
      new Request("http://localhost/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    )
    expect(res.status).toBe(401)
  })
})
