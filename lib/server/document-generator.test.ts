import { afterEach, describe, expect, it, vi } from "vitest"

import { validateGeneratedDocumentEvidence } from "@/lib/compliscan/generated-document-validation"

const ORIGINAL_GEMINI_API_KEY = process.env.GEMINI_API_KEY
const ORIGINAL_MISTRAL_API_KEY = process.env.MISTRAL_API_KEY
const DOCUMENT_GENERATOR_TEST_TIMEOUT_MS = 15_000

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
  if (ORIGINAL_MISTRAL_API_KEY === undefined) {
    delete process.env.MISTRAL_API_KEY
  } else {
    process.env.MISTRAL_API_KEY = ORIGINAL_MISTRAL_API_KEY
  }
})

describe("document generator fallback", () => {
  it("returns a valid privacy-policy fallback when Gemini is unavailable", async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.MISTRAL_API_KEY

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
  }, DOCUMENT_GENERATOR_TEST_TIMEOUT_MS)

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
  }, DOCUMENT_GENERATOR_TEST_TIMEOUT_MS)

  it("returns a valid retention-policy fallback when Gemini is unavailable", async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.MISTRAL_API_KEY

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
  }, DOCUMENT_GENERATOR_TEST_TIMEOUT_MS)

  it("substitutes cabinet template variables written in Diana-style camelCase", async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.MISTRAL_API_KEY

    const { generateDocument } = await importGeneratorModule()
    const document = await generateDocument({
      documentType: "dpa",
      orgName: "Clinica Diana SRL",
      orgCui: "RO123456",
      counterpartyName: "Stripe Payments Europe",
      dpoEmail: "diana@dpocomplet.ro",
      preparedBy: "DPO Complet SRL",
      cabinetTemplateContent: [
        "# DPA — {{orgName}} × {{counterpartyName}}",
        "",
        "**Cabinet:** {{preparedBy}}",
        "**CUI:** {{orgCui}}",
        "**Contact DPO:** {{dpoEmail}}",
        "Clauză cabinet Diana păstrată integral.",
      ].join("\n"),
    })

    expect(document.llmUsed).toBe(false)
    expect(document.content).toContain("Clinica Diana SRL × Stripe Payments Europe")
    expect(document.content).toContain("DPO Complet SRL")
    expect(document.content).toContain("RO123456")
    expect(document.content).toContain("diana@dpocomplet.ro")
    expect(document.content).not.toContain("{{orgName}}")
    expect(document.content).not.toContain("{{counterpartyName}}")
  }, DOCUMENT_GENERATOR_TEST_TIMEOUT_MS)

  it("does not leak COUNTERPARTY_NAME placeholders in cabinet DPA templates", async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.MISTRAL_API_KEY

    const { generateDocument } = await importGeneratorModule()
    const document = await generateDocument({
      documentType: "dpa",
      orgName: "Clinica Diana SRL",
      preparedBy: "DPO Complet SRL",
      cabinetTemplateContent: [
        "# DPA — {{ORG_NAME}} × {{COUNTERPARTY_NAME}}",
        "",
        "Cabinet: {{PREPARED_BY}}",
      ].join("\n"),
    })

    expect(document.llmUsed).toBe(false)
    expect(document.content).toContain("Clinica Diana SRL × Procesatorul desemnat")
    expect(document.content).not.toContain("{{COUNTERPARTY_NAME}}")
  }, DOCUMENT_GENERATOR_TEST_TIMEOUT_MS)

  it("uses cabinet templates deterministically even when an AI provider is configured", async () => {
    process.env.GEMINI_API_KEY = "test-key"
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"candidates":[]}', { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { generateDocument } = await importGeneratorModule()
    const document = await generateDocument({
      documentType: "dpa",
      orgName: "Clinica Diana SRL",
      counterpartyName: "Stripe Payments Europe",
      preparedBy: "DPO Complet SRL",
      cabinetTemplateContent: [
        "# DPA Cabinet Diana — {{orgName}} × {{counterpartyName}}",
        "",
        "Clauză cabinet Diana păstrată integral.",
      ].join("\n"),
    })

    expect(document.llmUsed).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(document.content).toContain("Clinica Diana SRL × Stripe Payments Europe")
    expect(document.content).toContain("Clauză cabinet Diana păstrată integral.")
  }, DOCUMENT_GENERATOR_TEST_TIMEOUT_MS)

  it("returns a valid ropa fallback when Gemini is unavailable", async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.MISTRAL_API_KEY

    const { generateDocument } = await importGeneratorModule()
    const document = await generateDocument({
      documentType: "ropa",
      orgName: "CompliAI Test SRL",
      orgCui: "RO12345678",
      dpoEmail: "dpo@example.com",
    })

    expect(document.llmUsed).toBe(false)

    const validation = validateGeneratedDocumentEvidence({
      documentType: "ropa",
      title: document.title,
      content: document.content,
      orgName: "CompliAI Test SRL",
    })

    expect(validation.status).toBe("valid")
  }, DOCUMENT_GENERATOR_TEST_TIMEOUT_MS)
})
