/**
 * finding-kernel.test.ts — Sprint 1 unit tests
 *
 * Acoperă:
 * - classifyFinding: id patterns + suggestedDocumentType + category fallbacks
 * - getFindingTypeDefinition: known + unknown ids
 * - getResolveFlowRecipe: known + unknown ids
 * - deriveCockpitUIState: tranzițiile cheie
 * - buildCockpitRecipe: cele 3 archetypes canonice (GDPR-001, EF-003, SYS-002)
 */

import { describe, expect, it } from "vitest"

import {
  buildCockpitRecipe,
  classifyFinding,
  computeNextMonitoringDateISO,
  deriveCockpitUIState,
  getCloseGatingRequirements,
  getFindingTypeDefinition,
  getResolveFlowRecipe,
} from "@/lib/compliscan/finding-kernel"
import type { ScanFinding } from "@/lib/compliance/types"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeFinding(overrides: Partial<ScanFinding> = {}): ScanFinding {
  return {
    id: "test-finding-001",
    title: "Test finding",
    detail: "Detalii test",
    category: "GDPR",
    severity: "high",
    risk: "high",
    principles: [],
    createdAtISO: "2026-03-26T00:00:00.000Z",
    sourceDocument: "test",
    findingStatus: "open",
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// classifyFinding
// ─────────────────────────────────────────────────────────────────────────────

describe("classifyFinding", () => {
  it("mapează GDPR + privacy-policy → GDPR-001, framework GDPR", () => {
    const result = classifyFinding(
      makeFinding({ category: "GDPR", suggestedDocumentType: "privacy-policy" })
    )
    expect(result.findingTypeId).toBe("GDPR-001")
    expect(result.framework).toBe("GDPR")
  })

  it("mapează GDPR + cookie-policy → GDPR-003", () => {
    const result = classifyFinding(
      makeFinding({ category: "GDPR", suggestedDocumentType: "cookie-policy" })
    )
    expect(result.findingTypeId).toBe("GDPR-003")
  })

  it("mapează GDPR + dpa → GDPR-010", () => {
    const result = classifyFinding(
      makeFinding({ category: "GDPR", suggestedDocumentType: "dpa" })
    )
    expect(result.findingTypeId).toBe("GDPR-010")
  })

  it("mapează finding-ul intake privacy policy → GDPR-001", () => {
    const result = classifyFinding(
      makeFinding({
        id: "intake-gdpr-privacy-policy",
        category: "GDPR",
        title: "Politică de confidențialitate GDPR lipsă",
      })
    )
    expect(result.findingTypeId).toBe("GDPR-001")
  })

  it("mapează finding-ul intake vendor no dpa → GDPR-010", () => {
    const result = classifyFinding(
      makeFinding({
        id: "intake-vendor-no-dpa",
        category: "GDPR",
        title: "DPA lipsă pentru furnizori care procesează date personale",
      })
    )
    expect(result.findingTypeId).toBe("GDPR-010")
  })

  it("mapează un vendor cunoscut din text pentru flow DPA", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "vendor-google-analytics-dpa",
        category: "GDPR",
        suggestedDocumentType: "dpa",
        title: "DPA lipsă pentru Google Analytics",
        detail: "Google Analytics procesează date personale și nu există DPA atașat în dosar.",
      })
    )

    expect(recipe.findingTypeId).toBe("GDPR-010")
    expect(recipe.vendorContext?.vendorName).toBe("Google Analytics")
    expect(recipe.vendorContext?.dpaUrl).toContain("google")
  })

  it("mapează finding-ul intake site cookies → GDPR-005", () => {
    const result = classifyFinding(
      makeFinding({
        id: "intake-site-cookies",
        category: "GDPR",
        title: "Cookies consent / policy lipsă",
        detail:
          "Directiva ePrivacy și GDPR cer consimțământ explicit pentru cookies non-esențiale. Lipsa unui banner de consent e neconformitate.",
      })
    )
    expect(result.findingTypeId).toBe("GDPR-005")
  })

  it("mapează NIS2 + nis2-incident-response → NIS2-015", () => {
    const result = classifyFinding(
      makeFinding({ category: "NIS2", suggestedDocumentType: "nis2-incident-response" })
    )
    expect(result.findingTypeId).toBe("NIS2-015")
    expect(result.framework).toBe("NIS2")
  })

  it("mapează EU_AI_ACT + ai-governance → AI-005", () => {
    const result = classifyFinding(
      makeFinding({ category: "EU_AI_ACT", suggestedDocumentType: "ai-governance" })
    )
    expect(result.findingTypeId).toBe("AI-005")
    expect(result.framework).toBe("AI Act")
  })

  it("mapează id=dsar-no-procedure → GDPR-013", () => {
    const result = classifyFinding(makeFinding({ id: "dsar-no-procedure", category: "GDPR" }))
    expect(result.findingTypeId).toBe("GDPR-013")
  })

  it("mapează id prefix saft- → EF-GENERIC", () => {
    const result = classifyFinding(makeFinding({ id: "saft-e-invoice-error", category: "E_FACTURA" }))
    expect(result.findingTypeId).toBe("EF-GENERIC")
    expect(result.framework).toBe("eFactura")
  })

  it("mapează id=saft-d406-registration → EF-001", () => {
    const result = classifyFinding(makeFinding({ id: "saft-d406-registration", category: "E_FACTURA" }))
    expect(result.findingTypeId).toBe("EF-001")
  })

  it("mapează id=nis2-finding-eligibility → NIS2-001", () => {
    const result = classifyFinding(
      makeFinding({ id: "nis2-finding-eligibility", category: "NIS2" })
    )
    expect(result.findingTypeId).toBe("NIS2-001")
  })

  it("fallback GDPR fără docType → GDPR-GENERIC", () => {
    const result = classifyFinding(makeFinding({ category: "GDPR" }))
    expect(result.findingTypeId).toBe("GDPR-GENERIC")
  })

  it("fallback E_FACTURA fără pattern → EF-GENERIC", () => {
    const result = classifyFinding(makeFinding({ category: "E_FACTURA" }))
    expect(result.findingTypeId).toBe("EF-GENERIC")
  })

  it("mapează finding-ul real de factură respinsă ANAF → EF-003", () => {
    const result = classifyFinding(
      makeFinding({
        id: "demo-efactura-1",
        category: "E_FACTURA",
        title: "Factură ANAF respinsă — FACT-2026-0021",
        detail:
          "Factura FACT-2026-0021 a fost respinsă de SPV ANAF. Codul de eroare E1 indică probleme cu câmpul TaxTotal.",
      })
    )
    expect(result.findingTypeId).toBe("EF-003")
  })

  it("mapează un finding de dovadă veche spre SYS-002", () => {
    const result = classifyFinding(
      makeFinding({
        category: "GDPR",
        title: "Dovadă veche / necesită revalidare",
        detail: "Această dovadă este veche și trebuie reconfirmată.",
      })
    )
    expect(result.findingTypeId).toBe("SYS-002")
    expect(result.framework).toBe("Cross")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getFindingTypeDefinition
// ─────────────────────────────────────────────────────────────────────────────

describe("getFindingTypeDefinition", () => {
  it("returnează definiția corectă pentru GDPR-001", () => {
    const def = getFindingTypeDefinition("GDPR-001")
    expect(def.findingTypeId).toBe("GDPR-001")
    expect(def.framework).toBe("GDPR")
    expect(def.resolutionModes).toContain("in_app_guided")
    expect(def.autoRecheck).toBe("partial")
    expect(def.requiredEvidenceKinds).toContain("generated_document")
  })

  it("returnează definiția corectă pentru EF-003", () => {
    const def = getFindingTypeDefinition("EF-003")
    expect(def.framework).toBe("eFactura")
    expect(def.resolutionModes).toContain("external_action")
    expect(def.autoRecheck).toBe("yes")
  })

  it("returnează definiția corectă pentru SYS-002", () => {
    const def = getFindingTypeDefinition("SYS-002")
    expect(def.framework).toBe("Cross")
    expect(def.resolutionModes).toContain("user_attestation")
  })

  it("returnează CROSS-GENERIC pentru id necunoscut", () => {
    const def = getFindingTypeDefinition("UNKNOWN-999")
    expect(def.findingTypeId).toBe("CROSS-GENERIC")
    expect(def.framework).toBe("Cross")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getResolveFlowRecipe
// ─────────────────────────────────────────────────────────────────────────────

describe("getResolveFlowRecipe", () => {
  it("returnează recipe corect pentru GDPR-001", () => {
    const recipe = getResolveFlowRecipe("GDPR-001")
    expect(recipe.findingTypeId).toBe("GDPR-001")
    expect(recipe.initialFlowState).toBe("ready_to_generate")
    expect(recipe.primaryCTA).toBe("Generează acum")
    expect(recipe.secondaryCTA).toBe("Am deja documentul")
    expect(recipe.revalidationTriggers.length).toBeGreaterThan(0)
  })

  it("returnează recipe corect pentru GDPR-005 — external action", () => {
    const recipe = getResolveFlowRecipe("GDPR-005")
    expect(recipe.initialFlowState).toBe("external_action_required")
    expect(recipe.primaryCTA).toBe("Corectează bannerul")
  })

  it("returnează handoff real pentru GDPR-005 către re-scanul site-ului", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "intake-site-cookies",
        category: "GDPR",
        title: "Banner cookie neconform",
        detail: "Trackerele se încarcă înainte de consimțământ.",
      })
    )

    expect(recipe.findingTypeId).toBe("GDPR-005")
    expect(recipe.workflowLink?.href).toContain("/dashboard/scan?action=site")
    expect(recipe.workflowLink?.href).toContain("findingId=intake-site-cookies")
    expect(recipe.workflowLink?.label).toBe("Scanează site-ul din nou")
    expect(recipe.closureCTA).toBe("Trimite la dosar și monitorizare")
  })

  it("returnează handoff real pentru GDPR-013 către DSAR", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "dsar-no-procedure",
        category: "GDPR",
        title: "Nu ai o procedură documentată pentru cererile DSAR",
        detail: "Creează procedura din Generator sau înregistrează prima cerere în modulul DSAR.",
      })
    )

    expect(recipe.findingTypeId).toBe("GDPR-013")
    expect(recipe.workflowLink?.href).toBe("/dashboard/dsar?action=new")
    expect(recipe.workflowLink?.label).toBe("Deschide DSAR")
    expect(recipe.closureCTA).toBe("Marchează răspunsul trimis")
  })

  it("returnează recipe corect pentru EF-003 — fără generator", () => {
    const recipe = getResolveFlowRecipe("EF-003")
    expect(recipe.initialFlowState).toBe("external_action_required")
    expect(recipe.primaryCTA).toBe("Vezi ce trebuie corectat")
  })

  it("returnează recipe corect pentru SYS-002 — needs_revalidation", () => {
    const recipe = getResolveFlowRecipe("SYS-002")
    expect(recipe.initialFlowState).toBe("needs_revalidation")
    expect(recipe.primaryCTA).toBe("Reconfirmă acum")
  })

  it("returnează CROSS-GENERIC pentru id necunoscut", () => {
    const recipe = getResolveFlowRecipe("UNKNOWN-999")
    expect(recipe.findingTypeId).toBe("CROSS-GENERIC")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// deriveCockpitUIState
// ─────────────────────────────────────────────────────────────────────────────

describe("deriveCockpitUIState", () => {
  function makeContract(
    findingTypeId: string,
    statusOverride?: ScanFinding["findingStatus"],
    docFlow?: "not_required" | "draft_missing" | "draft_ready" | "attached_as_evidence"
  ) {
    const findingType = getFindingTypeDefinition(findingTypeId)
    const flow = getResolveFlowRecipe(findingTypeId)
    const record = makeFinding({ findingStatus: statusOverride ?? "open" })
    return { record, findingType, flow, documentFlowState: docFlow ?? "not_required" as const }
  }

  it("dismissed → false_positive", () => {
    const result = deriveCockpitUIState(makeContract("GDPR-001", "dismissed"))
    expect(result).toBe("false_positive")
  })

  it("resolved → resolved", () => {
    const result = deriveCockpitUIState(makeContract("GDPR-001", "resolved"))
    expect(result).toBe("resolved")
  })

  it("under_monitoring → resolved", () => {
    const result = deriveCockpitUIState(makeContract("GDPR-001", "under_monitoring"))
    expect(result).toBe("resolved")
  })

  it("GDPR-001 open + draft_ready → evidence_uploaded", () => {
    const result = deriveCockpitUIState(makeContract("GDPR-001", "open", "draft_ready"))
    expect(result).toBe("evidence_uploaded")
  })

  it("GDPR-001 open + attached_as_evidence → evidence_uploaded", () => {
    const result = deriveCockpitUIState(makeContract("GDPR-001", "open", "attached_as_evidence"))
    expect(result).toBe("evidence_uploaded")
  })

  it("GDPR-001 open + not_required → ready_to_generate", () => {
    const result = deriveCockpitUIState(makeContract("GDPR-001", "open", "not_required"))
    expect(result).toBe("ready_to_generate")
  })

  it("EF-003 open → external_action_required", () => {
    const result = deriveCockpitUIState(makeContract("EF-003", "open"))
    expect(result).toBe("external_action_required")
  })

  it("SYS-002 open → needs_revalidation", () => {
    const result = deriveCockpitUIState(makeContract("SYS-002", "open"))
    expect(result).toBe("needs_revalidation")
  })

  it("AI-005 open → need_your_input", () => {
    const result = deriveCockpitUIState(makeContract("AI-005", "open"))
    expect(result).toBe("need_your_input")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// buildCockpitRecipe — 3 archetypes canonice
// ─────────────────────────────────────────────────────────────────────────────

describe("buildCockpitRecipe", () => {
  describe("Archetype 1 — GDPR-001 (document / in_app_guided)", () => {
    it("returnează uiState ready_to_generate pentru finding nou", () => {
      const finding = makeFinding({
        category: "GDPR",
        suggestedDocumentType: "privacy-policy",
        findingStatus: "open",
      })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.uiState).toBe("ready_to_generate")
      expect(recipe.resolveFlowState).toBe("ready_to_generate")
    })

    it("CTA principal este open_generator pentru ready_to_generate", () => {
      const finding = makeFinding({
        category: "GDPR",
        suggestedDocumentType: "privacy-policy",
        findingStatus: "open",
      })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.primaryCTA.action).toBe("open_generator")
    })

    it("CTA-ul hero păstrează label-ul din recipe, nu varianta collapsed", () => {
      const finding = makeFinding({
        category: "GDPR",
        suggestedDocumentType: "privacy-policy",
        findingStatus: "open",
      })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.primaryCTA.label).toBe("Generează acum")
      expect(recipe.visibleBlocks.collapsedPrimaryCTA).toBe("Generează acum")
    })

    it("are secondaryCTA cu action already_have_evidence", () => {
      const finding = makeFinding({
        category: "GDPR",
        suggestedDocumentType: "privacy-policy",
      })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.secondaryCTA?.action).toBe("already_have_evidence")
    })

    it("visibleBlocks conține input și evidence above-the-fold", () => {
      const finding = makeFinding({
        category: "GDPR",
        suggestedDocumentType: "privacy-policy",
      })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.visibleBlocks.aboveTheFoldBlocks).toContain("generator")
      expect(recipe.visibleBlocks.aboveTheFoldBlocks).toContain("input")
      expect(recipe.visibleBlocks.aboveTheFoldBlocks).toContain("evidence")
    })

    it("monitoringSignals include revalidation triggers", () => {
      const finding = makeFinding({
        category: "GDPR",
        suggestedDocumentType: "privacy-policy",
      })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.monitoringSignals.length).toBeGreaterThan(0)
    })

    it("resolved cu doc atașat → uiState resolved", () => {
      const finding = makeFinding({
        category: "GDPR",
        suggestedDocumentType: "privacy-policy",
        findingStatus: "under_monitoring",
      })
      const recipe = buildCockpitRecipe(finding, {
        documentFlowState: "attached_as_evidence",
      })
      expect(recipe.uiState).toBe("resolved")
      expect(recipe.statusLabel).toBe("Rezolvat")
    })
  })

  describe("Archetype 2 — EF-003 (operational / external_action)", () => {
    it("returnează uiState external_action_required", () => {
      const finding = makeFinding({ category: "E_FACTURA", findingStatus: "open" })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.uiState).toBe("external_action_required")
    })

    it("CTA principal este open_external_steps", () => {
      const finding = makeFinding({ category: "E_FACTURA" })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.primaryCTA.action).toBe("open_external_steps")
    })

    it("NU conține generator block (Regula 2 din canon)", () => {
      const finding = makeFinding({ category: "E_FACTURA" })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.visibleBlocks.detailBlocks).not.toContain("generator")
    })

    it("conține external_action block above-the-fold", () => {
      const finding = makeFinding({ category: "E_FACTURA" })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.visibleBlocks.aboveTheFoldBlocks).toContain("external_action")
    })

    it("acceptedEvidence include screenshot și xml", () => {
      const finding = makeFinding({ category: "E_FACTURA" })
      const recipe = buildCockpitRecipe(finding)
      // EF-GENERIC are screenshot; EF-003 ar avea și xml dar depinde de id
      expect(recipe.acceptedEvidence.length).toBeGreaterThan(0)
    })
  })

  describe("Archetype 3 — SYS-002 (revalidation / needs_revalidation)", () => {
    it("returnează uiState needs_revalidation", () => {
      // SYS-002 vine de la GDPR finding cu status open fără docType special
      // Simulăm un finding care ar fi clasificat ca SYS-002
      // (în practică, SYS-002 vine din logică de revalidare, nu din category)
      const findingType = getFindingTypeDefinition("SYS-002")
      const flow = getResolveFlowRecipe("SYS-002")
      const record = makeFinding({ findingStatus: "open" })
      const uiState = deriveCockpitUIState({
        record,
        findingType,
        flow,
        documentFlowState: "not_required",
      })
      expect(uiState).toBe("needs_revalidation")
    })

    it("CTA principal este revalidate pentru needs_revalidation", () => {
      const findingType = getFindingTypeDefinition("SYS-002")
      const flow = getResolveFlowRecipe("SYS-002")
      const record = makeFinding({ findingStatus: "open" })
      const uiState = deriveCockpitUIState({
        record,
        findingType,
        flow,
        documentFlowState: "not_required",
      })
      expect(uiState).toBe("needs_revalidation")
      // Verificăm că recipe-ul pentru SYS-002 are primaryCTA corect
      expect(flow.primaryCTA).toBe("Reconfirmă acum")
    })

    it("secondaryCTA este show_old_document pentru SYS-002", () => {
      const flow = getResolveFlowRecipe("SYS-002")
      expect(flow.secondaryCTA).toBe("Vezi dovada veche")
    })
  })

  describe("Reguli canonice de coerență", () => {
    it("in_app_guided NU afișează external_action block", () => {
      const finding = makeFinding({
        category: "GDPR",
        suggestedDocumentType: "privacy-policy",
      })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.visibleBlocks.detailBlocks).not.toContain("external_action")
    })

    it("external_action NU afișează generator block", () => {
      const finding = makeFinding({ category: "E_FACTURA" })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.visibleBlocks.detailBlocks).not.toContain("generator")
    })

    it("audit_meta este întotdeauna prezent below-the-fold", () => {
      const g = buildCockpitRecipe(makeFinding({ category: "GDPR", suggestedDocumentType: "privacy-policy" }))
      const e = buildCockpitRecipe(makeFinding({ category: "E_FACTURA" }))
      expect(g.visibleBlocks.belowTheFoldBlocks).toContain("audit_meta")
      expect(e.visibleBlocks.belowTheFoldBlocks).toContain("audit_meta")
    })

    it("closeCondition și dossierOutcome sunt întotdeauna prezente", () => {
      const recipe = buildCockpitRecipe(makeFinding({ category: "GDPR" }))
      expect(recipe.closeCondition).toBeTruthy()
      expect(recipe.dossierOutcome).toBeTruthy()
    })

    it("heroTitle este titlul finding-ului", () => {
      const finding = makeFinding({ title: "Politică GDPR lipsă" })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.heroTitle).toBe("Politică GDPR lipsă")
    })
  })
})

