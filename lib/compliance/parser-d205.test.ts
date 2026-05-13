// Unit tests pentru parser D205 (impozit reținut la sursă).

import { describe, expect, it } from "vitest"

import {
  getD205DividendBeneficiaries,
  getD205DividendsTotal,
  parseD205,
} from "./parser-d205"

// ── Sample XML fixtures ─────────────────────────────────────────────────────

const SAMPLE_DIVIDENDE_STANDARD = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie cui="RO12345678" an_raportare="2025">
  <beneficiar>
    <cnp>1850101123456</cnp>
    <nume>Ion Popescu</nume>
    <tip_venit>dividende</tip_venit>
    <cod_venit>401</cod_venit>
    <venit_brut>100000</venit_brut>
    <impozit_retinut>8000</impozit_retinut>
  </beneficiar>
  <beneficiar>
    <cnp>2900202234567</cnp>
    <nume>Maria Ionescu</nume>
    <tip_venit>dividende</tip_venit>
    <cod_venit>401</cod_venit>
    <venit_brut>50000</venit_brut>
    <impozit_retinut>4000</impozit_retinut>
  </beneficiar>
</declaratie>`

const SAMPLE_MIXED_TYPES = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie>
  <cui>RO87654321</cui>
  <an>2025</an>
  <linie>
    <cnp>3850101111111</cnp>
    <nume>Andrei Munteanu</nume>
    <cod_venit>501</cod_venit>
    <denumire_venit>Drepturi de autor</denumire_venit>
    <venit>20000</venit>
    <impozit>2000</impozit>
  </linie>
  <linie>
    <cnp>4900303222222</cnp>
    <nume>Elena Stan</nume>
    <cod_venit>401</cod_venit>
    <denumire_venit>Dividende</denumire_venit>
    <venit>30000</venit>
    <impozit>2400</impozit>
  </linie>
</declaratie>`

const SAMPLE_PJ_BENEFICIARY = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie cui="RO11111111" an="2025">
  <rand>
    <cui>RO99999999</cui>
    <denumire>Asociat SRL</denumire>
    <tip_venit>dividende</tip_venit>
    <venit_brut>200000</venit_brut>
    <impozit_retinut>16000</impozit_retinut>
  </rand>
</declaratie>`

const SAMPLE_RECTIFICATIVA = `<?xml version="1.0" encoding="UTF-8"?>
<declaratie cui="RO22222222" an="2025" rectificativa="1">
  <beneficiar>
    <cnp>5750505333333</cnp>
    <nume>Florin Test</nume>
    <cod_venit>401</cod_venit>
    <venit_brut>10000</venit_brut>
    <impozit_retinut>800</impozit_retinut>
  </beneficiar>
