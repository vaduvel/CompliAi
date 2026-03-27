import { describe, expect, it } from "vitest"

import { validateGeneratedDocumentEvidence } from "@/lib/compliscan/generated-document-validation"

describe("validateGeneratedDocumentEvidence", () => {
  it("acceptă un draft bine ancorat pentru privacy policy", () => {
    const result = validateGeneratedDocumentEvidence({
      documentType: "privacy-policy",
      title: "Politică de Confidențialitate",
      orgName: "Demo SRL",
      orgWebsite: "https://demo.ro",
      content: `# Politică de Confidențialitate

**Ultima actualizare:** 27 martie 2026

Demo SRL operează site-ul demo.ro și explică aici ce date prelucrează.

## Ce date colectăm
Colectăm date de contact, date contractuale și date de suport.

## Drepturile persoanelor vizate
Acces, rectificare, ștergere, opoziție, portabilitate.

## Transferuri și retenție
Transferurile sunt limitate, iar retenția se face după politicile interne.

⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială.

## Informații suplimentare
Acest paragraf există doar pentru a asigura o lungime auditabilă și pentru a păstra contextul complet în draftul folosit la testare.
`,
    })

    expect(result.status).toBe("valid")
    expect(result.checks.every((check) => check.passed)).toBe(true)
  })

  it("marchează invalid un draft fără website-ul scanat", () => {
    const result = validateGeneratedDocumentEvidence({
      documentType: "cookie-policy",
      title: "Politică de Cookies",
      orgName: "Demo SRL",
      orgWebsite: "https://demo.ro",
      content: `# Politică de Cookies

**Ultima actualizare:** 27 martie 2026

Demo SRL folosește cookies pentru funcționalități și analiză.

⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială.

## Structură
Conținut suplimentar suficient pentru lungime auditabilă, dar fără ancoră clară de website.
`,
    })

    expect(result.status).toBe("invalid")
    expect(result.checks.find((check) => check.id === "specific-context")?.passed).toBe(false)
  })

  it("marchează invalid un DPA fără procesatorul detectat", () => {
    const result = validateGeneratedDocumentEvidence({
      documentType: "dpa",
      title: "Acord de Prelucrare a Datelor (DPA) — Demo SRL × Furnizor",
      orgName: "Demo SRL",
      counterpartyName: "Mailchimp",
      content: `# Acord de Prelucrare a Datelor (DPA)

**Data generării:** 27 martie 2026

Demo SRL acționează ca operator de date.

## Obligații
Procesatorul respectă confidențialitatea, securitatea și ștergerea la încetare.

⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială.

## Conținut suplimentar
Text suficient pentru lungime auditabilă, dar fără numele procesatorului.
`,
    })

    expect(result.status).toBe("invalid")
    expect(result.checks.find((check) => check.id === "specific-context")?.passed).toBe(false)
  })
})
