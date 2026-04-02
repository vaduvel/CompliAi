import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorClass: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshAuthenticatedSessionMock: vi.fn(),
  inferPrefillFromInvoicesMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorClass,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/compliance/efactura-prefill-inference", () => ({
  inferPrefillFromInvoices: mocks.inferPrefillFromInvoicesMock,
}))

import { POST } from "./route"

describe("POST /api/prefill/invoice", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      orgId: "org-session",
      orgName: "Marketing Growth Hub SRL",
      email: "owner@example.com",
      role: "owner",
    })
  })

  it("cere sesiune activă înainte de inferență", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorClass("Ai nevoie de sesiune activa.")
    )

    const response = await POST(
      new Request("http://localhost/api/prefill/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceItems: ["Servicii marketing"] }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.code).toBe("AUTH_SESSION_REQUIRED")
    expect(mocks.inferPrefillFromInvoicesMock).not.toHaveBeenCalled()
  })

  it("returnează sugestii doar după validarea sesiunii", async () => {
    mocks.inferPrefillFromInvoicesMock.mockResolvedValue({
      industry: "marketing",
      suggestedServices: ["marketing automation"],
    })

    const response = await POST(
      new Request("http://localhost/api/prefill/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-compliscan-org-id": "wrong-org",
        },
        body: JSON.stringify({ invoiceItems: ["Servicii marketing automation"] }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.inferPrefillFromInvoicesMock).toHaveBeenCalledWith([
      "Servicii marketing automation",
    ])
    expect(body).toEqual({
      ok: true,
      prefill: {
        industry: "marketing",
        suggestedServices: ["marketing automation"],
      },
    })
  })
})
