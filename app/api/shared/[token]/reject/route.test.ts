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

describe("POST /api/shared/[token]/reject", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("respinge token invalid", async () => {
    mocks.resolveSignedShareTokenMock.mockReturnValue(null)

    const response = await POST(
      new Request("http://test.local/api/shared/bad/reject", {
        method: "POST",
        body: JSON.stringify({ comment: "Motiv valid pentru testare." }),
      }),
      {
        params: Promise.resolve({ token: "bad" }),
      }
    )

    expect(response.status).toBe(401)
    expect(mocks.mutateStateForOrgMock).not.toHaveBeenCalled()
  })

  it("respinge daca lipseste motivul (mandatory comment)", async () => {
    mocks.resolveSignedShareTokenMock.mockReturnValue({
      orgId: "org-demo",
      recipientType: "partner",
      createdAtISO: "2026-04-27T07:00:00.000Z",
      expiresAtISO: "2026-04-30T07:00:00.000Z",
      documentId: "doc-dpa-1",
    })

    const response = await POST(
      new Request("http://test.local/api/shared/good/reject", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      {
        params: Promise.resolve({ token: "good" }),
      }
    )

    expect(response.status).toBe(400)
    const body = (await response.json()) as { code?: string }
    expect(body.code).toBe("REJECTION_COMMENT_REQUIRED")
    expect(mocks.mutateStateForOrgMock).not.toHaveBeenCalled()
  })

  it("respinge daca motivul e prea scurt", async () => {
    mocks.resolveSignedShareTokenMock.mockReturnValue({
      orgId: "org-demo",
      recipientType: "partner",
      createdAtISO: "2026-04-27T07:00:00.000Z",
      expiresAtISO: "2026-04-30T07:00:00.000Z",
      documentId: "doc-dpa-1",
    })

    const response = await POST(
      new Request("http://test.local/api/shared/good/reject", {
        method: "POST",
        body: JSON.stringify({ comment: "scurt" }),
      }),
      {
        params: Promise.resolve({ token: "good" }),
      }
    )

    expect(response.status).toBe(400)
  })

  it("marcheaza documentul ca rejected si capteaza motivul ca dovada", async () => {
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

    const response = await POST(
      new Request("http://test.local/api/shared/good/reject", {
        method: "POST",
        body: JSON.stringify({
          comment:
            "Termenul de retenție 12 luni este prea scurt pentru contractele cu sub-procesatori. Vă rog reformulați la 24 luni.",
        }),
      }),
      {
        params: Promise.resolve({ token: "good" }),
      }
    )

    expect(response.status).toBe(200)
    const docs = savedState?.generatedDocuments as Array<{ adoptionStatus?: string }>
    expect(docs[0]?.adoptionStatus).toBe("rejected")

    const taskState = savedState?.taskState as Record<
      string,
      { validationStatus?: string; attachedEvidenceMeta?: { fileName?: string } }
    >
    expect(taskState["document-rejection-doc-dpa-1"]?.validationStatus).toBe("passed")
    expect(taskState["document-rejection-doc-dpa-1"]?.attachedEvidenceMeta?.fileName).toContain(
      "client-rejection-doc-dpa-1"
    )

    const alerts = savedState?.alerts as Array<{ message: string; severity: string }>
    expect(alerts[0]?.message).toContain("Document respins prin magic link")
    expect(alerts[0]?.severity).toBe("high")

    const events = savedState?.events as Array<{ type: string; metadata?: Record<string, unknown> }>
    expect(events[0]?.type).toBe("document.shared_rejected")
    expect(events[0]?.metadata?.rejectionReasonPreview).toContain("Termenul de retenție")
  })
})
