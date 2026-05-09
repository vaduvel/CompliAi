import { describe, it, expect } from "vitest"

import {
  MODULES_PER_ICP,
  PATRON_MODULES,
  AUDITOR_MODULES,
  resolveAllowedModules,
  isModuleAllowed,
} from "./icp-modules"

describe("icp-modules — base ICP visibility", () => {
  it("cabinet-fiscal sees ONLY fiscal-related modules", () => {
    const allowed = resolveAllowedModules("cabinet-fiscal")
    // Vede:
    expect(allowed.has("fiscal")).toBe(true)
    expect(allowed.has("home")).toBe(true)
    expect(allowed.has("dosar")).toBe(true)
    expect(allowed.has("agenti")).toBe(true)
    // NU vede DPO/HR/AI Act/DORA/NIS2:
    expect(allowed.has("ropa")).toBe(false)
    expect(allowed.has("dsar")).toBe(false)
    expect(allowed.has("dpia")).toBe(false)
    expect(allowed.has("breach")).toBe(false)
    expect(allowed.has("nis2")).toBe(false)
    expect(allowed.has("dora")).toBe(false)
    expect(allowed.has("pay-transparency")).toBe(false)
    expect(allowed.has("whistleblowing")).toBe(false)
    expect(allowed.has("magic-links")).toBe(false)
    expect(allowed.has("cabinet-templates")).toBe(false)
  })

  it("cabinet-dpo sees ONLY DPO-related modules", () => {
    const allowed = resolveAllowedModules("cabinet-dpo")
    // Vede:
    expect(allowed.has("ropa")).toBe(true)
    expect(allowed.has("dsar")).toBe(true)
    expect(allowed.has("dpia")).toBe(true)
    expect(allowed.has("breach")).toBe(true)
    expect(allowed.has("training")).toBe(true)
    expect(allowed.has("magic-links")).toBe(true)
    expect(allowed.has("cabinet-templates")).toBe(true)
    expect(allowed.has("partner")).toBe(true)
    // NU vede Fiscal/HR/Banking:
    expect(allowed.has("fiscal")).toBe(false)
    expect(allowed.has("pay-transparency")).toBe(false)
    expect(allowed.has("dora")).toBe(false)
    expect(allowed.has("nis2")).toBe(false)
  })

  it("cabinet-hr sees ONLY HR-related modules", () => {
    const allowed = resolveAllowedModules("cabinet-hr")
    expect(allowed.has("pay-transparency")).toBe(true)
    expect(allowed.has("whistleblowing")).toBe(true)
    expect(allowed.has("training")).toBe(true)
    expect(allowed.has("partner")).toBe(true)
    // NU:
    expect(allowed.has("fiscal")).toBe(false)
    expect(allowed.has("ropa")).toBe(false)
    expect(allowed.has("nis2")).toBe(false)
    expect(allowed.has("dora")).toBe(false)
  })

  it("imm-internal sees CROSS-FRAMEWORK (everything applicable)", () => {
    const allowed = resolveAllowedModules("imm-internal")
    expect(allowed.has("ropa")).toBe(true)
    expect(allowed.has("nis2")).toBe(true)
    expect(allowed.has("dora")).toBe(true)
    expect(allowed.has("fiscal")).toBe(true)
    expect(allowed.has("pay-transparency")).toBe(true)
    expect(allowed.has("whistleblowing")).toBe(true)
  })

  it("solo (Patron Owner IMM mic) sees minimum set", () => {
    const allowed = resolveAllowedModules("solo")
    expect(allowed.has("home")).toBe(true)
    expect(allowed.has("dosar")).toBe(true)
    expect(allowed.has("settings")).toBe(true)
    // NU vede module specializate:
    expect(allowed.has("ropa")).toBe(false)
    expect(allowed.has("fiscal")).toBe(false)
    expect(allowed.has("nis2")).toBe(false)
  })

  it("enterprise sees cyber-first cross-framework", () => {
    const allowed = resolveAllowedModules("enterprise")
    expect(allowed.has("nis2")).toBe(true)
    expect(allowed.has("dora")).toBe(true)
    expect(allowed.has("vendor-review")).toBe(true)
    expect(allowed.has("breach")).toBe(true)
    // GDPR essential:
    expect(allowed.has("ropa")).toBe(true)
    expect(allowed.has("dsar")).toBe(true)
    // NU vede fiscal/HR specifice:
    expect(allowed.has("fiscal")).toBe(false)
    expect(allowed.has("pay-transparency")).toBe(false)
  })
})

