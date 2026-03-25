import { describe, expect, it, vi, beforeEach } from "vitest"

const { trackEvent } = vi.hoisted(() => ({
  trackEvent: vi.fn(),
}))

vi.mock("@/lib/server/analytics", () => ({
  trackEvent,
}))

import { GET } from "./route"

describe("GET /r/renewal/[orgId]", () => {
  beforeEach(() => {
    trackEvent.mockReset()
  })

  it("tracks the renewal click and redirects to pricing", async () => {
    const response = await GET(
      new Request("https://compliscanag.vercel.app/r/renewal/org-123"),
      { params: Promise.resolve({ orgId: "org-123" }) }
    )

    expect(trackEvent).toHaveBeenCalledWith("org-123", "renewal_email_cta_clicked", {
      source: "renewal_email",
      target: "pricing",
    })
    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("https://compliscanag.vercel.app/pricing?source=renewal-email")
  })

  it("still redirects if org id is missing", async () => {
    const response = await GET(
      new Request("https://compliscanag.vercel.app/r/renewal/"),
      { params: Promise.resolve({ orgId: "" }) }
    )

    expect(trackEvent).not.toHaveBeenCalled()
    expect(response.headers.get("location")).toBe("https://compliscanag.vercel.app/pricing?source=renewal-email")
  })
})
