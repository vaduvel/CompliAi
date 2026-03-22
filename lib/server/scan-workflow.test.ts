import { describe, expect, it } from "vitest"

import type { ScanFinding } from "@/lib/compliance/types"
import { RequestValidationError } from "./request-validation"
import { mergeFindingsDeduplicated, validateScanInputPayload } from "./scan-workflow"

describe("validateScanInputPayload", () => {
  it("accepta text manual simplu", () => {
    const payload = validateScanInputPayload({
      documentName: "Politica.pdf",
      content: "Text relevant pentru analiza",
    })

    expect(payload.documentName).toBe("Politica.pdf")
    expect(payload.content).toBe("Text relevant pentru analiza")
  })

  it("respinge payload gol", () => {
    expect(() => validateScanInputPayload({})).toThrow(RequestValidationError)
  })

  it("respinge imagine si pdf simultan", () => {
    expect(() =>
      validateScanInputPayload({
        imageBase64: "YWJjZA==",
        pdfBase64: "YWJjZA==",
      })
    ).toThrow("Trimite ori imagine, ori PDF la acelasi request.")
  })

  it("respinge base64 invalid", () => {
    expect(() =>
      validateScanInputPayload({
        imageBase64: "%%%invalid%%%",
      })
    ).toThrow("Imaginea incarcata nu are format base64 valid.")
  })
})

function makeFinding(overrides: Partial<ScanFinding> = {}): ScanFinding {
  return {
    id: "finding-1",
    title: "Lipsa DPA cu furnizor IT",
    detail: "Nu exista DPA semnat cu furnizorul principal.",
    category: "GDPR",
    severity: "high",
    risk: "high",
    principles: [],
    createdAtISO: "2026-03-22T10:00:00.000Z",
    sourceDocument: "scan-1.pdf",
    scanId: "scan-1",
    legalReference: "GDPR Art. 28",
    provenance: {
      ruleId: "GDPR-ART28",
      excerpt: "Nu exista acord de prelucrare semnat.",
    },
    ...overrides,
  }
}

