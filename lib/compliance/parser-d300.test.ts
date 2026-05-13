// Unit tests pentru parser D300.
// Acoperă multiple formate XML: ANAF standard, Saga export, SmartBill export,
// format vechi cu attribute pe rânduri.

import { describe, expect, it } from "vitest"

import {
  getD300BaseByVatRate,
  getD300FilingKey,
  parseD300,
} from "./parser-d300"

// ── Sample XML fixtures ─────────────────────────────────────────────────────

const SAMPLE_LUNAR_STANDARD = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie>
  <cui>RO12345678</cui>
  <an>2026</an>
  <luna>5</luna>
  <rd1_baza>50000.00</rd1_baza>
  <rd1_tva>9500.00</rd1_tva>
  <rd2_baza>10000.00</rd2_baza>
  <rd2_tva>900.00</rd2_tva>
  <rd20_baza>30000.00</rd20_baza>
  <rd20_tva>5700.00</rd20_tva>
  <rd25_tva>5700.00</rd25_tva>
  <rd30_tva>4700.00</rd30_tva>
</declaratie>`

const SAMPLE_TRIMESTRIAL = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie cui="RO87654321" an="2026" trimestru="1" rectificativa="0">
  <a1>120000,00</a1>
  <a2>22800,00</a2>
  <a27>80000,00</a27>
  <a28>15200,00</a28>
  <a45>7600,00</a45>
</declaratie>`

const SAMPLE_RECTIFICATIVA = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie>
  <cui>RO11223344</cui>
  <perioada>2026-05</perioada>
  <rectificativa>1</rectificativa>
  <rd1_baza>50000</rd1_baza>
  <rd1_tva>9500</rd1_tva>
</declaratie>`

const SAMPLE_ATTRIBUTE_FORMAT = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie>
  <cui>RO55667788</cui>
  <perioada>2026-Q2</perioada>
  <rd1 baza="100000" tva="19000"/>
  <rd2 baza="20000" tva="1800"/>
  <rd20 baza="60000" tva="11400"/>
</declaratie>`

const SAMPLE_INVALID_EMPTY = ``
const SAMPLE_INVALID_NOT_XML = `lorem ipsum nu e xml`

// ── Tests ───────────────────────────────────────────────────────────────────

describe("parseD300 — format ANAF standard (lunar)", () => {
  it("extrage CUI corect", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    expect(result.cui).toBe("RO12345678")
  })

  it("extrage perioada lunar (2026-05)", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    expect(result.period).toEqual({
      year: 2026,
      month: 5,
      quarter: null,
      period: "2026-05",
      frequency: "monthly",
    })
  })

  it("extrage 3 linii TVA (rd1, rd2, rd20)", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    const codes = result.lines.map((l) => l.code)
    expect(codes).toContain("rd1")
    expect(codes).toContain("rd2")
    expect(codes).toContain("rd20")
  })

  it("rd1 are baza 50000 + TVA 9500 (cota 19%)", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    const rd1 = result.lines.find((l) => l.code === "rd1")
    expect(rd1?.base).toBe(50000)
    expect(rd1?.vat).toBe(9500)
    expect(rd1?.vatRate).toBe(19)
    expect(rd1?.category).toBe("collected")
  })

  it("agreghează totalCollectedVat corect (9500 + 900)", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    expect(result.totalCollectedVat).toBe(10400)
    expect(result.totalCollectedBase).toBe(60000)
  })

  it("agreghează totalDeductibleVat (5700)", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    expect(result.totalDeductibleVat).toBe(5700)
    expect(result.totalDeductibleBase).toBe(30000)
  })

  it("extrage rd30 (TVA de plată = 4700)", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    expect(result.vatToPay).toBe(4700)
  })

  it("zero erori pe XML valid complet", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    expect(result.errors).toEqual([])
  })
})

