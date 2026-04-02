import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  cacheXmlForSubmissionMock: vi.fn(),
  initiateSubmitMock: vi.fn(),
  listSubmissionsMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  requireRoleMock: vi.fn(),
  validateEFacturaXmlMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
}))

vi.mock("@/lib/server/anaf-submit-flow", () => ({
  cacheXmlForSubmission: mocks.cacheXmlForSubmissionMock,
  initiateSubmit: mocks.initiateSubmitMock,
  listSubmissions: mocks.listSubmissionsMock,
}))

vi.mock("@/lib/compliance/efactura-validator", () => ({
  validateEFacturaXml: mocks.validateEFacturaXmlMock,
}))

import { POST } from "./route"

describe("POST /api/fiscal/submit-spv", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      orgId: "org-session",
      userId: "user-1",
    })
    mocks.readStateForOrgMock.mockResolvedValue({
      orgProfile: { cui: "RO45758405" },
    })
    mocks.validateEFacturaXmlMock.mockReturnValue({
      id: "validation-1",
      valid: true,
      errors: [],
      warnings: [],
      documentName: "TEST-INV-001",
      xmlHash: "hash-1",
      validatedAtISO: "2026-04-02T08:00:00.000Z",
    })
    mocks.initiateSubmitMock.mockResolvedValue({
      submission: {
        id: "submission-1",
        orgId: "org-session",
        invoiceId: "TEST-INV-001",
        xmlSnippet: "<Invoice",
        cif: "RO45758405",
        approvalActionId: "approval-1",
        status: "pending_approval",
        indexDescarcare: null,
        anafStatus: null,
        anafMessage: null,
        downloadId: null,
        createdAtISO: "2026-04-02T08:00:00.000Z",
        submittedAtISO: null,
        resolvedAtISO: null,
        sourceFindingId: "finding-1",
        errorDetail: null,
      },
      pendingAction: {
        id: "approval-1",
      },
    })
  })

  it("citește CUI-ul din org-ul sesiunii, nu din header", async () => {
    const response = await POST(
      new Request("http://localhost/api/fiscal/submit-spv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-compliscan-org-id": "org-header",
          "x-compliscan-user-id": "user-header",
        },
        body: JSON.stringify({
          invoiceId: "TEST-INV-001",
          xmlContent: "<Invoice />",
          sourceFindingId: "finding-1",
        }),
      })
    )

    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(mocks.readStateForOrgMock).toHaveBeenCalledWith("org-session")
    expect(mocks.initiateSubmitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-session",
        userId: "user-1",
        cif: "RO45758405",
        sourceFindingId: "finding-1",
      })
    )
    expect(mocks.cacheXmlForSubmissionMock).toHaveBeenCalledWith("submission-1", "<Invoice />")
  })

  it("blochează inițierea dacă org-ul activ nu are CUI configurat", async () => {
    mocks.readStateForOrgMock.mockResolvedValueOnce({ orgProfile: { cui: "" } })

    const response = await POST(
      new Request("http://localhost/api/fiscal/submit-spv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-compliscan-org-id": "org-without-cui",
        },
        body: JSON.stringify({
          invoiceId: "TEST-INV-001",
          xmlContent: "<Invoice />",
        }),
      })
    )

    const body = await response.json()

    expect(mocks.readStateForOrgMock).toHaveBeenCalledWith("org-session")
    expect(response.status).toBe(400)
    expect(body.code).toBe("NO_CUI")
    expect(mocks.initiateSubmitMock).not.toHaveBeenCalled()
  })
})