describe("icp-modules — sub-flag restrictions", () => {
  it("legal-only (Avocat) removes cabinet-templates and vendor-review from cabinet-dpo", () => {
    const allowed = resolveAllowedModules("cabinet-dpo", "legal-only")
    // Avocatul are templates juridice proprii
    expect(allowed.has("cabinet-templates")).toBe(false)
    expect(allowed.has("vendor-review")).toBe(false)
    // Restul DPO core rămâne:
    expect(allowed.has("ropa")).toBe(true)
    expect(allowed.has("dsar")).toBe(true)
    expect(allowed.has("dpia")).toBe(true)
  })

  it("cabinet-cyber (CISO) removes GDPR detail from enterprise", () => {
    const allowed = resolveAllowedModules("enterprise", "cabinet-cyber")
    // GDPR detail minimum
    expect(allowed.has("ropa")).toBe(false)
    expect(allowed.has("dsar")).toBe(false)
    expect(allowed.has("dpia")).toBe(false)
    // Cyber rămâne:
    expect(allowed.has("nis2")).toBe(true)
    expect(allowed.has("dora")).toBe(true)
    expect(allowed.has("breach")).toBe(true)
  })

  it("ai-gov removes cyber from enterprise", () => {
    const allowed = resolveAllowedModules("enterprise", "ai-gov")
    expect(allowed.has("nis2")).toBe(false)
    expect(allowed.has("dora")).toBe(false)
    expect(allowed.has("breach")).toBe(false)
    // GDPR cross-link rămâne:
    expect(allowed.has("ropa")).toBe(true)
  })

  it("banking removes fiscal+pay-transparency from imm-internal", () => {
    const allowed = resolveAllowedModules("imm-internal", "banking")
    expect(allowed.has("fiscal")).toBe(false)
    expect(allowed.has("pay-transparency")).toBe(false)
    // DORA + NIS2 + GDPR rămân:
    expect(allowed.has("dora")).toBe(true)
    expect(allowed.has("nis2")).toBe(true)
    expect(allowed.has("ropa")).toBe(true)
  })
})

describe("icp-modules — access mode overrides", () => {
  it("patron mode shows minimal executive view (intersection cu ICP)", () => {
    const allowed = resolveAllowedModules("imm-internal", null, "patron")
    // Patron vede DOAR PATRON_MODULES intersected cu ICP
    expect(allowed.has("home")).toBe(true)
    expect(allowed.has("approvals")).toBe(true)
    expect(allowed.has("dosar")).toBe(true)
    expect(allowed.has("settings")).toBe(true)
    // Detalii tehnice ASCUNSE chiar dacă imm-internal le-ar vedea:
    expect(allowed.has("ropa")).toBe(false)
    expect(allowed.has("nis2")).toBe(false)
    expect(allowed.has("fiscal")).toBe(false)
    expect(allowed.has("dpia")).toBe(false)
  })

  it("auditor-token mode shows ONLY audit pack download", () => {
    const allowed = resolveAllowedModules("cabinet-dpo", null, "auditor-token")
    // Auditor vede DOAR dosar (read-only audit pack)
    expect(allowed.has("dosar")).toBe(true)
    // NIMIC altceva — chiar dacă ICP-ul ar fi cabinet-dpo:
    expect(allowed.has("home")).toBe(false)
    expect(allowed.has("ropa")).toBe(false)
    expect(allowed.has("settings")).toBe(false)
    expect(allowed.has("scan")).toBe(false)
  })

  it("auditor-token mode ignores icpSegment (token grants ONLY audit pack)", () => {
    // Same result regardless of ICP
    const dpo = resolveAllowedModules("cabinet-dpo", null, "auditor-token")
    const fiscal = resolveAllowedModules("cabinet-fiscal", null, "auditor-token")
    expect(Array.from(dpo).sort()).toEqual(Array.from(fiscal).sort())
  })
})

