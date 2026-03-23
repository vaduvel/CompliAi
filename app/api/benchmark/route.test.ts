import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getOrgContextMock: vi.fn(),
  readStateMock: vi.fn(),
  normalizeComplianceStateMock: vi.fn(),
  computeDashboardSummaryMock: vi.fn(),
  getSectorBenchmarkMock: vi.fn(),
  jsonErrorMock: vi.fn((message: string, status: number, code: string) =>
    new Response(JSON.stringify({ error: message, code }), { status })
  ),
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
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
    mocks.getOrgContextMock.mockResolvedValue({ orgId: "org-1" })
    mocks.readStateMock.mockResolvedValue({
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
    const response = await GET()
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
