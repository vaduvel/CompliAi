import { describe, expect, it } from "vitest"
import {
  buildAnnexIVDocument,
  type AssessmentAnswers,
} from "./ai-conformity-assessment"

const MOCK_SYSTEM = {
  id: "sys-test-1",
  name: "ChatBot Intern",
  vendor: "OpenAI",
  modelType: "GPT-4",
  purpose: "customer-service",
  riskLevel: "limited",
  usesPersonalData: true,
  makesAutomatedDecisions: false,
  impactsRights: false,
  hasHumanReview: true,
  createdAtISO: "2026-01-15T10:00:00.000Z",
}

const FULL_ANSWERS: AssessmentAnswers = {
  "q1-risk-class": "no",
  "q2-prohibited": "no",
  "q3-human-oversight": "yes",
  "q4-technical-doc": "yes",
  "q5-qms": "partial",
  "q6-data-governance": "yes",
  "q7-transparency": "yes",
  "q8-logging": "partial",
  "q9-post-market": "no",
  "q10-registration": "na",
}

describe("buildAnnexIVDocument", () => {
  it("returnează titlul corect cu numele sistemului", () => {
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, FULL_ANSWERS)
    expect(doc.title).toBe("Documentație Tehnică Anexa IV — ChatBot Intern")
  })

  it("conținutul include header-ul Anexa IV", () => {
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, FULL_ANSWERS)
    expect(doc.content).toContain("# Documentație Tehnică — Anexa IV EU AI Act")
  })

  it("conținutul include numele sistemului și furnizorul", () => {
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, FULL_ANSWERS)
    expect(doc.content).toContain("ChatBot Intern")
    expect(doc.content).toContain("OpenAI")
  })

  it("conținutul include organizația când este furnizată", () => {
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, FULL_ANSWERS, "Acme SRL")
    expect(doc.content).toContain("Acme SRL")
  })

  it("conținutul NU include linia organizației când nu este furnizată", () => {
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, FULL_ANSWERS)
    expect(doc.content).not.toContain("**Organizație:**")
  })

  it("conținutul include toate cele 9 secțiuni principale", () => {
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, FULL_ANSWERS)
    expect(doc.content).toContain("## 1.")
    expect(doc.content).toContain("## 2.")
    expect(doc.content).toContain("## 3.")
    expect(doc.content).toContain("## 4.")
    expect(doc.content).toContain("## 5.")
    expect(doc.content).toContain("## 6.")
    expect(doc.content).toContain("## 7.")
    expect(doc.content).toContain("## 8.")
    expect(doc.content).toContain("## 9.")
  })

  it("reflectă răspunsul q3 în secțiunea supraveghere umană", () => {
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, FULL_ANSWERS)
    expect(doc.content).toContain("Da ✅")
  })

  it("afișează avertisment corect pentru răspuns parțial", () => {
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, FULL_ANSWERS)
    expect(doc.content).toContain("Parțial ⚠️")
  })

  it("secțiunea gap analysis afișează lacunele identificate", () => {
    // q9-post-market=no este o lacună (weight 6 → medium)
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, FULL_ANSWERS)
    expect(doc.content).toContain("## 8. Gap analysis")
    expect(doc.content).toContain("EU AI Act Art. 72–73")
  })

  it("secțiunea gap analysis afișează mesaj pozitiv când nu există lacune", () => {
    const perfectAnswers: AssessmentAnswers = {
      "q1-risk-class": "no",
      "q2-prohibited": "no",
      "q3-human-oversight": "yes",
      "q4-technical-doc": "yes",
      "q5-qms": "yes",
      "q6-data-governance": "yes",
      "q7-transparency": "yes",
      "q8-logging": "yes",
      "q9-post-market": "yes",
      "q10-registration": "yes",
    }
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, perfectAnswers)
    expect(doc.content).toContain("Nicio lacună identificată")
  })

  it("conținutul include clauza de descărcare responsabilitate", () => {
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, FULL_ANSWERS)
    expect(doc.content).toContain("generat automat de CompliScan")
  })

  it("generatedAtISO este un timestamp ISO valid", () => {
    const doc = buildAnnexIVDocument(MOCK_SYSTEM, {})
    expect(() => new Date(doc.generatedAtISO)).not.toThrow()
    expect(new Date(doc.generatedAtISO).getTime()).toBeGreaterThan(0)
  })

  it("funcționează cu răspunsuri goale (fără erori)", () => {
    expect(() => buildAnnexIVDocument(MOCK_SYSTEM, {})).not.toThrow()
  })

  it("include nota Anexa III când sistemul o are", () => {
    const systemWithHint = { ...MOCK_SYSTEM, annexIIIHint: "Posibil Anexa III — evaluare necesară" }
    const doc = buildAnnexIVDocument(systemWithHint, FULL_ANSWERS)
    expect(doc.content).toContain("Posibil Anexa III — evaluare necesară")
  })
})
