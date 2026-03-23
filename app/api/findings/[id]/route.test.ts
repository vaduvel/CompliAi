import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readStateMock: vi.fn(),
  writeStateMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  createNotificationMock: vi.fn(),
  mapFindingToTaskMock: vi.fn(),
  readFreshSessionFromRequestMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
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
    mocks.readStateMock.mockResolvedValue({
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
    })
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

    const response = await PATCH(
      new Request("http://localhost/api/findings/finding-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          generatedDocumentId: "doc-1",
          confirmationChecklist: ["content-reviewed"],
        }),
      }),
      { params: Promise.resolve({ id: "finding-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("DOCUMENT_CONFIRMATION_INCOMPLETE")
  })
})
