// Unit tests pentru Cross-Correlation Engine (Pas 7).

import { describe, expect, it } from "vitest"

import {
  normalizeId,
  quarterMonths,
  runCrossCorrelation,
  yearMonths,
  type CrossCorrelationInput,
} from "./cross-correlation-engine"
import type { ParsedDeclarationRecord } from "./parsed-declarations"
import type { ParsedAgaRecord } from "./parsed-aga"
import type { ParsedInvoiceRecord } from "./parsed-invoices"
import type { OnrcSnapshotRecord } from "./onrc-snapshot"
import type { D300ParsedData } from "./parser-d300"
import type { D205ParsedData } from "./parser-d205"
import type { D100ParsedData } from "./parser-d100"
import type { AgaExtractedData } from "./parser-aga"

// ── Builders ────────────────────────────────────────────────────────────────

function mkD300(period: string, totalDeductibleVat: number): ParsedDeclarationRecord {
  const data: D300ParsedData = {
    cui: "RO12345678",
    period: {
      year: parseInt(period.slice(0, 4), 10),
      month: period.includes("Q") ? null : parseInt(period.slice(5), 10),
      quarter: period.includes("Q") ? parseInt(period.slice(-1), 10) : null,
      period,
      frequency: period.includes("Q") ? "quarterly" : "monthly",
    },
    isRectification: false,
    lines: [],
    totalCollectedBase: 0,
    totalCollectedVat: 0,
    totalDeductibleBase: 0,
    totalDeductibleVat,
    vatToPay: 0,
    vatToRefund: 0,
    errors: [],
    warnings: [],
  }
  return {
    id: `d300-${period}`,
    type: "d300",
    period,
    cui: "RO12345678",
    isRectification: false,
    parsedAtISO: new Date().toISOString(),
    source: "upload-xml",
    data,
    errors: [],
    warnings: [],
  }
}

function mkD205(
  year: number,
  beneficiaries: Array<{ id: string; name: string; grossIncome: number; tax: number }>,
): ParsedDeclarationRecord {
  const data: D205ParsedData = {
    declarantCui: "RO12345678",
    reportingYear: year,
    isRectification: false,
    beneficiaries: beneficiaries.map((b) => ({
      idType: "CNP",
      id: b.id,
      name: b.name,
      incomeType: "dividende",
      incomeCode: "401",
      grossIncome: b.grossIncome,
      withheldTax: b.tax,
      country: "RO",
    })),
    summaryByIncomeType: {
      dividende: {
        count: beneficiaries.length,
        totalIncome: beneficiaries.reduce((s, b) => s + b.grossIncome, 0),
        totalTax: beneficiaries.reduce((s, b) => s + b.tax, 0),
      },
      drepturi_autor: { count: 0, totalIncome: 0, totalTax: 0 },
      dobanzi: { count: 0, totalIncome: 0, totalTax: 0 },
      redevente: { count: 0, totalIncome: 0, totalTax: 0 },
      alte: { count: 0, totalIncome: 0, totalTax: 0 },
      necunoscut: { count: 0, totalIncome: 0, totalTax: 0 },
    },
    totalGrossIncome: beneficiaries.reduce((s, b) => s + b.grossIncome, 0),
    totalWithheldTax: beneficiaries.reduce((s, b) => s + b.tax, 0),
    errors: [],
    warnings: [],
  }
  return {
    id: `d205-${year}`,
    type: "d205",
    period: `${year}`,
    cui: "RO12345678",
    isRectification: false,
    parsedAtISO: new Date().toISOString(),
    source: "upload-xml",
    data,
    errors: [],
    warnings: [],
  }
}

function mkD100(period: string, dividendTax: number): ParsedDeclarationRecord {
  const data: D100ParsedData = {
    declarantCui: "RO12345678",
    period: {
      year: parseInt(period.slice(0, 4), 10),
      month: period.includes("Q") ? null : parseInt(period.slice(5), 10),
      quarter: period.includes("Q") ? parseInt(period.slice(-1), 10) : null,
      period,
      frequency: period.includes("Q") ? "quarterly" : "monthly",
    },
    isRectification: false,
    lines: [
      {
        code: "480",
        label: "Impozit dividende",
        category: "dividende",
        amountDue: dividendTax,
        amountToPay: dividendTax,
        amountToRecover: 0,
      },
    ],
    totalDue: dividendTax,
    totalToPay: dividendTax,
    summaryByCategory: {
      dividende: { count: 1, totalDue: dividendTax, totalToPay: dividendTax },
      profit_anual: { count: 0, totalDue: 0, totalToPay: 0 },
      microintreprindere: { count: 0, totalDue: 0, totalToPay: 0 },
      salarii: { count: 0, totalDue: 0, totalToPay: 0 },
      altele: { count: 0, totalDue: 0, totalToPay: 0 },
      necunoscut: { count: 0, totalDue: 0, totalToPay: 0 },
    },
    errors: [],
    warnings: [],
  }
  return {
    id: `d100-${period}`,
    type: "d100",
    period,
    cui: "RO12345678",
    isRectification: false,
    parsedAtISO: new Date().toISOString(),
    source: "upload-xml",
    data,
    errors: [],
    warnings: [],
  }
}

