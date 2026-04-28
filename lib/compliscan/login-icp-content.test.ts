// S3.4 — Tests pentru ICP-aware login content.

import { describe, expect, it } from "vitest"

import {
  getAccentBlobClasses,
  getAccentBorderClass,
  getAccentTextClass,
  getLoginPaneContent,
  parseLoginIcp,
} from "./login-icp-content"

describe("login-icp-content", () => {
  it("parseLoginIcp acceptă cele 5 ICP-uri valide", () => {
    expect(parseLoginIcp("solo")).toBe("solo")
    expect(parseLoginIcp("cabinet-dpo")).toBe("cabinet-dpo")
    expect(parseLoginIcp("cabinet-fiscal")).toBe("cabinet-fiscal")
    expect(parseLoginIcp("imm-internal")).toBe("imm-internal")
    expect(parseLoginIcp("enterprise")).toBe("enterprise")
  })

  it("parseLoginIcp respinge valori invalide", () => {
    expect(parseLoginIcp("invalid")).toBeNull()
    expect(parseLoginIcp("")).toBeNull()
    expect(parseLoginIcp(null)).toBeNull()
    expect(parseLoginIcp(undefined)).toBeNull()
    expect(parseLoginIcp("DPO")).toBeNull() // case-sensitive
  })

  it("getLoginPaneContent returnează default pentru null", () => {
    const content = getLoginPaneContent(null)
    expect(content.testimonial.author).toBe("Ramona Ilie")
    expect(content.accent).toBe("primary")
    expect(content.kpis).toHaveLength(4)
  })

  it("getLoginPaneContent returnează DPO content pentru cabinet-dpo", () => {
    const content = getLoginPaneContent("cabinet-dpo")
    expect(content.testimonial.author).toBe("Diana Popescu")
    expect(content.accent).toBe("violet")
    expect(content.kpis.some((k) => k.framework === "Magic Link")).toBe(true)
  })

  it("getLoginPaneContent returnează Fiscal content pentru cabinet-fiscal", () => {
    const content = getLoginPaneContent("cabinet-fiscal")
    expect(content.testimonial.author).toBe("Ramona Ilie")
    expect(content.accent).toBe("amber")
    expect(content.kpis.some((k) => k.framework === "e-Factura")).toBe(true)
  })

  it("getLoginPaneContent returnează IMM content pentru imm-internal", () => {
    const content = getLoginPaneContent("imm-internal")
    expect(content.accent).toBe("emerald")
    expect(content.kpis.some((k) => k.framework === "DORA")).toBe(true)
  })

  it("getLoginPaneContent returnează Enterprise content", () => {
    const content = getLoginPaneContent("enterprise")
    expect(content.accent).toBe("indigo")
    expect(content.kpis.some((k) => k.framework === "DNSC")).toBe(true)
  })

  it("toate ICP-urile au exact 4 KPI-uri", () => {
    for (const icp of ["solo", "cabinet-dpo", "cabinet-fiscal", "imm-internal", "enterprise"] as const) {
      const content = getLoginPaneContent(icp)
      expect(content.kpis).toHaveLength(4)
      expect(content.testimonial.author).toBeTruthy()
      expect(content.testimonial.quote.length).toBeGreaterThan(20)
    }
  })

  it("getAccentBlobClasses returnează 2 clase per accent", () => {
    const blob = getAccentBlobClasses("violet")
    expect(blob.primary).toContain("violet-500")
    expect(blob.secondary).toBeTruthy()
  })

  it("getAccentTextClass + getAccentBorderClass returnează strings", () => {
    expect(getAccentTextClass("amber")).toContain("amber")
    expect(getAccentBorderClass("emerald")).toContain("emerald")
  })
})
