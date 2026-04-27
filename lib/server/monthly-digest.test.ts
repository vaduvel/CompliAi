import { describe, expect, it } from "vitest"

import {
  buildMonthlyActivitySummary,
  buildMonthlyDigestEmail,
  type MonthlyDigest,
} from "@/lib/server/monthly-digest"
import type { ComplianceState } from "@/lib/compliance/types"

function createState(overrides?: Partial<ComplianceState>): ComplianceState {
  return {
    highRisk: 0,
    lowRisk: 0,
    gdprProgress: 80,
    efacturaSyncedAtISO: "",
    efacturaConnected: false,
    efacturaSignalsCount: 0,
    scannedDocuments: 0,
    alerts: [],
    findings: [],
    scans: [],
    generatedDocuments: [],
    chat: [],
    taskState: {},
    aiComplianceFieldOverrides: {},
    traceabilityReviews: {},
    aiSystems: [],
    detectedAISystems: [],
    efacturaValidations: [],
    driftRecords: [],
    driftSettings: { severityOverrides: {} },
    snapshotHistory: [],
    events: [],
    ...overrides,
  }
}

describe("monthly digest", () => {
  it("agrega activitatea reala din documente, magic links, dovezi, findings si baseline", () => {
    const generatedAtISO = "2026-04-27T12:00:00.000Z"
    const state = createState({
      generatedDocuments: [
        {
          id: "doc-1",
          documentType: "dpa",
          title: "DPA Stripe",
          generatedAtISO: "2026-04-20T10:00:00.000Z",
          llmUsed: true,
          adoptionStatus: "signed",
          adoptionUpdatedAtISO: "2026-04-21T10:00:00.000Z",
          shareComments: [
            {
              id: "comment-1",
              authorName: "Mihai",
              comment: "Ok cu modificari minore.",
              recipientType: "partner",
              createdAtISO: "2026-04-21T09:00:00.000Z",
              channel: "public_magic_link",
            },
          ],
        },
        {
          id: "doc-old",
          documentType: "privacy-policy",
          title: "Old policy",
          generatedAtISO: "2026-02-01T10:00:00.000Z",
          llmUsed: true,
        },
      ],
      taskState: {
        "document-approval-doc-1": {
          status: "done",
          updatedAtISO: "2026-04-21T10:00:00.000Z",
          validationStatus: "passed",
          validatedAtISO: "2026-04-21T10:00:00.000Z",
          attachedEvidenceMeta: {
            id: "evidence-doc-1",
            fileName: "client-approval-doc-1.json",
            mimeType: "application/json",
            sizeBytes: 420,
            uploadedAtISO: "2026-04-21T10:00:00.000Z",
            kind: "document_bundle",
            quality: {
              status: "sufficient",
              summary: "Aprobare capturata.",
              reasonCodes: [],
              checkedAtISO: "2026-04-21T10:00:00.000Z",
            },
          },
        },
      },
      findings: [
        {
          id: "finding-1",
          title: "DPA lipsa",
          detail: "Vendor fara DPA.",
          category: "GDPR",
          severity: "high",
          risk: "high",
          principles: ["privacy_data_governance"],
          createdAtISO: "2026-04-01T10:00:00.000Z",
          sourceDocument: "vendor-list.xlsx",
          findingStatus: "resolved",
          findingStatusUpdatedAtISO: "2026-04-22T10:00:00.000Z",
        },
      ],
      events: [
        {
          id: "evt-1",
          type: "document.shared_approved",
          entityType: "system",
          entityId: "doc-1",
          message: "Document aprobat.",
          createdAtISO: "2026-04-21T10:00:00.000Z",
        },
        {
          id: "evt-2",
          type: "baseline.set",
          entityType: "drift",
          entityId: "snap-1",
          message: "Baseline validat.",
          createdAtISO: "2026-04-23T10:00:00.000Z",
        },
      ],
    })

    const activity = buildMonthlyActivitySummary({ state, generatedAtISO })

    expect(activity.documentsGenerated).toBe(1)
    expect(activity.documentsSent).toBe(1)
    expect(activity.magicLinksApproved).toBe(1)
    expect(activity.magicLinkComments).toBe(1)
    expect(activity.validatedEvidenceItems).toBe(1)
    expect(activity.findingsClosed).toBe(1)
    expect(activity.baselineValidated).toBe(true)
  })

  it("include sectiunea de activitate reala si branding CompliScan in email", () => {
    const digest: MonthlyDigest = {
      orgName: "Apex Logistic SRL",
      emailAddress: "diana@dpocomplet.ro",
      event: null,
      statusItems: [{ label: "Conformitate GDPR", ok: true, detail: "80%" }],
      activity: {
        periodStartISO: "2026-03-27T12:00:00.000Z",
        periodEndISO: "2026-04-27T12:00:00.000Z",
        documentsGenerated: 2,
        documentsSent: 1,
        magicLinksApproved: 1,
        magicLinksRejected: 0,
        magicLinkComments: 1,
        validatedEvidenceItems: 3,
        findingsClosed: 1,
        baselineValidated: true,
      },
      currentScore: 82,
      openFindings: 0,
      ctaHref: "/dashboard",
      ctaLabel: "Deschide dashboard",
      appBaseUrl: "https://app.compliscan.ro",
      generatedAt: "2026-04-27T12:00:00.000Z",
    }

    const html = buildMonthlyDigestEmail(digest)

    expect(html).toContain("CompliScan")
    expect(html).toContain("Activitate reală în dosar")
    expect(html).toContain("Documente generate")
    expect(html).toContain("Aprobări magic link")
    expect(html).toContain("https://app.compliscan.ro/dashboard")
  })
})
