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
  requireFreshRoleMock: vi.fn(),
  getReviewMock: vi.fn(),
  updateReviewMock: vi.fn(),
  deleteReviewMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/vendor-review-store", () => ({
  getReview: mocks.getReviewMock,
  updateReview: mocks.updateReviewMock,
  deleteReview: mocks.deleteReviewMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

import { DELETE, GET, PATCH } from "./route"

describe("vendor review single route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      email: "owner@example.com",
      role: "owner",
      orgId: "org-demo",
      orgName: "Org Demo",
    })
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      email: "owner@example.com",
      role: "owner",
      orgId: "org-demo",
      orgName: "Org Demo",
    })
    mocks.getReviewMock.mockResolvedValue({
      id: "vr-1",
      vendorId: "vendor-1",
      vendorName: "OpenAI",
      status: "awaiting-evidence",
      urgency: "high",
      category: "ai",
      confidence: "high",
      detectionSource: "vendor-registry",
      createdAtISO: "2026-03-30T10:00:00.000Z",
      updatedAtISO: "2026-03-30T10:00:00.000Z",
      auditTrail: [],
    })
    mocks.updateReviewMock.mockImplementation(async (_orgId, _reviewId, patch) => ({
      id: "vr-1",
      vendorId: "vendor-1",
      vendorName: "OpenAI",
      status: "awaiting-evidence",
      urgency: "high",
      category: "ai",
      confidence: "high",
      detectionSource: "vendor-registry",
      createdAtISO: "2026-03-30T10:00:00.000Z",
      updatedAtISO: "2026-03-30T11:00:00.000Z",
      auditTrail: [],
      ...patch,
    }))
    mocks.mutateStateForOrgMock.mockResolvedValue({
      orgKnowledge: {
        items: [],
        lastUpdatedAtISO: null,
      },
    })
  })

  it("salvează termenul și nota de follow-up", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/vendor-review/vr-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "schedule-follow-up",
          followUpDueISO: "2026-04-07T00:00:00.000Z",
          followUpNote: "Așteptăm DPA semnat.",
        }),
      }),
      { params: Promise.resolve({ id: "vr-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.review.followUpDueISO).toBe("2026-04-07T00:00:00.000Z")
    expect(payload.review.followUpNote).toBe("Așteptăm DPA semnat.")
    expect(mocks.updateReviewMock).toHaveBeenCalledWith(
      "org-demo",
      "vr-1",
      expect.objectContaining({
        followUpDueISO: "2026-04-07T00:00:00.000Z",
      })
    )
  })

  it("citește review-ul din org-ul sesiunii", async () => {
    const response = await GET(
      new Request("http://localhost/api/vendor-review/vr-1"),
      { params: Promise.resolve({ id: "vr-1" }) }
    )

    expect(response.status).toBe(200)
    expect(mocks.getReviewMock).toHaveBeenCalledWith("org-demo", "vr-1")
  })

  it("șterge review-ul din org-ul sesiunii", async () => {
    mocks.deleteReviewMock.mockResolvedValueOnce(true)

    const response = await DELETE(
      new Request("http://localhost/api/vendor-review/vr-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "vr-1" }) }
    )

    expect(response.status).toBe(200)
    expect(mocks.deleteReviewMock).toHaveBeenCalledWith("org-demo", "vr-1")
  })
})
