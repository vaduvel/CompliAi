import { describe, it, expect } from "vitest"
import {
  ANAF_RESPONSE_TEMPLATES,
  ANAF_TEMPLATE_TYPES,
  fillTemplate,
  getTemplateByType,
} from "./anaf-response-templates"

describe("ANAF response templates", () => {
  it("conține minim 8 template-uri standard", () => {
    expect(ANAF_RESPONSE_TEMPLATES.length).toBeGreaterThanOrEqual(8)
  })

  it("fiecare template are subject + body + legalReference", () => {
    for (const t of ANAF_RESPONSE_TEMPLATES) {
      expect(t.subject).toBeTruthy()
      expect(t.body).toBeTruthy()
      expect(t.legalReference).toBeTruthy()
      expect(t.recommendedAction).toBeTruthy()
      expect(t.attachmentsRequired.length).toBeGreaterThan(0)
    }
  })

  it("getTemplateByType returnează template corect", () => {
    const t = getTemplateByType("etva_diff_above_threshold")
    expect(t).not.toBeNull()
    expect(t?.label).toContain("rectificare")
  })

  it("fillTemplate înlocuiește placeholders", () => {
    const t = getTemplateByType("etva_diff_sub_threshold")
    if (!t) throw new Error("template not found")
    const filled = fillTemplate(t, {
      org_name: "Test SRL",
      cif: "12345678",
      period: "2026-04",
      difference_explanation: "diferență 3K RON",
      cause: "facturi întârziate",
      art: "297",
      attachments_list: "- D300\n- P300",
      signer_name: "Petre Test",
      signer_role: "Expert Contabil",
    })
    expect(filled.subject).toContain("2026-04")
    expect(filled.subject).toContain("12345678")
    expect(filled.body).toContain("Test SRL")
    expect(filled.body).not.toContain("{{org_name}}")  // toate placeholderele înlocuite
  })

  it("fillTemplate păstrează placeholderii nesetați (graceful)", () => {
    const t = getTemplateByType("etva_diff_sub_threshold")
    if (!t) throw new Error("template not found")
    const filled = fillTemplate(t, { org_name: "Test SRL" })
    expect(filled.body).toContain("Test SRL")
    expect(filled.body).toContain("{{cif}}")  // placeholder rămas
  })

  it("ANAF_TEMPLATE_TYPES expune lista completă pentru UI dropdown", () => {
    expect(ANAF_TEMPLATE_TYPES.length).toBe(ANAF_RESPONSE_TEMPLATES.length)
    expect(ANAF_TEMPLATE_TYPES[0]).toHaveProperty("type")
    expect(ANAF_TEMPLATE_TYPES[0]).toHaveProperty("label")
  })
})
