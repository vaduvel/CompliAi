import { describe, expect, it } from "vitest"

import { getGeneratedDocumentTitle, normalizeGeneratedDocumentContent } from "./document-generator"

describe("normalizeGeneratedDocumentContent", () => {
  it("înlocuiește o dată stale din politica de confidențialitate cu data generării", () => {
    const content = [
      "# Politica de Confidențialitate – Demo Retail SRL",
      "",
      "**Ultima actualizare:** 22 Mai 2024",
      "",
      "## 1. Introducere",
    ].join("\n")

    const normalized = normalizeGeneratedDocumentContent(content, "privacy-policy", "2026-03-25T18:49:10.342Z")

    expect(normalized).toContain("**Ultima actualizare:** 25 martie 2026")
    expect(normalized).not.toContain("22 Mai 2024")
  })

  it("inserează linia de dată după titlu când modelul o omite", () => {
    const content = [
      "# Politică de Cookies",
      "",
      "## 1. Introducere",
      "Text introductiv.",
    ].join("\n")

    const normalized = normalizeGeneratedDocumentContent(content, "cookie-policy", "2026-03-25T18:49:10.342Z")

    expect(normalized).toContain("# Politică de Cookies\n\n**Ultima actualizare:** 25 martie 2026\n\n## 1. Introducere")
  })

  it("folosește eticheta de generare pentru documentele operaționale", () => {
    const content = [
      "# Acord de Prelucrare a Datelor",
      "",
      "**Data generării:** 1 ianuarie 2024",
      "",
      "## Părțile",
    ].join("\n")

    const normalized = normalizeGeneratedDocumentContent(content, "dpa", "2026-03-25T18:49:10.342Z")

    expect(normalized).toContain("**Data generării:** 25 martie 2026")
    expect(normalized).not.toContain("1 ianuarie 2024")
  })
})

describe("getGeneratedDocumentTitle", () => {
  it("personalizează titlul DPA cu vendorul când counterpartyName este prezent", () => {
    const title = getGeneratedDocumentTitle({
      documentType: "dpa",
      orgName: "Demo Retail SRL",
      counterpartyName: "Mailchimp (Intuit)",
    })

    expect(title).toBe("Acord de Prelucrare a Datelor (DPA) — Demo Retail SRL × Mailchimp (Intuit)")
  })

  it("păstrează titlul standard pentru documentele fără counterparty", () => {
    const title = getGeneratedDocumentTitle({
      documentType: "privacy-policy",
      orgName: "Demo Retail SRL",
    })

    expect(title).toBe("Politică de Confidențialitate")
  })

  it("returnează titlul standard pentru retention policy", () => {
    const title = getGeneratedDocumentTitle({
      documentType: "retention-policy",
      orgName: "Demo Retail SRL",
    })

    expect(title).toBe("Politică și Matrice de Retenție a Datelor")
  })
})
