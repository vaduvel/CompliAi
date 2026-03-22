import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readStateMock: vi.fn(),
  writeStateMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  createNotificationMock: vi.fn(),
  mapFindingToTaskMock: vi.fn(),
  generateDocumentMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
  writeState: mocks.writeStateMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/notifications-store", () => ({
  createNotification: mocks.createNotificationMock,
}))

vi.mock("@/lib/finding-to-task-mapper", () => ({
  mapFindingToTask: mocks.mapFindingToTaskMock,
}))

vi.mock("@/lib/server/document-generator", () => ({
  generateDocument: mocks.generateDocumentMock,
}))

import { PATCH } from "./route"

describe("PATCH /api/findings/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getOrgContextMock.mockResolvedValue({ orgId: "org-1", orgName: "Demo SRL" })
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
    mocks.generateDocumentMock.mockResolvedValue(null)
  })

  it("returnează feedback util când finding-ul este confirmat", async () => {
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
    expect(payload.documentGenerationTriggered).toBe(true)
    expect(payload.feedbackMessage).toContain("Finding confirmat")
  })
})
