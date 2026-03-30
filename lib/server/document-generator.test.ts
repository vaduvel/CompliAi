import { afterEach, describe, expect, it, vi } from "vitest"

import { validateGeneratedDocumentEvidence } from "@/lib/compliscan/generated-document-validation"

const ORIGINAL_GEMINI_API_KEY = process.env.GEMINI_API_KEY

async function importGeneratorModule() {
  vi.resetModules()
  return import("./document-generator")
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (ORIGINAL_GEMINI_API_KEY === undefined) {
    delete process.env.GEMINI_API_KEY
  } else {
    process.env.GEMINI_API_KEY = ORIGINAL_GEMINI_API_KEY
  }
})

describe("document generator fallback", () => {
  it("returns a valid privacy-policy fallback when Gemini is unavailable", async () => {
    delete process.env.GEMINI_API_KEY

    const { generateDocument } = await importGeneratorModule()
    const document = await generateDocument({
      documentType: "privacy-policy",
      orgName: "CompliAI Test SRL",
      orgWebsite: "https://example.com",
      dpoEmail: "dpo@example.com",
      dataFlows: "formulare de contact si administrare clienti",
    })

    expect(document.llmUsed).toBe(false)

    const validation = validateGeneratedDocumentEvidence({
      documentType: "privacy-policy",
      title: document.title,
      content: document.content,
      orgName: "CompliAI Test SRL",
      orgWebsite: "https://example.com",
    })

    expect(validation.status).toBe("valid")
  })

  it("falls back cleanly on Gemini 503 and still returns a valid DPA draft", async () => {
    process.env.GEMINI_API_KEY = "test-key"
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response('{"error":"busy"}', { status: 503 }))
    )

    const { generateDocument } = await importGeneratorModule()
    const document = await generateDocument({
      documentType: "dpa",
      orgName: "CompliAI Test SRL",
      counterpartyName: "Google Analytics",
      counterpartyReferenceUrl: "https://example.com/dpa",
      dpoEmail: "dpo@example.com",
    })

    expect(document.llmUsed).toBe(false)

    const validation = validateGeneratedDocumentEvidence({
      documentType: "dpa",
      title: document.title,
      content: document.content,
      orgName: "CompliAI Test SRL",
      counterpartyName: "Google Analytics",
    })

    expect(validation.status).toBe("valid")
  })

  it("returns a valid retention-policy fallback when Gemini is unavailable", async () => {
    delete process.env.GEMINI_API_KEY

    const { generateDocument } = await importGeneratorModule()
    const document = await generateDocument({
      documentType: "retention-policy",
      orgName: "CompliAI Test SRL",
      dpoEmail: "dpo@example.com",
      dataFlows: "lead-uri 12 luni, clienti activi 3 ani dupa contract, loguri suport 90 zile",
    })

    expect(document.llmUsed).toBe(false)

    const validation = validateGeneratedDocumentEvidence({
      documentType: "retention-policy",
      title: document.title,
      content: document.content,
      orgName: "CompliAI Test SRL",
    })

    expect(validation.status).toBe("valid")
  })
})