function mkAga(
  year: number,
  associates: Array<{ cnp: string; name: string; ownership: number; dividends: number }>,
): ParsedAgaRecord {
  const data: AgaExtractedData = {
    resolutionDate: `${year + 1}-04-15`,
    financialYear: year,
    resolutionType: "AGA-ordinara",
    associates: associates.map((a) => ({
      idType: "CNP",
      id: a.cnp,
      name: a.name,
      ownershipPercent: a.ownership,
      dividendsAmount: a.dividends,
      dividendsPercent: a.ownership,
    })),
    totalDividendsAmount: associates.reduce((s, a) => s + a.dividends, 0),
    netProfit: associates.reduce((s, a) => s + a.dividends, 0),
    retainedEarnings: 0,
    aiProvider: "gemini",
    confidence: 0.95,
    errors: [],
    warnings: [],
  }
  return {
    id: `aga-${year}`,
    resolutionDate: data.resolutionDate,
    financialYear: year,
    parsedAtISO: new Date().toISOString(),
    source: "upload-text",
    data,
    userVerified: true,
    errors: [],
    warnings: [],
  }
}

function mkInvoice(period: string, vat: number, idx: number = 0): ParsedInvoiceRecord {
  return {
    id: `inv-${period}-${idx}`,
    direction: "primita",
    invoiceNumber: `F${idx}`,
    issueDateISO: `${period}-15`,
    period,
    partnerCif: "RO99",
    partnerName: "Furnizor",
    totalNetRON: vat / 0.19,
    totalVatRON: vat,
    totalGrossRON: vat + vat / 0.19,
    currency: "RON",
    confidence: "high",
    aiProvider: "gemini-vision",
    parsedAtISO: new Date().toISOString(),
    source: "ocr-image",
    data: { totalVatRON: vat },
    userVerified: true,
    errors: [],
    warnings: [],
  }
}

function mkOnrc(
  cui: string,
  associates: Array<{ cnp: string; name: string; ownership: number }>,
): OnrcSnapshotRecord {
  const total = associates.reduce((s, a) => s + a.ownership, 0)
  return {
    id: `onrc-${cui}`,
    cui,
    companyName: "ACME SRL",
    mainCaen: null,
    legalForm: "SRL",
    registeredAddress: null,
    fiscalStatus: "ACTIVĂ",
    vatRegistered: true,
    efacturaRegistered: true,
    registrationNumber: "J40/1234/2020",
    associates: associates.map((a) => ({
      idType: "CNP",
      id: a.cnp,
      name: a.name,
      ownershipPercent: a.ownership,
    })),
    majorityOwner: null,
    totalOwnershipPercent: total,
    sources: ["anaf-v9", "manual"],
    anafFetchedAtISO: new Date().toISOString(),
    associatesConfirmedAtISO: new Date().toISOString(),
    isComplete: Math.abs(total - 100) < 2,
    parsedAtISO: new Date().toISOString(),
    errors: [],
    warnings: [],
  }
}

function emptyInput(): CrossCorrelationInput {
  return { declarations: [], aga: [], invoices: [], onrc: [] }
}

// ── Helpers tests ───────────────────────────────────────────────────────────

describe("helpers", () => {
  it("normalizeId elimină RO prefix și whitespace", () => {
    expect(normalizeId("RO12345678")).toBe("12345678")
    expect(normalizeId("ro12345678")).toBe("12345678")
    expect(normalizeId("  1850101123456  ")).toBe("1850101123456")
    expect(normalizeId(null)).toBe("")
  })

  it("quarterMonths returnează 3 luni pentru Q2", () => {
    expect(quarterMonths("2026-Q2")).toEqual(["2026-04", "2026-05", "2026-06"])
    expect(quarterMonths("2026-Q4")).toEqual(["2026-10", "2026-11", "2026-12"])
    expect(quarterMonths("2026-04")).toEqual(["2026-04"])
  })

  it("yearMonths returnează 12 luni", () => {
    const months = yearMonths(2026)
    expect(months).toHaveLength(12)
    expect(months[0]).toBe("2026-01")
    expect(months[11]).toBe("2026-12")
  })
})

