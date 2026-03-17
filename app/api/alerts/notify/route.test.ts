import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

const mocks = vi.hoisted(() => ({
  readSessionMock: vi.fn(),
  readAlertPrefsMock: vi.fn(),
  fetchMock: vi.fn(),
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

vi.mock("@/lib/server/alert-preferences-store", () => ({
  readAlertPreferences: mocks.readAlertPrefsMock,
}))

// Mock global fetch
vi.stubGlobal("fetch", mocks.fetchMock)

const SESSION = { userId: "user-1", orgId: "org-1", email: "test@site.ro" }

const PREFS_EMAIL_ONLY = {
  emailEnabled: true,
  emailAddress: "alert@companie.ro",
  webhookEnabled: false,
  webhookUrl: "",
  events: { "drift.detected": true, "task.overdue": true, "alert.critical": true },
  updatedAtISO: "2026-03-17T10:00:00.000Z",
}

const PREFS_WEBHOOK_ONLY = {
  emailEnabled: false,
  emailAddress: "",
  webhookEnabled: true,
  webhookUrl: "https://hooks.example.com/notify",
  events: { "drift.detected": true, "task.overdue": true, "alert.critical": true },
  updatedAtISO: "2026-03-17T10:00:00.000Z",
}

const PREFS_DISABLED = {
  emailEnabled: false,
  emailAddress: "",
  webhookEnabled: false,
  webhookUrl: "",
  events: { "drift.detected": false, "task.overdue": false, "alert.critical": false },
  updatedAtISO: "2026-03-17T10:00:00.000Z",
}

function makeRequest(body: object) {
  return new Request("http://localhost/api/alerts/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/alerts/notify", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue(SESSION)
    mocks.fetchMock.mockResolvedValue({ ok: true, status: 200 })
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)
    const res = await POST(makeRequest({ event: "drift.detected", orgId: "org-1" }))
    expect(res.status).toBe(401)
  })

  it("respinge body fara event", async () => {
    const res = await POST(makeRequest({ orgId: "org-1" }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.code).toBe("MISSING_FIELDS")
  })

  it("respinge body fara orgId", async () => {
    const res = await POST(makeRequest({ event: "drift.detected" }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.code).toBe("MISSING_FIELDS")
  })

  it("respinge eveniment necunoscut", async () => {
    mocks.readAlertPrefsMock.mockResolvedValue(PREFS_EMAIL_ONLY)
    const res = await POST(makeRequest({ event: "eveniment.inexistent", orgId: "org-1" }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.code).toBe("UNKNOWN_EVENT")
  })

  it("returneaza skipped cand evenimentul este dezactivat in preferinte", async () => {
    mocks.readAlertPrefsMock.mockResolvedValue(PREFS_DISABLED)
    const res = await POST(makeRequest({ event: "drift.detected", orgId: "org-1" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.dispatched).toBe(false)
    expect(body.skipped).toContain("event-disabled")
  })

  it("trimite email si marcheaza dispatched=true cand emailul este activ", async () => {
    mocks.readAlertPrefsMock.mockResolvedValue(PREFS_EMAIL_ONLY)
    const res = await POST(makeRequest({ event: "drift.detected", orgId: "org-1" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.dispatched).toBe(true)
    expect(body.channels).toContain("email")
    expect(body.skipped).toContain("webhook-disabled")
  })

  it("trimite webhook si marcheaza dispatched=true cand webhook-ul este activ", async () => {
    mocks.readAlertPrefsMock.mockResolvedValue(PREFS_WEBHOOK_ONLY)
    mocks.fetchMock.mockResolvedValue({ ok: true, status: 200 })

    const res = await POST(makeRequest({ event: "alert.critical", orgId: "org-1" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.dispatched).toBe(true)
    expect(body.channels).toContain("webhook")
    expect(mocks.fetchMock).toHaveBeenCalledOnce()
  })

  it("adauga webhook-error in skipped cand fetch-ul esueaza", async () => {
    mocks.readAlertPrefsMock.mockResolvedValue(PREFS_WEBHOOK_ONLY)
    mocks.fetchMock.mockResolvedValue({ ok: false, status: 500 })

    const res = await POST(makeRequest({ event: "task.overdue", orgId: "org-1" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.dispatched).toBe(false)
    expect(body.skipped.some((s: string) => s.startsWith("webhook-error:"))).toBe(true)
  })

  it("adauga webhook-error in skipped cand fetch arunca exceptie (timeout etc)", async () => {
    mocks.readAlertPrefsMock.mockResolvedValue(PREFS_WEBHOOK_ONLY)
    mocks.fetchMock.mockRejectedValue(new Error("AbortError: timeout"))

    const res = await POST(makeRequest({ event: "drift.detected", orgId: "org-1" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.skipped.some((s: string) => s.startsWith("webhook-error:"))).toBe(true)
  })

  it("trimite payload custom in webhook", async () => {
    mocks.readAlertPrefsMock.mockResolvedValue(PREFS_WEBHOOK_ONLY)
    mocks.fetchMock.mockResolvedValue({ ok: true, status: 200 })

    await POST(
      makeRequest({
        event: "drift.detected",
        orgId: "org-1",
        payload: { driftId: "d-123", summary: "Provider nou" },
      })
    )

    const callArgs = mocks.fetchMock.mock.calls[0]
    const sentBody = JSON.parse(callArgs[1].body)
    expect(sentBody.driftId).toBe("d-123")
    expect(sentBody.event).toBe("drift.detected")
    expect(sentBody.orgId).toBe("org-1")
  })
})
