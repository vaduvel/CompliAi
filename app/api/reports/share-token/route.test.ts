import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorClass: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshAuthenticatedSessionMock: vi.fn(),
  generateSignedShareTokenMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorClass,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/share-token-store", () => ({
  generateSignedShareToken: mocks.generateSignedShareTokenMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

import { POST } from "./route"

describe("POST /api/reports/share-token", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-owner-1",
      orgId: "org-session",
      orgName: "Marketing Growth Hub SRL",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.generateSignedShareTokenMock.mockReturnValue("share-token-1")
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId: string, updater: (state: unknown) => unknown) =>
      updater({
        generatedDocuments: [],
        events: [],
      })
    )
  })

  it("generează tokenul pe org-ul sesiunii, nu din headere", async () => {
    const response = await POST(
      new Request("http://localhost/api/reports/share-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-compliscan-org-id": "wrong-org",
        },
        body: JSON.stringify({ recipientType: "partner" }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.generateSignedShareTokenMock).toHaveBeenCalledWith(
      "org-session",
      "partner",
      expect.any(String)
    )
    expect(body).toEqual({
      ok: true,
      token: "share-token-1",
      expiresAtISO: expect.any(String),
    })
  })

  it("refuză generarea fără sesiune activă", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorClass("Ai nevoie de sesiune activa.")
    )

    const response = await POST(
      new Request("http://localhost/api/reports/share-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientType: "accountant" }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.code).toBe("AUTH_SESSION_REQUIRED")
    expect(mocks.generateSignedShareTokenMock).not.toHaveBeenCalled()
  })

  it("marchează documentul drept trimis la client când tokenul este document-specific", async () => {
    let savedState: unknown = null
    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: unknown) => unknown) => {
      savedState = await updater({
        generatedDocuments: [
          {
            id: "doc-dpa-1",
            documentType: "dpa",
            title: "DPA Stripe",
            generatedAtISO: "2026-04-30T07:00:00.000Z",
            llmUsed: false,
            adoptionStatus: "reviewed_internally",
          },
        ],
        events: [],
      })
      return savedState
    })

    const response = await POST(
      new Request("http://localhost/api/reports/share-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType: "partner",
          documentId: "doc-dpa-1",
          documentTitle: "DPA Stripe",
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.generateSignedShareTokenMock).toHaveBeenCalledWith(
      "org-session",
      "partner",
      expect.any(String),
      { documentId: "doc-dpa-1", documentTitle: "DPA Stripe" }
    )
    expect(savedState).toEqual(
      expect.objectContaining({
        generatedDocuments: [
          expect.objectContaining({
            id: "doc-dpa-1",
            adoptionStatus: "sent_for_signature",
          }),
        ],
        events: [expect.objectContaining({ type: "document.shared" })],
      })
    )
  })
})
