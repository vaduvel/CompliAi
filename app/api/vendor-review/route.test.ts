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
  requireFreshAuthenticatedSessionMock: vi.fn(),
  safeListReviewsMock: vi.fn(),
  createReviewMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  appendAuditMock: vi.fn(),
  generateVendorGovernancePackMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
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

import { GET, POST } from "./route"

describe("GET /api/vendor-review", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-demo-imm",
      orgName: "Demo Retail SRL",
      email: "demo@demo-imm.compliscan.ro",
      role: "owner",
    })
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
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Autentificare necesară.", 401, "UNAUTHORIZED")
    )

    const response = await GET(new Request("http://localhost/api/vendor-review"))
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("UNAUTHORIZED")
  })

  it("returneaza lista vida cand vendor review storage nu are date disponibile", async () => {
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

  it("creează review-ul în org-ul sesiunii", async () => {
    mocks.readNis2StateMock.mockResolvedValueOnce({
      vendors: [
        { id: "vendor-1", name: "OpenAI", techConfidence: "high", riskLevel: "high" },
      ],
    })
    mocks.createReviewMock.mockImplementation(async (_orgId, review) => review)

    const response = await POST(
      new Request("http://localhost/api/vendor-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: "vendor-1" }),
      })
    )

    expect(response.status).toBe(201)
    expect(mocks.createReviewMock).toHaveBeenCalledWith(
      "org-demo-imm",
      expect.objectContaining({ vendorId: "vendor-1", vendorName: "OpenAI" })
    )
  })
})
