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

describe("POST /api/shared/[token]/comment", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("respinge token invalid", async () => {
    mocks.resolveSignedShareTokenMock.mockReturnValue(null)

    const response = await POST(
      new Request("http://test.local/api/shared/bad/comment", {
        method: "POST",
        body: JSON.stringify({ comment: "Test feedback" }),
      }),
      {
        params: Promise.resolve({ token: "bad" }),
      }
    )

    expect(response.status).toBe(401)
    expect(mocks.mutateStateForOrgMock).not.toHaveBeenCalled()
  })

  it("respinge daca lipseste comentariul", async () => {
    mocks.resolveSignedShareTokenMock.mockReturnValue({
      orgId: "org-demo",
      recipientType: "partner",
      createdAtISO: "2026-04-27T07:00:00.000Z",
      expiresAtISO: "2026-04-30T07:00:00.000Z",
      documentId: "doc-dpa-1",
    })

    const response = await POST(
      new Request("http://test.local/api/shared/good/comment", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      {
        params: Promise.resolve({ token: "good" }),
      }
    )

    expect(response.status).toBe(400)
    const body = (await response.json()) as { code?: string }
    expect(body.code).toBe("COMMENT_REQUIRED")
  })

  it("ataseaza comentariul la document fara sa schimbe adoption status", async () => {
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
            adoptionStatus: "sent_for_signature",
          },
        ],
        alerts: [],
        events: [],
        taskState: {},
      })
      return savedState
    })

    const response = await POST(
      new Request("http://test.local/api/shared/good/comment", {
        method: "POST",
        body: JSON.stringify({
          comment: "Vă rog confirmați dacă DPA acoperă și sub-procesatorul Stripe Connect.",
          authorName: "Mihai Ionescu",
        }),
      }),
      {
        params: Promise.resolve({ token: "good" }),
      }
    )

    expect(response.status).toBe(200)

    const docs = savedState?.generatedDocuments as Array<{
      adoptionStatus?: string
      shareComments?: Array<{ comment: string; authorName: string; channel: string }>
    }>
    // Adoption status RAMANE neschimbat
    expect(docs[0]?.adoptionStatus).toBe("sent_for_signature")
    expect(docs[0]?.shareComments?.length).toBe(1)
    expect(docs[0]?.shareComments?.[0]?.comment).toContain("Stripe Connect")
    expect(docs[0]?.shareComments?.[0]?.authorName).toBe("Mihai Ionescu")
    expect(docs[0]?.shareComments?.[0]?.channel).toBe("public_magic_link")

    const alerts = savedState?.alerts as Array<{ message: string; severity: string }>
    expect(alerts[0]?.message).toContain("Comentariu primit prin magic link")
    expect(alerts[0]?.severity).toBe("medium")

    const events = savedState?.events as Array<{ type: string }>
    expect(events[0]?.type).toBe("document.shared_commented")
  })

  it("foloseste author default daca nu e specificat", async () => {
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
      new Request("http://test.local/api/shared/good/comment", {
        method: "POST",
        body: JSON.stringify({ comment: "Întrebare scurtă despre clauza 5." }),
      }),
      {
        params: Promise.resolve({ token: "good" }),
      }
    )

    expect(response.status).toBe(200)

    const docs = savedState?.generatedDocuments as Array<{
      shareComments?: Array<{ authorName: string }>
    }>
    expect(docs[0]?.shareComments?.[0]?.authorName).toBe("Client (magic link)")
  })
})
