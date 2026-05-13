// Unit tests pentru parser AGA cu mock AI provider.

import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the AI provider before importing parser
vi.mock("@/lib/server/ai-provider", () => ({
  generateContent: vi.fn(),
}))

import {
  extractAgaFromText,
  getAgaAssociatesCnps,
  isAgaDistributionPropRata,
  type AgaExtractedData,
} from "./parser-aga"
import { generateContent } from "@/lib/server/ai-provider"

const mockedGenerate = vi.mocked(generateContent)

beforeEach(() => {
  mockedGenerate.mockReset()
})

function mockAIResponse(json: object | string) {
  const content = typeof json === "string" ? json : JSON.stringify(json)
  mockedGenerate.mockResolvedValueOnce({
    content,
    provider: "gemini",
    model: "gemini-2.5-flash-lite",
  })
}

const SAMPLE_AGA_TEXT = `
HOTĂRÂREA ADUNĂRII GENERALE A ASOCIAȚILOR
ACME SRL, CUI RO12345678, J40/1234/2020
Sediu: București, Strada Test nr. 1
Data: 15 aprilie 2026

Asociații prezenți:
1. POPESCU ION, CNP 1850101123456, deține 60% din capitalul social
2. IONESCU MARIA, CNP 2900202234567, deține 40% din capitalul social

HOTĂRĂSC:
Repartizarea profitului net aferent exercițiului financiar 2025 (100.000 RON) sub formă de dividende:
- POPESCU ION: 60.000 RON
- IONESCU MARIA: 40.000 RON
Total dividende distribuite: 100.000 RON

Profit reportat anterior: 0 RON

Semnături:
POPESCU ION   IONESCU MARIA
`

const SAMPLE_DEROGATION = `
HOTĂRÂREA ASOCIATULUI UNIC
Beta SRL, CUI RO87654321
Data: 10 mai 2026

ALPHA HOLDING SRL (CUI RO11111111) — asociat unic 100%

HOTĂRĂȘTE:
Distribuirea sumei de 50.000 RON dividende cuvenite din profitul net 2024.
`

const SAMPLE_DERIVATE_DEROG_PROCENT = `
HOTĂRÂREA AGA EXTRAORDINARĂ
Gamma SRL, CUI RO99999999
Data: 1 iunie 2026

Asociați:
- POPESCU A (CNP 1800101111111): deținere 70%
- IONESCU B (CNP 2900202222222): deținere 30%

În baza acordului unanim conform art. 67 Legea 31/1990, asociații hotărăsc distribuție derogatorie:
- A primește 50.000 RON (50% din dividende)
- B primește 50.000 RON (50% din dividende)
Total: 100.000 RON
`

