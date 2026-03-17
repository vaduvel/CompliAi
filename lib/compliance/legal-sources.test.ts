// Sprint 11 — Explainability Layer tests
import { describe, it, expect } from "vitest"
import {
  getLegalSource,
  getLegalSourceForFinding,
  getSuggestionExplanation,
  getActiveLegalSources,
} from "./legal-sources"

describe("getLegalSource", () => {
  it("returnează sursa GDPR cu citație oficială", () => {
    const src = getLegalSource("gdpr")
    expect(src.citation).toBe("Regulament UE 2016/679")
    expect(src.shortName).toBe("GDPR")
  })

  it("returnează sursa NIS2 cu OUG 155/2024", () => {
    const src = getLegalSource("nis2")
    expect(src.citation).toContain("OUG 155/2024")
    expect(src.shortName).toBe("NIS2")
  })

  it("returnează sursa AI Act cu Regulament UE 2024/1689", () => {
    const src = getLegalSource("ai-act")
    expect(src.citation).toContain("2024/1689")
    expect(src.applicabilityNote).toContain("2026")
  })

  it("returnează sursa e-Factura cu OUG 89/2025", () => {
    const src = getLegalSource("efactura")
    expect(src.citation).toContain("OUG 89/2025")
  })
})

describe("getLegalSourceForFinding", () => {
  it("mapează GDPR finding la GDPR", () => {
    const src = getLegalSourceForFinding("GDPR")
    expect(src.shortName).toBe("GDPR")
  })

  it("mapează NIS2 finding la NIS2", () => {
    const src = getLegalSourceForFinding("NIS2")
    expect(src.shortName).toBe("NIS2")
  })

  it("mapează EU_AI_ACT finding la AI Act", () => {
    const src = getLegalSourceForFinding("EU_AI_ACT")
    expect(src.shortName).toBe("AI Act")
  })
})

describe("getSuggestionExplanation", () => {
  it("returnează explicație cu toate câmpurile pentru cert", () => {
    const exp = getSuggestionExplanation("gdpr", "GDPR se aplică tuturor entităților.", "certain")
    expect(exp.legalSource.citation).toBe("Regulament UE 2016/679")
    expect(exp.reasoning).toBe("GDPR se aplică tuturor entităților.")
    expect(exp.certaintyLabel).toBe("Cert aplicabil")
    expect(exp.certaintyColor).toBe("green")
  })

  it("returnează culoare yellow pentru probable", () => {
    const exp = getSuggestionExplanation("nis2", "Sectorul tău poate fi inclus.", "probable")
    expect(exp.certaintyColor).toBe("yellow")
    expect(exp.certaintyLabel).toBe("Probabil aplicabil")
  })

  it("returnează culoare gray pentru unlikely", () => {
    const exp = getSuggestionExplanation("ai-act", "Nu s-au detectat sisteme AI.", "unlikely")
    expect(exp.certaintyColor).toBe("gray")
    expect(exp.certaintyLabel).toBe("Puțin probabil aplicabil")
  })
})

describe("getActiveLegalSources", () => {
  it("returnează sursele pentru tag-urile active", () => {
    const sources = getActiveLegalSources(["gdpr", "nis2"])
    expect(sources).toHaveLength(2)
    expect(sources.map((s) => s.shortName)).toContain("GDPR")
    expect(sources.map((s) => s.shortName)).toContain("NIS2")
  })

  it("returnează array gol pentru tags gol", () => {
    const sources = getActiveLegalSources([])
    expect(sources).toHaveLength(0)
  })
})
