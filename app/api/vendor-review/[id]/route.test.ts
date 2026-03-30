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
  requireRoleMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  getReviewMock: vi.fn(),
  updateReviewMock: vi.fn(),
  deleteReviewMock: vi.fn(),
  mutateStateMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  readSessionFromRequest: mocks.readSessionFromRequestMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/vendor-review-store", () => ({
  getReview: mocks.getReviewMock,
  updateReview: mocks.updateReviewMock,
  deleteReview: mocks.deleteReviewMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: mocks.mutateStateMock,
}))

import { PATCH } from "./route"

describe("vendor review single route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-demo",
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
    expect(mocks.updateReviewMock).toHaveBeenCalled()
  })
})
