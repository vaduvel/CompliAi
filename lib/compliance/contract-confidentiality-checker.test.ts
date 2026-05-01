// Pay Transparency — Anti-Confidentiality contract checker tests

import { describe, expect, it } from "vitest"

import { checkContractConfidentiality } from "./contract-confidentiality-checker"

describe("contract-confidentiality-checker", () => {
  it("detects explicit salary confidentiality clause", () => {
    const text = `
      Art. 12. Angajatul are obligația de confidențialitate cu privire la salariul său
      și la condițiile de remunerare. Nedivulgarea remunerației este obligatorie pe toată
      durata contractului.
    `
    const result = checkContractConfidentiality(text)
    expect(result.findings.length).toBeGreaterThanOrEqual(1)
    expect(result.severity).toBe("critical")
    expect(result.directiveCompliant).toBe(false)
  })

  it("detects salariu + confidențialitate combo", () => {
    const text = `
      Salariatul nu are dreptul să comunice nivelul salarial unor terți. Informațiile
      privind salariul, sporurile și beneficiile sunt confidențiale.
    `
    const result = checkContractConfidentiality(text)
    expect(result.findings.length).toBeGreaterThan(0)
    expect(result.directiveCompliant).toBe(false)
  })

  it("detects payroll confidentiality phrasing", () => {
    const text = `Este interzis să comunice nivelul de plată al colegilor.`
    const result = checkContractConfidentiality(text)
    expect(result.findings.length).toBeGreaterThanOrEqual(1)
  })

  it("returns clean result for compliant contract (no salary confidentiality)", () => {
    const text = `
      Salariatul are dreptul să discute salariul cu colegii și să solicite informații
      privind nivelul mediu de remunerare. Confidențialitatea se aplică doar datelor
      tehnice și secretelor comerciale ale companiei.
    `
    const result = checkContractConfidentiality(text)
    expect(result.findings).toEqual([])
    expect(result.directiveCompliant).toBe(true)
    expect(result.severity).toBe("ok")
  })

  it("returns clean result for empty input", () => {
    const result = checkContractConfidentiality("")
    expect(result.findings).toEqual([])
    expect(result.directiveCompliant).toBe(true)
  })

  it("includes excerpt with detected text + recomandare", () => {
    const text = `Confidențialitate salarială strictă pentru tot personalul.`
    const result = checkContractConfidentiality(text)
    expect(result.findings.length).toBeGreaterThan(0)
    const f = result.findings[0]
    expect(f.excerpt).toContain("Confidențialitate")
    expect(f.recommendation).toMatch(/șterge/i)
    expect(f.recommendation).toContain("2023/970")
  })

  it("aggregates multiple findings cu overall severity critical", () => {
    const text = `
      Confidențialitate salarială este obligatorie.
      Nedivulgarea remunerației colegilor este interzisă.
      Salariul rămâne confidențial pe perioada contractului.
    `
    const result = checkContractConfidentiality(text)
    expect(result.findings.length).toBeGreaterThan(1)
    expect(result.severity).toBe("critical")
  })

  it("is case-insensitive", () => {
    const text = `CONFIDENȚIALITATE SALARIALĂ STRICTĂ.`
    const result = checkContractConfidentiality(text)
    expect(result.findings.length).toBeGreaterThan(0)
  })
})
