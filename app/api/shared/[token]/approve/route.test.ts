import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  mutateStateForOrgMock: vi.fn(),
  resolveSignedShareTokenMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/share-token-store", () => ({
  resolveSignedShareToken: mocks.resolveSignedShareTokenMock,
}))

import { POST } from "./route"

describe("POST /api/shared/[token]/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("respinge token invalid", async () => {
    mocks.resolveSignedShareTokenMock.mockReturnValue(null)

    const response = await POST(new Request("http://test.local/api/shared/bad/approve"), {
      params: Promise.resolve({ token: "bad" }),
    })

    expect(response.status).toBe(401)
    expect(mocks.mutateStateForOrgMock).not.toHaveBeenCalled()
  })

  it("marcheaza documentul ca signed si creeaza alerta + event", async () => {
    mocks.resolveSignedShareTokenMock.mockReturnValue({
      orgId: "org-demo",
      recipientType: "partner",
      createdAtISO: "2026-04-27T07:00:00.000Z",
      expiresAtISO: "2026-04-30T07:00:00.000Z",
      documentId: "doc-dpa-1",
    })

    let savedState: Record<string, unknown> | null = null
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId, updater) => {
      savedState = await updater({
        generatedDocuments: [
          {
            id: "doc-dpa-1",
            documentType: "dpa",
            title: "DPA Stripe",
            generatedAtISO: "2026-04-27T07:00:00.000Z",
            llmUsed: true,
          },
        ],
        alerts: [],
        events: [],
        taskState: {},
      })
      return savedState
    })

    const response = await POST(new Request("http://test.local/api/shared/good/approve", { method: "POST" }), {
      params: Promise.resolve({ token: "good" }),
    })

    expect(response.status).toBe(200)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith("org-demo", expect.any(Function))
    expect((savedState?.generatedDocuments as Array<{ adoptionStatus?: string }>)[0]?.adoptionStatus).toBe("signed")
    expect(
      (savedState?.taskState as Record<string, { validationStatus?: string; attachedEvidenceMeta?: { quality?: { status?: string } } }>)[
        "document-approval-doc-dpa-1"
      ]?.validationStatus
    ).toBe("passed")
    expect(
      (savedState?.taskState as Record<string, { attachedEvidenceMeta?: { quality?: { status?: string } } }>)[
        "document-approval-doc-dpa-1"
      ]?.attachedEvidenceMeta?.quality?.status
    ).toBe("sufficient")
    expect((savedState?.alerts as Array<{ message: string }>)[0]?.message).toContain("Document aprobat prin magic link")
    expect((savedState?.events as Array<{ type: string }>)[0]?.type).toBe("document.shared_approved")
  })

  it("nu permite aprobarea peste o decizie finala existenta", async () => {
    mocks.resolveSignedShareTokenMock.mockReturnValue({
      orgId: "org-demo",
      recipientType: "partner",
      createdAtISO: "2026-04-27T07:00:00.000Z",
      expiresAtISO: "2026-04-30T07:00:00.000Z",
      documentId: "doc-dpa-1",
    })

    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId, updater) => {
      await updater({
        generatedDocuments: [
          {
            id: "doc-dpa-1",
            documentType: "dpa",
            title: "DPA Stripe",
            generatedAtISO: "2026-04-27T07:00:00.000Z",
            llmUsed: true,
            adoptionStatus: "rejected",
          },
        ],
        alerts: [],
        events: [],
        taskState: {},
      })
    })

    const response = await POST(new Request("http://test.local/api/shared/good/approve", { method: "POST" }), {
      params: Promise.resolve({ token: "good" }),
    })

    expect(response.status).toBe(409)
    const body = (await response.json()) as { code?: string }
    expect(body.code).toBe("APPROVABLE_DOCUMENT_ALREADY_FINAL")
  })
})
