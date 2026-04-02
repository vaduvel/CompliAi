import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  writeStateForOrgMock: vi.fn(),
  jsonErrorMock: vi.fn((message: string, status: number, code: string) =>
    new Response(JSON.stringify({ error: message, code }), { status })
  ),
}))

vi.mock("@/lib/server/auth", () => ({
  requireFreshRole: mocks.requireFreshRoleMock,
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
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
  writeStateForOrg: mocks.writeStateForOrgMock,
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: mocks.jsonErrorMock,
}))

import { PATCH } from "./route"

describe("PATCH /api/documents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      orgId: "org-1",
      orgName: "Demo Org SRL",
      role: "owner",
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      generatedDocuments: [
        {
          id: "doc-1",
          title: "Politică",
          validationStatus: "pending",
        },
      ],
    })
    mocks.writeStateForOrgMock.mockResolvedValue(undefined)
  })

  it("validează documentul în org-ul explicit din sesiune", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/documents/doc-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ validationStatus: "passed" }),
      }),
      { params: Promise.resolve({ id: "doc-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-1", "Demo Org SRL")
    expect(mocks.writeStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({
        generatedDocuments: [
          expect.objectContaining({
            id: "doc-1",
            validationStatus: "passed",
          }),
        ],
      }),
      "Demo Org SRL"
    )
    expect(payload).toEqual({ id: "doc-1", validationStatus: "passed" })
  })
})
