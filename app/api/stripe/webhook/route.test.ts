import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  setOrgPlanMock: vi.fn(),
  setPartnerAccountPlanMock: vi.fn(),
  clearPartnerAccountPlanMock: vi.fn(),
}))

vi.mock("@/lib/server/plan", () => ({
  setOrgPlan: mocks.setOrgPlanMock,
  setPartnerAccountPlan: mocks.setPartnerAccountPlanMock,
  clearPartnerAccountPlan: mocks.clearPartnerAccountPlanMock,
}))

import { POST } from "./route"

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.STRIPE_WEBHOOK_SECRET
  })

  it("aplica billingul de cont partner la checkout.session.completed", async () => {
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: {
              id: "cs_1",
              customer: "cus_account",
              subscription: "sub_account",
              metadata: {
                billingScope: "account",
                userId: "user-1",
                targetPlan: "partner_25",
              },
            },
          },
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.setPartnerAccountPlanMock).toHaveBeenCalledWith(
      "user-1",
      "partner_25",
      expect.objectContaining({
        stripeCustomerId: "cus_account",
        stripeSubscriptionId: "sub_account",
      })
    )
  })

  it("curata billingul de cont partner la subscription deleted", async () => {
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify({
          type: "customer.subscription.deleted",
          data: {
            object: {
              id: "sub_account",
              customer: "cus_account",
              status: "canceled",
              metadata: {
                billingScope: "account",
                userId: "user-1",
              },
            },
          },
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.clearPartnerAccountPlanMock).toHaveBeenCalledWith("user-1")
  })
})
