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
  getReviewCycleMock: vi.fn(),
  updateReviewCycleMock: vi.fn(),
  markReviewCycleCompletedMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

vi.mock("@/lib/server/review-cycle-store", () => ({
  getReviewCycle: mocks.getReviewCycleMock,
  updateReviewCycle: mocks.updateReviewCycleMock,
  markReviewCycleCompleted: mocks.markReviewCycleCompletedMock,
}))

import { GET, PATCH } from "./route"

describe("review cycle by id route", () => {
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
      findings: [{ id: "finding-1", title: "Policy lipsă", findingStatus: "open", reviewState: "open" }],
    })
    mocks.getReviewCycleMock.mockResolvedValue({
      id: "cycle-1",
      orgId: "org-1",
      findingId: "finding-1",
      findingTypeId: null,
      reviewType: "manual",
      status: "upcoming",
      scheduledAt: "2099-01-01T00:00:00.000Z",
      notes: null,
      outcome: null,
      createdAt: "2026-04-02T10:00:00.000Z",
      completedAt: null,
      completedBy: null,
    })
  })

  it("îmbogățește response-ul din org-ul activ", async () => {
    const response = await GET(new Request("http://localhost/api/review-cycles/cycle-1"), {
      params: Promise.resolve({ id: "cycle-1" }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-1", "Org Demo")
    expect(payload.item.findingTitle).toBe("Policy lipsă")
  })

  it("marchează review-ul completat în org-ul activ", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/review-cycles/cycle-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complete: true, outcome: "done" }),
      }),
      { params: Promise.resolve({ id: "cycle-1" }) }
    )

    expect(response.status).toBe(200)
    expect(mocks.markReviewCycleCompletedMock).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "org-1", cycleId: "cycle-1" })
    )
  })
})
