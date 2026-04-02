import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  normalizeComplianceStateMock: vi.fn(),
  computeDashboardSummaryMock: vi.fn(),
  buildRemediationPlanMock: vi.fn(),
  buildComplianceResponseMock: vi.fn(),
  buildCounselBriefMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
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

vi.mock("@/lib/compliance/response-pack", () => ({
  buildComplianceResponse: mocks.buildComplianceResponseMock,
  buildCounselBrief: mocks.buildCounselBriefMock,
}))

import { POST } from "./route"

describe("POST /api/reports/counsel-brief", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({ orgId: "org-1", orgName: "Demo Org SRL" })
    mocks.readFreshStateForOrgMock.mockResolvedValue({ findings: [] })
    mocks.normalizeComplianceStateMock.mockImplementation((value: unknown) => value)
    mocks.computeDashboardSummaryMock.mockReturnValue({ score: 65 })
    mocks.buildRemediationPlanMock.mockReturnValue([{ id: "plan-1" }])
    mocks.buildComplianceResponseMock.mockReturnValue({ reportId: "response-1" })
    mocks.buildCounselBriefMock.mockReturnValue({ summary: "ok" })
  })

  it("construiește brief-ul folosind org-ul explicit din sesiune", async () => {
    const response = await POST(
      new Request("http://localhost/api/reports/counsel-brief", { method: "POST" })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-1", "Demo Org SRL")
    expect(mocks.buildComplianceResponseMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      "Demo Org SRL",
      expect.any(String)
    )
    expect(payload).toEqual({
      ok: true,
      brief: { summary: "ok" },
    })
  })
})
