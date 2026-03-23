import { describe, expect, it } from "vitest"

import {
  buildPortfolioAlertRows,
  buildPortfolioOverviewRows,
  buildPortfolioReportRows,
  buildPortfolioTaskRows,
  buildPortfolioVendorRows,
} from "@/lib/server/portfolio"

describe("lib/server/portfolio", () => {
  const baseBundle: Parameters<typeof buildPortfolioOverviewRows>[0][number] = {
    membership: {
      membershipId: "m-1",
      orgId: "org-1",
      orgName: "Acme SRL",
      role: "partner_manager",
      createdAtISO: "2026-03-20T10:00:00.000Z",
      status: "active",
    },
    summary: {
      score: 61,
      riskLabel: "Risc Mediu",
      riskColor: "amber",
      redAlerts: 1,
      yellowAlerts: 1,
      openAlerts: 2,
    },
    state: {
      scannedDocuments: 4,
      gdprProgress: 74,
      highRisk: 2,
      efacturaConnected: true,
      alerts: [
        {
          id: "alert-critical",
          message: "Finding critic AI",
          severity: "critical",
          open: true,
          createdAtISO: "2026-03-22T10:00:00.000Z",
          findingId: "finding-critical",
        },
        {
          id: "alert-medium",
          message: "Avertisment GDPR",
          severity: "medium",
          open: true,
          createdAtISO: "2026-03-21T10:00:00.000Z",
          findingId: "finding-gdpr",
        },
      ],
      findings: [
        {
          id: "finding-critical",
          severity: "critical",
          category: "EU_AI_ACT",
          findingStatus: "open",
          title: "AI critic",
          detail: "detaliu",
        },
        {
          id: "finding-high-dismissed",
          severity: "high",
          category: "GDPR",
          findingStatus: "dismissed",
          title: "dismissed",
          detail: "detaliu",
        },
        {
          id: "finding-gdpr",
          severity: "medium",
          category: "GDPR",
          findingStatus: "open",
          title: "GDPR",
          detail: "detaliu",
        },
      ],
      scans: [
        {
          id: "scan-1",
          documentName: "doc-1",
          contentPreview: "",
          createdAtISO: "2026-03-22T08:00:00.000Z",
          findingsCount: 2,
        },
      ],
      generatedDocuments: [
        {
          id: "doc-1",
          documentType: "privacy-policy",
          title: "Politică GDPR",
          generatedAtISO: "2026-03-22T11:00:00.000Z",
          llmUsed: true,
        },
      ],
      taskState: {
        "high-risk-flow": {
          status: "todo",
          updatedAtISO: "2026-03-22T10:30:00.000Z",
        },
        "baseline-maintenance": {
          status: "todo",
          updatedAtISO: "2026-03-22T10:40:00.000Z",
        },
      },
    },
    remediationPlan: [
      {
        id: "high-risk-flow",
        title: "Flux high-risk",
        priority: "P1",
        severity: "high",
        owner: "Legal",
        evidence: "Procedură aprobată",
      },
      {
        id: "baseline-maintenance",
        title: "Baseline",
        priority: "P3",
        severity: "low",
        owner: "Ops",
        evidence: "Review periodic",
      },
    ],
    nis2: {
      assessment: { score: 80 },
      dnscRegistrationStatus: "not-started",
      vendors: [
        {
          id: "vendor-1",
          name: "Cloudify",
          cui: "RO123",
          service: "cloud",
          riskLevel: "high",
          hasSecurityClause: true,
          hasIncidentNotification: true,
          hasAuditRight: false,
          notes: "",
          createdAtISO: "2026-03-20T10:00:00.000Z",
          updatedAtISO: "2026-03-20T10:00:00.000Z",
        },
      ],
    },
    vendorReviews: [
      {
        id: "review-1",
        vendorId: "vendor-1",
        vendorName: "Cloudify",
        status: "needs-context",
        urgency: "critical",
        category: "cloud",
        confidence: "high",
        detectionSource: "vendor-registry",
        createdAtISO: "2026-03-22T09:00:00.000Z",
        updatedAtISO: "2026-03-22T09:00:00.000Z",
      },
    ],
  }

  it("construiește overview rows cu finding-uri critice și taskuri active", () => {
    const rows = buildPortfolioOverviewRows([baseBundle])

    expect(rows[0]?.compliance).toEqual(
      expect.objectContaining({
        criticalFindings: 1,
        totalTasks: 1,
        lastScanAtISO: "2026-03-22T08:00:00.000Z",
      })
    )
  })

  it("construiește alert rows sortate și cu framework derivat", () => {
    const rows = buildPortfolioAlertRows([baseBundle])

    expect(rows).toHaveLength(2)
    expect(rows[0]?.alertId).toBe("alert-critical")
    expect(rows[0]?.framework).toBe("AI Act")
    expect(rows[1]?.framework).toBe("GDPR")
  })

  it("exclude baseline-maintenance din taskurile de portofoliu", () => {
    const rows = buildPortfolioTaskRows([baseBundle])

    expect(rows).toHaveLength(1)
    expect(rows[0]?.taskId).toBe("high-risk-flow")
  })

  it("dedupează vendorii pe CUI sau nume și cumulează review-urile", () => {
    const rows = buildPortfolioVendorRows([
      baseBundle,
      {
        ...baseBundle,
        membership: {
          ...baseBundle.membership,
          membershipId: "m-2",
          orgId: "org-2",
          orgName: "Beta SRL",
        },
        nis2: {
          ...baseBundle.nis2,
          vendors: [
            {
              ...baseBundle.nis2.vendors[0],
              id: "vendor-2",
            },
          ],
        },
        vendorReviews: [],
      },
    ])

    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual(
      expect.objectContaining({
        orgCount: 2,
        openReviews: 1,
        highestRisk: "critical",
      })
    )
  })

  it("rezumă metadata de raportare per org", () => {
    const rows = buildPortfolioReportRows([baseBundle])

    expect(rows[0]).toEqual(
      expect.objectContaining({
        generatedDocumentsCount: 1,
        latestGeneratedTitle: "Politică GDPR",
        openAlerts: 2,
      })
    )
  })
})
