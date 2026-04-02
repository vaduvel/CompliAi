import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readSessionFromRequestMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  normalizeComplianceStateMock: vi.fn(),
  computeDashboardSummaryMock: vi.fn(),
  getSectorBenchmarkMock: vi.fn(),
  jsonErrorMock: vi.fn((message: string, status: number, code: string) =>
    new Response(JSON.stringify({ error: message, code }), { status })
  ),
}))

vi.mock("@/lib/server/auth", () => ({
  readSessionFromRequest: mocks.readSessionFromRequestMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
}))

vi.mock("@/lib/compliance/engine", () => ({
  normalizeComplianceState: mocks.normalizeComplianceStateMock,
  computeDashboardSummary: mocks.computeDashboardSummaryMock,
}))

vi.mock("@/lib/sector-benchmark", () => ({
  getSectorBenchmark: mocks.getSectorBenchmarkMock,
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: mocks.jsonErrorMock,
}))

import { GET } from "./route"

describe("GET /api/benchmark", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "viewer",
      exp: Date.now() + 1000,
    })
    mocks.readStateForOrgMock.mockResolvedValue({
      gdprProgress: 12,
      orgProfile: { sector: "retail" },
    })
    mocks.normalizeComplianceStateMock.mockImplementation((value: unknown) => value)
    mocks.computeDashboardSummaryMock.mockReturnValue({ score: 82, riskLabel: "Risc Scăzut" })
    mocks.getSectorBenchmarkMock.mockResolvedValue({
      medie: 61,
      percentil: 88,
      nrFirme: 14,
      sector: "Retail",
    })
  })

  it("foloseste scorul canonic din computeDashboardSummary, nu gdprProgress", async () => {
    const response = await GET(new Request("http://localhost/api/benchmark"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.benchmark).toEqual(
      expect.objectContaining({
        percentil: 88,
      })
    )
    expect(mocks.getSectorBenchmarkMock).toHaveBeenCalledWith("org-1", "47", 82)
  })
})
