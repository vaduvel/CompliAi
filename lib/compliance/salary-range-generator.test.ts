// Pay Transparency — Salary Range Generator tests

import { describe, expect, it } from "vitest"

import { generateRangeForJobAd } from "./salary-range-generator"

describe("salary-range-generator", () => {
  it("generates BestJobs format with min-max RON locale-formatted", () => {
    const text = generateRangeForJobAd({
      role: "Marketing Specialist",
      level: "Mid",
      range: { min: 5500, mid: 6500, max: 7500 },
      currency: "RON",
      format: "bestjobs",
    })
    expect(text).toContain("5.500")
    expect(text).toContain("7.500")
    expect(text).toContain("RON")
    expect(text).toContain("Marketing Specialist")
    expect(text).toContain("Mid")
  })

  it("generates LinkedIn format en-US numbers + English labels", () => {
    const text = generateRangeForJobAd({
      role: "Sales Rep",
      level: "Senior",
      range: { min: 7000, mid: 8500, max: 10000 },
      currency: "RON",
      format: "linkedin",
    })
    expect(text).toContain("7,000")
    expect(text).toContain("10,000")
    expect(text).toContain("Salary range")
    expect(text).toContain("Senior")
  })

  it("generates eJobs format Romanian friendly", () => {
    const text = generateRangeForJobAd({
      role: "Junior Dev",
      level: "Junior",
      range: { min: 5000, mid: 6000, max: 7000 },
      currency: "RON",
      format: "ejobs",
    })
    expect(text).toContain("Junior Dev")
    expect(text).toContain("5.000")
    expect(text).toContain("7.000")
  })

  it("generates generic compact format", () => {
    const text = generateRangeForJobAd({
      role: "Designer",
      level: "Mid",
      range: { min: 6000, mid: 7500, max: 9000 },
      currency: "RON",
      format: "generic",
    })
    expect(text).toContain("Designer")
    expect(text).toContain("Mid")
    expect(text).toContain("6.000")
    expect(text).toContain("9.000")
  })

  it("includes Pay Transparency Directive disclaimer", () => {
    const text = generateRangeForJobAd({
      role: "Dev",
      level: "Junior",
      range: { min: 5000, mid: 6000, max: 7000 },
      currency: "RON",
      format: "bestjobs",
    })
    // genitive form "Directivei" e folosit în RO
    expect(text).toMatch(/Directiv/)
    expect(text).toContain("2023/970")
  })

  it("supports EUR currency", () => {
    const text = generateRangeForJobAd({
      role: "Senior Dev",
      level: "Senior",
      range: { min: 4000, mid: 5000, max: 6000 },
      currency: "EUR",
      format: "bestjobs",
    })
    expect(text).toContain("EUR")
    expect(text).not.toContain("RON")
  })
})
