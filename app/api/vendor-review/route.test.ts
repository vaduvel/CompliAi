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
  readSessionFromRequestMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  safeListReviewsMock: vi.fn(),
  createReviewMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  appendAuditMock: vi.fn(),
  generateVendorGovernancePackMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  readSessionFromRequest: mocks.readSessionFromRequestMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/vendor-review-store", () => ({
  safeListReviews: mocks.safeListReviewsMock,
  createReview: mocks.createReviewMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: mocks.readNis2StateMock,
}))

vi.mock("@/lib/compliance/vendor-review-engine", () => ({
  appendAudit: mocks.appendAuditMock,
  generateVendorGovernancePack: mocks.generateVendorGovernancePackMock,
}))

import { GET } from "./route"

describe("GET /api/vendor-review", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getOrgContextMock.mockResolvedValue({ orgId: "org-demo-imm", orgName: "Demo Retail SRL" })
    mocks.safeListReviewsMock.mockResolvedValue([])
    mocks.readNis2StateMock.mockResolvedValue({ vendors: [{ id: "vendor-1" }] })
    mocks.generateVendorGovernancePackMock.mockReturnValue({
      title: "Pachet minim Vendor Review",
      summary: "sumar",
      assets: [{ id: "asset-1" }],
      completionChecklist: ["c1", "c2", "c3"],
    })
  })

  it("cere autentificare cand nu exista sesiune", async () => {
    mocks.readSessionFromRequestMock.mockReturnValue(null)

    const response = await GET(new Request("http://localhost/api/vendor-review"))
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("UNAUTHORIZED")
  })

  it("returneaza lista vida cand vendor review storage nu are date disponibile", async () => {
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-demo-imm",
      email: "demo@demo-imm.compliscan.ro",
      orgName: "Demo Retail SRL",
      role: "owner",
    })

    const response = await GET(new Request("http://localhost/api/vendor-review"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      reviews: [],
      pack: {
        title: "Pachet minim Vendor Review",
        summary: "sumar",
        assets: [{ id: "asset-1" }],
        completionChecklist: ["c1", "c2", "c3"],
      },
    })
    expect(mocks.safeListReviewsMock).toHaveBeenCalledWith("org-demo-imm")
    expect(mocks.generateVendorGovernancePackMock).toHaveBeenCalledWith({
      orgName: "Demo Retail SRL",
      knownVendorCount: 1,
    })
  })
})