describe("icp-modules — null icpSegment fallback", () => {
  it("returns minimal safe set when icpSegment is null (pre-onboarding)", () => {
    const allowed = resolveAllowedModules(null)
    expect(allowed.has("home")).toBe(true)
    expect(allowed.has("scan")).toBe(true)
    expect(allowed.has("resolve")).toBe(true)
    expect(allowed.has("dosar")).toBe(true)
    expect(allowed.has("settings")).toBe(true)
    expect(allowed.has("calendar")).toBe(true)
    // NU vede module specializate:
    expect(allowed.has("ropa")).toBe(false)
    expect(allowed.has("fiscal")).toBe(false)
    expect(allowed.has("nis2")).toBe(false)
  })

  it("auditor-token works even when icpSegment is null", () => {
    const allowed = resolveAllowedModules(null, null, "auditor-token")
    expect(allowed.has("dosar")).toBe(true)
    expect(allowed.has("home")).toBe(false)
  })

  it("patron-mode without icpSegment returns just PATRON_MODULES", () => {
    const allowed = resolveAllowedModules(null, null, "patron")
    expect(allowed.has("home")).toBe(true)
    expect(allowed.has("approvals")).toBe(true)
    expect(allowed.has("dosar")).toBe(true)
    expect(allowed.has("settings")).toBe(true)
  })
})

describe("isModuleAllowed helper", () => {
  it("checks single module quickly", () => {
    expect(isModuleAllowed("fiscal", "cabinet-fiscal")).toBe(true)
    expect(isModuleAllowed("ropa", "cabinet-fiscal")).toBe(false)
    expect(isModuleAllowed("ropa", "cabinet-dpo")).toBe(true)
    expect(isModuleAllowed("dpia", "enterprise", "cabinet-cyber")).toBe(false)
  })
})

describe("MODULES_PER_ICP — invariants", () => {
  it("every ICP has at least home+settings (universal access)", () => {
    Object.entries(MODULES_PER_ICP).forEach(([icp, modules]) => {
      expect(modules, `ICP ${icp} should include 'home'`).toContain("home")
      expect(modules, `ICP ${icp} should include 'settings'`).toContain("settings")
    })
  })

  it("cabinet-fiscal does NOT include any DPO/HR/AI/Banking-specific modules", () => {
    const fiscalModules = new Set(MODULES_PER_ICP["cabinet-fiscal"])
    const forbidden = ["ropa", "dsar", "dpia", "breach", "nis2", "dora", "pay-transparency", "whistleblowing"] as const
    forbidden.forEach((id) => {
      expect(fiscalModules.has(id), `cabinet-fiscal must NOT contain '${id}'`).toBe(false)
    })
  })

  it("cabinet-dpo does NOT include Fiscal-specific modules", () => {
    const dpoModules = new Set(MODULES_PER_ICP["cabinet-dpo"])
    expect(dpoModules.has("fiscal")).toBe(false)
    expect(dpoModules.has("pay-transparency")).toBe(false)
  })

  it("PATRON_MODULES never include technical detail", () => {
    const patron = new Set(PATRON_MODULES)
    const forbidden = ["scan", "ropa", "dpia", "fiscal", "nis2", "dora", "vendor-review"] as const
    forbidden.forEach((id) => {
      expect(patron.has(id), `PATRON should NOT include '${id}'`).toBe(false)
    })
  })

  it("AUDITOR_MODULES contain ONLY dosar (read-only audit pack)", () => {
    expect(AUDITOR_MODULES).toEqual(["dosar"])
  })
})