// ── Empty state ─────────────────────────────────────────────────────────────

describe("runCrossCorrelation — empty inputs", () => {
  it("rulează cu input gol și returnează info findings", () => {
    const report = runCrossCorrelation(emptyInput())
    expect(report.findings.length).toBe(4) // 1 per rule, all info
    expect(report.summary.info).toBe(4)
    expect(report.summary.errors).toBe(0)
    expect(report.summary.warnings).toBe(0)
    expect(report.inputs.d300Count).toBe(0)
  })
})

// ── R1: Σ facturi primite ↔ D300 ────────────────────────────────────────────

describe("R1 — Σ facturi primite ↔ D300 TVA deductibil", () => {
  it("OK când suma OCR coincide cu D300", () => {
    const input = emptyInput()
    input.declarations.push(mkD300("2026-04", 1000))
    input.invoices.push(mkInvoice("2026-04", 600, 1))
    input.invoices.push(mkInvoice("2026-04", 400, 2))
    const report = runCrossCorrelation(input)
    const r1 = report.findings.filter((f) => f.rule === "R1")
    expect(r1).toHaveLength(1)
    expect(r1[0]?.severity).toBe("ok")
  })

  it("warning când există discrepanță moderată", () => {
    const input = emptyInput()
    input.declarations.push(mkD300("2026-04", 1000))
    input.invoices.push(mkInvoice("2026-04", 950, 1)) // 50 RON diferență = 5%
    const report = runCrossCorrelation(input)
    const r1 = report.findings.filter((f) => f.rule === "R1" && f.severity !== "info")
    expect(r1).toHaveLength(1)
    expect(r1[0]?.severity).toBe("warning")
    expect(r1[0]?.diff?.diff).toBeCloseTo(50, 1)
  })

  it("error la discrepanță mare > 10 RON și > 5%", () => {
    const input = emptyInput()
    input.declarations.push(mkD300("2026-04", 1000))
    input.invoices.push(mkInvoice("2026-04", 500, 1)) // 500 RON diferență = 50%
    const report = runCrossCorrelation(input)
    const r1 = report.findings.filter((f) => f.rule === "R1" && f.severity !== "info")
    expect(r1[0]?.severity).toBe("error")
  })

  it("info când D300 trimestrial nu are facturi în nici una din 3 luni", () => {
    const input = emptyInput()
    input.declarations.push(mkD300("2026-Q2", 500))
    const report = runCrossCorrelation(input)
    const r1 = report.findings.filter((f) => f.rule === "R1")
    expect(r1[0]?.severity).toBe("info")
    expect(r1[0]?.title).toContain("Fără facturi OCR")
  })

  it("agregă facturi pe lunile unui trimestru", () => {
    const input = emptyInput()
    input.declarations.push(mkD300("2026-Q2", 900))
    input.invoices.push(mkInvoice("2026-04", 300, 1))
    input.invoices.push(mkInvoice("2026-05", 300, 2))
    input.invoices.push(mkInvoice("2026-06", 300, 3))
    const report = runCrossCorrelation(input)
    const r1 = report.findings.filter((f) => f.rule === "R1" && f.severity !== "info")
    expect(r1[0]?.severity).toBe("ok")
  })
})

// ── R2: AGA ↔ D205 ──────────────────────────────────────────────────────────

