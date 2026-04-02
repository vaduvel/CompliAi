import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string

    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshRoleMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  buildAnnexIVDocumentMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/compliance/ai-conformity-assessment", () => ({
  buildAnnexIVDocument: mocks.buildAnnexIVDocumentMock,
}))

import { POST } from "./route"

describe("POST /api/ai-act/annex-iv", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      aiSystems: [
        {
          id: "sys-1",
          name: "Scoring AI",
          vendor: "Vendor",
          modelType: "ml",
          purpose: "Scoring",
          riskLevel: "high",
          usesPersonalData: true,
          makesAutomatedDecisions: true,
          impactsRights: true,
          hasHumanReview: true,
          annexIIIHint: "credit-scoring",
          createdAtISO: "2026-04-02T08:00:00.000Z",
        },
      ],
      generatedDocuments: [],
    })
    mocks.buildAnnexIVDocumentMock.mockReturnValue({
      title: "Annex IV",
      content: "# Annex IV",
      generatedAtISO: "2026-04-02T08:30:00.000Z",
    })
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId, updater) =>
      updater({
        generatedDocuments: [],
      })
    )
  })

  it("genereaza documentul pe org-ul din sesiune", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai-act/annex-iv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ systemId: "sys-1" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-1", "Org Demo")
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
    expect(payload.title).toBe("Annex IV")
  })
})
