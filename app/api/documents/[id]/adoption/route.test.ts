import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  getDocumentAdoptionFeedbackMock: vi.fn(),
  supportsDocumentAdoptionMock: vi.fn(),
  jsonErrorMock: vi.fn((message: string, status: number, code: string) =>
    new Response(JSON.stringify({ error: message, code }), { status })
  ),
}))

vi.mock("@/lib/server/auth", () => ({
  requireRole: mocks.requireRoleMock,
  AuthzError: class AuthzError extends Error {
    status: number
    code: string

    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: mocks.jsonErrorMock,
}))

vi.mock("@/lib/compliance/document-adoption", () => ({
  getDocumentAdoptionFeedback: mocks.getDocumentAdoptionFeedbackMock,
  supportsDocumentAdoption: mocks.supportsDocumentAdoptionMock,
}))

import { PATCH } from "./route"

describe("PATCH /api/documents/[id]/adoption", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      orgId: "org-1",
      orgName: "Demo Org SRL",
      userId: "user-1",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.getDocumentAdoptionFeedbackMock.mockReturnValue("Document semnat")
    mocks.supportsDocumentAdoptionMock.mockReturnValue(true)
    mocks.mutateStateForOrgMock.mockImplementation(
      async (_orgId: string, fn: (state: Record<string, unknown>) => unknown) =>
        fn({
          generatedDocuments: [
            {
              id: "doc-1",
              title: "DPA",
              documentType: "dpa",
            },
          ],
          events: [],
        })
    )
  })

  it("salvează adoptarea în org-ul explicit din sesiune", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/documents/doc-1/adoption", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ adoptionStatus: "signed" }),
      }),
      { params: Promise.resolve({ id: "doc-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Demo Org SRL"
    )
    expect(payload).toEqual(
      expect.objectContaining({
        ok: true,
        feedbackMessage: "Document semnat",
      })
    )
  })
})