describe("R2 — AGA dividende ↔ D205 dividende", () => {
  it("OK când AGA și D205 coincid per CNP", () => {
    const input = emptyInput()
    input.aga.push(
      mkAga(2025, [
        { cnp: "1850101123456", name: "POPESCU", ownership: 60, dividends: 60000 },
        { cnp: "2900202234567", name: "IONESCU", ownership: 40, dividends: 40000 },
      ]),
    )
    input.declarations.push(
      mkD205(2025, [
        { id: "1850101123456", name: "POPESCU", grossIncome: 60000, tax: 4800 },
        { id: "2900202234567", name: "IONESCU", grossIncome: 40000, tax: 3200 },
      ]),
    )
    const report = runCrossCorrelation(input)
    const r2 = report.findings.filter((f) => f.rule === "R2")
    expect(r2.every((f) => f.severity === "ok")).toBe(true)
    expect(r2).toHaveLength(2)
  })

  it("warning AGA fără D205 corespondent", () => {
    const input = emptyInput()
    input.aga.push(mkAga(2025, [{ cnp: "1", name: "A", ownership: 100, dividends: 10000 }]))
    const report = runCrossCorrelation(input)
    const r2 = report.findings.filter((f) => f.rule === "R2")
    expect(r2.some((f) => f.severity === "warning")).toBe(true)
  })

  it("error asociat AGA lipsește din D205", () => {
    const input = emptyInput()
    input.aga.push(
      mkAga(2025, [
        { cnp: "1850101123456", name: "POPESCU", ownership: 100, dividends: 50000 },
      ]),
    )
    input.declarations.push(
      mkD205(2025, [
        { id: "9999999999999", name: "ALTUL", grossIncome: 50000, tax: 4000 },
      ]),
    )
    const report = runCrossCorrelation(input)
    const r2 = report.findings.filter((f) => f.rule === "R2")
    expect(r2.some((f) => f.severity === "error")).toBe(true)
  })

  it("warning diferență sume AGA vs D205 pentru același CNP", () => {
    const input = emptyInput()
    input.aga.push(
      mkAga(2025, [{ cnp: "1", name: "A", ownership: 100, dividends: 50000 }]),
    )
    input.declarations.push(
      mkD205(2025, [{ id: "1", name: "A", grossIncome: 47000, tax: 3760 }]),
    )
    const report = runCrossCorrelation(input)
    const r2 = report.findings.filter((f) => f.rule === "R2" && f.severity !== "info")
    // 3000 diferență = 6% — ar trebui error (>5%)
    expect(r2.some((f) => f.severity === "error" || f.severity === "warning")).toBe(true)
  })
})

// ── R3: AGA ↔ ONRC ──────────────────────────────────────────────────────────

describe("R3 — AGA procent ↔ ONRC procent", () => {
  it("OK când cotele coincid", () => {
    const input = emptyInput()
    input.aga.push(
      mkAga(2025, [
        { cnp: "1850101123456", name: "POPESCU", ownership: 60, dividends: 60000 },
      ]),
    )
    input.onrc.push(
      mkOnrc("12345678", [
        { cnp: "1850101123456", name: "POPESCU", ownership: 60 },
      ]),
    )
    const report = runCrossCorrelation(input)
    const r3 = report.findings.filter((f) => f.rule === "R3")
    expect(r3.every((f) => f.severity === "ok")).toBe(true)
  })

  it("warning AGA asociat fără ONRC corespondent", () => {
    const input = emptyInput()
    input.aga.push(
      mkAga(2025, [
        { cnp: "1850101123456", name: "POPESCU", ownership: 60, dividends: 0 },
      ]),
    )
    input.onrc.push(
      mkOnrc("12345678", [
        { cnp: "9999999999999", name: "ALTUL", ownership: 100 },
      ]),
    )
    const report = runCrossCorrelation(input)
    const r3 = report.findings.filter((f) => f.rule === "R3" && f.severity === "warning")
    expect(r3).toHaveLength(1)
  })

  it("error diferență mare > 5pp deținere", () => {
    const input = emptyInput()
    input.aga.push(
      mkAga(2025, [
        { cnp: "1850101123456", name: "POPESCU", ownership: 80, dividends: 0 },
      ]),
    )
    input.onrc.push(
      mkOnrc("12345678", [
        { cnp: "1850101123456", name: "POPESCU", ownership: 60 },
      ]),
    )
    const report = runCrossCorrelation(input)
    const r3 = report.findings.filter((f) => f.rule === "R3" && f.severity !== "info")
    expect(r3[0]?.severity).toBe("error")
    expect(r3[0]?.diff?.diff).toBeCloseTo(20, 1)
  })

  it("warning diferență mică 2pp", () => {
    const input = emptyInput()
    input.aga.push(
      mkAga(2025, [
        { cnp: "1", name: "POPESCU", ownership: 62, dividends: 0 },
      ]),
    )
    input.onrc.push(mkOnrc("12345678", [{ cnp: "1", name: "POPESCU", ownership: 60 }]))
    const report = runCrossCorrelation(input)
    const r3 = report.findings.filter((f) => f.rule === "R3" && f.severity !== "info")
    expect(r3[0]?.severity).toBe("warning")
  })
})

