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
  readDsarStateMock: vi.fn(),
  updateDsarMock: vi.fn(),
  generateDsarDraftMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/dsar-store", () => ({
  readDsarState: mocks.readDsarStateMock,
  updateDsar: mocks.updateDsarMock,
}))

vi.mock("@/lib/compliance/dsar-drafts", () => ({
  generateDsarDraft: mocks.generateDsarDraftMock,
}))

import { GET } from "./route"

describe("GET /api/dsar/[id]/draft", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-dsar",
      orgName: "Org DSAR",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readDsarStateMock.mockResolvedValue({
      requests: [
        {
          id: "dsar-1",
          requestType: "access",
          requesterName: "Ion Popescu",
        },
      ],
    })
    mocks.generateDsarDraftMock.mockReturnValue("draft markdown")
    mocks.updateDsarMock.mockResolvedValue(undefined)
  })

  it("generează draftul pe org-ul din sesiune și marchează cererea", async () => {
    const response = await GET(new Request("http://localhost/api/dsar/dsar-1/draft"), {
      params: Promise.resolve({ id: "dsar-1" }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ draft: "draft markdown" })
    expect(mocks.readDsarStateMock).toHaveBeenCalledWith("org-dsar")
    expect(mocks.generateDsarDraftMock).toHaveBeenCalledWith({
      requestType: "access",
      requesterName: "Ion Popescu",
      orgName: "Org DSAR",
    })
    expect(mocks.updateDsarMock).toHaveBeenCalledWith("org-dsar", "dsar-1", {
      draftResponseGenerated: true,
    })
  })
})