describe("extractAgaFromText", () => {
  it("extrage AGA standard cu 2 asociați pro-rata", async () => {
    mockAIResponse({
      resolutionDate: "2026-04-15",
      financialYear: 2025,
      resolutionType: "AGA-ordinara",
      associates: [
        {
          idType: "CNP",
          id: "1850101123456",
          name: "POPESCU ION",
          ownershipPercent: 60,
          dividendsAmount: 60000,
          dividendsPercent: 60,
        },
        {
          idType: "CNP",
          id: "2900202234567",
          name: "IONESCU MARIA",
          ownershipPercent: 40,
          dividendsAmount: 40000,
          dividendsPercent: 40,
        },
      ],
      totalDividendsAmount: 100000,
      netProfit: 100000,
      retainedEarnings: 0,
      confidence: 0.95,
      warnings: [],
    })

    const result = await extractAgaFromText(SAMPLE_AGA_TEXT)
    expect(result.resolutionDate).toBe("2026-04-15")
    expect(result.financialYear).toBe(2025)
    expect(result.resolutionType).toBe("AGA-ordinara")
    expect(result.associates).toHaveLength(2)
    expect(result.totalDividendsAmount).toBe(100000)
    expect(result.confidence).toBeGreaterThan(0.9)
    expect(result.errors).toEqual([])
  })

  it("CNP-uri extrase complete (13 cifre)", async () => {
    mockAIResponse({
      associates: [{ idType: "CNP", id: "1850101123456", name: "POPESCU ION", ownershipPercent: 60, dividendsAmount: 60000, dividendsPercent: 60 }],
      resolutionDate: "2026-04-15",
      financialYear: 2025,
      resolutionType: "AGA-ordinara",
      totalDividendsAmount: 60000,
      netProfit: 100000,
      retainedEarnings: 0,
      confidence: 0.9,
    })
    const result = await extractAgaFromText(SAMPLE_AGA_TEXT)
    expect(result.associates[0]?.id).toBe("1850101123456")
    expect(result.associates[0]?.idType).toBe("CNP")
  })

  it("detectează decizie asociat unic cu CUI", async () => {
    mockAIResponse({
      resolutionDate: "2026-05-10",
      financialYear: 2024,
      resolutionType: "decizie-asociat-unic",
      associates: [
        {
          idType: "CUI",
          id: "RO11111111",
          name: "ALPHA HOLDING SRL",
          ownershipPercent: 100,
          dividendsAmount: 50000,
          dividendsPercent: 100,
        },
      ],
      totalDividendsAmount: 50000,
      netProfit: 50000,
      retainedEarnings: 0,
      confidence: 0.92,
    })

    const result = await extractAgaFromText(SAMPLE_DEROGATION)
    expect(result.resolutionType).toBe("decizie-asociat-unic")
    expect(result.associates[0]?.idType).toBe("CUI")
    expect(result.associates[0]?.id).toBe("RO11111111")
    expect(result.associates[0]?.ownershipPercent).toBe(100)
  })

  it("warning auto-generat pentru distribuție derogatorie", async () => {
    mockAIResponse({
      resolutionDate: "2026-06-01",
      financialYear: 2024,
      resolutionType: "AGA-extraordinara",
      associates: [
        { idType: "CNP", id: "1800101111111", name: "POPESCU A", ownershipPercent: 70, dividendsAmount: 50000, dividendsPercent: 50 },
        { idType: "CNP", id: "2900202222222", name: "IONESCU B", ownershipPercent: 30, dividendsAmount: 50000, dividendsPercent: 50 },
      ],
      totalDividendsAmount: 100000,
      netProfit: 100000,
      retainedEarnings: 0,
      confidence: 0.88,
      warnings: ["Distribuție derogatorie acord unanim."],
    })

    const result = await extractAgaFromText(SAMPLE_DERIVATE_DEROG_PROCENT)
    expect(result.warnings.length).toBeGreaterThanOrEqual(2)
    expect(result.warnings.some((w) => /derogare AGA/i.test(w))).toBe(true)
  })

  it("warning pentru suma procente ≠ 100%", async () => {
    mockAIResponse({
      resolutionDate: "2026-04-15",
      financialYear: 2025,
      resolutionType: "AGA-ordinara",
      associates: [
        { idType: "CNP", id: "1", name: "A", ownershipPercent: 60, dividendsAmount: 60000, dividendsPercent: 60 },
        { idType: "CNP", id: "2", name: "B", ownershipPercent: 35, dividendsAmount: 35000, dividendsPercent: 35 },
      ],
      totalDividendsAmount: 95000,
      netProfit: 95000,
      retainedEarnings: 0,
      confidence: 0.8,
    })

    const result = await extractAgaFromText(SAMPLE_AGA_TEXT)
    expect(result.warnings.some((w) => /procente de[țt]inere/i.test(w))).toBe(true)
  })

  it("clamp procent peste 100", async () => {
    mockAIResponse({
      associates: [
        { idType: "CNP", id: "1", name: "A", ownershipPercent: 150, dividendsAmount: 100, dividendsPercent: 60 },
      ],
      resolutionDate: "2026-04-15",
      financialYear: 2025,
      resolutionType: "AGA-ordinara",
      confidence: 0.5,
    })
    const result = await extractAgaFromText(SAMPLE_AGA_TEXT)
    expect(result.associates[0]?.ownershipPercent).toBe(100)
  })

  it("text gol → eroare fără apel AI", async () => {
    const result = await extractAgaFromText("")
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain("prea scurt")
    expect(mockedGenerate).not.toHaveBeenCalled()
  })

  it("text prea lung → eroare fără apel AI", async () => {
    const result = await extractAgaFromText("a".repeat(60_000))
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain("prea lung")
  })

  it("AI răspunde JSON invalid → eroare", async () => {
    mockAIResponse("not valid json")
    const result = await extractAgaFromText(SAMPLE_AGA_TEXT)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain("JSON")
  })

  it("AI răspuns cu markdown wrapper se curăță automat", async () => {
    mockedGenerate.mockResolvedValueOnce({
      content:
        "```json\n" +
        JSON.stringify({
          resolutionDate: "2026-04-15",
          financialYear: 2025,
          resolutionType: "AGA-ordinara",
          associates: [],
          confidence: 0.5,
        }) +
        "\n```",
      provider: "gemini",
      model: "gemini-2.5-flash-lite",
    })

    const result = await extractAgaFromText(SAMPLE_AGA_TEXT)
    expect(result.resolutionDate).toBe("2026-04-15")
    expect(result.errors).toEqual([])
  })
})

describe("helpers cross-correlation", () => {
  const baseAga: AgaExtractedData = {
    resolutionDate: "2026-04-15",
    financialYear: 2025,
    resolutionType: "AGA-ordinara",
    associates: [
      { idType: "CNP", id: "1850101123456", name: "A", ownershipPercent: 60, dividendsAmount: 60000, dividendsPercent: 60 },
      { idType: "CNP", id: "2900202234567", name: "B", ownershipPercent: 40, dividendsAmount: 40000, dividendsPercent: 40 },
    ],
    totalDividendsAmount: 100000,
    netProfit: 100000,
    retainedEarnings: 0,
    aiProvider: "gemini",
    confidence: 0.95,
    errors: [],
    warnings: [],
  }

  it("getAgaAssociatesCnps returnează doar CNP-uri", () => {
    const cnps = getAgaAssociatesCnps(baseAga)
    expect(cnps).toHaveLength(2)
    expect(cnps[0]).toBe("1850101123456")
  })

  it("isAgaDistributionPropRata = true pe distribuție egală cu ownership", () => {
    expect(isAgaDistributionPropRata(baseAga)).toBe(true)
  })

  it("isAgaDistributionPropRata = false pe derogare", () => {
    const derog: AgaExtractedData = {
      ...baseAga,
      associates: [
        { ...baseAga.associates[0]!, ownershipPercent: 70, dividendsPercent: 50 },
        { ...baseAga.associates[1]!, ownershipPercent: 30, dividendsPercent: 50 },
      ],
    }
    expect(isAgaDistributionPropRata(derog)).toBe(false)
  })
})
