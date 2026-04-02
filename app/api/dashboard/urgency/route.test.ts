import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  readDsarStateMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  safeListReviewsMock: vi.fn(),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string

    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/dsar-store", () => ({
  readDsarState: mocks.readDsarStateMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: mocks.readNis2StateMock,
}))

vi.mock("@/lib/server/vendor-review-store", () => ({
  safeListReviews: mocks.safeListReviewsMock,
}))

import { GET } from "./route"

describe("GET /api/dashboard/urgency", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-urgency",
      orgName: "Urgency Org",
      role: "owner",
    })
    mocks.readDsarStateMock.mockResolvedValue({
      requests: [
        {
          id: "dsar-1",
          requesterName: "Maria Popescu",
          requestType: "access",
          status: "received",
          deadlineISO: new Date(Date.now() + 3 * 86_400_000).toISOString(),
          extendedDeadlineISO: null,
        },
      ],
    })
    mocks.readNis2StateMock.mockResolvedValue({
      incidents: [
        {
          id: "inc-1",
          title: "Incident critic",
          status: "open",
          severity: "critical",
          deadline24hISO: new Date(Date.now() + 86_400_000).toISOString(),
        },
      ],
    })
    mocks.safeListReviewsMock.mockResolvedValue([
      {
        id: "review-1",
        vendorName: "Vendor SRL",
        status: "overdue-review",
        urgency: "high",
        nextReviewDueISO: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      },
    ])
  })

  it("agregă urgențele pe org-ul din sesiunea fresh", async () => {
    const response = await GET(new Request("http://localhost/api/dashboard/urgency"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readDsarStateMock).toHaveBeenCalledWith("org-urgency")
    expect(mocks.readNis2StateMock).toHaveBeenCalledWith("org-urgency")
    expect(mocks.safeListReviewsMock).toHaveBeenCalledWith("org-urgency")
    expect(payload.total).toBe(3)
  })

  it("propagă 403 când rolul nu permite accesul", async () => {
    mocks.requireFreshRoleMock.mockRejectedValueOnce(
      new mocks.AuthzErrorMock("Fără acces.", 403, "AUTH_ROLE_FORBIDDEN")
    )

    const response = await GET(new Request("http://localhost/api/dashboard/urgency"))

    expect(response.status).toBe(403)
  })
})
