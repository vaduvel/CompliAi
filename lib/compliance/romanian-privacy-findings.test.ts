import { describe, expect, it } from "vitest"

import { buildRomanianPrivacyFindings } from "@/lib/compliance/romanian-privacy-findings"
import type { OrgProfile } from "@/lib/compliance/applicability"

function profile(overrides: Partial<OrgProfile>): OrgProfile {
  return {
    sector: "other",
    employeeCount: "1-9",
    usesAITools: false,
    requiresEfactura: false,
    completedAtISO: "2026-04-29T10:00:00.000Z",
    ...overrides,
  }
}

describe("buildRomanianPrivacyFindings", () => {
  it("declanșează Legea 190/2018 pentru clinici", () => {
    const findings = buildRomanianPrivacyFindings(
      profile({ sector: "health", employeeCount: "10-49" }),
      "2026-04-29T10:00:00.000Z"
    )

    expect(findings.map((finding) => finding.id)).toContain("intake-lege190-cnp-sensitive-data")
    expect(findings.find((finding) => finding.id === "intake-lege190-cnp-sensitive-data")?.legalReference).toContain("Legea 190/2018")
  })

  it("declanșează trackerul de training GDPR pentru firme cu angajați", () => {
    const findings = buildRomanianPrivacyFindings(
      profile({ sector: "transport", employeeCount: "50-249" }),
      "2026-04-29T10:00:00.000Z"
    )

    expect(findings.map((finding) => finding.id)).toContain("intake-gdpr-training-tracker")
  })

  it("declanșează Legea 190/2018 pentru servicii profesionale cu date HR/CNP", () => {
    const findings = buildRomanianPrivacyFindings(
      profile({ sector: "professional-services", employeeCount: "10-49" }),
      "2026-04-29T10:00:00.000Z"
    )

    const lege190 = findings.find((finding) => finding.id === "intake-lege190-cnp-sensitive-data")
    expect(lege190?.severity).toBe("high")
    expect(lege190?.evidenceRequired).toContain("anexă CNP")
  })
})
