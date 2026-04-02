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
  listReviewCyclesMock: vi.fn(),
  createReviewCycleMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

vi.mock("@/lib/server/review-cycle-store", () => ({
  listReviewCycles: mocks.listReviewCyclesMock,
  createReviewCycle: mocks.createReviewCycleMock,
}))

import { GET, POST } from "./route"

describe("review cycles route", () => {
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
    mocks.listReviewCyclesMock.mockResolvedValue([
      {
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
      },
    ])
    mocks.createReviewCycleMock.mockResolvedValue({ id: "cycle-2" })
  })

  it("citește review cycles din org-ul activ", async () => {
    const response = await GET(new Request("http://localhost/api/review-cycles"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-1", "Org Demo")
    expect(payload.items[0].findingTitle).toBe("Policy lipsă")
  })

  it("creează review cycle în org-ul activ", async () => {
    const response = await POST(
      new Request("http://localhost/api/review-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          findingId: "finding-1",
          scheduledAt: "2099-01-01T00:00:00.000Z",
        }),
      })
    )

    expect(response.status).toBe(201)
    expect(mocks.createReviewCycleMock).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: "org-1", findingId: "finding-1" })
    )
  })
})