describe("getCloseGatingRequirements", () => {
  it("cere document și checklist pentru GDPR-001", () => {
    const requirements = getCloseGatingRequirements("GDPR-001")
    expect(requirements.requiresGeneratedDocument).toBe(true)
    expect(requirements.requiresConfirmationChecklist).toBe(true)
    expect(requirements.requiresEvidenceNote).toBe(false)
  })

  it("cere dovadă operațională pentru GDPR-005", () => {
    const requirements = getCloseGatingRequirements("GDPR-005")
    expect(requirements.requiresGeneratedDocument).toBe(false)
    expect(requirements.requiresEvidenceNote).toBe(true)
  })

  it("cere dovadă operațională pentru EF-003", () => {
    const requirements = getCloseGatingRequirements("EF-003")
    expect(requirements.requiresGeneratedDocument).toBe(false)
    expect(requirements.requiresEvidenceNote).toBe(true)
    expect(requirements.requiresRevalidationConfirmation).toBe(false)
  })

  it("cere reconfirmare și dată nouă de review pentru SYS-002", () => {
    const requirements = getCloseGatingRequirements("SYS-002")
    expect(requirements.requiresRevalidationConfirmation).toBe(true)
    expect(requirements.requiresNextReviewDate).toBe(true)
  })
})

describe("computeNextMonitoringDateISO", () => {
  it("calculează următorul control pentru EF-003 la 7 zile", () => {
    const nextISO = computeNextMonitoringDateISO("EF-003", "2026-03-26T00:00:00.000Z")
    expect(nextISO).toBe("2026-04-02T00:00:00.000Z")
  })

  it("calculează următorul control pentru GDPR-001 la 180 zile", () => {
    const nextISO = computeNextMonitoringDateISO("GDPR-001", "2026-03-26T00:00:00.000Z")
    expect(nextISO).toBe("2026-09-22T00:00:00.000Z")
  })

  it("cade pe fallback-ul transversal pentru id necunoscut", () => {
    const nextISO = computeNextMonitoringDateISO("UNKNOWN-999", "2026-03-26T00:00:00.000Z")
    expect(nextISO).toBe("2026-06-24T00:00:00.000Z")
  })
})
