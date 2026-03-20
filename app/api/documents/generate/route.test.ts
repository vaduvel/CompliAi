import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  mutateStateMock: vi.fn(async (fn: (state: Record<string, unknown>) => unknown) => fn({})),
  generateDocumentMock: vi.fn(),
  trackEventMock: vi.fn(),
  jsonErrorMock: vi.fn((message: string, status: number, code: string) =>
    new Response(JSON.stringify({ error: message, code }), { status })
  ),
}))

vi.mock("@/lib/server/auth", () => ({
  requireRole: mocks.requireRoleMock,
  AuthzError: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "UNAUTHORIZED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: mocks.jsonErrorMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: mocks.mutateStateMock,
}))

vi.mock("@/lib/server/analytics", () => ({
  trackEvent: mocks.trackEventMock,
}))

vi.mock("@/lib/server/document-generator", () => ({
  DOCUMENT_TYPES: [
    { id: "privacy-policy" },
    { id: "cookie-policy" },
    { id: "dpa" },
    { id: "nis2-incident-response" },
    { id: "ai-governance" },
  ],
  generateDocument: mocks.generateDocumentMock,
}))

import { POST } from "./route"

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/documents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/documents/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Math, "random").mockReturnValue(0.123456789)
    mocks.requireRoleMock.mockReturnValue({
      orgId: "org-1",
      userId: "user-1",
      email: "owner@example.com",
      role: "owner",
    })
  })

  it("persista metadata documentului generat in state si intoarce payload-ul", async () => {
    let saved: unknown = null
    mocks.mutateStateMock.mockImplementation(async (fn: (state: Record<string, unknown>) => unknown) => {
      saved = fn({ generatedDocuments: [], events: [] }) as Record<string, unknown>
      return saved
    })
    mocks.generateDocumentMock.mockResolvedValue({
      documentType: "privacy-policy",
      title: "Politică de Confidențialitate",
      content: "# Politică",
      generatedAtISO: "2026-03-20T10:00:00.000Z",
      llmUsed: false,
    })

    const res = await POST(
      makeRequest({
        documentType: "privacy-policy",
        orgName: "CompliScan SRL",
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.title).toBe("Politică de Confidențialitate")
    expect((saved as { generatedDocuments: Array<Record<string, unknown>> }).generatedDocuments[0]).toEqual(
      expect.objectContaining({
        documentType: "privacy-policy",
        title: "Politică de Confidențialitate",
        generatedAtISO: "2026-03-20T10:00:00.000Z",
        llmUsed: false,
      })
    )
    expect((saved as { events: Array<Record<string, unknown>> }).events[0]).toEqual(
      expect.objectContaining({
        type: "document.generated",
        entityType: "system",
        message: "Document generat: Politică de Confidențialitate.",
      })
    )
    expect(mocks.trackEventMock).toHaveBeenCalledWith("org-1", "generated_first_document", {
      docType: "privacy-policy",
    })
  })

  it("respinge tipurile de document invalide", async () => {
    const res = await POST(
      makeRequest({
        documentType: "unknown",
        orgName: "CompliScan SRL",
      })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe("INVALID_DOCUMENT_TYPE")
    expect(mocks.generateDocumentMock).not.toHaveBeenCalled()
    expect(mocks.mutateStateMock).not.toHaveBeenCalled()
  })
})