describe("mergeFindingsDeduplicated", () => {
  it("nu dubleaza finding-ul la rescan si pastreaza statusul existent", () => {
    const existing = makeFinding({
      id: "finding-existing",
      findingStatus: "confirmed",
      findingStatusUpdatedAtISO: "2026-03-22T10:05:00.000Z",
    })
    const incoming = makeFinding({
      id: "finding-new",
      scanId: "scan-2",
      sourceDocument: "scan-2.pdf",
      createdAtISO: "2026-03-22T11:00:00.000Z",
    })

    const merged = mergeFindingsDeduplicated([existing], [incoming])

    expect(merged.findings).toHaveLength(1)
    expect(merged.findings[0].id).toBe("finding-existing")
    expect(merged.findings[0].findingStatus).toBe("confirmed")
    expect(merged.findings[0].scanId).toBe("scan-2")
    expect(merged.findings[0].sourceDocument).toBe("scan-2.pdf")
    expect(merged.addedHighRiskCount).toBe(0)
  })

  it("creste highRisk doar pentru finding-uri AI high-risk noi", () => {
    const incoming = makeFinding({
      id: "ai-new",
      category: "EU_AI_ACT",
      risk: "high",
      title: "AI high-risk detection",
      provenance: {
        ruleId: "EUAI-001",
        excerpt: "high risk ai",
      },
    })

    const merged = mergeFindingsDeduplicated([], [incoming])

    expect(merged.findings).toHaveLength(1)
    expect(merged.addedHighRiskCount).toBe(1)
  })

  it("deduplica finding-uri Gemini cu titluri si ruleId-uri instabile, dar acelasi articol si excerpt", () => {
    const existing = makeFinding({
      id: "finding-gemini-1",
      title: "Lipsa mențiunii privind transferurile internaționale de date",
      legalReference: "Art. 44",
      provenance: {
        ruleId: "gemini-gdpr-r-old123",
        excerpt: "Scripturile de masurare pot colecta date despre dispozitiv, comportament si sesiune.",
      },
    })
    const incoming = makeFinding({
      id: "finding-gemini-2",
      title: "Lipsa mențiunii privind transferul datelor în afara SEE",
      legalReference: "Art. 44",
      sourceDocument: "scan-2.pdf",
      provenance: {
        ruleId: "gemini-gdpr-r-new456",
        excerpt: "Scripturile de masurare pot colecta date despre dispozitiv, comportament si sesiune.",
      },
    })

    const merged = mergeFindingsDeduplicated([existing], [incoming])

    expect(merged.findings).toHaveLength(1)
    expect(merged.findings[0].id).toBe("finding-gemini-1")
    expect(merged.addedLowRiskCount).toBe(0)
  })

  it("deduplica finding-uri keyword cand excerptul difera doar prin numele documentului", () => {
    const existing = makeFinding({
      id: "finding-keyword-1",
      title: "Verificare consimțământ tracking",
      detail: "Verifica bannerele de consimtamant.",
      risk: "low",
      severity: "medium",
      sourceDocument: "policy-tracking-live-1.txt",
      provenance: {
        ruleId: "GDPR-003",
        excerpt: "policy-tracking-live-1.txt Politica de confidentialitate Folosim analytics si",
      },
    })
    const incoming = makeFinding({
      id: "finding-keyword-2",
      title: "Verificare consimțământ tracking",
      detail: "Verifica bannerele de consimtamant.",
      risk: "low",
      severity: "medium",
      sourceDocument: "policy-tracking-live-2.txt",
      provenance: {
        ruleId: "GDPR-003",
        excerpt: "policy-tracking-live-2.txt Politica de confidentialitate Folosim analytics si",
      },
    })

    const merged = mergeFindingsDeduplicated([existing], [incoming])

    expect(merged.findings).toHaveLength(1)
    expect(merged.findings[0].id).toBe("finding-keyword-1")
    expect(merged.addedLowRiskCount).toBe(0)
  })

  it("deduplica finding-uri Gemini semantice pe acelasi paragraf cand LLM-ul reformuleaza aceeasi problema", () => {
    const existing = makeFinding({
      id: "finding-transfer-see",
      title: "Lipsa mențiunii privind transferul de date în afara SEE",
      detail: "Scripturile de analytics implica adesea transferuri internationale.",
      severity: "medium",
      risk: "low",
      legalReference: "Art. 44",
      sourceDocument: "policy-tracking-live-a.txt",
      sourceParagraph: "Scripturile de masurare pot colecta date despre dispozitiv, comportament si sesiune.",
      suggestedDocumentType: "privacy-policy",
      provenance: {
        ruleId: "gemini-gdpr-r-old123",
        excerpt: "Scripturile de masurare pot colecta date despre dispozitiv, comportament si sesiune.",
      },
    })
    const incoming = makeFinding({
      id: "finding-transfer-terti",
      title: "Lipsa detaliilor privind transferul de date către terți",
      detail: "Utilizarea analytics implica transferul datelor catre furnizori terti.",
      severity: "medium",
      risk: "low",
      legalReference: "Art. 13 alin. (1) lit. (e)",
      sourceDocument: "policy-tracking-live-b.txt",
      sourceParagraph: "Scripturile de masurare pot colecta date despre dispozitiv, comportament si sesiune.",
      suggestedDocumentType: "privacy-policy",
      provenance: {
        ruleId: "gemini-gdpr-r-new456",
        excerpt: "Scripturile de masurare pot colecta date despre dispozitiv, comportament si sesiune.",
      },
    })

    const merged = mergeFindingsDeduplicated([existing], [incoming])

    expect(merged.findings).toHaveLength(1)
    expect(merged.findings[0].id).toBe("finding-transfer-see")
    expect(merged.addedLowRiskCount).toBe(0)
  })

  it("deduplica finding-uri Gemini pe acelasi paragraf chiar daca severitatea se schimba intre rescan-uri", () => {
    const existing = makeFinding({
      id: "finding-ai-transparency-existing",
      title: "Lipsa transparenței privind utilizarea sistemelor AI",
      category: "EU_AI_ACT",
      severity: "high",
      risk: "high",
      legalReference: "Articolul 52",
      suggestedDocumentType: "ai-transparency-notice",
      sourceParagraph: "Folosim analytics si tracking pentru a intelege cum interactioneaza utilizatorii cu site-ul.",
      provenance: {
        ruleId: "gemini-ai-r-old123",
        excerpt: "Folosim analytics si tracking pentru a intelege cum interactioneaza utilizatorii cu site-ul.",
      },
    })
    const incoming = makeFinding({
      id: "finding-ai-transparency-new",
      title: "Lipsa transparenței privind sistemele AI",
      category: "EU_AI_ACT",
      severity: "medium",
      risk: "high",
      legalReference: "Articolul 52",
      suggestedDocumentType: "ai-transparency-notice",
      sourceDocument: "scan-2.pdf",
      sourceParagraph: "Folosim analytics si tracking pentru a intelege cum interactioneaza utilizatorii cu site-ul.",
      provenance: {
        ruleId: "gemini-ai-r-new456",
        excerpt: "Folosim analytics si tracking pentru a intelege cum interactioneaza utilizatorii cu site-ul.",
      },
    })

    const merged = mergeFindingsDeduplicated([existing], [incoming])

    expect(merged.findings).toHaveLength(1)
    expect(merged.findings[0].id).toBe("finding-ai-transparency-existing")
    expect(merged.findings[0].severity).toBe("high")
    expect(merged.findings[0].risk).toBe("high")
  })

  it("deduplica finding-uri Gemini AI Act pe aceeasi problema chiar daca ancora se muta intre doua paragrafe", () => {
    const existing = makeFinding({
      id: "finding-ai-high-risk-existing",
      title: "Sistem AI nedeclarat cu potențial risc ridicat",
      category: "EU_AI_ACT",
      severity: "critical",
      risk: "high",
      legalReference: "Articolul 6",
      suggestedDocumentType: "ai-risk-assessment",
      sourceParagraph: "Pentru sistemele automate cu impact asupra utilizatorului final, decizia finala trebuie validata de un operator uman.",
      provenance: {
        ruleId: "gemini-ai-r-old789",
        excerpt:
          "Pentru sistemele automate cu impact asupra utilizatorului final, decizia finala trebuie validata de un operator uman.",
      },
    })
    const incoming = makeFinding({
      id: "finding-ai-high-risk-new",
      title: "Sistem AI nedeclarat cu potențial high-risk",
      category: "EU_AI_ACT",
      severity: "critical",
      risk: "high",
      legalReference: "Articolul 6",
      suggestedDocumentType: "ai-risk-assessment",
      sourceDocument: "scan-2.pdf",
      sourceParagraph: "Scripturile de masurare pot colecta date despre dispozitiv, comportament si sesiune.",
      provenance: {
        ruleId: "gemini-ai-r-new987",
        excerpt: "Scripturile de masurare pot colecta date despre dispozitiv, comportament si sesiune.",
      },
    })

    const merged = mergeFindingsDeduplicated([existing], [incoming])

    expect(merged.findings).toHaveLength(1)
    expect(merged.findings[0].id).toBe("finding-ai-high-risk-existing")
    expect(merged.addedHighRiskCount).toBe(0)
  })
})
