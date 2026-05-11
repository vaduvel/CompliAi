import { describe, expect, it } from "vitest"

import {
  buildDpoSecurityContractualPack,
  renderDpoSecurityContractualPackMarkdown,
} from "@/lib/server/dpo-security-contractual-pack"

describe("dpo-security-contractual-pack", () => {
  it("include documentele si controalele cerute pentru migratie DPO", () => {
    const pack = buildDpoSecurityContractualPack({
      cabinetOrgId: "org-dpo",
      cabinetName: "DPO Complet SRL",
      consultantEmail: "diana@dpocomplet.ro",
      consultantRole: "partner_manager",
      generatedAtISO: "2026-04-28T10:00:00.000Z",
      appUrl: "https://app.compliscan.ro",
    })

    expect(pack.meta.cabinetName).toBe("DPO Complet SRL")
    expect(pack.contractualDocuments.map((doc) => doc.id)).toEqual(
      expect.arrayContaining([
        "dpa-controller-processor",
        "subprocessors-list",
        "security-brief",
        "ai-processing-brief",
      ])
    )
    expect(pack.contractualDocuments.find((doc) => doc.id === "dpa-controller-processor")?.status).toBe(
      "signature_ready"
    )
    expect(pack.subprocessors.map((item) => item.name)).toEqual(
      expect.arrayContaining(["Vercel", "Supabase", "Resend", "Mistral AI", "Google Gemini"])
    )
    expect(pack.subprocessors.every((item) => item.exactProvider && item.dataProcessed)).toBe(true)
    expect(pack.subprocessors.find((item) => item.name === "Supabase")?.region).toContain("Frankfurt")
    expect(pack.productionStorage.backend).toBe("supabase_production")
    expect(pack.legalTerms.map((term) => term.id)).toEqual(
      expect.arrayContaining([
        "dpa-signable-terms",
        "retention-deletion-terms",
        "incident-response-terms",
        "ai-processing-terms",
      ])
    )
    expect(pack.evidenceDeletionPolicy.permanentDelete).toContain("owner")
    expect(pack.securityControls.map((control) => control.id)).toEqual(
      expect.arrayContaining([
        "rbac",
        "audit-trail",
        "evidence-ledger",
        "evidence-delete-hardening",
        "exports",
        "ai-off",
        "baseline",
      ])
    )
    expect(pack.permissionMatrix.some((row) => row.action === "validate_baseline")).toBe(true)
    expect(pack.aiAssurance.aiMode).toBe("configurable_on_off")
  })

  it("randarea markdown este client-safe si contine checklistul de pilot", () => {
    const pack = buildDpoSecurityContractualPack({
      cabinetOrgId: "org-dpo",
      cabinetName: "DPO Complet SRL",
      consultantEmail: "diana@dpocomplet.ro",
      consultantRole: "partner_manager",
      generatedAtISO: "2026-04-28T10:00:00.000Z",
    })
    const markdown = renderDpoSecurityContractualPackMarkdown(pack)

    expect(markdown).toContain("DPO Migration Confidence Pack")
    expect(markdown).toContain("DPA CompliScan ↔ cabinet DPO")
    expect(markdown).toContain("Storage production")
    expect(markdown).toContain("Evidence delete policy")
    expect(markdown).toContain("Mistral AI")
    expect(markdown).toContain("Matrice RBAC")
    expect(markdown).toContain("- [ ] DPA CompliScan")
    expect(markdown).not.toContain("CompliAI")
    expect(markdown).not.toContain("draft_for_review")
  })
})
