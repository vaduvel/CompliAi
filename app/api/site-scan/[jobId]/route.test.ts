import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readSessionFromRequestMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  readSessionFromRequest: mocks.readSessionFromRequestMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
}))

import { GET } from "./route"

describe("GET /api/site-scan/[jobId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 1000,
    })
    mocks.readStateForOrgMock.mockResolvedValue({
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
    expect(mocks.readStateForOrgMock).toHaveBeenCalledWith("org-1")
  })

  it("intoarce 404 cand jobul nu exista", async () => {
    mocks.readStateForOrgMock.mockResolvedValueOnce({ siteScanJobs: {} })

    const response = await GET(
      new Request("http://localhost/api/site-scan/job-x"),
      { params: Promise.resolve({ jobId: "job-x" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.code).toBe("JOB_NOT_FOUND")
  })
})
