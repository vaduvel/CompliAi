import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { parseCompliScanYaml } from "@/lib/server/compliscan-yaml"
import { discoverAISystemsFromManifest } from "@/lib/server/manifest-autodiscovery"

function readFixture(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", ...segments), "utf8")
}

describe("manifest-autodiscovery fixtures", () => {
  it("parseaza fixture-ul compliscan.yaml valid", () => {
    const yaml = readFixture("yaml", "compliscan-customer-support.yaml")
    const parsed = parseCompliScanYaml(yaml)

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.config.specs.provider).toBe("openai")
    expect(parsed.config.specs.model).toBe("gpt-4o")
    expect(parsed.config.governance.risk_class).toBe("limited")
    expect(parsed.config.human_oversight.required).toBe(true)
  })

  it("detecteaza provideri si framework-uri din fixture-ul package.json", () => {
    const manifest = readFixture("manifests", "package-openai.json")
    const discovery = discoverAISystemsFromManifest({
      documentName: "package.json",
      content: manifest,
      nowISO: "2026-03-13T09:00:00.000Z",
    })

    expect(discovery.sourceKind).toBe("manifest")
    expect(discovery.providers).toContain("OpenAI")
    expect(discovery.frameworks).toContain("openai-sdk")
    expect(discovery.frameworks).toContain("langchain")
    expect(discovery.candidates.length).toBeGreaterThan(0)
  })

  it("detecteaza provideri si din fixture-ul requirements.txt", () => {
    const manifest = readFixture("manifests", "requirements-openai.txt")
    const discovery = discoverAISystemsFromManifest({
      documentName: "requirements.txt",
      content: manifest,
      nowISO: "2026-03-13T09:00:00.000Z",
    })

    expect(discovery.sourceKind).toBe("manifest")
    expect(discovery.providers).toContain("OpenAI")
    expect(discovery.providers).toContain("Anthropic")
    expect(discovery.frameworks).toContain("openai-sdk")
  })

  it("trateaza fixture-ul YAML ca sursa declarativa pentru sistem AI", () => {
    const yaml = readFixture("yaml", "compliscan-customer-support.yaml")
    const discovery = discoverAISystemsFromManifest({
      documentName: "compliscan.yaml",
      content: yaml,
      nowISO: "2026-03-13T09:00:00.000Z",
    })

    expect(discovery.sourceKind).toBe("yaml")
    expect(discovery.candidates).toHaveLength(1)
    expect(discovery.candidates[0].riskLevel).toBe("limited")
    expect(discovery.frameworks).toContain("compliscan-yaml")
  })

  it("trateaza fixture-ul YAML high-risk ca sursa declarativa cu semnale multiple", () => {
    const yaml = readFixture("yaml", "compliscan-recruitment-high-risk.yaml")
    const discovery = discoverAISystemsFromManifest({
      documentName: "compliscan.yaml",
      content: yaml,
      nowISO: "2026-03-13T09:00:00.000Z",
    })

    expect(discovery.sourceKind).toBe("yaml")
    expect(discovery.candidates).toHaveLength(1)
    expect(discovery.candidates[0].riskLevel).toBe("high")
    expect(discovery.findings.map((finding) => finding.provenance?.ruleId)).toEqual(
      expect.arrayContaining(["EUAI-001", "EUAI-HO-001", "GDPR-INT-001"])
    )
  })
})
