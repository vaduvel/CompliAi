// S2A.1 — Tests pentru Stripe ICP tier registry.

import { describe, expect, it } from "vitest"

import {
  STRIPE_TIER_REGISTRY,
  getStripeTier,
  isAccountScopedTier,
  isOrgScopedTier,
  isValidTier,
  listAllIcpTiers,
  listTiersForIcp,
  tierToOrgPlan,
  tierToPartnerAccountPlan,
} from "./stripe-tier-config"

describe("stripe-tier-config", () => {
  it("registry conține toate cele 14 tier-uri așteptate", () => {
    const expected = [
      "solo-starter",
      "solo-pro",
      "imm-internal-solo",
      "imm-internal-pro",
      "cabinet-solo",
      "cabinet-pro",
      "cabinet-studio",
      "fiscal-solo",
      "fiscal-pro",
      "pro",
      "partner",
      "partner_10",
      "partner_25",
      "partner_50",
    ]
    for (const id of expected) {
      expect(STRIPE_TIER_REGISTRY[id]).toBeDefined()
    }
  })

  it("getStripeTier returnează null pentru tier inexistent", () => {
    expect(getStripeTier("inexistent-tier")).toBeNull()
  })

  it("listTiersForIcp filtrează corect și exclude legacy", () => {
    const dpo = listTiersForIcp("cabinet-dpo")
    expect(dpo.length).toBeGreaterThanOrEqual(3) // cabinet-solo/pro/studio
    expect(dpo.every((t) => t.icpSegment === "cabinet-dpo")).toBe(true)
    // Sortat ascendent după preț
    for (let i = 1; i < dpo.length; i++) {
      expect(dpo[i].priceLabelEur >= dpo[i - 1].priceLabelEur).toBe(true)
    }
  })

  it("listAllIcpTiers exclude legacy partner_*/pro/partner", () => {
    const all = listAllIcpTiers()
    expect(all.find((t) => t.id === "pro")).toBeUndefined()
    expect(all.find((t) => t.id === "partner")).toBeUndefined()
    expect(all.find((t) => t.id === "partner_25")).toBeUndefined()
  })

  it("isValidTier verifică prezența în registry", () => {
    expect(isValidTier("cabinet-pro")).toBe(true)
    expect(isValidTier("inexistent")).toBe(false)
  })

  it("isAccountScopedTier identifică tier-urile cabinet (account)", () => {
    expect(isAccountScopedTier("cabinet-pro")).toBe(true)
    expect(isAccountScopedTier("fiscal-solo")).toBe(true)
    expect(isAccountScopedTier("partner_25")).toBe(true)
    expect(isAccountScopedTier("solo-starter")).toBe(false)
    expect(isAccountScopedTier("pro")).toBe(false)
  })

  it("isOrgScopedTier identifică tier-urile org-level", () => {
    expect(isOrgScopedTier("solo-starter")).toBe(true)
    expect(isOrgScopedTier("imm-internal-pro")).toBe(true)
    expect(isOrgScopedTier("pro")).toBe(true)
    expect(isOrgScopedTier("cabinet-pro")).toBe(false)
  })

  it("tierToOrgPlan mapează ICP tiers org-scoped la 'pro'", () => {
    expect(tierToOrgPlan("solo-starter")).toBe("pro")
    expect(tierToOrgPlan("solo-pro")).toBe("pro")
    expect(tierToOrgPlan("imm-internal-solo")).toBe("pro")
    expect(tierToOrgPlan("imm-internal-pro")).toBe("pro")
    expect(tierToOrgPlan("pro")).toBe("pro")
    // Cabinet/account scoped → null
    expect(tierToOrgPlan("cabinet-pro")).toBeNull()
    expect(tierToOrgPlan("fiscal-solo")).toBeNull()
  })

  it("tierToPartnerAccountPlan mapează corect cabinet tiers la partner_10/25/50", () => {
    expect(tierToPartnerAccountPlan("cabinet-solo")).toBe("partner_10")
    expect(tierToPartnerAccountPlan("cabinet-pro")).toBe("partner_25")
    expect(tierToPartnerAccountPlan("cabinet-studio")).toBe("partner_50")
    expect(tierToPartnerAccountPlan("fiscal-solo")).toBe("partner_25")
    expect(tierToPartnerAccountPlan("fiscal-pro")).toBe("partner_50")
    expect(tierToPartnerAccountPlan("partner_10")).toBe("partner_10")
    // Org tiers → null
    expect(tierToPartnerAccountPlan("solo-starter")).toBeNull()
    expect(tierToPartnerAccountPlan("pro")).toBeNull()
  })

  it("toate tier-urile au priceLabelEur > 0 și features non-empty", () => {
    for (const tier of Object.values(STRIPE_TIER_REGISTRY)) {
      expect(tier.priceLabelEur).toBeGreaterThan(0)
      expect(tier.features.length).toBeGreaterThan(0)
      expect(tier.envVar).toMatch(/^STRIPE_PRICE_/)
    }
  })

  it("nu există tier ID duplicat", () => {
    const ids = Object.keys(STRIPE_TIER_REGISTRY)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})
