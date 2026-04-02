import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  normalizeComplianceStateMock: vi.fn(),
  computeDashboardSummaryMock: vi.fn(),
  buildRemediationPlanMock: vi.fn(),
  buildOnePageReportMock: vi.fn(),
  buildOnePageReportMarkdownMock: vi.fn(),
  buildPDFFromMarkdownMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
}))

vi.mock("@/lib/compliance/engine", async () => {
  const actual = await vi.importActual<typeof import("@/lib/compliance/engine")>(
    "@/lib/compliance/engine"
  )
  return {
    ...actual,
    normalizeComplianceState: mocks.normalizeComplianceStateMock,
    computeDashboardSummary: mocks.computeDashboardSummaryMock,
  }
})

vi.mock("@/lib/compliance/remediation", () => ({
  buildRemediationPlan: mocks.buildRemediationPlanMock,
}))

vi.mock("@/lib/compliance/one-page-report", () => ({
  buildOnePageReport: mocks.buildOnePageReportMock,
  buildOnePageReportMarkdown: mocks.buildOnePageReportMarkdownMock,
}))

vi.mock("@/lib/server/pdf-generator", () => ({
  buildPDFFromMarkdown: mocks.buildPDFFromMarkdownMock,
}))

import { POST } from "./route"

describe("POST /api/reports/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({ orgId: "org-1", orgName: "Demo Org SRL" })
    mocks.readStateForOrgMock.mockResolvedValue({ findings: [] })
    mocks.normalizeComplianceStateMock.mockImplementation((value: unknown) => value)
    mocks.computeDashboardSummaryMock.mockReturnValue({ score: 72 })
    mocks.buildRemediationPlanMock.mockReturnValue([{ id: "plan-1" }])
    mocks.buildOnePageReportMock.mockReturnValue({ reportId: "report-1" })
    mocks.buildOnePageReportMarkdownMock.mockReturnValue("# Demo report")
    mocks.buildPDFFromMarkdownMock.mockResolvedValue(Buffer.from("pdf-demo"))
  })

  it("generează PDF-ul folosind org-ul explicit din sesiune", async () => {
    const response = await POST(new Request("http://localhost/api/reports/pdf", { method: "POST" }))

    expect(response.status).toBe(200)
    expect(mocks.readStateForOrgMock).toHaveBeenCalledWith("org-1")
    expect(mocks.buildPDFFromMarkdownMock).toHaveBeenCalledWith(
      "# Demo report",
      expect.objectContaining({
        orgName: "Demo Org SRL",
        documentType: "Raport Executiv de Conformitate",
      })
    )
    expect(response.headers.get("content-type")).toBe("application/pdf")
  })
})
