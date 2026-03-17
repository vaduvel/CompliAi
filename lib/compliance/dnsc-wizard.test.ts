import { describe, it, expect } from "vitest"
import { buildDNSCNotificationDraft } from "@/lib/compliance/dnsc-wizard"
import type { OrgProfile } from "@/lib/compliance/applicability"

const fullProfile: OrgProfile = {
  sector: "health",
  employeeCount: "50-249",
  usesAITools: false,
  requiresEfactura: true,
  cui: "RO12345678",
  completedAtISO: "2026-03-17T00:00:00.000Z",
}

describe("buildDNSCNotificationDraft", () => {
  it("include orgName și CUI în draft", () => {
    const draft = buildDNSCNotificationDraft({
      orgName: "Test SRL",
      orgProfile: fullProfile,
    })
    expect(draft).toContain("Test SRL")
    expect(draft).toContain("RO12345678")
  })

  it("include sector label în română", () => {
    const draft = buildDNSCNotificationDraft({
      orgName: "Test SRL",
      orgProfile: fullProfile,
    })
    expect(draft).toContain("Sănătate")
  })

  it("marchează entitate esențială pentru sectoare NIS2 esențiale", () => {
    const draft = buildDNSCNotificationDraft({
      orgName: "Spital SRL",
      orgProfile: { ...fullProfile, sector: "health" },
    })
    expect(draft).toContain("entitate esențială")
  })

  it("marchează entitate importantă pentru sectoare NIS2 importante", () => {
    const draft = buildDNSCNotificationDraft({
      orgName: "Firma SA",
      orgProfile: { ...fullProfile, sector: "manufacturing" },
    })
    expect(draft).toContain("entitate importantă")
  })

  it("funcționează cu profil null (fallback graceful)", () => {
    const draft = buildDNSCNotificationDraft({
      orgName: "Fără Profil SRL",
      orgProfile: null,
    })
    expect(draft).toContain("Fără Profil SRL")
    expect(draft).toContain("[DE COMPLETAT")
    expect(draft.length).toBeGreaterThan(200)
  })

  it("include disclaimer CompliAI la final", () => {
    const draft = buildDNSCNotificationDraft({
      orgName: "Test",
      orgProfile: null,
    })
    expect(draft).toContain("CompliAI")
    expect(draft).toContain("nu constituie consiliere juridică")
  })
})