// ── R5: D205 ↔ Σ D100 ───────────────────────────────────────────────────────

describe("R5 — D205 anual ↔ Σ D100 lunare dividende", () => {
  it("OK când suma D100 lunare = D205 anuală", () => {
    const input = emptyInput()
    input.declarations.push(
      mkD205(2025, [{ id: "1", name: "A", grossIncome: 100000, tax: 8000 }]),
    )
    // 12 luni × ~667 RON = 8000 RON
    for (let m = 1; m <= 12; m++) {
      input.declarations.push(
        mkD100(`2025-${m.toString().padStart(2, "0")}`, m === 12 ? 8000 - 11 * 667 : 667),
      )
    }
    const report = runCrossCorrelation(input)
    const r5 = report.findings.filter((f) => f.rule === "R5" && f.severity !== "info")
    expect(r5[0]?.severity).toBe("ok")
  })

  it("warning D205 fără D100 corespondent", () => {
    const input = emptyInput()
    input.declarations.push(
      mkD205(2025, [{ id: "1", name: "A", grossIncome: 50000, tax: 4000 }]),
    )
    const report = runCrossCorrelation(input)
    const r5 = report.findings.filter((f) => f.rule === "R5")
    expect(r5.some((f) => f.severity === "warning")).toBe(true)
  })

  it("error diferență mare D205 vs Σ D100", () => {
    const input = emptyInput()
    input.declarations.push(
      mkD205(2025, [{ id: "1", name: "A", grossIncome: 100000, tax: 8000 }]),
    )
    input.declarations.push(mkD100("2025-12", 4000)) // doar 1 D100, mult sub
    const report = runCrossCorrelation(input)
    const r5 = report.findings.filter((f) => f.rule === "R5" && f.severity !== "info")
    expect(r5[0]?.severity).toBe("error")
  })

  it("aplică pe D100 trimestriale", () => {
    const input = emptyInput()
    input.declarations.push(
      mkD205(2025, [{ id: "1", name: "A", grossIncome: 50000, tax: 4000 }]),
    )
    input.declarations.push(mkD100("2025-Q1", 1000))
    input.declarations.push(mkD100("2025-Q2", 1000))
    input.declarations.push(mkD100("2025-Q3", 1000))
    input.declarations.push(mkD100("2025-Q4", 1000))
    const report = runCrossCorrelation(input)
    const r5 = report.findings.filter((f) => f.rule === "R5" && f.severity !== "info")
    expect(r5[0]?.severity).toBe("ok")
  })
})

// ── Report-level checks ─────────────────────────────────────────────────────

describe("runCrossCorrelation — agregare report", () => {
  it("sortează findings: error → warning → info → ok", () => {
    const input = emptyInput()
    input.declarations.push(mkD300("2026-04", 1000))
    input.invoices.push(mkInvoice("2026-04", 500, 1)) // error R1
    input.aga.push(mkAga(2025, [{ cnp: "1", name: "A", ownership: 100, dividends: 50000 }]))
    input.declarations.push(mkD205(2025, [{ id: "1", name: "A", grossIncome: 50000, tax: 4000 }])) // ok R2
    input.onrc.push(mkOnrc("12345678", [{ cnp: "1", name: "A", ownership: 100 }])) // ok R3

    const report = runCrossCorrelation(input)
    // Primul finding ar trebui error
    expect(report.findings[0]?.severity).toBe("error")
    expect(report.summary.errors).toBeGreaterThan(0)
    expect(report.summary.ok).toBeGreaterThan(0)
  })

  it("agregă summary corect per regulă", () => {
    const input = emptyInput()
    input.declarations.push(mkD300("2026-04", 1000))
    input.invoices.push(mkInvoice("2026-04", 1000, 1)) // ok R1
    const report = runCrossCorrelation(input)
    expect(report.summary.byRule.R1.ok).toBe(1)
    expect(report.summary.byRule.R2.info).toBeGreaterThan(0) // no AGA
  })

  it("toate generatedAtISO și inputs counts populated", () => {
    const input = emptyInput()
    input.declarations.push(mkD300("2026-04", 0))
    input.aga.push(mkAga(2025, []))
    const report = runCrossCorrelation(input)
    expect(report.generatedAtISO).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(report.inputs.d300Count).toBe(1)
    expect(report.inputs.agaCount).toBe(1)
  })
})
