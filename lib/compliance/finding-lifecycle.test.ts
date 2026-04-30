import { describe, expect, it } from "vitest"

import { buildFindingLifecycleView } from "@/lib/compliance/finding-lifecycle"
import type { GeneratedDocumentRecord, ScanFinding } from "@/lib/compliance/types"

function finding(overrides: Partial<ScanFinding> = {}): ScanFinding {
  return {
    id: "finding-dpa",
    title: "DPA furnizor lipsă",
    detail: "Furnizorul procesează date personale fără DPA.",
    category: "GDPR",
    severity: "high",
    risk: "high",
    principles: ["accountability"],
    createdAtISO: "2026-04-30T07:00:00.000Z",
    sourceDocument: "scan",
    legalReference: "GDPR Art. 28",
    remediationHint: "Pregătește DPA-ul și trimite-l clientului pentru aprobare.",
    evidenceRequired: "DPA semnat sau aprobare client.",
    ...overrides,
  }
}

function document(overrides: Partial<GeneratedDocumentRecord> = {}): GeneratedDocumentRecord {
  return {
    id: "doc-dpa",
    documentType: "dpa",
    title: "DPA CloudMed",
    generatedAtISO: "2026-04-30T08:00:00.000Z",
    llmUsed: false,
    sourceFindingId: "finding-dpa",
    approvalStatus: "draft",
    validationStatus: "pending",
    ...overrides,
  }
}

describe("buildFindingLifecycleView", () => {
  it("expune finding-ul detectat si triat cu urmatorul pas in cockpit", () => {
    const view = buildFindingLifecycleView({ finding: finding() })

    expect(view.currentStage).toBe("triaged")
    expect(view.completedStages).toContain("detected")
    expect(view.completedStages).toContain("triaged")
    expect(view.nextAction).toContain("Pregătește DPA-ul")
    expect(view.dossierReady).toBe(false)
  })

  it("marchează trimiterea la client si respingerea ca feedback capturat, dar nu ca dosar gata", () => {
    const view = buildFindingLifecycleView({
      finding: finding({ findingStatus: "confirmed" }),
      generatedDocuments: [
        document({
          adoptionStatus: "rejected",
          shareComments: [
            {
              id: "comment-1",
              authorName: "Client",
              comment: "Revizuiți clauza 7.",
              recipientType: "partner",
              createdAtISO: "2026-04-30T09:00:00.000Z",
              channel: "public_magic_link",
            },
          ],
        }),
      ],
    })

    expect(view.currentStage).toBe("evidence_attached")
    expect(view.clientDecision).toBe("rejected")
    expect(view.statusLabel).toContain("Respins")
    expect(view.evidence.attached).toBe(true)
    expect(view.evidence.validated).toBe(false)
    expect(view.dossierReady).toBe(false)
  })

  it("marchează finding-ul ca dosar gata doar după dovadă validată si monitorizare", () => {
    const view = buildFindingLifecycleView({
      finding: finding({
        findingStatus: "under_monitoring",
        nextMonitoringDateISO: "2026-07-30T08:00:00.000Z",
      }),
      generatedDocuments: [
        document({
          approvalStatus: "approved_as_evidence",
          validationStatus: "passed",
          validatedAtISO: "2026-04-30T09:00:00.000Z",
          adoptionStatus: "signed",
        }),
      ],
    })

    expect(view.currentStage).toBe("monitoring")
    expect(view.completedStages).toEqual([
      "detected",
      "triaged",
      "in_progress",
      "sent_to_client",
      "client_decided",
      "evidence_attached",
      "evidence_validated",
      "resolved",
      "monitoring",
    ])
    expect(view.evidence.validated).toBe(true)
    expect(view.dossierReady).toBe(true)
    expect(view.nextAction).toContain("Menține monitorizarea")
  })
})
