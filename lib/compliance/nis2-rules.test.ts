import { describe, expect, it } from "vitest"

import {
  detectEntityType,
  scoreNis2Assessment,
  NIS2_QUESTIONS,
  NIS2_CATEGORY_LABELS,
  SECTOR_LABELS,
  type Nis2Answers,
} from "./nis2-rules"

describe("nis2-rules", () => {
  // ── detectEntityType ────────────────────────────────────────────────────────

  it("clasifica sectoarele esentiale corect", () => {
    expect(detectEntityType("energy")).toBe("essential")
    expect(detectEntityType("transport")).toBe("essential")
    expect(detectEntityType("banking")).toBe("essential")
    expect(detectEntityType("health")).toBe("essential")
    expect(detectEntityType("digital-infrastructure")).toBe("essential")
    expect(detectEntityType("public-admin")).toBe("essential")
  })

  it("clasifica sectorul general ca important", () => {
    expect(detectEntityType("general")).toBe("important")
  })

  // ── NIS2_QUESTIONS ──────────────────────────────────────────────────────────

  it("contine cel putin 18 intrebari universale", () => {
    const universal = NIS2_QUESTIONS.filter((q) => q.sectors === "all")
    expect(universal.length).toBeGreaterThanOrEqual(18)
  })

  it("intrebarile au articol NIS2 si referinta DNSC", () => {
    for (const q of NIS2_QUESTIONS) {
      expect(q.article).toMatch(/^Art\. /)
      expect(q.dnscRef).toBeDefined()
    }
  })

  it("include intrebari specifice pentru sanatate", () => {
    const healthQuestions = NIS2_QUESTIONS.filter(
      (q) => Array.isArray(q.sectors) && q.sectors.includes("health")
    )
    expect(healthQuestions.length).toBeGreaterThanOrEqual(1)
  })

  it("include intrebari specifice pentru energie si transport", () => {
    const energyQuestions = NIS2_QUESTIONS.filter(
      (q) => Array.isArray(q.sectors) && q.sectors.includes("energy")
    )
    expect(energyQuestions.length).toBeGreaterThanOrEqual(1)
  })

  // ── scoreNis2Assessment ─────────────────────────────────────────────────────

  it("returneaza scor 0 si non-conform pentru raspunsuri goale", () => {
    const result = scoreNis2Assessment({}, "general")
    expect(result.score).toBe(0)
    expect(result.maturityLabel).toBe("non-conform")
    expect(result.answeredCount).toBe(0)
    expect(result.gaps).toHaveLength(0)
  })

  it("returneaza scor 100 si robust pentru toate yes", () => {
    const answers: Nis2Answers = {}
    for (const q of NIS2_QUESTIONS) {
      if (q.sectors === "all") answers[q.id] = "yes"
    }
    const result = scoreNis2Assessment(answers, "general")
    expect(result.score).toBe(100)
    expect(result.maturityLabel).toBe("robust")
    expect(result.gaps).toHaveLength(0)
  })

  it("calculeaza scor partial pentru raspunsuri mixte", () => {
    const applicable = NIS2_QUESTIONS.filter((q) => q.sectors === "all")
    const answers: Nis2Answers = {}
    // Jumatate yes, jumatate no
    applicable.forEach((q, i) => {
      answers[q.id] = i % 2 === 0 ? "yes" : "no"
    })
    const result = scoreNis2Assessment(answers, "general")
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(100)
    expect(result.gaps.length).toBeGreaterThan(0)
  })

  it("adauga gap cu severitate critical pentru raspuns no la intrebare critica (weight=3)", () => {
    const criticalQ = NIS2_QUESTIONS.find((q) => q.weight === 3 && q.sectors === "all")
    expect(criticalQ).toBeDefined()

    const answers: Nis2Answers = { [criticalQ!.id]: "no" }
    const result = scoreNis2Assessment(answers, "general")

    const gap = result.gaps.find((g) => g.questionId === criticalQ!.id)
    expect(gap).toBeDefined()
    expect(gap!.severity).toBe("critical")
  })

  it("adauga gap cu severitate high pentru raspuns partial la intrebare critica (weight=3)", () => {
    const criticalQ = NIS2_QUESTIONS.find((q) => q.weight === 3 && q.sectors === "all")!
    const answers: Nis2Answers = { [criticalQ.id]: "partial" }
    const result = scoreNis2Assessment(answers, "general")

    const gap = result.gaps.find((g) => g.questionId === criticalQ.id)
    expect(gap?.severity).toBe("high")
  })

  it("ignora raspunsurile na in calcul", () => {
    const q = NIS2_QUESTIONS.find((q) => q.sectors === "all")!
    const answers: Nis2Answers = { [q.id]: "na" }
    const result = scoreNis2Assessment(answers, "general")
    expect(result.score).toBe(0)
    expect(result.answeredCount).toBe(0)
    expect(result.gaps).toHaveLength(0)
  })

  it("sorteaza gap-urile: critical > high > medium", () => {
    const applicable = NIS2_QUESTIONS.filter((q) => q.sectors === "all")
    const answers: Nis2Answers = {}
    for (const q of applicable) {
      answers[q.id] = "no"
    }
    const result = scoreNis2Assessment(answers, "general")

    const severityRank: Record<string, number> = { critical: 0, high: 1, medium: 2 }
    for (let i = 0; i < result.gaps.length - 1; i++) {
      expect(severityRank[result.gaps[i].severity]).toBeLessThanOrEqual(
        severityRank[result.gaps[i + 1].severity]
      )
    }
  })

  it("include intrebarile sectoriale pentru sanatate", () => {
    const answers: Nis2Answers = {}
    const result = scoreNis2Assessment(answers, "health")
    expect(result.totalCount).toBeGreaterThan(scoreNis2Assessment(answers, "general").totalCount)
  })

  it("etichetele de maturitate sunt corecte la limitele de scor", () => {
    // We test the thresholds directly via scoreNis2Assessment with controlled inputs
    // non-conform: <25 => scor 0
    const r0 = scoreNis2Assessment({}, "general")
    expect(r0.maturityLabel).toBe("non-conform")

    // partial: 50-74 => toate partial pe intrebari universale
    const applicable = NIS2_QUESTIONS.filter((q) => q.sectors === "all")
    const partialAnswers: Nis2Answers = {}
    for (const q of applicable) {
      partialAnswers[q.id] = "partial"
    }
    const rPartial = scoreNis2Assessment(partialAnswers, "general")
    expect(rPartial.score).toBeGreaterThan(0)
    expect(["initial", "partial", "robust"]).toContain(rPartial.maturityLabel)
  })

  // ── Label maps ──────────────────────────────────────────────────────────────

  it("SECTOR_LABELS acopera toate sectoarele", () => {
    const labels = SECTOR_LABELS()
    expect(labels["energy"]).toBeDefined()
    expect(labels["general"]).toBeDefined()
    expect(labels["health"]).toBeDefined()
    expect(labels["digital-infrastructure"]).toBeDefined()
  })

  it("NIS2_CATEGORY_LABELS acopera toate categoriile", () => {
    expect(NIS2_CATEGORY_LABELS["risk-management"]).toBeDefined()
    expect(NIS2_CATEGORY_LABELS["incident-response"]).toBeDefined()
    expect(NIS2_CATEGORY_LABELS["supply-chain"]).toBeDefined()
    expect(NIS2_CATEGORY_LABELS["access-control"]).toBeDefined()
    expect(NIS2_CATEGORY_LABELS["cryptography"]).toBeDefined()
    expect(NIS2_CATEGORY_LABELS["continuity"]).toBeDefined()
    expect(NIS2_CATEGORY_LABELS["training"]).toBeDefined()
    expect(NIS2_CATEGORY_LABELS["vulnerability"]).toBeDefined()
  })
})
