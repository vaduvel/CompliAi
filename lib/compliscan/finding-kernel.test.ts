import { describe, expect, it } from "vitest"

import type { ScanFinding } from "@/lib/compliance/types"
import {
  buildCockpitRecipe,
  getCloseGatingRequirements,
  getRuntimeSuggestedDocumentType,
} from "@/lib/compliscan/finding-kernel"

const AI_POLICY_FINDING: ScanFinding = {
  id: "intake-ai-missing-policy",
  title: "Politică de utilizare AI lipsă",
  detail:
    "AI Act Art.4 impune alfabetizare AI. Fără politică internă, angajații folosesc AI fără reguli.",
  category: "EU_AI_ACT",
  severity: "high",
  risk: "high",
  principles: [],
  createdAtISO: "2026-03-27T10:00:00.000Z",
  sourceDocument: "intake-questionnaire",
  suggestedDocumentType: "ai-governance",
}

describe("finding-kernel AI document flows", () => {
  it("keeps document-backed AI findings on the cockpit generator path", () => {
    const recipe = buildCockpitRecipe({
      ...AI_POLICY_FINDING,
      findingStatus: "open",
    })

    expect(recipe.findingTypeId).toBe("AI-005")
    expect(recipe.visibleBlocks.detailBlocks).toContain("generator")
    expect(recipe.visibleBlocks.aboveTheFoldBlocks).toContain("generator")
    expect(recipe.primaryCTA.action).toBe("confirm_and_generate")
    expect(getCloseGatingRequirements(recipe.findingTypeId).requiresGeneratedDocument).toBe(true)
  })

  it("keeps ROPA findings on the generator path from open state", () => {
    const recipe = buildCockpitRecipe({
      id: "intake-gdpr-ropa-missing",
      title: "Registru de prelucrări lipsă",
      detail: "Compania procesează date personale, dar nu are registru Art. 30.",
      category: "GDPR",
      severity: "high",
      risk: "high",
      principles: [],
      createdAtISO: "2026-03-27T10:00:00.000Z",
      sourceDocument: "intake-questionnaire",
      suggestedDocumentType: "ropa",
      findingStatus: "open",
    })

    expect(recipe.findingTypeId).toBe("GDPR-004")
    expect(recipe.visibleBlocks.detailBlocks).toContain("generator")
    expect(recipe.visibleBlocks.aboveTheFoldBlocks).toContain("generator")
    expect(recipe.resolveFlowState).toBe("ready_to_generate")
    expect(recipe.primaryCTA.action).toBe("open_generator")
    expect(getCloseGatingRequirements(recipe.findingTypeId).requiresGeneratedDocument).toBe(true)
  })

  it("corectează retention findings la retention-policy pentru runtime truth", () => {
    const retentionFinding: ScanFinding = {
      id: "finding-retention",
      title: "Lipsa justificării perioadei de retenție",
      detail: "Nu este clar cât timp păstrăm datele și când se execută ștergerea.",
      category: "GDPR",
      severity: "medium",
      risk: "low",
      principles: [],
      createdAtISO: "2026-03-27T10:00:00.000Z",
      sourceDocument: "scan.pdf",
      provenance: { ruleId: "GDPR-RET-001" },
      suggestedDocumentType: "privacy-policy",
    }

    expect(getRuntimeSuggestedDocumentType(retentionFinding)).toBe("retention-policy")
  })
})
