import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { simulateFindings } from "@/lib/compliance/engine"
import { discoverAISystemsFromManifest } from "@/lib/server/manifest-autodiscovery"

function readFixture(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", ...segments), "utf8")
}

type ExpectedFindingFixture = {
  documentName: string
  requiredRuleIds: string[]
}

describe("expected findings fixtures", () => {
  function assertFixture(name: string) {
    const expected = JSON.parse(
      readFixture("expected-findings", name)
    ) as ExpectedFindingFixture
    const content = readFixture("documents", expected.documentName)

    const result = simulateFindings(expected.documentName, content, "2026-03-13T10:00:00.000Z")
    const actualRuleIds = new Set(result.findings.map((finding) => finding.provenance?.ruleId))

    for (const ruleId of expected.requiredRuleIds) {
      expect(actualRuleIds.has(ruleId)).toBe(true)
    }
  }

  it("pastreaza semnalele-cheie pentru documentul de tracking", () => {
    assertFixture("policy-tracking.json")
  })

  it("pastreaza semnalele-cheie pentru documentul high-risk", () => {
    assertFixture("high-risk-scoring.json")
  })

  it("pastreaza semnalele-cheie pentru documentul de transfer/resedinta date", () => {
    assertFixture("data-residency-transfer.json")
  })

  it("pastreaza semnalele-cheie pentru documentul de recrutare cu risc ridicat", () => {
    assertFixture("recruitment-high-risk-bundle.json")
  })

  it("pastreaza semnalele-cheie pentru compliscan.yaml declarativ", () => {
    const content = readFixture("yaml", "compliscan-customer-support.yaml")
    const expected = JSON.parse(
      readFixture("expected-findings", "compliscan-customer-support.json")
    ) as ExpectedFindingFixture

    const discovery = discoverAISystemsFromManifest({
      documentName: expected.documentName,
      content,
      nowISO: "2026-03-13T10:00:00.000Z",
    })
    const actualRuleIds = new Set(
      discovery.findings.map((finding) => finding.provenance?.ruleId).filter(Boolean)
    )

    for (const ruleId of expected.requiredRuleIds) {
      expect(actualRuleIds.has(ruleId)).toBe(true)
    }
  })

  it("pastreaza semnalele-cheie pentru compliscan.yaml high-risk de recrutare", () => {
    const content = readFixture("yaml", "compliscan-recruitment-high-risk.yaml")
    const expected = JSON.parse(
      readFixture("expected-findings", "compliscan-recruitment-high-risk.json")
    ) as ExpectedFindingFixture

    const discovery = discoverAISystemsFromManifest({
      documentName: expected.documentName,
      content,
      nowISO: "2026-03-13T10:00:00.000Z",
    })
    const actualRuleIds = new Set(
      discovery.findings.map((finding) => finding.provenance?.ruleId).filter(Boolean)
    )

    for (const ruleId of expected.requiredRuleIds) {
      expect(actualRuleIds.has(ruleId)).toBe(true)
    }
  })
})