describe("parseD300 — format vechi cu aliases a1/a2/a27", () => {
  it("extrage trimestrial Q1 din attribute root", () => {
    const result = parseD300(SAMPLE_TRIMESTRIAL)
    expect(result.period?.frequency).toBe("quarterly")
    expect(result.period?.period).toBe("2026-Q1")
    expect(result.period?.quarter).toBe(1)
  })

  it("parsează numere cu virgulă RO (120000,00)", () => {
    const result = parseD300(SAMPLE_TRIMESTRIAL)
    const rd1 = result.lines.find((l) => l.code === "rd1")
    expect(rd1?.base).toBe(120000)
    expect(rd1?.vat).toBe(22800)
  })

  it("extrage rd20 din alias a27/a28", () => {
    const result = parseD300(SAMPLE_TRIMESTRIAL)
    const rd20 = result.lines.find((l) => l.code === "rd20")
    expect(rd20?.base).toBe(80000)
    expect(rd20?.vat).toBe(15200)
  })

  it("rd30 din alias a45 = 7600", () => {
    const result = parseD300(SAMPLE_TRIMESTRIAL)
    expect(result.vatToPay).toBe(7600)
  })

  it("detectează cui din attribute root (cui=...)", () => {
    const result = parseD300(SAMPLE_TRIMESTRIAL)
    expect(result.cui).toBe("RO87654321")
  })
})

describe("parseD300 — rectificativă", () => {
  it("detectează isRectification=true cu <rectificativa>1</>", () => {
    const result = parseD300(SAMPLE_RECTIFICATIVA)
    expect(result.isRectification).toBe(true)
  })

  it("rectificativă=0 (atribut) → isRectification=false", () => {
    const result = parseD300(SAMPLE_TRIMESTRIAL)
    expect(result.isRectification).toBe(false)
  })

  it("perioada YYYY-MM direct (no separate luna/an)", () => {
    const result = parseD300(SAMPLE_RECTIFICATIVA)
    expect(result.period?.period).toBe("2026-05")
    expect(result.period?.month).toBe(5)
  })
})

describe("parseD300 — format cu attribute pe element rd", () => {
  it("extrage rd1 din <rd1 baza='X' tva='Y'/>", () => {
    const result = parseD300(SAMPLE_ATTRIBUTE_FORMAT)
    const rd1 = result.lines.find((l) => l.code === "rd1")
    expect(rd1?.base).toBe(100000)
    expect(rd1?.vat).toBe(19000)
  })

  it("agreghează corect pentru attribute format", () => {
    const result = parseD300(SAMPLE_ATTRIBUTE_FORMAT)
    expect(result.totalCollectedVat).toBe(20800) // 19000 + 1800
    expect(result.totalDeductibleVat).toBe(11400)
  })

  it("perioada YYYY-Qn direct", () => {
    const result = parseD300(SAMPLE_ATTRIBUTE_FORMAT)
    expect(result.period?.period).toBe("2026-Q2")
  })
})

describe("parseD300 — erori și edge cases", () => {
  it("XML gol → error 'XML invalid'", () => {
    const result = parseD300(SAMPLE_INVALID_EMPTY)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain("invalid")
  })

  it("text non-XML → error 'XML invalid'", () => {
    const result = parseD300(SAMPLE_INVALID_NOT_XML)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("XML cu doar CUI fără rânduri → error 'Niciun rând TVA'", () => {
    const minimal = `<?xml version="1.0"?><declaratie><cui>RO123</cui><an>2026</an><luna>5</luna></declaratie>`
    const result = parseD300(minimal)
    expect(result.errors.some((e) => /niciun r[âa]nd/i.test(e))).toBe(true)
  })

  it("warning când există colectat dar zero deductibil", () => {
    const xml = `<?xml version="1.0"?><declaratie><cui>RO1</cui><an>2026</an><luna>5</luna><rd1_baza>1000</rd1_baza><rd1_tva>190</rd1_tva></declaratie>`
    const result = parseD300(xml)
    expect(result.warnings.some((w) => /zero TVA deductibil/i.test(w))).toBe(true)
  })
})

describe("getD300FilingKey", () => {
  it("returnează perioada normalizată pentru match cu FilingRecord", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    expect(getD300FilingKey(result)).toBe("2026-05")
  })

  it("returnează null când perioada lipsește", () => {
    const result = parseD300(SAMPLE_INVALID_EMPTY)
    expect(getD300FilingKey(result)).toBeNull()
  })
})

describe("getD300BaseByVatRate", () => {
  it("returnează baza+TVA pentru cota 19%", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    expect(getD300BaseByVatRate(result, 19)).toEqual({ base: 50000, vat: 9500 })
  })

  it("returnează baza+TVA pentru cota 9%", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    expect(getD300BaseByVatRate(result, 9)).toEqual({ base: 10000, vat: 900 })
  })

  it("returnează 0/0 pentru cotă inexistentă", () => {
    const result = parseD300(SAMPLE_LUNAR_STANDARD)
    expect(getD300BaseByVatRate(result, 5)).toEqual({ base: 0, vat: 0 })
  })
})
