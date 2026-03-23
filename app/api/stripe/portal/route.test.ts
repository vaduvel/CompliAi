import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test"
  process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com"
  return {
    requireFreshAuthenticatedSessionMock: vi.fn(),
    getUserModeMock: vi.fn(),
    getOrgPlanRecordMock: vi.fn(),
    getPartnerAccountPlanRecordMock: vi.fn(),
  }
})

vi.mock("@/lib/server/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/auth")>("@/lib/server/auth")
  return {
    ...actual,
    requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
    getUserMode: mocks.getUserModeMock,
  }
})

vi.mock("@/lib/server/plan", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/plan")>("@/lib/server/plan")
  return {
    ...actual,
    getOrgPlanRecord: mocks.getOrgPlanRecordMock,
    getPartnerAccountPlanRecord: mocks.getPartnerAccountPlanRecordMock,
  }
})

import { POST } from "./route"

describe("POST /api/stripe/portal", () => {
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
    mocks.getUserModeMock.mockResolvedValue("partner")
    mocks.getOrgPlanRecordMock.mockResolvedValue({
      orgId: "org-1",
      plan: "pro",
      updatedAtISO: "2026-03-23T10:00:00.000Z",
      stripeCustomerId: "cus_org",
    })
    mocks.getPartnerAccountPlanRecordMock.mockResolvedValue({
      userId: "user-1",
      planType: "partner_25",
      updatedAtISO: "2026-03-23T11:00:00.000Z",
      stripeCustomerId: "cus_account",
    })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://stripe.example.com/portal" }),
    } as Response)
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("creeaza portal pentru billingul de cont partner", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValueOnce({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Cabinet Elena",
      email: "partner@example.com",
      role: "partner_manager",
    })

    const response = await POST(
      new Request("http://localhost/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingScope: "account" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.url).toBe("https://stripe.example.com/portal")
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.stripe.com/v1/billing_portal/sessions",
      expect.objectContaining({
        body: expect.stringContaining("customer=cus_account"),
      })
    )
  })

  it("blocheaza billingul org pentru non-owner", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValueOnce({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Cabinet Elena",
      email: "partner@example.com",
      role: "partner_manager",
    })

    const response = await POST(new Request("http://localhost/api/stripe/portal", { method: "POST" }))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("ORG_BILLING_FORBIDDEN")
  })
})
