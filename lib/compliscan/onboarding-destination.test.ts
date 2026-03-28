import { describe, expect, it } from "vitest"

import { resolveOnboardingDestination } from "./onboarding-destination"

describe("resolveOnboardingDestination", () => {
  it("trimite solo direct spre primul snapshot", () => {
    expect(resolveOnboardingDestination("solo")).toEqual(
      expect.objectContaining({
        clientHref: "/dashboard/resolve",
        serverHref: "/dashboard/resolve",
        requiresPortfolioWorkspace: false,
      })
    )
  })

  it("trimite partner prin traseul de portofoliu", () => {
    expect(resolveOnboardingDestination("partner")).toEqual(
      expect.objectContaining({
        clientHref: "/portfolio",
        serverHref: "/dashboard/partner",
        requiresPortfolioWorkspace: true,
      })
    )
  })

  it("trimite compliance in dashboard-ul operational", () => {
    expect(resolveOnboardingDestination("compliance")).toEqual(
      expect.objectContaining({
        clientHref: "/dashboard",
        serverHref: "/dashboard",
        requiresPortfolioWorkspace: false,
      })
    )
  })
})
