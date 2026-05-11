import { describe, expect, it } from "vitest"

import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import { computeDashboardSummary } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import {
  buildDemoPortfolioClientStates,
  buildDemoNis2State,
  buildDemoState,
  DEMO_SCENARIOS,
} from "@/lib/server/demo-seed"
import {
  buildPortfolioTaskRows,
  buildPortfolioVendorRows,
  type PortfolioOrgBundle,
} from "@/lib/server/portfolio"

describe("demo revalidation scenario", () => {
  it("include scenariul revalidation în lista demo publică", () => {
    expect(DEMO_SCENARIOS).toContain("revalidation")
  })

  it("seed-uiește un finding SYS-002 cu flow needs_revalidation", () => {
    const state = buildDemoState("revalidation")
    const finding = state.findings.find((item) => item.id === "demo-review-1")

    expect(finding).toBeDefined()
    expect(finding?.title).toContain("necesită revalidare")
    expect(finding?.findingStatus).toBe("open")

    const recipe = buildCockpitRecipe(finding!)
    expect(recipe.findingTypeId).toBe("SYS-002")
    expect(recipe.resolveFlowState).toBe("needs_revalidation")
  })

  it("nu încearcă să seed-uiască state NIS2 separat pentru revalidation", () => {
    expect(buildDemoNis2State("revalidation")).toBeNull()
  })
})

describe("demo DPO consultant scenario", () => {
  it("include scenariul dpo-consultant în lista demo publică", () => {
    expect(DEMO_SCENARIOS).toContain("dpo-consultant")
  })

  it("seed-uiește 3 clienți fictivi cu findings DPO reale", () => {
    const clients = buildDemoPortfolioClientStates("dpo-consultant")

    expect(clients.map((client) => client.orgName)).toEqual([
      "Apex Logistic SRL",
      "Lumen Clinic SRL",
      "Cobalt Fintech IFN",
    ])

    expect(clients.flatMap((client) => client.state.findings)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "apex-gdpr-dpa-stripe",
          legalReference: "GDPR Art. 28",
        }),
        expect.objectContaining({
          id: "lumen-dsar-overdue",
          severity: "critical",
        }),
        expect.objectContaining({
          id: "cobalt-gdpr-credit-dpia",
          legalReference: "GDPR Art. 22 + Art. 35",
        }),
      ])
    )
  })

  it("include o dovadă validată pentru aprobarea DPA Apex × Stripe", () => {
    const apex = buildDemoPortfolioClientStates("dpo-consultant").find(
      (client) => client.orgName === "Apex Logistic SRL"
    )

    expect(apex).toBeDefined()
    expect(apex?.state.generatedDocuments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "apex-doc-dpa-stripe",
          adoptionStatus: "signed",
          approvalStatus: "approved_as_evidence",
        }),
      ])
    )
    expect(apex?.state.taskState["document-approval-apex-doc-dpa-stripe"]).toEqual(
      expect.objectContaining({
        status: "done",
        validationStatus: "passed",
        attachedEvidenceMeta: expect.objectContaining({
          quality: expect.objectContaining({ status: "sufficient" }),
        }),
      })
    )
  })

  it("seed-uiește cererea DSAR Lumen în store-ul dedicat, nu doar ca alertă", () => {
    const lumen = buildDemoPortfolioClientStates("dpo-consultant").find(
      (client) => client.orgName === "Lumen Clinic SRL"
    )

    expect(lumen?.dsarState?.requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "dsar-lumen-patient-overdue",
          status: "in_progress",
          deadlineISO: "2026-04-24T08:30:00.000Z",
          draftResponseGenerated: true,
        }),
      ])
    )
  })

  it("populează task-uri și furnizori cross-client pentru browser demo", () => {
    const bundles = buildDemoPortfolioClientStates("dpo-consultant").map((client, index) => {
      const orgId = `org-demo-client-${index}`
      return {
        membership: {
          membershipId: `membership-${index}`,
          orgId,
          orgName: client.orgName,
          role: "partner_manager",
          status: "active",
          createdAtISO: "2026-04-28T10:00:00.000Z",
        },
        state: client.state,
        summary: computeDashboardSummary(client.state),
        remediationPlan: buildRemediationPlan(client.state),
        nis2: { assessment: null, vendors: [], incidents: [], boardMembers: [], updatedAtISO: "2026-04-28T10:00:00.000Z" },
        vendorReviews: [],
        dsar: client.dsarState ?? { requests: [], updatedAtISO: "2026-04-28T10:00:00.000Z" },
      } satisfies PortfolioOrgBundle
    })

    const tasks = buildPortfolioTaskRows(bundles)
    const vendors = buildPortfolioVendorRows(bundles)

    expect(tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orgName: "Lumen Clinic SRL",
          taskId: "lumen-dsar-overdue",
          dueDate: "2026-04-24",
        }),
      ])
    )
    expect(vendors.map((vendor) => vendor.vendorName)).toEqual(
      expect.arrayContaining(["Stripe Payments Europe", "PayFlow HR / Payroll Cloud"])
    )
  })
})
