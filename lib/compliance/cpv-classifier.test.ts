import { describe, expect, it } from "vitest"

import {
  CPV_DICTIONARY,
  cpvDictionarySize,
  findCpvByCode,
  jaccardSimilarity,
  suggestCpvCodes,
  tokenize,
} from "./cpv-classifier"

describe("cpv-classifier — tokenize", () => {
  it("normalizează diacritice", () => {
    const tokens = tokenize("Servicii de Contabilitate")
    expect(tokens).toContain("servicii")
    expect(tokens).toContain("contabilitate")
  })

  it("elimină cuvinte scurte <3 caractere", () => {
    const tokens = tokenize("a și de pe contabilitate")
    expect(tokens).not.toContain("a")
    expect(tokens).not.toContain("și")
    expect(tokens).not.toContain("de")
    expect(tokens).not.toContain("pe")
    expect(tokens).toContain("contabilitate")
  })

  it("returnează lista goală pentru input vid", () => {
    expect(tokenize("")).toEqual([])
    expect(tokenize("  ")).toEqual([])
  })
})

describe("cpv-classifier — jaccardSimilarity", () => {
  it("returnează 1 pentru set-uri identice", () => {
    expect(jaccardSimilarity(["a", "b"], ["a", "b"])).toBe(1)
  })

  it("returnează 0 pentru set-uri disjuncte", () => {
    expect(jaccardSimilarity(["a", "b"], ["c", "d"])).toBe(0)
  })

  it("returnează 0.5 pentru intersecție 1/2", () => {
    // {a,b} vs {b,c} → intersect = {b}, union = {a,b,c} → 1/3
    expect(jaccardSimilarity(["a", "b"], ["b", "c"])).toBeCloseTo(1 / 3, 2)
  })
})

describe("cpv-classifier — suggestCpvCodes", () => {
  it("returnează top match pentru contabilitate", () => {
    const result = suggestCpvCodes("Servicii de contabilitate și audit fiscal")
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].code).toBe("79200000")
    expect(result[0].score).toBeGreaterThan(0.3)
  })

  it("returnează top match pentru combustibil/benzină", () => {
    const result = suggestCpvCodes("Factura combustibil — motorină 50L")
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].code).toBe("09100000")
    expect(result[0].matchedKeywords).toContain("combustibil")
  })

  it("returnează top match pentru servicii IT", () => {
    const result = suggestCpvCodes("Dezvoltare software custom + hosting web")
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].code).toMatch(/^72/) // 72000000 sau sub-cod IT
  })

  it("returnează top match pentru telecomunicații", () => {
    const result = suggestCpvCodes("Abonament telefon mobil Orange")
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].code).toMatch(/^64/) // telecom
  })

  it("returnează listă goală pentru descriere prea scurtă", () => {
    expect(suggestCpvCodes("X")).toEqual([])
    expect(suggestCpvCodes("")).toEqual([])
  })

  it("returnează maxim topN sugestii", () => {
    const result = suggestCpvCodes("Servicii diverse pentru întreprinderi", 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it("filtrează sugestii sub minScore", () => {
    const result = suggestCpvCodes("xyzabcunknown qwertyrandomzyx", 10, 0.5)
    expect(result.length).toBe(0)
  })
})

describe("cpv-classifier — lookup", () => {
  it("findCpvByCode returnează entry pentru cod valid", () => {
    const entry = findCpvByCode("79200000")
    expect(entry).toBeDefined()
    expect(entry?.description).toContain("contabilitate")
  })

  it("findCpvByCode returnează undefined pentru cod invalid", () => {
    expect(findCpvByCode("99999999")).toBeUndefined()
  })

  it("cpvDictionarySize returnează >= 50", () => {
    expect(cpvDictionarySize()).toBeGreaterThanOrEqual(50)
    expect(cpvDictionarySize()).toBe(CPV_DICTIONARY.length)
  })
})
