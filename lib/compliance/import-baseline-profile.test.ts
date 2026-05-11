import { describe, expect, it } from "vitest"

import type { OrgProfile, OrgSector } from "@/lib/compliance/applicability"
import { buildImportBaselineAnswers } from "@/lib/compliance/import-baseline-profile"
import { buildInitialFindings } from "@/lib/compliance/intake-engine"
import { buildRomanianPrivacyFindings } from "@/lib/compliance/romanian-privacy-findings"
import { computeDashboardSummary, initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"

function profile(sector: OrgSector, employeeCount: OrgProfile["employeeCount"]): OrgProfile {
  return {
    sector,
    employeeCount,
    usesAITools: false,
    requiresEfactura: false,
    completedAtISO: "2026-04-30T07:00:00.000Z",
  }
}

function scoreFor(input: OrgProfile) {
  const nowISO = "2026-04-30T07:00:00.000Z"
  const answers = buildImportBaselineAnswers(input, { hasWebsite: false })
  const findings = buildInitialFindings(answers, {
    supplementalFindings: buildRomanianPrivacyFindings(input, nowISO),
  })
  const state = normalizeComplianceState({
    ...initialComplianceState,
    orgProfile: input,
    findings,
    scans: [
      {
        id: `scan-${input.sector}`,
        documentName: "Baseline import portofoliu",
        contentPreview: "Test baseline import.",
        createdAtISO: nowISO,
        analyzedAtISO: nowISO,
        findingsCount: findings.length,
      },
    ],
  })
  return computeDashboardSummary(state).score
}

describe("buildImportBaselineAnswers", () => {
  it("nu tratează toate firmele importate ca același profil de risc", () => {
    const scores = [
      scoreFor(profile("health", "10-49")),
      scoreFor(profile("transport", "50-249")),
      scoreFor(profile("finance", "250+")),
    ]

    expect(new Set(scores).size).toBeGreaterThan(1)
  })

  it("declanșează B2C pentru clinică/retail, dar nu pentru transport B2B", () => {
    const healthFindings = buildInitialFindings(
      buildImportBaselineAnswers(profile("health", "10-49"), { hasWebsite: false })
    )
    const transportFindings = buildInitialFindings(
      buildImportBaselineAnswers(profile("transport", "50-249"), { hasWebsite: false })
    )

    expect(healthFindings.some((finding) => finding.id === "intake-b2c-privacy")).toBe(true)
    expect(transportFindings.some((finding) => finding.id === "intake-b2c-privacy")).toBe(false)
  })

  it("păstrează semnalele reale de website peste presupunerile conservative", () => {
    const answers = buildImportBaselineAnswers(profile("retail", "10-49"), {
      hasWebsite: true,
      websiteSignals: {
        hasPrivacyPolicy: true,
        hasSitePrivacyPolicy: true,
        hasCookiesConsent: true,
      },
    })

    expect(answers.hasPrivacyPolicy).toBe("yes")
    expect(answers.hasSitePrivacyPolicy).toBe("yes")
    expect(answers.hasCookiesConsent).toBe("yes")
  })
})
