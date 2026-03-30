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

import { GET, PATCH } from "./route"

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

  it("returnează suggestedDocumentType canonic pentru retenție chiar dacă state-ul brut este greșit", async () => {
    const retentionState = {
      findings: [
        {
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
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(retentionState)

    const response = await GET(
      new Request("http://localhost/api/findings/finding-retention"),
      { params: Promise.resolve({ id: "finding-retention" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.finding.suggestedDocumentType).toBe("retention-policy")
    expect(payload.documentFlowState).toBe("draft_missing")
  })

  it("returnează draft_missing și pentru AI-OPS asistat de politică AI", async () => {
    const aiOpsState = {
      findings: [
        {
          id: "intake-ai-confidential-data",
          title: "Date confidențiale introduse în AI fără protecție",
          detail: "Tool-uri AI externe primesc date sensibile fără reguli.",
          category: "EU_AI_ACT",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-27T10:00:00.000Z",
          sourceDocument: "scan.pdf",
          findingStatus: "open",
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(aiOpsState)

    const response = await GET(
      new Request("http://localhost/api/findings/intake-ai-confidential-data"),
      { params: Promise.resolve({ id: "intake-ai-confidential-data" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.finding.suggestedDocumentType ?? null).toBeNull()
    expect(payload.documentFlowState).toBe("draft_missing")
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

  it("blocheaza salvarea dovezii daca draftul nu este confirmat explicit", async () => {
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
          status: "confirmed",
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

  it("confirmă documentul fără să rezolve sau să trimită imediat cazul la dosar", async () => {
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
          status: "confirmed",
          generatedDocumentId: "doc-1",
          confirmationChecklist: ["content-reviewed", "facts-confirmed", "approved-for-evidence"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("confirmed")
    expect(payload.finding.findingStatus).toBe("confirmed")
    expect(payload.documentFlowState).toBe("draft_ready")
    expect(payload.linkedGeneratedDocument.approvalStatus).toBe("draft")
    expect(payload.linkedGeneratedDocument.validationStatus).toBe("passed")
    expect(payload.feedbackMessage).toContain("Documentul este confirmat și validat")
    expect(payload.feedbackMessage).toContain("Acum poți rezolva riscul")
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
          status: "confirmed",
          generatedDocumentId: "doc-1",
          confirmationChecklist: ["reviewed-content", "facts-confirmed", "approved-for-evidence"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("confirmed")
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

  it("acceptă retention-policy ca document valid pentru flow-ul documentar", async () => {
    const retentionState = {
      findings: [
        {
          id: "finding-1",
          title: "Retenție date neclară",
          detail: "Nu este clar cât timp păstrăm datele și când se execută ștergerea.",
          category: "GDPR",
          severity: "medium",
          risk: "low",
          principles: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "doc.pdf",
          suggestedDocumentType: "retention-policy",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [
        {
          id: "doc-retention-1",
          documentType: "retention-policy",
          title: "Politică și Matrice de Retenție",
          generatedAtISO: "2026-03-22T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-1",
          approvalStatus: "draft",
        },
      ],
    }
    mocks.readStateMock.mockResolvedValueOnce(retentionState)
    mocks.readFreshStateMock.mockResolvedValueOnce(retentionState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/finding-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "confirmed",
          generatedDocumentId: "doc-retention-1",
          confirmationChecklist: ["content-reviewed", "facts-confirmed", "approved-for-evidence"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("confirmed")
    expect(payload.documentFlowState).toBe("draft_ready")
    expect(payload.linkedGeneratedDocument.documentType).toBe("retention-policy")
    expect(payload.feedbackMessage).toContain("Documentul este confirmat și validat")
  })

  it("rezolvă finding-ul documentar doar după ce documentul este confirmat și validat", async () => {
    const attachedDocumentState = {
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
          validationStatus: "passed",
          validatedAtISO: "2026-03-22T11:10:00.000Z",
          confirmationChecklist: ["content-reviewed", "facts-confirmed", "approved-for-evidence"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        },
      ],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(attachedDocumentState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/finding-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
        }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("resolved")
    expect(payload.finding.findingStatus).toBe("resolved")
    expect(payload.documentFlowState).toBe("draft_ready")
    expect(payload.feedbackMessage).toContain("Riscul este rezolvat")
    expect(payload.feedbackMessage).toContain("Acum adaugi documentul la Dosar")
  })

  it("blochează salvarea dovezii dacă validarea nu este confirmată explicit", async () => {
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
          status: "confirmed",
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

  it("blochează rezolvarea dacă documentul nu a fost încă validat și confirmat", async () => {
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
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("DOCUMENT_NOT_READY_FOR_RESOLUTION")
  })

  it("blochează AI-OPS dacă documentul de suport lipsește, chiar dacă dovada operațională este prezentă", async () => {
    const aiOpsState = {
      findings: [
        {
          id: "intake-ai-confidential-data",
          title: "Date confidențiale introduse în AI fără protecție",
          detail: "Tool-uri AI externe primesc date sensibile fără reguli.",
          category: "EU_AI_ACT",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-27T10:00:00.000Z",
          sourceDocument: "scan.pdf",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(aiOpsState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/intake-ai-confidential-data", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          evidenceNote: "Politica AI a fost comunicată și trainingul a fost ținut.",
        }),
      }),
      { params: Promise.resolve({ id: "intake-ai-confidential-data" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("DOCUMENT_NOT_READY_FOR_RESOLUTION")
  })

  it("blochează AI-OPS dacă documentul există, dar lipsește dovada operațională", async () => {
    const aiOpsState = {
      findings: [
        {
          id: "intake-ai-confidential-data",
          title: "Date confidențiale introduse în AI fără protecție",
          detail: "Tool-uri AI externe primesc date sensibile fără reguli.",
          category: "EU_AI_ACT",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-27T10:00:00.000Z",
          sourceDocument: "scan.pdf",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [
        {
          id: "doc-ai-1",
          documentType: "ai-governance",
          title: "Politică de utilizare AI",
          generatedAtISO: "2026-03-27T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "intake-ai-confidential-data",
          approvalStatus: "draft",
          validationStatus: "passed",
          validatedAtISO: "2026-03-27T11:10:00.000Z",
          confirmationChecklist: ["content-reviewed", "facts-confirmed", "approved-for-evidence"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        },
      ],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(aiOpsState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/intake-ai-confidential-data", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ id: "intake-ai-confidential-data" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("OPERATIONAL_EVIDENCE_REQUIRED")
  })

  it("trimite documentul la dosar doar după ce riscul este deja rezolvat cu el", async () => {
    const resolvedDocumentState = {
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
          findingStatus: "resolved",
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
          validationStatus: "passed",
          validatedAtISO: "2026-03-22T11:10:00.000Z",
          confirmationChecklist: ["content-reviewed", "facts-confirmed", "approved-for-evidence"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        },
      ],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(resolvedDocumentState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/finding-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "under_monitoring",
          generatedDocumentId: "doc-1",
        }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("under_monitoring")
    expect(payload.finding.findingStatus).toBe("under_monitoring")
    expect(payload.documentFlowState).toBe("attached_as_evidence")
    expect(payload.linkedGeneratedDocument.approvalStatus).toBe("approved_as_evidence")
    expect(payload.feedbackMessage).toContain("Documentul a intrat în Dosar")
  })

  it("blochează trimiterea la dosar dacă riscul nu a fost încă rezolvat", async () => {
    const confirmedDocumentState = {
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
          validationStatus: "passed",
          validatedAtISO: "2026-03-22T11:10:00.000Z",
          confirmationChecklist: ["content-reviewed", "facts-confirmed", "approved-for-evidence"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        },
      ],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(confirmedDocumentState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/finding-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "under_monitoring",
          generatedDocumentId: "doc-1",
        }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("FINDING_NOT_RESOLVED_FOR_DOSSIER")
  })

  it("creează follow-up-ul GDPR-017 când GDPR-016 intră în monitorizare", async () => {
    const retentionMonitoringState = {
      findings: [
        {
          id: "finding-retention",
          title: "Retenție date neclară",
          detail: "Nu este clar cât timp păstrăm datele și când se execută ștergerea.",
          category: "GDPR",
          severity: "medium",
          risk: "low",
          principles: ["privacy_data_governance"],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          sourceDocument: "doc.pdf",
          suggestedDocumentType: "retention-policy",
          findingStatus: "resolved",
          resolution: {
            problem: "Durate neclare",
            impact: "Date păstrate prea mult sau prea puțin.",
            action: "Definești retenția și o salvezi la dosar.",
            generatedAsset: "Politică și Matrice de Retenție",
            closureEvidence: "Matrice salvată și aprobată.",
          },
        },
      ],
      generatedDocuments: [
        {
          id: "doc-retention-1",
          documentType: "retention-policy",
          title: "Politică și Matrice de Retenție",
          generatedAtISO: "2026-03-22T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "finding-retention",
          approvalStatus: "draft",
          validationStatus: "passed",
          validatedAtISO: "2026-03-22T11:10:00.000Z",
          confirmationChecklist: ["content-reviewed", "facts-confirmed", "approved-for-evidence"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        },
      ],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(retentionMonitoringState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/finding-retention", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "under_monitoring",
          generatedDocumentId: "doc-retention-1",
        }),
      }),
      { params: Promise.resolve({ id: "finding-retention" }) }
    )
    const payload = await response.json()
    const writtenState = mocks.writeStateMock.mock.calls[0]?.[0]
    const followUpFinding = writtenState?.findings?.find(
      (finding: { id: string }) => finding.id === "retention-deletion-proof-finding-retention"
    )

    expect(response.status).toBe(200)
    expect(payload.status).toBe("under_monitoring")
    expect(payload.feedbackMessage).toContain("follow-up-ul pentru dovada de ștergere / anonimizare")
    expect(followUpFinding).toBeTruthy()
    expect(followUpFinding.title).toBe("Ștergere / anonimizare neconfirmată")
    expect(followUpFinding.findingStatus).toBe("open")
    expect(followUpFinding.suggestedDocumentType).toBe("retention-policy")
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

    expect(response.status).toBe(200)
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

  it("blochează contracts-baseline fără dovadă contractuală explicită", async () => {
    const contractualState = {
      findings: [
        {
          id: "contracts-baseline",
          title: "Contracte standard lipsă sau incomplete",
          detail: "Lipsa contractelor standard cu clienții și furnizorii creează expunere juridică și face auditul dificil.",
          category: "GDPR",
          severity: "medium",
          risk: "medium",
          principles: [],
          createdAtISO: "2026-03-27T10:00:00.000Z",
          sourceDocument: "intake-questionnaire",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(contractualState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/contracts-baseline", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ id: "contracts-baseline" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("OPERATIONAL_EVIDENCE_REQUIRED")
  })

  it("închide contracts-baseline doar cu urmă contractuală explicită", async () => {
    const contractualState = {
      findings: [
        {
          id: "contracts-baseline",
          title: "Contracte standard lipsă sau incomplete",
          detail: "Lipsa contractelor standard cu clienții și furnizorii creează expunere juridică și face auditul dificil.",
          category: "GDPR",
          severity: "medium",
          risk: "medium",
          principles: [],
          createdAtISO: "2026-03-27T10:00:00.000Z",
          sourceDocument: "intake-questionnaire",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(contractualState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/contracts-baseline", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          evidenceNote:
            "Template contract client și template furnizor revizuite cu juristul. Salvate în /Legal/Contracte-standard-v3 și puse în uz pentru cazurile noi.",
        }),
      }),
      { params: Promise.resolve({ id: "contracts-baseline" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("under_monitoring")
    expect(payload.finding.operationalEvidenceNote).toContain("Contracte-standard-v3")
    expect(payload.feedbackMessage).toContain("operațională")
  })

  it("blochează intake-hr-registry fără dovadă operațională explicită", async () => {
    const hrRegistryState = {
      findings: [
        {
          id: "intake-hr-registry",
          title: "REGES / evidență contracte angajați",
          detail: "Evidența contractelor de muncă trebuie menținută la zi în REGES.",
          category: "GDPR",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-27T10:00:00.000Z",
          sourceDocument: "intake-questionnaire",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(hrRegistryState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/intake-hr-registry", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ id: "intake-hr-registry" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("OPERATIONAL_EVIDENCE_REQUIRED")
  })

  it("închide intake-hr-registry doar cu urmă operațională explicită", async () => {
    const hrRegistryState = {
      findings: [
        {
          id: "intake-hr-registry",
          title: "REGES / evidență contracte angajați",
          detail: "Evidența contractelor de muncă trebuie menținută la zi în REGES.",
          category: "GDPR",
          severity: "high",
          risk: "high",
          principles: [],
          createdAtISO: "2026-03-27T10:00:00.000Z",
          sourceDocument: "intake-questionnaire",
          findingStatus: "confirmed",
        },
      ],
      generatedDocuments: [],
    }
    mocks.readFreshStateMock.mockResolvedValueOnce(hrRegistryState)

    const response = await PATCH(
      new Request("http://localhost/api/findings/intake-hr-registry", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          evidenceNote:
            "REGES verificat și actualizat la 27.03.2026. Contractele lipsă au fost introduse, iar exportul de control a fost salvat în /HR/REGES/2026-03-27.",
        }),
      }),
      { params: Promise.resolve({ id: "intake-hr-registry" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("under_monitoring")
    expect(payload.finding.operationalEvidenceNote).toContain("/HR/REGES/2026-03-27")
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

  it("rezolvă GDPR-017 doar după documentul de suport și dovada de ștergere", async () => {
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
      generatedDocuments: [
        {
          id: "doc-retention-1",
          documentType: "retention-policy",
          title: "Politică și Matrice de Retenție",
          generatedAtISO: "2026-03-22T11:00:00.000Z",
          llmUsed: false,
          sourceFindingId: "retention-deletion-proof-1",
          approvalStatus: "draft",
          validationStatus: "passed",
          validatedAtISO: "2026-03-22T11:10:00.000Z",
          confirmationChecklist: ["content-reviewed", "facts-confirmed", "approved-for-evidence"],
          validationChecklist: ["validation-reviewed", "validation-ready"],
        },
      ],
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
    expect(payload.status).toBe("resolved")
    expect(payload.finding.operationalEvidenceNote).toContain("Lead-urile expirate")
    expect(payload.documentFlowState).toBe("draft_ready")
    expect(payload.feedbackMessage).toContain("Riscul este rezolvat")
    expect(payload.feedbackMessage).toContain("Acum adaugi documentul la Dosar")
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
