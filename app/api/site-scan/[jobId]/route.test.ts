import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorClass: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorClass,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

import { GET } from "./route"

describe("GET /api/site-scan/[jobId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 1000,
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      siteScanJobs: {
        "job-1": {
          jobId: "job-1",
          url: "https://example.com",
          status: "done",
          createdAtISO: "2026-04-02T08:00:00.000Z",
          completedAtISO: "2026-04-02T08:00:05.000Z",
          result: { reachable: true },
        },
      },
    })
  })

  it("citește jobul din org-ul sesiunii", async () => {
    const response = await GET(
      new Request("http://localhost/api/site-scan/job-1"),
      { params: Promise.resolve({ jobId: "job-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.jobId).toBe("job-1")
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-1", "Org Demo")
  })

  it("intoarce 404 cand jobul nu exista", async () => {
    mocks.readFreshStateForOrgMock.mockResolvedValueOnce({ siteScanJobs: {} })

    const response = await GET(
      new Request("http://localhost/api/site-scan/job-x"),
      { params: Promise.resolve({ jobId: "job-x" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.code).toBe("JOB_NOT_FOUND")
  })

  it("respinge fără sesiune activă", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorClass("Ai nevoie de sesiune activa.")
    )

    const response = await GET(
      new Request("http://localhost/api/site-scan/job-1"),
      { params: Promise.resolve({ jobId: "job-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("AUTH_SESSION_REQUIRED")
  })
})
