import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readStateMock: vi.fn(),
  readFreshStateMock: vi.fn(),
  writeStateMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  createNotificationMock: vi.fn(),
  mapFindingToTaskMock: vi.fn(),
  readFreshSessionFromRequestMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
  readFreshState: mocks.readFreshStateMock,
  writeState: mocks.writeStateMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/auth", () => ({
  readFreshSessionFromRequest: mocks.readFreshSessionFromRequestMock,
}))

vi.mock("@/lib/server/notifications-store", () => ({
  createNotification: mocks.createNotificationMock,
}))

vi.mock("@/lib/finding-to-task-mapper", () => ({
  mapFindingToTask: mocks.mapFindingToTaskMock,
}))

import { PATCH } from "./route"

describe("PATCH /api/findings/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getOrgContextMock.mockResolvedValue({ orgId: "org-1", orgName: "Demo SRL" })
    mocks.readFreshSessionFromRequestMock.mockResolvedValue({
      userId: "user-1",
      email: "owner@example.com",
    })
    const baseState = {
      findings: [
        {
          id: "finding-1",
          title: "Lipsa DPA",
          detail: "Nu exista DPA.",
          category: "GDPR",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "doc.pdf",
          suggestedDocumentType: "dpa",
        },
      ],
      generatedDocuments: [],
    }
    mocks.readStateMock.mockResolvedValue(baseState)
    mocks.readFreshStateMock.mockResolvedValue(baseState)
    mocks.mapFindingToTaskMock.mockReturnValue({
      id: "task-1",
      title: "Rezolvă: Lipsa DPA",
      suggestedOwner: "DPO / Responsabil conformitate",
      deadline: "2026-04-01T00:00:00.000Z",
      evidenceNeeded: "DPA semnat",
      documentTrigger: "dpa",
    })
    mocks.writeStateMock.mockResolvedValue(undefined)
    mocks.createNotificationMock.mockResolvedValue(undefined)
  })

  it("returnează feedback util când finding-ul este confirmat fără auto-generare", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/findings/finding-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.taskCandidate).toEqual(
      expect.objectContaining({
        id: "task-1",
        documentTrigger: "dpa",
      })
    )
    expect(payload.documentFlowState).toBe("draft_missing")
    expect(payload.feedbackMessage).toContain("Finding confirmat")
    expect(payload.feedbackMessage).toContain("flow-ul ghidat")
  })

  it("blocheaza rezolvarea daca draftul nu este confirmat explicit", async () => {
    mocks.readStateMock.mockResolvedValueOnce({
      findings: [
        {
          id: "finding-1",
          title: "Lipsa DPA",
          detail: "Nu exista DPA.",
          category: "GDPR",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "doc.pdf",
          suggestedDocumentType: "dpa",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [
        {
          id: "doc-1",
          documentType: "dpa",
          title: "Acord DPA",
          generatedAtISO: "2026-03-22T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-1",
          approvalStatus: "draft",
        },
      ],
    })
    mocks.readFreshStateMock.mockResolvedValueOnce({
      findings: [
        {
          id: "finding-1",
          title: "Lipsa DPA",
          detail: "Nu exista DPA.",
          category: "GDPR",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "doc.pdf",
          suggestedDocumentType: "dpa",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [
        {
          id: "doc-1",
          documentType: "dpa",
          title: "Acord DPA",
          generatedAtISO: "2026-03-22T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-1",
          approvalStatus: "draft",
        },
      ],
    })

    const response = await PATCH(
      new Request("http://localhost/api/findings/finding-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          generatedDocumentId: "doc-1",
          confirmationChecklist: ["content-reviewed"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("DOCUMENT_CONFIRMATION_INCOMPLETE")
  })

  it("intoarce mesaj de dosar cand draftul este aprobat ca dovada", async () => {
    mocks.readStateMock.mockResolvedValueOnce({
      findings: [
        {
          id: "finding-1",
          title: "Lipsa DPA",
          detail: "Nu exista DPA.",
          category: "GDPR",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "doc.pdf",
          suggestedDocumentType: "dpa",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [
        {
          id: "doc-1",
          documentType: "dpa",
          title: "Acord DPA",
          generatedAtISO: "2026-03-22T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-1",
          approvalStatus: "draft",
        },
      ],
    })
    mocks.readFreshStateMock.mockResolvedValueOnce({
      findings: [
        {
          id: "finding-1",
          title: "Lipsa DPA",
          detail: "Nu exista DPA.",
          category: "GDPR",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "doc.pdf",
          suggestedDocumentType: "dpa",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [
        {
          id: "doc-1",
          documentType: "dpa",
          title: "Acord DPA",
          generatedAtISO: "2026-03-22T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-1",
          approvalStatus: "draft",
        },
      ],
    })

    const response = await PATCH(
      new Request("http://localhost/api/findings/finding-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          generatedDocumentId: "doc-1",
          confirmationChecklist: ["content-reviewed", "facts-confirmed", "approved-for-evidence"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("under_monitoring")
    expect(payload.finding.findingStatus).toBe("under_monitoring")
    expect(payload.documentFlowState).toBe("attached_as_evidence")
    expect(payload.feedbackMessage).toContain("dosar")
    expect(payload.feedbackMessage).toContain("artefact")
    expect(payload.feedbackMessage).toContain("monitorizare")
  })

  it("accepta aliasul legacy pentru checklist-ul de review", async () => {
    mocks.readStateMock.mockResolvedValueOnce({
      findings: [
        {
          id: "finding-1",
          title: "Lipsa DPA",
          detail: "Nu exista DPA.",
          category: "GDPR",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "doc.pdf",
          suggestedDocumentType: "dpa",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [
        {
          id: "doc-1",
          documentType: "dpa",
          title: "Acord DPA",
          generatedAtISO: "2026-03-22T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-1",
          approvalStatus: "draft",
        },
      ],
    })
    mocks.readFreshStateMock.mockResolvedValueOnce({
      findings: [
        {
          id: "finding-1",
          title: "Lipsa DPA",
          detail: "Nu exista DPA.",
          category: "GDPR",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "doc.pdf",
          suggestedDocumentType: "dpa",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [
        {
          id: "doc-1",
          documentType: "dpa",
          title: "Acord DPA",
          generatedAtISO: "2026-03-22T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-1",
          approvalStatus: "draft",
        },
      ],
    })

    const response = await PATCH(
      new Request("http://localhost/api/findings/finding-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          generatedDocumentId: "doc-1",
          confirmationChecklist: ["reviewed-content", "facts-confirmed", "approved-for-evidence"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("under_monitoring")
    expect(payload.linkedGeneratedDocument.confirmationChecklist).toEqual([
      "content-reviewed",
      "facts-confirmed",
      "approved-for-evidence",
    ])
    expect(payload.linkedGeneratedDocument.validationChecklist).toEqual([
      "validation-reviewed",
      "validation-ready",
    ])
  })

  it("blochează rezolvarea dacă validarea dovezii nu este confirmată explicit", async () => {
    const documentState = {
      findings: [
        {
          id: "finding-1",
          title: "Lipsa DPA",
          detail: "Nu exista DPA.",
          category: "GDPR",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "doc.pdf",
          suggestedDocumentType: "dpa",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [
        {
          id: "doc-1",
          documentType: "dpa",
          title: "Acord DPA",
          generatedAtISO: "2026-03-22T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-1",
          approvalStatus: "draft",
        },
      ],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(documentState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/finding-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          generatedDocumentId: "doc-1",
          confirmationChecklist: ["content-reviewed", "facts-confirmed", "approved-for-evidence"],
        }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("DOCUMENT_VALIDATION_INCOMPLETE")
  })

  it("blochează EF-003 fără dovadă operațională", async () => {
    const efacturaState = {
      findings: [
        {
          id: "demo-efactura-1",
          title: "Factură ANAF respinsă — FACT-2026-0021",
          detail: "Factura FACT-2026-0021 a fost respinsă de SPV ANAF. Codul de eroare E1 indică probleme cu câmpul TaxTotal.",
          category: "E_FACTURA",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "FACT-2026-0021.xml",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(efacturaState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/demo-efactura-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ id: "demo-efactura-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("OPERATIONAL_EVIDENCE_REQUIRED")
  })

  it("închide EF-003 cu dovadă operațională și dată de monitoring", async () => {
    const efacturaState = {
      findings: [
        {
          id: "demo-efactura-1",
          title: "Factură ANAF respinsă — FACT-2026-0021",
          detail: "Factura FACT-2026-0021 a fost respinsă de SPV ANAF. Codul de eroare E1 indică probleme cu câmpul TaxTotal.",
          category: "E_FACTURA",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "FACT-2026-0021.xml",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(efacturaState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/demo-efactura-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          evidenceNote: "TaxTotal corectat în ERP și factura retransmisă în SPV cu confirmare de primire.",
        }),
      }),
      { params: Promise.resolve({ id: "demo-efactura-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("under_monitoring")
    expect(payload.finding.operationalEvidenceNote).toContain("TaxTotal corectat")
    expect(payload.finding.nextMonitoringDateISO).toBeTruthy()
    expect(payload.feedbackMessage).toContain("operațională")
  })

  it("creează notificare fiscală umană când EF-003 intră în monitorizare", async () => {
    const efacturaState = {
      findings: [
        {
          id: "demo-efactura-1",
          title: "Factură ANAF respinsă — FACT-2026-0021",
          detail:
            "Factura FACT-2026-0021 a fost respinsă de SPV ANAF. Codul de eroare V009 indică probleme cu câmpul TaxTotal.",
          category: "E_FACTURA",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "FACT-2026-0021.xml",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(efacturaState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/demo-efactura-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          evidenceNote: "Factura a fost corectată și retransmisă în SPV, în așteptarea statusului ok.",
        }),
      }),
      { params: Promise.resolve({ id: "demo-efactura-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("under_monitoring")
    expect(mocks.createNotificationMock).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({
        type: "fiscal_alert",
        title: "Reverificăm factura retransmisă",
        linkTo: "/dashboard/resolve/demo-efactura-1",
      })
    )
  })

  it("închide GDPR-017 cu dovadă de ștergere și intră în monitoring", async () => {
    const retentionState = {
      findings: [
        {
          id: "retention-deletion-proof-1",
          title: "Ștergere / anonimizare neconfirmată",
          detail: "Există politică de retenție, dar lipsește logul de ștergere pentru datele expirate.",
          evidenceRequired: "Log de ștergere sau export de control.",
          category: "GDPR",
          severity: "medium",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "retention-review",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(retentionState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/retention-deletion-proof-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          evidenceNote:
            "Lead-urile expirate >12 luni au fost șterse din CRM la 26.03.2026. Export job #retention-2026-03-26 salvat pentru audit.",
        }),
      }),
      { params: Promise.resolve({ id: "retention-deletion-proof-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("under_monitoring")
    expect(payload.finding.operationalEvidenceNote).toContain("Lead-urile expirate")
    expect(typeof payload.finding.nextMonitoringDateISO).toBe("string")
    expect(payload.feedbackMessage).toContain("operațională")
  })

  it("blochează SYS-002 fără reconfirmare explicită", async () => {
    const sysState = {
      findings: [
        {
          id: "review-1",
          title: "Dovadă veche / necesită revalidare",
          detail: "Această dovadă este veche și trebuie reconfirmată.",
          category: "GDPR",
          severity: "medium",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "vault",
          findingStatus: "confirmed",
          resolution: {
            problem: "Dovadă veche",
            impact: "Poți rămâne cu o dovadă expirată în dosar.",
            action: "Reconfirmă acum",
            closureEvidence: "Politică publicată și revizuită anterior",
          },
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(sysState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/review-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          newReviewDateISO: "2026-06-26",
        }),
      }),
      { params: Promise.resolve({ id: "review-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("REVALIDATION_CONFIRMATION_REQUIRED")
  })

  it("închide SYS-002 cu reconfirmare și dată nouă de review", async () => {
    const sysState = {
      findings: [
        {
          id: "review-1",
          title: "Dovadă veche / necesită revalidare",
          detail: "Această dovadă este veche și trebuie reconfirmată.",
          category: "GDPR",
          severity: "medium",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "vault",
          findingStatus: "confirmed",
          resolution: {
            problem: "Dovadă veche",
            impact: "Poți rămâne cu o dovadă expirată în dosar.",
            action: "Reconfirmă acum",
            closureEvidence: "Politică publicată și revizuită anterior",
          },
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(sysState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/review-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          revalidationConfirmed: true,
          newReviewDateISO: "2026-06-26",
        }),
      }),
      { params: Promise.resolve({ id: "review-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("under_monitoring")
    expect(payload.finding.nextMonitoringDateISO).toBe("2026-06-26T00:00:00.000Z")
    expect(payload.feedbackMessage).toContain("Revalidarea")
  })

  it("permite redeschiderea unui finding monitorizat și păstrează urma anterioară", async () => {
    const reopenedState = {
      findings: [
        {
          id: "review-1",
          title: "Dovadă veche / necesită revalidare",
          detail: "Această dovadă este veche și trebuie reconfirmată.",
          category: "GDPR",
          severity: "medium",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "vault",
          findingStatus: "under_monitoring",
          findingStatusUpdatedAtISO: "2026-03-24T10:00:00.000Z",
          nextMonitoringDateISO: "2026-06-26T00:00:00.000Z",
          resolution: {
            problem: "Dovadă veche",
            impact: "Poți rămâne cu o dovadă expirată în dosar.",
            action: "Reconfirmă acum",
            closureEvidence: "Politică publicată și revizuită anterior",
          },
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(reopenedState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/review-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      }),
      { params: Promise.resolve({ id: "review-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("open")
    expect(payload.finding.reopenedFromISO).toBe("2026-03-24T10:00:00.000Z")
    expect(payload.finding.nextMonitoringDateISO).toBeUndefined()
  })
})
