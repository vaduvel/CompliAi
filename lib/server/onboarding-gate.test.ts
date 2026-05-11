import { describe, expect, it, vi } from "vitest"

import { hasCompletedOnboarding, loadOnboardingGateState } from "@/lib/server/onboarding-gate"

describe("onboarding gate", () => {
  it("marks onboarding complete only when both orgProfile and applicability exist", () => {
    expect(hasCompletedOnboarding({ orgProfile: undefined, applicability: undefined })).toBe(false)
    expect(
      hasCompletedOnboarding({
        orgProfile: { sector: "retail" } as never,
        applicability: undefined,
      }),
    ).toBe(false)
    expect(
      hasCompletedOnboarding({ orgProfile: undefined, applicability: { tags: [] } as never }),
    ).toBe(false)
    expect(
      hasCompletedOnboarding({
        orgProfile: { sector: "retail" } as never,
        applicability: { tags: ["gdpr"] } as never,
      }),
    ).toBe(true)
  })

  it("loads onboarding gate state through the fresh loader", async () => {
    const loadState = vi.fn().mockResolvedValue({
      orgProfile: { sector: "retail" } as never,
      applicability: { tags: ["gdpr"] } as never,
    })

    const result = await loadOnboardingGateState(loadState)

    expect(loadState).toHaveBeenCalledTimes(1)
    expect(result.hasCompletedOnboarding).toBe(true)
  })
})
