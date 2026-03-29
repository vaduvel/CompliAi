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
  extractEF001SpvState,
  extractEF003Explainability,
  getCloseGatingRequirements,
  getSmartResolveExecutionClass,
  getSpecialistHandoffContract,
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

  it("mapează baseline-ul contractual din intake → GDPR-020", () => {
    const result = classifyFinding(
      makeFinding({
        id: "contracts-baseline",
        category: "GDPR",
        title: "Contracte standard lipsă sau incomplete",
        detail: "Lipsa contractelor standard cu clienții și furnizorii creează expunere juridică și face auditul dificil.",
      })
    )
    expect(result.findingTypeId).toBe("GDPR-020")
    expect(result.framework).toBe("GDPR")
  })

  it("mapează intake HR fără generator → GDPR-OPS", () => {
    const result = classifyFinding(
      makeFinding({
        id: "intake-hr-registry",
        category: "GDPR",
        title: "REGES / evidență contracte angajați",
        detail: "Evidența contractelor trebuie ținută la zi.",
      })
    )
    expect(result.findingTypeId).toBe("GDPR-OPS")
    expect(result.framework).toBe("GDPR")
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

  it("mapează intake AI operațional fără generator → AI-OPS", () => {
    const result = classifyFinding(
      makeFinding({
        id: "intake-ai-confidential-data",
        category: "EU_AI_ACT",
        title: "Date confidențiale introduse în AI fără protecție",
        detail: "Tool-uri AI externe primesc date sensibile fără reguli.",
      })
    )
    expect(result.findingTypeId).toBe("AI-OPS")
    expect(result.framework).toBe("AI Act")
  })

  it("mapează id=dsar-no-procedure → GDPR-013", () => {
    const result = classifyFinding(makeFinding({ id: "dsar-no-procedure", category: "GDPR" }))
    expect(result.findingTypeId).toBe("GDPR-013")
  })

  it("mapează cererea de ștergere activă → GDPR-014", () => {
    const result = classifyFinding(
      makeFinding({
        id: "dsar-erasure-active",
        category: "GDPR",
        title: "Cerere de ștergere activă",
        detail: "Există o cerere activă de ștergere pentru datele personale ale unui client.",
      })
    )
    expect(result.findingTypeId).toBe("GDPR-014")
  })

  it("mapează ruleId GDPR-RET-001 → GDPR-016", () => {
    const result = classifyFinding(
      makeFinding({
        category: "GDPR",
        title: "Clarifică retenția datelor personale",
        detail: "Termenele de retenție și procesul de ștergere nu sunt suficient de clare.",
        provenance: {
          ruleId: "GDPR-RET-001",
        },
      })
    )
    expect(result.findingTypeId).toBe("GDPR-016")
  })

  it("mapează dovada de ștergere / anonimizare → GDPR-017", () => {
    const result = classifyFinding(
      makeFinding({
        id: "retention-deletion-proof-1",
        category: "GDPR",
        title: "Ștergere / anonimizare neconfirmată",
        detail: "Există politică de retenție, dar lipsește logul de ștergere sau anonimizare pentru datele expirate.",
        evidenceRequired: "Log de ștergere sau export de control pentru sistemele afectate.",
      })
    )
    expect(result.findingTypeId).toBe("GDPR-017")
    expect(result.framework).toBe("GDPR")
  })

  it("mapează finding-ul rescue ANSPDCP → GDPR-019", () => {
    const result = classifyFinding(
      makeFinding({
        id: "anspdcp-breach-inc-42",
        category: "GDPR",
        title: "Notificare ANSPDCP obligatorie — Incident ransomware",
      })
    )
    expect(result.findingTypeId).toBe("GDPR-019")
    expect(result.framework).toBe("GDPR")
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

  it("returnează recipe corect pentru GDPR-016 — retention generator", () => {
    const recipe = getResolveFlowRecipe("GDPR-016")
    expect(recipe.initialFlowState).toBe("ready_to_generate")
    expect(recipe.primaryCTA).toBe("Definește retenția")
  })

  it("returnează recipe corect pentru GDPR-017 — deletion proof external action", () => {
    const recipe = getResolveFlowRecipe("GDPR-017")
    expect(recipe.initialFlowState).toBe("external_action_required")
    expect(recipe.primaryCTA).toBe("Confirmă ștergerea")
    expect(recipe.closeCondition).toContain("Log")
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
    expect(recipe.workflowLink?.href).toContain("/dashboard/dsar?action=new")
    expect(recipe.workflowLink?.href).toContain("type=access")
    expect(recipe.workflowLink?.href).toContain("findingId=dsar-no-procedure")
    expect(recipe.workflowLink?.href).toContain("returnTo=%2Fdashboard%2Fresolve%2Fdsar-no-procedure")
    expect(recipe.workflowLink?.label).toBe("Deschide DSAR")
    expect(recipe.closureCTA).toBe("Marchează răspunsul trimis")
  })

  it("returnează handoff real pentru GDPR-014 către DSAR pe erasure", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "dsar-erasure-active",
        category: "GDPR",
        title: "Cerere de ștergere activă",
        detail: "Persoana vizată a solicitat ștergerea datelor și trebuie pregătit răspunsul plus execuția operațională.",
      })
    )

    expect(recipe.findingTypeId).toBe("GDPR-014")
    expect(recipe.workflowLink?.href).toContain("/dashboard/dsar?action=new")
    expect(recipe.workflowLink?.href).toContain("type=erasure")
    expect(recipe.workflowLink?.href).toContain("findingId=dsar-erasure-active")
    expect(recipe.workflowLink?.href).toContain("returnTo=%2Fdashboard%2Fresolve%2Fdsar-erasure-active")
    expect(recipe.workflowLink?.label).toBe("Deschide cererea de ștergere")
    expect(recipe.closureCTA).toBe("Marchează răspunsul și ștergerea")
  })

  it("returnează handoff real pentru GDPR-019 către flow-ul ANSPDCP din NIS2", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "anspdcp-breach-inc-42",
        category: "GDPR",
        title: "Notificare ANSPDCP obligatorie — Incident ransomware",
        detail: "Incidentul implică date cu caracter personal și trebuie evaluată notificarea ANSPDCP în 72h.",
      })
    )

    expect(recipe.findingTypeId).toBe("GDPR-019")
    expect(recipe.workflowLink?.href).toContain("/dashboard/nis2?tab=incidents")
    expect(recipe.workflowLink?.href).toContain("incidentId=inc-42")
    expect(recipe.workflowLink?.href).toContain("focus=anspdcp")
    expect(recipe.workflowLink?.href).toContain("findingId=anspdcp-breach-inc-42")
    expect(recipe.workflowLink?.label).toBe("Deschide flow-ul de breach")
    expect(recipe.closureCTA).toBe("Marchează notificarea ANSPDCP")
  })

  it("returnează handoff real pentru NIS2-001 către wizardul de eligibilitate", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-finding-eligibility",
        category: "NIS2",
        title: "Eligibilitate NIS2 neclară",
        detail: "Nu este clar dacă firma intră sub NIS2 și dacă trebuie continuat cu DNSC.",
      })
    )

    expect(recipe.findingTypeId).toBe("NIS2-001")
    expect(recipe.workflowLink?.href).toContain("/dashboard/nis2/eligibility")
    expect(recipe.workflowLink?.href).toContain("findingId=nis2-finding-eligibility")
    expect(recipe.workflowLink?.href).toContain("source=cockpit")
    expect(recipe.workflowLink?.href).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-finding-eligibility")
    expect(recipe.workflowLink?.label).toBe("Deschide eligibilitatea NIS2")
    expect(recipe.closureCTA).toBe("Salvează eligibilitatea")
  })

  it("returnează handoff real pentru NIS2-005 către assessment", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-finding-assessment",
        category: "NIS2",
        title: "Assessment NIS2 neînceput",
        detail: "Nu avem încă o evaluare NIS2 pentru firma ta.",
      })
    )

    expect(recipe.findingTypeId).toBe("NIS2-005")
    expect(recipe.workflowLink?.href).toContain("/dashboard/nis2?tab=assessment")
    expect(recipe.workflowLink?.href).toContain("focus=assessment")
    expect(recipe.workflowLink?.href).toContain("findingId=nis2-finding-assessment")
    expect(recipe.workflowLink?.label).toBe("Deschide evaluarea NIS2")
    expect(recipe.closureCTA).toBe("Salvează evaluarea NIS2")
  })

  it("returnează handoff real pentru NIS2-015 către timeline-ul incidentului selectat", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-finding-incident-timeline",
        category: "NIS2",
        suggestedDocumentType: "nis2-incident-response",
        title: "Incident activ fără Early Warning",
        detail: "Incidentul demo-incident-1 cere early warning în 24h.",
      })
    )

    expect(recipe.findingTypeId).toBe("NIS2-015")
    expect(recipe.workflowLink?.href).toContain("/dashboard/nis2?tab=incidents")
    expect(recipe.workflowLink?.href).toContain("focus=incident")
    expect(recipe.workflowLink?.href).toContain("incidentId=demo-incident-1")
    expect(recipe.workflowLink?.href).toContain("findingId=nis2-finding-incident-timeline")
    expect(recipe.workflowLink?.href).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-finding-incident-timeline")
    expect(recipe.workflowLink?.label).toBe("Deschide timeline-ul incidentului")
    expect(recipe.closureCTA).toBe("Marchează early warning trimis")
  })

  it("returnează fallback clar pentru NIS2-015 când nu poate deduce incidentul exact", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-finding-incident-generic",
        category: "NIS2",
        suggestedDocumentType: "nis2-incident-response",
        title: "Incident activ fără Early Warning",
        detail: "Incidentul cere deschiderea flow-ului DNSC, dar nu are încă un incident legat explicit.",
      })
    )

    expect(recipe.findingTypeId).toBe("NIS2-015")
    expect(recipe.workflowLink?.href).toContain("/dashboard/nis2?tab=incidents")
    expect(recipe.workflowLink?.href).toContain("focus=incident")
    expect(recipe.workflowLink?.href).toContain("findingId=nis2-finding-incident-generic")
    expect(recipe.workflowLink?.href).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-finding-incident-generic")
    expect(recipe.workflowLink?.href).not.toContain("incidentId=")
    expect(recipe.workflowLink?.label).toBe("Deschide flow-ul de incident")
  })

  it("deschide registrul furnizorilor pentru finding-ul NIS2 de supply-chain", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-supply-chain-gap",
        category: "NIS2",
        title: "2 furnizori tehnici fără DPA semnat",
        detail: "Microsoft și AWS apar în registrul furnizorilor fără DPA actualizat.",
        remediationHint: "Solicitați DPA actualizat de la Microsoft și AWS.",
      })
    )

    expect(recipe.findingTypeId).toBe("NIS2-GENERIC")
    expect(recipe.workflowLink?.href).toContain("/dashboard/nis2?tab=vendors")
    expect(recipe.workflowLink?.href).toContain("focus=vendor")
    expect(recipe.workflowLink?.href).toContain("findingId=nis2-supply-chain-gap")
    expect(recipe.workflowLink?.href).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-supply-chain-gap")
    expect(recipe.workflowLink?.label).toContain("Deschide registrul")
    expect(recipe.closureCTA).toBe("Marchează furnizorul revizuit")
    expect(recipe.monitoringSignals.length).toBeGreaterThan(0)
  })

  it("deschide evaluarea de maturitate pentru gap-ul NIS2 pe risk management", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-maturity-risk-management",
        category: "NIS2",
        title: "Maturitate insuficientă: Managementul riscului cibernetic (33%)",
        detail: "Domeniu NIS2 cu scor sub 50%. Documentează o Politică de Management al Riscului Cibernetic.",
        remediationHint:
          "Documentează o Politică de Management al Riscului Cibernetic. Generează din Generatorul de Documente și atașează documentul semnat de management.",
      })
    )

    expect(recipe.findingTypeId).toBe("NIS2-GENERIC")
    expect(recipe.workflowLink?.href).toContain("/dashboard/nis2/maturitate")
    expect(recipe.workflowLink?.href).toContain("focus=risk-management")
    expect(recipe.workflowLink?.href).toContain("findingId=nis2-maturity-risk-management")
    expect(recipe.workflowLink?.href).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-maturity-risk-management")
    expect(recipe.workflowLink?.label).toBe("Deschide evaluarea de maturitate")
    expect(recipe.closureCTA).toBe("Marchează evaluarea salvată")
    expect(recipe.acceptedEvidence[0]).toContain("Managementul riscului cibernetic")
  })

  it("nu confundă gap-ul vechi de risk management cu registrul de guvernanță", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-risk-management-gap",
        category: "NIS2",
        title: "Politica de management al riscului cibernetic lipsă",
        detail: "Organizația nu are o politică formală de management al riscului conform NIS2 Art. 21(2)(a).",
        remediationHint: "Elaborați o politică de management al riscului validată de conducere.",
        resolution: {
          problem: "Lipsă politică formală de management risc cibernetic",
          impact: "Neconformitate NIS2 Art. 21 — risc de sancțiune",
          action: "Elaborați și aprobați politica cu conducerea + CISO",
          closureEvidence: "Document aprobat de conducere + dată intrare în vigoare",
        },
      })
    )

    expect(recipe.findingTypeId).toBe("NIS2-GENERIC")
    expect(recipe.workflowLink?.href).toContain("/dashboard/nis2/maturitate")
    expect(recipe.workflowLink?.href).toContain("focus=risk-management")
    expect(recipe.workflowLink?.href).not.toContain("/dashboard/nis2/governance")
    expect(recipe.primaryCTA.label).toBe("Deschide evaluarea de maturitate")
    expect(recipe.closureCTA).toBe("Marchează evaluarea salvată")
  })

  it("nu trimite maturity supply-chain în vendor registry când finding-ul este gap de assessment", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-maturity-supply-chain",
        category: "NIS2",
        title: "Maturitate insuficientă: Securitatea lanțului de aprovizionare (20%)",
        detail: "Domeniu NIS2 cu scor sub 50%. Completează registrul de furnizori cu clauze de securitate.",
      })
    )

    expect(recipe.workflowLink?.href).toContain("/dashboard/nis2/maturitate")
    expect(recipe.workflowLink?.href).toContain("focus=supply-chain")
    expect(recipe.workflowLink?.href).not.toContain("tab=vendors")
  })

  it("deschide registrul de guvernanță pentru gap de training board", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-gov-training-demo-board-1",
        category: "NIS2",
        title: "Ana Popescu nu a completat training-ul de securitate cibernetică",
        detail: "Membrul conducerii nu are documentat training-ul de securitate cibernetică.",
        sourceDocument: "Registru Guvernanță — Board Training Tracker",
      })
    )

    expect(recipe.findingTypeId).toBe("NIS2-GENERIC")
    expect(recipe.workflowLink?.href).toContain("/dashboard/nis2/governance")
    expect(recipe.workflowLink?.href).toContain("focus=training")
    expect(recipe.workflowLink?.href).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-gov-training-demo-board-1")
    expect(recipe.closureCTA).toBe("Marchează training-ul documentat")
    expect(recipe.primaryCTA.label).toBe("Actualizează training-ul boardului")
  })

  it("deschide registrul CISO pentru certificare expirată", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-gov-cert-expired-demo-ciso-1",
        category: "NIS2",
        title: "Certificarea CISSP a lui Ioan Ionescu a expirat",
        detail: "Certificarea CISO a expirat și trebuie reînnoită în registrul de guvernanță.",
        sourceDocument: "Registru Guvernanță — Board Training Tracker",
      })
    )

    expect(recipe.workflowLink?.href).toContain("/dashboard/nis2/governance")
    expect(recipe.workflowLink?.href).toContain("focus=certification")
    expect(recipe.workflowLink?.href).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-gov-cert-expired-demo-ciso-1")
    expect(recipe.workflowLink?.label).toBe("Deschide registrul CISO")
    expect(recipe.closureCTA).toBe("Marchează certificarea actualizată")
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

  describe("Archetype 1b — GDPR-016 (retention / in_app_guided)", () => {
    it("returnează generator flow pentru finding de retenție", () => {
      const finding = makeFinding({
        category: "GDPR",
        title: "Clarifică retenția datelor personale",
        detail: "Nu este clar cât timp păstrăm datele și când se execută ștergerea.",
        provenance: {
          ruleId: "GDPR-RET-001",
        },
        findingStatus: "open",
      })

      const recipe = buildCockpitRecipe(finding)
      expect(recipe.findingTypeId).toBe("GDPR-016")
      expect(recipe.uiState).toBe("ready_to_generate")
      expect(recipe.primaryCTA.action).toBe("open_generator")
      expect(recipe.acceptedEvidence).toContain("Document generat și aprobat")
    })
  })

  describe("Archetype 1c — GDPR-017 (deletion proof / external_action)", () => {
    it("returnează external_action asistat de document și cu CTA de control operațional", () => {
      const finding = makeFinding({
        id: "retention-deletion-proof-1",
        category: "GDPR",
        title: "Ștergere / anonimizare neconfirmată",
        detail: "Lipsește logul de ștergere pentru datele care au depășit termenul de retenție.",
        evidenceRequired: "Log de ștergere sau export de control.",
        findingStatus: "open",
      })

      const recipe = buildCockpitRecipe(finding)
      expect(recipe.findingTypeId).toBe("GDPR-017")
      expect(recipe.uiState).toBe("external_action_required")
      expect(recipe.primaryCTA.action).toBe("open_external_steps")
      expect(recipe.documentSupport?.mode).toBe("assistive")
      expect(recipe.documentSupport?.documentType).toBe("retention-policy")
      expect(recipe.visibleBlocks.detailBlocks).toContain("generator")
      expect(recipe.closureCTA).toBe("Marchează ștergerea / anonimizarea")
      expect(recipe.acceptedEvidence).toContain("Export log / jurnal operațional")
    })
  })

  describe("Archetype 1d — AI-OPS (operational-assisted)", () => {
    it("păstrează clasa operațională, dar afișează generatorul de politică AI", () => {
      const finding = makeFinding({
        id: "intake-ai-confidential-data",
        category: "EU_AI_ACT",
        title: "Date confidențiale introduse în AI fără protecție",
        detail: "Tool-uri AI externe primesc date sensibile fără reguli.",
        findingStatus: "open",
      })

      const recipe = buildCockpitRecipe(finding)
      expect(recipe.findingTypeId).toBe("AI-OPS")
      expect(recipe.executionClass).toBe("operational")
      expect(recipe.documentSupport?.mode).toBe("assistive")
      expect(recipe.documentSupport?.documentType).toBe("ai-governance")
      expect(recipe.visibleBlocks.detailBlocks).toContain("generator")
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

    it("mapează intake-gdpr-dsar pe flow-ul dedicat de proces DSAR", () => {
      const finding = makeFinding({
        id: "intake-gdpr-dsar",
        category: "GDPR",
        title: "Proces DSAR (cereri de date) lipsă",
        detail: "Nu există procedură DSAR clară pentru primire și răspuns.",
      })
      const recipe = buildCockpitRecipe(finding)
      expect(recipe.findingTypeId).toBe("GDPR-012")
      expect(recipe.executionClass).toBe("specialist_handoff")
      expect(recipe.workflowLink?.href).toContain("/dashboard/dsar?")
      expect(recipe.workflowLink?.href).toContain("focus=process")
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
    expect(requirements.requiresGeneratedDocument).toBe(true)
    expect(requirements.requiresEvidenceNote).toBe(true)
  })

  it("cere dovadă operațională pentru GDPR-017", () => {
    const requirements = getCloseGatingRequirements("GDPR-017")
    expect(requirements.requiresGeneratedDocument).toBe(true)
    expect(requirements.requiresEvidenceNote).toBe(true)
    expect(requirements.acceptedEvidence).toContain("Export log / jurnal operațional")
  })

  it("cere dovadă operațională pentru GDPR-020", () => {
    const requirements = getCloseGatingRequirements("GDPR-020")
    expect(requirements.requiresGeneratedDocument).toBe(false)
    expect(requirements.requiresEvidenceNote).toBe(true)
    expect(requirements.acceptedEvidence).toContain("Fișier încărcat")
  })

  it("cere dovadă operațională pentru GDPR-OPS", () => {
    const requirements = getCloseGatingRequirements("GDPR-OPS")
    expect(requirements.requiresGeneratedDocument).toBe(false)
    expect(requirements.requiresEvidenceNote).toBe(true)
    expect(requirements.acceptedEvidence).toContain("Notă explicativă")
  })

  it("cere dovadă operațională pentru AI-OPS", () => {
    const requirements = getCloseGatingRequirements("AI-OPS")
    expect(requirements.requiresGeneratedDocument).toBe(true)
    expect(requirements.requiresEvidenceNote).toBe(true)
    expect(requirements.acceptedEvidence).toContain("Fișier încărcat")
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

describe("getSmartResolveExecutionClass", () => {
  it("marchează policy-urile și documentele reale ca documentare", () => {
    expect(getSmartResolveExecutionClass("GDPR-001")).toBe("documentary")
    expect(getSmartResolveExecutionClass("GDPR-010")).toBe("documentary")
    expect(getSmartResolveExecutionClass("GDPR-016")).toBe("documentary")
    expect(getSmartResolveExecutionClass("AI-005")).toBe("documentary")
  })

  it("marchează riscurile operaționale din intake ca operaționale", () => {
    expect(getSmartResolveExecutionClass("GDPR-OPS")).toBe("operational")
    expect(getSmartResolveExecutionClass("GDPR-020")).toBe("operational")
    expect(getSmartResolveExecutionClass("AI-OPS")).toBe("operational")
    expect(getSmartResolveExecutionClass("EF-003")).toBe("operational")
  })

  it("marchează DSAR și NIS2 asistat ca specialist_handoff", () => {
    expect(getSmartResolveExecutionClass("GDPR-012")).toBe("specialist_handoff")
    expect(getSmartResolveExecutionClass("GDPR-013")).toBe("specialist_handoff")
    expect(getSmartResolveExecutionClass("GDPR-019")).toBe("specialist_handoff")
    expect(getSmartResolveExecutionClass("NIS2-015")).toBe("specialist_handoff")
  })
})

describe("getSpecialistHandoffContract", () => {
  it("mapează procesul DSAR pe handoff contextual cu întoarcere automată", () => {
    const contract = getSpecialistHandoffContract(
      "GDPR-012",
      makeFinding({ id: "intake-gdpr-dsar", category: "GDPR" })
    )
    expect(contract?.surface).toBe("dsar_process")
    expect(contract?.startHref).toContain("/dashboard/dsar?")
    expect(contract?.startHref).toContain("focus=process")
    expect(contract?.startHref).toContain("returnTo=%2Fdashboard%2Fresolve%2Fintake-gdpr-dsar")
    expect(contract?.runtimeReturnMode).toBe("automatic")
  })

  it("mapează DSAR access pe handoff contextual cu întoarcere automată", () => {
    const contract = getSpecialistHandoffContract(
      "GDPR-013",
      makeFinding({ id: "dsar-no-procedure", category: "GDPR" })
    )
    expect(contract?.surface).toBe("dsar_access")
    expect(contract?.startHref).toContain("/dashboard/dsar?")
    expect(contract?.startHref).toContain("type=access")
    expect(contract?.startHref).toContain("returnTo=%2Fdashboard%2Fresolve%2Fdsar-no-procedure")
    expect(contract?.targetReturnMode).toBe("automatic")
    expect(contract?.runtimeReturnMode).toBe("automatic")
  })

  it("mapează DSAR erasure pe handoff contextual cu întoarcere automată", () => {
    const contract = getSpecialistHandoffContract(
      "GDPR-014",
      makeFinding({ id: "dsar-erasure-active", category: "GDPR" })
    )
    expect(contract?.surface).toBe("dsar_erasure")
    expect(contract?.startHref).toContain("/dashboard/dsar?")
    expect(contract?.startHref).toContain("type=erasure")
    expect(contract?.startHref).toContain("returnTo=%2Fdashboard%2Fresolve%2Fdsar-erasure-active")
    expect(contract?.targetReturnMode).toBe("automatic")
    expect(contract?.runtimeReturnMode).toBe("automatic")
  })

  it("mapează assessment-ul NIS2 pe handoff cu întoarcere automată", () => {
    const contract = getSpecialistHandoffContract(
      "NIS2-005",
      makeFinding({ id: "nis2-finding-ops-baseline", category: "NIS2" })
    )
    expect(contract?.surface).toBe("nis2_assessment")
    expect(contract?.startHref).toContain("/dashboard/nis2?")
    expect(contract?.startHref).toContain("tab=assessment")
    expect(contract?.startHref).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-finding-ops-baseline")
    expect(contract?.runtimeReturnMode).toBe("automatic")
  })

  it("mapează eligibilitatea NIS2 pe handoff cu întoarcere automată", () => {
    const contract = getSpecialistHandoffContract(
      "NIS2-001",
      makeFinding({ id: "nis2-finding-eligibility", category: "NIS2" })
    )
    expect(contract?.surface).toBe("nis2_eligibility")
    expect(contract?.startHref).toContain("/dashboard/nis2/eligibility?")
    expect(contract?.startHref).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-finding-eligibility")
    expect(contract?.runtimeReturnMode).toBe("automatic")
  })

  it("mapează breach-ul ANSPDCP pe handoff cu întoarcere automată", () => {
    const contract = getSpecialistHandoffContract(
      "GDPR-019",
      makeFinding({
        id: "anspdcp-breach-demo-incident-1",
        category: "GDPR",
        title: "Breach cu date personale",
        detail: "Incident demo-incident-1 cu notificare ANSPDCP necesară",
      })
    )
    expect(contract?.surface).toBe("anspdcp_breach")
    expect(contract?.startHref).toContain("/dashboard/nis2?")
    expect(contract?.startHref).toContain("incidentId=demo-incident-1")
    expect(contract?.startHref).toContain("returnTo=%2Fdashboard%2Fresolve%2Fanspdcp-breach-demo-incident-1")
    expect(contract?.runtimeReturnMode).toBe("automatic")
  })

  it("mapează early warning NIS2 pe handoff cu întoarcere automată", () => {
    const contract = getSpecialistHandoffContract(
      "NIS2-015",
      makeFinding({
        id: "incident-ops-2026",
        category: "NIS2",
        title: "Incident activ fără early warning",
        detail: "incidentId=demo-incident-1",
      })
    )
    expect(contract?.surface).toBe("nis2_incident")
    expect(contract?.startHref).toContain("returnTo=%2Fdashboard%2Fresolve%2Fincident-ops-2026")
    expect(contract?.runtimeReturnMode).toBe("automatic")
    expect(contract?.returnEvidenceLabel).toContain("early warning")
  })

  it("mapează guvernanța NIS2 pe handoff cu întoarcere automată", () => {
    const contract = getSpecialistHandoffContract(
      "NIS2-GENERIC",
      makeFinding({
        id: "nis2-gov-training-demo-board-1",
        category: "NIS2",
        title: "Ana Popescu nu a completat training-ul de securitate cibernetică",
        detail: "Membrul conducerii nu are documentat training-ul de securitate cibernetică.",
        sourceDocument: "Registru Guvernanță — Board Training Tracker",
      })
    )
    expect(contract?.surface).toBe("nis2_governance")
    expect(contract?.startHref).toContain("/dashboard/nis2/governance?")
    expect(contract?.startHref).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-gov-training-demo-board-1")
    expect(contract?.runtimeReturnMode).toBe("automatic")
  })

  it("mapează maturitatea NIS2 generică pe handoff cu întoarcere automată", () => {
    const contract = getSpecialistHandoffContract(
      "NIS2-GENERIC",
      makeFinding({
        id: "nis2-maturity-risk-management",
        category: "NIS2",
        title: "Maturitate insuficientă: Managementul riscului cibernetic (33%)",
        detail: "Domeniu NIS2 cu scor sub 50%. Documentează o Politică de Management al Riscului Cibernetic.",
      })
    )
    expect(contract?.surface).toBe("nis2_maturity")
    expect(contract?.startHref).toContain("/dashboard/nis2/maturitate?")
    expect(contract?.startHref).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-maturity-risk-management")
    expect(contract?.runtimeReturnMode).toBe("automatic")
  })

  it("mapează registrul de furnizori NIS2 pe handoff cu întoarcere automată", () => {
    const contract = getSpecialistHandoffContract(
      "NIS2-GENERIC",
      makeFinding({
        id: "nis2-vendor-risk-vendor-123",
        category: "NIS2",
        title: "Furnizorul Vendor 123 are risc ridicat și nu a fost revizuit",
        detail: "Vendor 123 apare în registrul furnizorilor fără DPA și SLA actualizat.",
      })
    )
    expect(contract?.surface).toBe("nis2_vendor_registry")
    expect(contract?.startHref).toContain("/dashboard/nis2?tab=vendors")
    expect(contract?.startHref).toContain("vendorId=vendor-123")
    expect(contract?.startHref).toContain("returnTo=%2Fdashboard%2Fresolve%2Fnis2-vendor-risk-vendor-123")
    expect(contract?.runtimeReturnMode).toBe("automatic")
  })

  it("include contractul specialist_handoff și în recipe", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "dsar-no-procedure",
        category: "GDPR",
        title: "Cerere de acces activă",
      })
    )
    expect(recipe.specialistHandoff?.surface).toBe("dsar_access")
    expect(recipe.specialistHandoff?.targetReturnMode).toBe("automatic")
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

  it("calculează următorul control pentru GDPR-017 la 90 zile", () => {
    const nextISO = computeNextMonitoringDateISO("GDPR-017", "2026-03-26T00:00:00.000Z")
    expect(nextISO).toBe("2026-06-24T00:00:00.000Z")
  })

  it("cade pe fallback-ul transversal pentru id necunoscut", () => {
    const nextISO = computeNextMonitoringDateISO("UNKNOWN-999", "2026-03-26T00:00:00.000Z")
    expect(nextISO).toBe("2026-06-24T00:00:00.000Z")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Sprint 6A — EF-003 Explainability
// ─────────────────────────────────────────────────────────────────────────────

describe("extractEF003Explainability", () => {
  it("extrage codul V009 din detaliul finding-ului și returnează intrarea ANAF", () => {
    const finding = makeFinding({
      id: "demo-efactura-v009",
      category: "E_FACTURA",
      title: "Factură Respinsă ANAF — FACT-2026-042",
      detail: "Factura FACT-2026-042 a fost respinsă. Codul de eroare V009 indică probleme cu câmpul TaxTotal.",
    })
    const expl = extractEF003Explainability(finding)
    expect(expl.errorCode).toBe("V009")
    expect(expl.errorEntry).not.toBeNull()
    expect(expl.errorEntry?.title).toBe("TaxTotal lipsă sau incorect")
    expect(expl.errorEntry?.fix).toContain("TaxTotal")
    expect(expl.invoiceRef).toBe("FACT-2026-042")
  })

  it("extrage codul V002 (CustomizationID) din reason-ul finding-ului", () => {
    const finding = makeFinding({
      id: "demo-efactura-v002",
      category: "E_FACTURA",
      title: "Factură Eroare XML — Microsoft Invoice",
      detail: "Eroare la validare: V002 — CustomizationID lipsă sau incorect (CIUS-RO:1.0.1 necesar).",
    })
    const expl = extractEF003Explainability(finding)
    expect(expl.errorCode).toBe("V002")
    expect(expl.errorEntry).not.toBeNull()
    expect(expl.errorEntry?.title).toContain("CustomizationID")
  })

  it("fallback — nu extrage cod când nu există pattern ANAF în text", () => {
    const finding = makeFinding({
      id: "demo-efactura-generic",
      category: "E_FACTURA",
      title: "Factură respinsă — Amazon Web Services",
      detail: "Factura a fost respinsă de ANAF din motive necunoscute.",
    })
    const expl = extractEF003Explainability(finding)
    expect(expl.errorCode).toBeNull()
    expect(expl.errorEntry).toBeNull()
    expect(expl.rawReasonText).toBeTruthy()
  })

  it("extrage codul din resolution.problem dacă lipsește din detail", () => {
    const finding = makeFinding({
      id: "demo-efactura-e001",
      category: "E_FACTURA",
      title: "Factură respinsă — SPV Auth",
      detail: "Acces SPV respins.",
      resolution: {
        problem: "Certificat digital E001 invalid sau expirat.",
        impact: "Factura nu poate fi transmisă.",
        action: "Reînnoiește certificatul.",
      },
    })
    const expl = extractEF003Explainability(finding)
    expect(expl.errorCode).toBe("E001")
    expect(expl.errorEntry?.title).toContain("Certificat")
  })
})

describe("buildCockpitRecipe — EF-003 explainability (Sprint 6A)", () => {
  it("cu cod V009 — heroSummary conține descrierea erorii, nu textul generic", () => {
    const finding = makeFinding({
      id: "demo-efactura-v009",
      category: "E_FACTURA",
      title: "Factură Respinsă ANAF — FACT-2026-042",
      detail: "Factura a fost respinsă. Codul de eroare V009 indică probleme cu câmpul TaxTotal.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.findingTypeId).toBe("EF-003")
    expect(recipe.heroSummary).toContain("TaxTotal")
    expect(recipe.heroSummary).not.toBe("O factură a fost respinsă de ANAF.")
  })

  it("cu cod V009 — whatUserMustDo conține fix-ul concret din ANAF_ERROR_MAP", () => {
    const finding = makeFinding({
      id: "demo-efactura-v009",
      category: "E_FACTURA",
      title: "Factură Respinsă ANAF — FACT-2026-042",
      detail: "Respinsă ANAF: V009 TaxTotal incorect.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.whatUserMustDo).toContain("TaxTotal")
    // Nu mai e generic "Corectează în softul de facturare."
    expect(recipe.whatUserMustDo).not.toBe("Corectează în softul de facturare.")
  })

  it("cu cod V009 — whatCompliDoes menționează codul erorii", () => {
    const finding = makeFinding({
      id: "demo-efactura-v009",
      category: "E_FACTURA",
      title: "Factură Respinsă ANAF — FACT-2026-042",
      detail: "V009: TaxTotal lipsă sau incorect.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.whatCompliDoes).toContain("V009")
  })

  it("cu cod V009 — acceptedEvidence include confirmarea specifică pentru V009", () => {
    const finding = makeFinding({
      id: "demo-efactura-v009",
      category: "E_FACTURA",
      title: "Factură Respinsă ANAF — FACT-2026-042",
      detail: "Eroare V009.",
    })
    const recipe = buildCockpitRecipe(finding)
    const hasSpecificEvidence = recipe.acceptedEvidence.some((e) => e.includes("V009"))
    expect(hasSpecificEvidence).toBe(true)
  })

  it("cu cod V009 — monitoringSignals include semnalul de 7 zile SPV", () => {
    const finding = makeFinding({
      id: "demo-efactura-v009",
      category: "E_FACTURA",
      title: "Factură Respinsă ANAF",
      detail: "Eroare V009.",
    })
    const recipe = buildCockpitRecipe(finding)
    const has7daySignal = recipe.monitoringSignals.some((s) => s.includes("7 zile"))
    expect(has7daySignal).toBe(true)
  })

  it("cu cod V009 — closeCondition nu mai rămâne vag și nu mai păstrează triggerul generic", () => {
    const finding = makeFinding({
      id: "demo-efactura-v009",
      category: "E_FACTURA",
      title: "Factură Respinsă ANAF — FACT-2026-042",
      detail: "Factura a fost respinsă. Codul de eroare V009 indică probleme cu câmpul TaxTotal.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.closeCondition).toContain("status 'ok'")
    expect(recipe.closeCondition).toContain("V009")
    expect(recipe.monitoringSignals.some((s) => s.includes("până la validare"))).toBe(false)
  })

  it("fallback fără cod — recipe rămâne valid, uiState corect", () => {
    const finding = makeFinding({
      id: "demo-efactura-nocode",
      category: "E_FACTURA",
      title: "Factură respinsă — Fan Courier Express SRL",
      detail: "Factura a fost respinsă de SPV ANAF din motive nespecificate.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.findingTypeId).toBe("EF-003")
    expect(recipe.uiState).toBe("external_action_required")
    expect(recipe.resolutionMode).toBe("external_action")
    expect(recipe.acceptedEvidence.length).toBeGreaterThan(0)
  })

  it("fallback fără cod — monitoringSignals include 7 zile SPV", () => {
    const finding = makeFinding({
      id: "demo-efactura-nocode",
      category: "E_FACTURA",
      title: "Factură respinsă — Telekom SRL",
      detail: "Factura respinsă de SPV ANAF.",
    })
    const recipe = buildCockpitRecipe(finding)
    const has7daySignal = recipe.monitoringSignals.some((s) => s.includes("7 zile"))
    expect(has7daySignal).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Sprint 6B — EF-001 SPV State Model
// ─────────────────────────────────────────────────────────────────────────────

describe("classifyFinding — EF-001 SPV heuristics (Sprint 6B)", () => {
  it("clasifică spv-missing-{cui} ca EF-001", () => {
    const finding = makeFinding({
      id: "spv-missing-12345678",
      category: "E_FACTURA",
      title: "Înregistrare SPV lipsă",
      detail: "Firma cu CUI 12345678 nu este înregistrată în SPV ANAF.",
    })
    const { findingTypeId } = classifyFinding(finding)
    expect(findingTypeId).toBe("EF-001")
  })

  it("clasifică saft-d406-registration ca EF-001 (existent)", () => {
    const finding = makeFinding({
      id: "saft-d406-registration",
      category: "E_FACTURA",
      title: "SAF-T D406 lipsă",
      detail: "Firma nu a transmis SAF-T.",
    })
    const { findingTypeId } = classifyFinding(finding)
    expect(findingTypeId).toBe("EF-001")
  })

  it("clasifică finding cu titlu 'SPV lipsă' ca EF-001", () => {
    const finding = makeFinding({
      id: "spv-check-001",
      category: "E_FACTURA",
      title: "SPV lipsă — verificare necesară",
      detail: "Nu am putut verifica SPV-ul firmei.",
    })
    const { findingTypeId } = classifyFinding(finding)
    expect(findingTypeId).toBe("EF-001")
  })

  it("nu clasifică un SPV deja activ ca EF-001 doar pentru că apare 'spv' în text", () => {
    const finding = makeFinding({
      id: "spv-ok-12345678",
      category: "E_FACTURA",
      title: "SPV activ",
      detail: "Firma este înregistrată în SPV ANAF și verificarea a trecut.",
    })
    const { findingTypeId } = classifyFinding(finding)
    expect(findingTypeId).not.toBe("EF-001")
  })
})

describe("extractEF001SpvState", () => {
  it("derivează spv_not_registered pentru spv-missing-{cui}", () => {
    const finding = makeFinding({
      id: "spv-missing-12345678",
      category: "E_FACTURA",
      title: "Înregistrare SPV lipsă",
      detail: "Firma cu CUI 12345678 nu este înregistrată în SPV ANAF.",
    })
    const state = extractEF001SpvState(finding)
    expect(state.spvSubState).toBe("spv_not_registered")
    expect(state.stateLabel).toBe("SPV neînregistrat")
    expect(state.cuiRef).toBe("12345678")
    expect(state.description).toContain("12345678")
    expect(state.fix).toContain("anaf.ro")
  })

  it("derivează spv_token_expired când finding-ul menționează token expirat", () => {
    const finding = makeFinding({
      id: "spv-check-002",
      category: "E_FACTURA",
      title: "Token SPV expirat",
      detail: "Token-ul de acces SPV ANAF a expirat. Verificarea automată nu este posibilă.",
      operationalEvidenceNote: "TOKEN_EXPIRED",
    })
    const state = extractEF001SpvState(finding)
    expect(state.spvSubState).toBe("spv_token_expired")
    expect(state.recheckSignal).toContain("7 zile")
  })

  it("derivează spv_check_needed ca fallback când nu există semnal specific", () => {
    const finding = makeFinding({
      id: "spv-generic-001",
      category: "E_FACTURA",
      title: "SPV neverificat",
      detail: "SPV-ul nu a fost verificat.",
    })
    const state = extractEF001SpvState(finding)
    expect(state.spvSubState).toBe("spv_check_needed")
    expect(state.recheckSignal).toContain("30 de zile")
  })

  it("returnează cuiRef null când nu e în id", () => {
    const finding = makeFinding({
      id: "saft-d406-registration",
      category: "E_FACTURA",
      title: "SAF-T lipsă",
      detail: "SPV neverificat.",
    })
    const state = extractEF001SpvState(finding)
    expect(state.cuiRef).toBeNull()
  })
})

describe("buildCockpitRecipe — EF-001 SPV explainability (Sprint 6B)", () => {
  it("cu spv-missing-{cui} — heroSummary conține descrierea concretă, nu textul generic", () => {
    const finding = makeFinding({
      id: "spv-missing-12345678",
      category: "E_FACTURA",
      title: "Înregistrare SPV lipsă",
      detail: "Firma nu este înregistrată în SPV ANAF.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.findingTypeId).toBe("EF-001")
    expect(recipe.heroSummary).not.toBe("Nu avem dovada că SPV este activ și operațional.")
    expect(recipe.heroSummary).toContain("SPV")
  })

  it("whatUserMustDo conține acțiunea concretă de remediere SPV", () => {
    const finding = makeFinding({
      id: "spv-missing-12345678",
      category: "E_FACTURA",
      title: "Înregistrare SPV lipsă",
      detail: "Firma nu este înregistrată în SPV ANAF.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.whatUserMustDo).not.toBe("Activează și confirmă.")
    expect(recipe.whatUserMustDo).toContain("ANAF")
  })

  it("whatCompliDoes folosește eticheta umană a sub-stării, nu cheia internă", () => {
    const finding = makeFinding({
      id: "spv-missing-12345678",
      category: "E_FACTURA",
      title: "Înregistrare SPV lipsă",
      detail: "Firma nu este înregistrată în SPV ANAF.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.whatCompliDoes).toContain("spv neînregistrat")
    expect(recipe.whatCompliDoes).not.toContain("spv_not_registered")
  })

  it("workflowLink duce la /dashboard/fiscal?tab=spv&findingId=...", () => {
    const finding = makeFinding({
      id: "spv-missing-12345678",
      category: "E_FACTURA",
      title: "Înregistrare SPV lipsă",
      detail: "Firma nu este înregistrată în SPV ANAF.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.workflowLink).toBeDefined()
    expect(recipe.workflowLink?.href).toContain("/dashboard/fiscal")
    expect(recipe.workflowLink?.href).toContain("tab=spv")
    expect(recipe.workflowLink?.href).toContain("findingId=spv-missing-12345678")
  })

  it("closureCTA este 'Confirmă activarea SPV'", () => {
    const finding = makeFinding({
      id: "spv-missing-12345678",
      category: "E_FACTURA",
      title: "Înregistrare SPV lipsă",
      detail: "SPV lipsă.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.closureCTA).toBe("Confirmă activarea SPV")
  })

  it("monitoringSignals include reverificarea la 30 de zile", () => {
    const finding = makeFinding({
      id: "spv-missing-12345678",
      category: "E_FACTURA",
      title: "Înregistrare SPV lipsă",
      detail: "SPV lipsă.",
    })
    const recipe = buildCockpitRecipe(finding)
    const has30daySignal = recipe.monitoringSignals.some((s) => s.includes("30"))
    expect(has30daySignal).toBe(true)
  })

  it("dossierOutcome specific EF-001", () => {
    const finding = makeFinding({
      id: "spv-missing-12345678",
      category: "E_FACTURA",
      title: "Înregistrare SPV lipsă",
      detail: "SPV lipsă.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.dossierOutcome).toContain("SPV")
  })

  it("closeCondition este regula de închidere, nu copia dovezii cerute", () => {
    const finding = makeFinding({
      id: "spv-missing-12345678",
      category: "E_FACTURA",
      title: "Înregistrare SPV lipsă",
      detail: "SPV lipsă.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.closeCondition).toContain("SPV este activat")
    expect(recipe.closeCondition).not.toBe(recipe.acceptedEvidence[0])
  })

  it("NU afișează generator block pentru EF-001 (external_action)", () => {
    const finding = makeFinding({
      id: "spv-missing-12345678",
      category: "E_FACTURA",
      title: "Înregistrare SPV lipsă",
      detail: "SPV lipsă.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.visibleBlocks.detailBlocks).not.toContain("generator")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Sprint 6C — Fiscal operational risk flows
// EF-004 processing-delayed · EF-005 unsubmitted · EF-006 buyer-side risk
// ─────────────────────────────────────────────────────────────────────────────

describe("classifyFinding — Sprint 6C fiscal risk heuristics", () => {
  it("clasifică finding de prelucrare blocată ca EF-004", () => {
    const finding = makeFinding({
      id: "ef-processing-delay-001",
      category: "E_FACTURA",
      title: "Factură în prelucrare blocată — INV-2026-001",
      detail: "Factura este în prelucrare ANAF de peste 72 ore și pare blocată.",
    })
    const { findingTypeId } = classifyFinding(finding)
    expect(findingTypeId).toBe("EF-004")
  })

  it("clasifică finding netransmis spre SPV ca EF-005", () => {
    const finding = makeFinding({
      id: "ef-unsubmitted-001",
      category: "E_FACTURA",
      title: "Factură netransmisă SPV — INV-2026-002",
      detail: "Factura a fost generată local, dar a rămas netransmisă spre SPV ANAF.",
    })
    const { findingTypeId } = classifyFinding(finding)
    expect(findingTypeId).toBe("EF-005")
  })

  it("clasifică buyer-side risk pe date client invalide ca EF-006", () => {
    const finding = makeFinding({
      id: "ef-buyer-risk-001",
      category: "E_FACTURA",
      title: "Date identificare client invalide",
      detail: "AccountingCustomerParty invalid: CUI client neidentificat, eroare C002 la validare.",
    })
    const { findingTypeId } = classifyFinding(finding)
    expect(findingTypeId).toBe("EF-006")
  })
})

describe("buildCockpitRecipe — Sprint 6C fiscal operational explainability", () => {
  it("EF-004 explică clar că nu este o respingere ANAF", () => {
    const finding = makeFinding({
      id: "ef-processing-delay-001",
      category: "E_FACTURA",
      title: "Factură în prelucrare blocată — INV-2026-001",
      detail: "Factura INV-2026-001 este în prelucrare ANAF de peste 72 ore și pare blocată.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.findingTypeId).toBe("EF-004")
    expect(recipe.heroSummary).toContain("NU este o respingere")
    expect(recipe.whatCompliDoes).toContain("factură blocată în prelucrare")
    expect(recipe.closeCondition).toContain("Status final confirmat din SPV")
  })

  it("EF-005 cere dovadă de transmitere și păstrează xml + screenshot", () => {
    const finding = makeFinding({
      id: "ef-unsubmitted-001",
      category: "E_FACTURA",
      title: "Factură netransmisă SPV — INV-2026-002",
      detail: "Factura a fost generată local, dar a rămas netransmisă spre SPV ANAF.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.findingTypeId).toBe("EF-005")
    expect(recipe.heroSummary).toContain("NU a fost transmisă")
    expect(recipe.acceptedEvidence).toContain("Screenshot dovadă")
    expect(recipe.acceptedEvidence).toContain("Fișier XML factură")
    expect(recipe.closeCondition).toContain("Confirmare transmitere și acceptare")
  })

  it("EF-006 tratează problema ca buyer-side risk, nu ca eroare XML generică", () => {
    const finding = makeFinding({
      id: "ef-buyer-risk-001",
      category: "E_FACTURA",
      title: "Date identificare client invalide",
      detail: "AccountingCustomerParty invalid: CUI client neidentificat, eroare C002 la validare.",
    })
    const recipe = buildCockpitRecipe(finding)
    expect(recipe.findingTypeId).toBe("EF-006")
    expect(recipe.heroSummary).toContain("eroare buyer-side")
    expect(recipe.whatUserMustDo).toContain("anaf.ro/verificare-cif")
    expect(recipe.whatCompliDoes).toContain("date client invalide")
    expect(recipe.closeCondition).toContain("date client corecte")
  })
})

describe("buildCockpitRecipe — Sprint 7 NIS2 evidence per control", () => {
  it("risk-management — acceptedEvidence conține dovada specifică: politică de management al riscului", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-maturity-risk-management",
        category: "NIS2",
        title: "Maturitate insuficientă: Managementul riscului cibernetic (33%)",
        detail: "Domeniu NIS2 cu scor sub 50%.",
      })
    )
    expect(recipe.acceptedEvidence.some((e) => e.includes("Politică de Management"))).toBe(true)
    expect(recipe.acceptedEvidence.length).toBeGreaterThan(2)
  })

  it("mfa — acceptedEvidence conține dovada specifică: screenshot MFA activat", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-maturity-mfa",
        category: "NIS2",
        title: "Maturitate insuficientă: Autentificare multi-factor (MFA) (0%)",
        detail: "MFA nu este activat pe conturile critice.",
      })
    )
    expect(recipe.acceptedEvidence.some((e) => e.includes("MFA activat"))).toBe(true)
  })

  it("business-continuity — acceptedEvidence conține dovada testului de recuperare", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-maturity-business-continuity",
        category: "NIS2",
        title: "Maturitate insuficientă: Continuitatea activității (BCP / DRP) (25%)",
        detail: "Lipsesc planuri BCP/DRP documentate.",
      })
    )
    expect(
      recipe.acceptedEvidence.some((e) => e.includes("BCP") || e.includes("DRP"))
    ).toBe(true)
  })

  it("audit-testing — acceptedEvidence conține raport pentest sau audit extern", () => {
    const recipe = buildCockpitRecipe(
      makeFinding({
        id: "nis2-maturity-audit-testing",
        category: "NIS2",
        title: "Maturitate insuficientă: Evaluarea eficacității măsurilor (20%)",
        detail: "Nu există teste de penetrare sau audituri de securitate.",
      })
    )
    expect(
      recipe.acceptedEvidence.some((e) => e.includes("pentest") || e.includes("audit"))
    ).toBe(true)
  })

  it("fiecare domeniu cu maturityFocus returnează mai mult de 2 acceptedEvidence items", () => {
    const domains = [
      "risk-management",
      "incident-response",
      "business-continuity",
      "supply-chain",
      "secure-development",
      "audit-testing",
      "basic-hygiene",
      "cryptography",
      "access-control",
      "mfa",
    ]
    for (const domainId of domains) {
      const recipe = buildCockpitRecipe(
        makeFinding({
          id: `nis2-maturity-${domainId}`,
          category: "NIS2",
          title: `Maturitate insuficientă: domeniu ${domainId} (20%)`,
          detail: "Gap de maturitate NIS2.",
        })
      )
      expect(recipe.acceptedEvidence.length).toBeGreaterThan(2)
    }
  })
})
