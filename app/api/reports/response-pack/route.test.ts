import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readStateMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  listReviewsMock: vi.fn(),
  normalizeComplianceStateMock: vi.fn(),
  computeDashboardSummaryMock: vi.fn(),
  buildRemediationPlanMock: vi.fn(),
  buildComplianceResponseMock: vi.fn(),
  buildComplianceResponseHtmlMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/vendor-review-store", () => ({
  listReviews: mocks.listReviewsMock,
  safeListReviews: mocks.listReviewsMock,
}))

vi.mock("@/lib/compliance/engine", () => ({
  normalizeComplianceState: mocks.normalizeComplianceStateMock,
  computeDashboardSummary: mocks.computeDashboardSummaryMock,
}))

vi.mock("@/lib/compliance/remediation", () => ({
  buildRemediationPlan: mocks.buildRemediationPlanMock,
}))

vi.mock("@/lib/compliance/response-pack", () => ({
  buildComplianceResponse: mocks.buildComplianceResponseMock,
  buildComplianceResponseHtml: mocks.buildComplianceResponseHtmlMock,
}))

vi.mock("@/lib/compliance/efactura-signal-hardening", () => ({
  buildFiscalSummary: vi.fn().mockReturnValue({
    totalSignals: 0, criticalUrgency: 0, highUrgency: 0,
    fiscalHealthLabel: "sănătos", repeatedRejectionVendors: 0, pendingTooLong: 0, averageUrgency: 0,
  }),
}))

vi.mock("@/lib/compliance/filing-discipline", () => ({
  computeFilingDisciplineScore: vi.fn().mockReturnValue({ score: 100, label: "excelent", onTime: 0, late: 0, missing: 0, rectified: 0, total: 0, details: "" }),
  generateFilingReminders: vi.fn().mockReturnValue([]),
  buildOverdueFilingFindings: vi.fn().mockReturnValue([]),
}))

import { POST } from "./route"

describe("POST /api/reports/response-pack", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.readStateMock.mockResolvedValue({ findings: [], alerts: [], efacturaConnected: false })
    mocks.getOrgContextMock.mockResolvedValue({ orgId: "org-demo-imm", orgName: "Demo Retail SRL" })
    mocks.listReviewsMock.mockResolvedValue([])
    mocks.normalizeComplianceStateMock.mockImplementation((value: unknown) => value)
    mocks.computeDashboardSummaryMock.mockReturnValue({ score: 72 })
    mocks.buildRemediationPlanMock.mockReturnValue([{ id: "plan-1" }])
    mocks.buildComplianceResponseMock.mockReturnValue({ reportId: "report-1" })
    mocks.buildComplianceResponseHtmlMock.mockReturnValue("<html>ok</html>")
  })

  it("genereaza response pack si fara vendor reviews", async () => {
    const response = await POST(new Request("http://localhost/api/reports/response-pack", { method: "POST" }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.report).toEqual({ reportId: "report-1" })
    expect(payload.html).toBe("<html>ok</html>")
  })

  it("degradeaza gratios cand vendor review store returneaza gol", async () => {
    mocks.listReviewsMock.mockResolvedValueOnce([])

    const response = await POST(new Request("http://localhost/api/reports/response-pack", { method: "POST" }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.report).toEqual({ reportId: "report-1" })
    expect(mocks.buildComplianceResponseMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      "Demo Retail SRL",
      expect.any(String),
      undefined,
      undefined,
    )
  })
})
