// Unit tests pentru parser D100 (obligații buget de stat).

import { describe, expect, it } from "vitest"

import {
  getD100DividendsTotal,
  getD100FilingKey,
  parseD100,
} from "./parser-d100"

const SAMPLE_MONTHLY_DIVIDENDE = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie cui="RO12345678" an="2026" luna="5">
  <impozit cod="480" suma_datorata="8000" suma_de_plata="8000"/>
  <impozit cod="101" suma_datorata="15000" suma_de_plata="15000"/>
  <impozit cod="201" suma_datorata="3000" suma_de_plata="3000"/>
</declaratie>`

const SAMPLE_BLOCK_FORMAT = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie>
  <cui>RO87654321</cui>
  <perioada>2026-Q1</perioada>
  <impozit cod="401">
    <suma_datorata>5000</suma_datorata>
    <suma_de_plata>5000</suma_de_plata>
    <suma_de_recuperat>0</suma_de_recuperat>
  </impozit>
  <impozit cod="481">
    <suma_datorata>2400</suma_datorata>
    <suma_de_plata>2400</suma_de_plata>
  </impozit>
</declaratie>`

const SAMPLE_NUMERIC_RO = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie cui="RO11223344" an="2026" luna="6">
  <impozit cod="480" suma_datorata="12.500,00" suma_de_plata="12.500,00"/>
</declaratie>`

const SAMPLE_UNKNOWN_CODE = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie cui="RO99999999" an="2026" luna="5">
  <impozit cod="999" suma_datorata="100" suma_de_plata="100"/>
</declaratie>`

describe("parseD100 — format attribute single-line", () => {
  it("extrage CUI + perioada lunară", () => {
    const result = parseD100(SAMPLE_MONTHLY_DIVIDENDE)
    expect(result.declarantCui).toBe("RO12345678")
    expect(result.period?.period).toBe("2026-05")
    expect(result.period?.frequency).toBe("monthly")
  })

  it("extrage 3 linii (dividende, profit, salarii)", () => {
    const result = parseD100(SAMPLE_MONTHLY_DIVIDENDE)
    expect(result.lines).toHaveLength(3)
    const codes = result.lines.map((l) => l.code)
    expect(codes).toContain("480")
    expect(codes).toContain("101")
    expect(codes).toContain("201")
  })

  it("clasifică 480 ca dividende, 101 ca profit", () => {
    const result = parseD100(SAMPLE_MONTHLY_DIVIDENDE)
    const div = result.lines.find((l) => l.code === "480")
    const profit = result.lines.find((l) => l.code === "101")
    expect(div?.category).toBe("dividende")
    expect(profit?.category).toBe("profit_anual")
  })

  it("totalDue corect (8K + 15K + 3K = 26K)", () => {
    const result = parseD100(SAMPLE_MONTHLY_DIVIDENDE)
    expect(result.totalDue).toBe(26000)
    expect(result.totalToPay).toBe(26000)
  })

  it("dividende summary 8K", () => {
    const result = parseD100(SAMPLE_MONTHLY_DIVIDENDE)
    expect(result.summaryByCategory.dividende.totalDue).toBe(8000)
    expect(result.summaryByCategory.dividende.count).toBe(1)
  })
})

describe("parseD100 — format block cu child elements", () => {
  it("extrage din <impozit cod=...><suma_datorata>...</></impozit>", () => {
    const result = parseD100(SAMPLE_BLOCK_FORMAT)
    expect(result.lines).toHaveLength(2)
  })

  it("perioada trimestrială Q1", () => {
    const result = parseD100(SAMPLE_BLOCK_FORMAT)
    expect(result.period?.period).toBe("2026-Q1")
    expect(result.period?.frequency).toBe("quarterly")
  })

  it("clasifică 401 ca microintreprindere, 481 ca dividende", () => {
    const result = parseD100(SAMPLE_BLOCK_FORMAT)
    const micro = result.lines.find((l) => l.code === "401")
    const divPj = result.lines.find((l) => l.code === "481")
    expect(micro?.category).toBe("microintreprindere")
    expect(divPj?.category).toBe("dividende")
  })
})

describe("parseD100 — RO numeric format", () => {
  it("parsează '12.500,00' ca 12500", () => {
    const result = parseD100(SAMPLE_NUMERIC_RO)
    expect(result.lines[0]?.amountDue).toBe(12500)
    expect(result.lines[0]?.amountToPay).toBe(12500)
  })
})

describe("parseD100 — coduri necunoscute", () => {
  it("warning cand toate codurile sunt necunoscute", () => {
    const result = parseD100(SAMPLE_UNKNOWN_CODE)
    expect(result.warnings.some((w) => /cod impozit nu a fost recunoscut/i.test(w))).toBe(true)
  })

  it("totuși extrage linia ca 'necunoscut'", () => {
    const result = parseD100(SAMPLE_UNKNOWN_CODE)
    expect(result.lines[0]?.category).toBe("necunoscut")
    expect(result.lines[0]?.amountDue).toBe(100)
  })
})

describe("parseD100 — errors", () => {
  it("XML gol → error", () => {
    const result = parseD100("")
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("fără linii → error", () => {
    const xml = `<?xml version="1.0"?><declaratie cui="RO1" an="2026" luna="5"></declaratie>`
    const result = parseD100(xml)
    expect(result.errors.some((e) => /niciun r[âa]nd/i.test(e))).toBe(true)
  })
})

describe("getD100DividendsTotal", () => {
  it("returnează agregatul componentei dividende", () => {
    const result = parseD100(SAMPLE_MONTHLY_DIVIDENDE)
    const totals = getD100DividendsTotal(result)
    expect(totals.totalDue).toBe(8000)
    expect(totals.totalToPay).toBe(8000)
  })

  it("returnează 0/0 când nu există dividende", () => {
    const xml = `<?xml version="1.0"?><declaratie cui="RO1" an="2026" luna="5">
      <impozit cod="101" suma_datorata="1000" suma_de_plata="1000"/>
    </declaratie>`
    const result = parseD100(xml)
    expect(getD100DividendsTotal(result)).toEqual({ totalDue: 0, totalToPay: 0 })
  })
})

describe("getD100FilingKey", () => {
  it("returnează cheia 2026-05 pentru match cu FilingRecord", () => {
    const result = parseD100(SAMPLE_MONTHLY_DIVIDENDE)
    expect(getD100FilingKey(result)).toBe("2026-05")
  })
})
