import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveTemplateForTypeMock: vi.fn(),
  getWhiteLabelConfigMock: vi.fn(),
  listUserMembershipsMock: vi.fn(),
  requireFreshRoleMock: vi.fn(),
  resolveUserModeMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(
    async (_orgId: string, fn: (state: Record<string, unknown>) => unknown) => fn({})
  ),
  generateDocumentMock: vi.fn(),
  trackEventMock: vi.fn(),
  jsonErrorMock: vi.fn((message: string, status: number, code: string) =>
    new Response(JSON.stringify({ error: message, code }), { status })
  ),
}))

vi.mock("@/lib/server/auth", () => ({
  requireFreshRole: mocks.requireFreshRoleMock,
  listUserMemberships: mocks.listUserMembershipsMock,
  resolveUserMode: mocks.resolveUserModeMock,
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

vi.mock("@/lib/server/cabinet-templates-store", () => ({
  getActiveTemplateForType: mocks.getActiveTemplateForTypeMock,
}))

vi.mock("@/lib/server/white-label", () => ({
  getWhiteLabelConfig: mocks.getWhiteLabelConfigMock,
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: mocks.jsonErrorMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
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
    { id: "ropa" },
  ],
  getGeneratedDocumentTitle: vi.fn((input: { orgName: string }) => `Registru de Prelucrări (RoPA) — ${input.orgName}`),
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
    mocks.requireFreshRoleMock.mockResolvedValue({
      orgId: "org-1",
      userId: "user-1",
      email: "owner@example.com",
      role: "owner",
      userMode: "solo",
    })
    mocks.getActiveTemplateForTypeMock.mockResolvedValue(null)
    mocks.getWhiteLabelConfigMock.mockResolvedValue(null)
    mocks.listUserMembershipsMock.mockResolvedValue([])
    mocks.resolveUserModeMock.mockResolvedValue("solo")
  })

  it("persista metadata documentului generat in state si intoarce payload-ul", async () => {
    let saved: unknown = null
    mocks.mutateStateForOrgMock.mockImplementation(
      async (_orgId: string, fn: (state: Record<string, unknown>) => unknown) => {
        saved = fn({ generatedDocuments: [], events: [] }) as Record<string, unknown>
        return saved
      }
    )
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
    expect(body.recordId).toBeTruthy()
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

  it("leaga draftul de finding cand vine din flow-ul ghidat", async () => {
    let saved: unknown = null
    mocks.mutateStateForOrgMock.mockImplementation(
      async (_orgId: string, fn: (state: Record<string, unknown>) => unknown) => {
        saved = fn({ generatedDocuments: [], events: [] }) as Record<string, unknown>
        return saved
      }
    )
    mocks.generateDocumentMock.mockResolvedValue({
      documentType: "dpa",
      title: "Acord DPA",
      content: "# DPA",
      generatedAtISO: "2026-03-20T10:00:00.000Z",
      llmUsed: false,
    })

    const res = await POST(
      makeRequest({
        documentType: "dpa",
        orgName: "CompliScan SRL",
        sourceFindingId: "finding-1",
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.sourceFindingId).toBe("finding-1")
    expect((saved as { generatedDocuments: Array<Record<string, unknown>> }).generatedDocuments[0]).toEqual(
      expect.objectContaining({
        documentType: "dpa",
        sourceFindingId: "finding-1",
        approvalStatus: "draft",
      })
    )
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
    expect(mocks.mutateStateForOrgMock).not.toHaveBeenCalled()
  })

  it("acceptă conținutul pre-generat pentru ROPA fără să mai cheme generatorul LLM", async () => {
    let saved: unknown = null
    mocks.mutateStateForOrgMock.mockImplementation(
      async (_orgId: string, fn: (state: Record<string, unknown>) => unknown) => {
        saved = fn({ generatedDocuments: [], events: [] }) as Record<string, unknown>
        return saved
      }
    )

    const markdown = "# Registru de Prelucrări (RoPA)\n\n| Activitate | Scop |\n| --- | --- |\n| Facturare | Executare contract |"

    const res = await POST(
      makeRequest({
        documentType: "ropa",
        orgName: "CompliScan SRL",
        sourceFindingId: "finding-ropa-1",
        pregeneratedContent: markdown,
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.title).toBe("Registru de Prelucrări (RoPA) — CompliScan SRL")
    expect(body.content).toBe(markdown)
    expect(mocks.generateDocumentMock).not.toHaveBeenCalled()
    expect((saved as { generatedDocuments: Array<Record<string, unknown>> }).generatedDocuments[0]).toEqual(
      expect.objectContaining({
        documentType: "ropa",
        title: "Registru de Prelucrări (RoPA) — CompliScan SRL",
        content: markdown,
        sourceFindingId: "finding-ropa-1",
        approvalStatus: "draft",
        validationStatus: "pending",
      })
    )
  })

  it("moștenește template-ul cabinetului când consultantul generează document în workspace-ul clientului", async () => {
    let saved: unknown = null
    mocks.requireFreshRoleMock.mockResolvedValueOnce({
      orgId: "client-org",
      userId: "user-1",
      email: "diana@dpocomplet.ro",
      role: "partner_manager",
      userMode: "partner",
    })
    mocks.resolveUserModeMock.mockResolvedValueOnce("partner")
    mocks.listUserMembershipsMock.mockResolvedValueOnce([
      {
        membershipId: "membership-cabinet",
        orgId: "cabinet-org",
        orgName: "DPO Complet SRL",
        role: "owner",
        createdAtISO: "2026-04-28T10:00:00.000Z",
        status: "active",
      },
      {
        membershipId: "membership-client",
        orgId: "client-org",
        orgName: "Apex Logistic SRL",
        role: "partner_manager",
        createdAtISO: "2026-04-28T10:00:00.000Z",
        status: "active",
      },
    ])
    mocks.getActiveTemplateForTypeMock.mockImplementation(async (orgId: string) =>
      orgId === "cabinet-org"
        ? {
            id: "tpl-dpa",
            orgId: "cabinet-org",
            documentType: "dpa",
            name: "DPO Complet DPA",
            content: "# Template DPO Complet\n\nClient: {{ORG_NAME}}\n\nClauză cabinet custom pentru procesatori.",
            uploadedAtISO: "2026-04-28T10:00:00.000Z",
            updatedAtISO: "2026-04-28T10:00:00.000Z",
            active: true,
            detectedVariables: ["ORG_NAME"],
            sizeBytes: 96,
          }
        : null
    )
    mocks.mutateStateForOrgMock.mockImplementation(
      async (_orgId: string, fn: (state: Record<string, unknown>) => unknown) => {
        saved = fn({ generatedDocuments: [], events: [] }) as Record<string, unknown>
        return saved
      }
    )
    mocks.generateDocumentMock.mockResolvedValue({
      documentType: "dpa",
      title: "Acord DPA",
      content: "# Template DPO Complet\n\nClient: Apex Logistic SRL",
      generatedAtISO: "2026-04-28T10:00:00.000Z",
      llmUsed: false,
    })

    const res = await POST(
      makeRequest({
        documentType: "dpa",
        orgName: "Apex Logistic SRL",
        counterpartyName: "Stripe Payments Europe",
      })
    )

    expect(res.status).toBe(200)
    expect(mocks.getActiveTemplateForTypeMock).toHaveBeenNthCalledWith(1, "client-org", "dpa")
    expect(mocks.getActiveTemplateForTypeMock).toHaveBeenNthCalledWith(2, "cabinet-org", "dpa")
    expect(mocks.generateDocumentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cabinetTemplateName: "DPO Complet DPA",
        cabinetTemplateContent: expect.stringContaining("Clauză cabinet custom"),
      })
    )
    expect((saved as { generatedDocuments: Array<Record<string, unknown>> }).generatedDocuments[0]).toEqual(
      expect.objectContaining({
        documentType: "dpa",
        title: "Acord DPA",
      })
    )
  })
})
