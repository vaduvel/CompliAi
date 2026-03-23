import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test"
  process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro"
  process.env.STRIPE_PRICE_PARTNER_25_MONTHLY = "price_partner_25"
  process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com"
  return {
    requireFreshAuthenticatedSessionMock: vi.fn(),
    resolveUserModeMock: vi.fn(),
    getOrgPlanMock: vi.fn(),
    getOrgPlanRecordMock: vi.fn(),
  }
})

vi.mock("@/lib/server/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/auth")>("@/lib/server/auth")
  return {
    ...actual,
    requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
    resolveUserMode: mocks.resolveUserModeMock,
  }
})

vi.mock("@/lib/server/plan", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/plan")>("@/lib/server/plan")
  return {
    ...actual,
    getOrgPlan: mocks.getOrgPlanMock,
    getOrgPlanRecord: mocks.getOrgPlanRecordMock,
  }
})

import { POST } from "./route"

describe("POST /api/stripe/checkout", () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Cabinet Elena",
      email: "partner@example.com",
      role: "owner",
    })
    mocks.resolveUserModeMock.mockResolvedValue("partner")
    mocks.getOrgPlanMock.mockResolvedValue("free")
    mocks.getOrgPlanRecordMock.mockResolvedValue({
      orgId: "org-1",
      plan: "free",
      updatedAtISO: "2026-03-23T10:00:00.000Z",
    })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://stripe.example.com/session" }),
    } as Response)
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("blocheaza billingul org pentru non-owner", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValueOnce({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Cabinet Elena",
      email: "partner@example.com",
      role: "partner_manager",
    })

    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlan: "pro" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("ORG_BILLING_FORBIDDEN")
  })

  it("creeaza checkout pentru billing de cont partner", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValueOnce({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Cabinet Elena",
      email: "partner@example.com",
      role: "partner_manager",
    })

    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingScope: "account", targetPlan: "partner_25" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.url).toBe("https://stripe.example.com/session")
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.stripe.com/v1/checkout/sessions",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("metadata%5BbillingScope%5D=account"),
      })
    )
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.stripe.com/v1/checkout/sessions",
      expect.objectContaining({
        body: expect.stringContaining("metadata%5BuserId%5D=user-1"),
      })
    )
  })

  it("ramane compatibil pentru checkout per-org", async () => {
    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlan: "pro" }),
      })
    )

    expect(response.status).toBe(200)
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.stripe.com/v1/checkout/sessions",
      expect.objectContaining({
        body: expect.stringContaining("metadata%5BorgId%5D=org-1"),
      })
    )
  })
})
