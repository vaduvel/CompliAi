import { describe, expect, it, vi } from "vitest"

import { hasCompletedOnboarding, loadOnboardingGateState } from "@/lib/server/onboarding-gate"

describe("onboarding gate", () => {
  it("marks onboarding complete only when both orgProfile and applicability exist", () => {
    expect(hasCompletedOnboarding({ orgProfile: null, applicability: null })).toBe(false)
    expect(hasCompletedOnboarding({ orgProfile: { sector: "retail" }, applicability: null })).toBe(false)
    expect(hasCompletedOnboarding({ orgProfile: null, applicability: { tags: [] } })).toBe(false)
    expect(
      hasCompletedOnboarding({
        orgProfile: { sector: "retail" },
        applicability: { tags: ["gdpr"] },
      })
    ).toBe(true)
  })

  it("loads onboarding gate state through the fresh loader", async () => {
    const loadState = vi.fn().mockResolvedValue({
      orgProfile: { sector: "retail" },
      applicability: { tags: ["gdpr"] },
    })

    const result = await loadOnboardingGateState(loadState)

    expect(loadState).toHaveBeenCalledTimes(1)
    expect(result.hasCompletedOnboarding).toBe(true)
  })
})