</declaratie>`

const SAMPLE_INVALID = ``

// ── Tests ───────────────────────────────────────────────────────────────────

describe("parseD205 — format standard cu beneficiar", () => {
  it("extrage CUI declarant din attribute root", () => {
    const result = parseD205(SAMPLE_DIVIDENDE_STANDARD)
    expect(result.declarantCui).toBe("RO12345678")
  })

  it("extrage anul raportării (2025)", () => {
    const result = parseD205(SAMPLE_DIVIDENDE_STANDARD)
    expect(result.reportingYear).toBe(2025)
  })

  it("extrage 2 beneficiari dividende cu CNP", () => {
    const result = parseD205(SAMPLE_DIVIDENDE_STANDARD)
    expect(result.beneficiaries).toHaveLength(2)
    expect(result.beneficiaries[0]?.idType).toBe("CNP")
    expect(result.beneficiaries[0]?.id).toBe("1850101123456")
    expect(result.beneficiaries[0]?.name).toBe("Ion Popescu")
  })

  it("clasifică tip venit dividende din cod 401", () => {
    const result = parseD205(SAMPLE_DIVIDENDE_STANDARD)
    expect(result.beneficiaries[0]?.incomeType).toBe("dividende")
    expect(result.beneficiaries[0]?.incomeCode).toBe("401")
  })

  it("agreghează totaluri corect (150K venit + 12K impozit)", () => {
    const result = parseD205(SAMPLE_DIVIDENDE_STANDARD)
    expect(result.totalGrossIncome).toBe(150000)
    expect(result.totalWithheldTax).toBe(12000)
  })

  it("summary dividende: 2 beneficiari, 150K total", () => {
    const result = parseD205(SAMPLE_DIVIDENDE_STANDARD)
    expect(result.summaryByIncomeType.dividende.count).toBe(2)
    expect(result.summaryByIncomeType.dividende.totalIncome).toBe(150000)
    expect(result.summaryByIncomeType.dividende.totalTax).toBe(12000)
  })

  it("zero erori pe XML valid", () => {
    const result = parseD205(SAMPLE_DIVIDENDE_STANDARD)
    expect(result.errors).toEqual([])
  })
})

describe("parseD205 — format cu <linie> și tipuri mixte", () => {
  it("extrage 2 beneficiari (drepturi autor + dividende)", () => {
    const result = parseD205(SAMPLE_MIXED_TYPES)
    expect(result.beneficiaries).toHaveLength(2)
  })

  it("clasifică tip drepturi_autor din cod 501", () => {
    const result = parseD205(SAMPLE_MIXED_TYPES)
    const drAutor = result.beneficiaries.find((b) => b.incomeType === "drepturi_autor")
    expect(drAutor).toBeDefined()
    expect(drAutor?.grossIncome).toBe(20000)
    expect(drAutor?.withheldTax).toBe(2000)
  })

  it("clasifică dividende corect din cod 401", () => {
    const result = parseD205(SAMPLE_MIXED_TYPES)
    const divResult = result.beneficiaries.find((b) => b.incomeType === "dividende")
    expect(divResult?.grossIncome).toBe(30000)
  })

  it("summary diferențiat pe tipuri venit", () => {
    const result = parseD205(SAMPLE_MIXED_TYPES)
    expect(result.summaryByIncomeType.dividende.count).toBe(1)
    expect(result.summaryByIncomeType.drepturi_autor.count).toBe(1)
  })
})

describe("parseD205 — beneficiar persoană juridică (CUI)", () => {
  it("idType = CUI pentru asociat PJ", () => {
    const result = parseD205(SAMPLE_PJ_BENEFICIARY)
    expect(result.beneficiaries[0]?.idType).toBe("CUI")
    expect(result.beneficiaries[0]?.id).toBe("RO99999999")
  })

  it("extras corect din <rand>", () => {
    const result = parseD205(SAMPLE_PJ_BENEFICIARY)
    expect(result.beneficiaries[0]?.name).toBe("Asociat SRL")
    expect(result.beneficiaries[0]?.grossIncome).toBe(200000)
  })
})

describe("parseD205 — rectificativă", () => {
  it("isRectification = true cu attribute root", () => {
    const result = parseD205(SAMPLE_RECTIFICATIVA)
    expect(result.isRectification).toBe(true)
  })

  it("isRectification = false default", () => {
    const result = parseD205(SAMPLE_DIVIDENDE_STANDARD)
    expect(result.isRectification).toBe(false)
  })
})

describe("parseD205 — warnings & errors", () => {
  it("XML gol → error", () => {
    const result = parseD205(SAMPLE_INVALID)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("XML fără beneficiari → error", () => {
    const xml = `<?xml version="1.0"?><declaratie cui="RO123" an="2025"></declaratie>`
    const result = parseD205(xml)
    expect(result.errors.some((e) => /niciun beneficiar/i.test(e))).toBe(true)
  })

  it("warning pentru cotă impozit atipică (nu 8%)", () => {
    const xml = `<?xml version="1.0"?><declaratie cui="RO1" an="2025">
      <beneficiar>
        <cnp>1850101123456</cnp>
        <cod_venit>401</cod_venit>
        <venit_brut>100000</venit_brut>
        <impozit_retinut>25000</impozit_retinut>
      </beneficiar>
    </declaratie>`
    const result = parseD205(xml)
    expect(result.warnings.some((w) => /cot[aă] efectiv[aă]/i.test(w))).toBe(true)
  })
})

describe("getD205DividendsTotal", () => {
  it("returnează agregat dividende pentru cross-correlation cu AGA", () => {
    const result = parseD205(SAMPLE_DIVIDENDE_STANDARD)
    const totals = getD205DividendsTotal(result)
    expect(totals.totalIncome).toBe(150000)
    expect(totals.totalTax).toBe(12000)
    expect(totals.count).toBe(2)
  })
})

describe("getD205DividendBeneficiaries", () => {
  it("filtrează doar beneficiari dividende", () => {
    const result = parseD205(SAMPLE_MIXED_TYPES)
    const divBens = getD205DividendBeneficiaries(result)
    expect(divBens).toHaveLength(1)
    expect(divBens[0]?.incomeType).toBe("dividende")
  })
})
