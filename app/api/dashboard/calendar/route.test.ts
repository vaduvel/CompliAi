import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET } from "./route"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  readDsarStateMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  safeListReviewsMock: vi.fn(),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
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

const SESSION = { userId: "user-1", orgId: "org-1", orgName: "Org Test", email: "owner@test.ro" }

describe("GET /api/dashboard/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.readDsarStateMock.mockResolvedValue({
      requests: [
        {
          id: "dsar-1",
          requesterName: "Ion Popescu",
          requestType: "access",
          status: "received",
          deadlineISO: new Date(Date.now() + 2 * 86_400_000).toISOString(),
        },
      ],
    })
    mocks.readNis2StateMock.mockResolvedValue({ incidents: [], vendors: [] })
    mocks.safeListReviewsMock.mockResolvedValue([])
  })

  it("agregă evenimentele pe org-ul sesiunii", async () => {
    const res = await GET(new Request("http://localhost/api/dashboard/calendar"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.total).toBe(1)
    expect(mocks.readDsarStateMock).toHaveBeenCalledWith("org-1")
    expect(mocks.readNis2StateMock).toHaveBeenCalledWith("org-1")
    expect(mocks.safeListReviewsMock).toHaveBeenCalledWith("org-1")
  })
})
