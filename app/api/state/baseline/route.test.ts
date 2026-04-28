import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

type MockBaselineState = {
  snapshotHistory: Array<{ snapshotId: string }>
  events: unknown[]
  validatedBaselineSnapshotId?: string
}

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
  buildDashboardPayloadMock: vi.fn(),
  buildCompliScanSnapshotMock: vi.fn(),
  buildRemediationPlanMock: vi.fn(),
  computeDashboardSummaryMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  requireFreshRoleMock: vi.fn(),
}))

vi.mock("@/lib/compliance/engine", () => ({
  computeDashboardSummary: mocks.computeDashboardSummaryMock,
}))

vi.mock("@/lib/compliance/remediation", () => ({
  buildRemediationPlan: mocks.buildRemediationPlanMock,
}))

vi.mock("@/lib/server/compliscan-export", () => ({
  buildCompliScanSnapshot: mocks.buildCompliScanSnapshotMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

describe("POST /api/state/baseline", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "compliance",
      exp: Date.now() + 1000,
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-ctx",
      orgName: "Workspace Org",
      workspaceLabel: "Workspace",
      workspaceOwner: "Owner",
      workspaceInitials: "WO",
      userRole: "compliance",
    })
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
    mocks.computeDashboardSummaryMock.mockReturnValue({ score: 100, riskLabel: "low" })
    mocks.buildRemediationPlanMock.mockReturnValue([])
    mocks.buildCompliScanSnapshotMock.mockReturnValue({
      version: "1.0",
      snapshotId: "snap-generated",
      generatedAt: "2026-04-28T10:00:00.000Z",
      comparedToSnapshotId: null,
      workspace: {
        id: "org-1",
        name: "Org Demo",
        label: "Org Demo",
        owner: "demo@site.ro",
      },
      sources: [],
      systems: [],
      findings: [],
      drift: [],
      summary: {
        complianceScore: 100,
        riskLabel: "low",
        openFindings: 0,
        openAlerts: 0,
        systemsDetected: 0,
        highRiskSystems: 0,
      },
    })
  })

  it("creeaza snapshot curent daca nu exista inca snapshot persistat", async () => {
    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: MockBaselineState) => unknown) =>
      updater({
        snapshotHistory: [],
        events: [],
      })
    )

    const response = await POST(
      new Request("http://localhost/api/state/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.state.validatedBaselineSnapshotId).toBe("snap-generated")
    expect(payload.state.snapshotHistory[0].snapshotId).toBe("snap-generated")
  })

  it("seteaza baseline-ul pe snapshot-ul curent", async () => {
    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: MockBaselineState) => unknown) =>
      updater({
        snapshotHistory: [{ snapshotId: "snap-1" }],
        events: [],
      })
    )

    const response = await POST(
      new Request("http://localhost/api/state/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toContain("salvat ca baseline validat")
    expect(payload.state.validatedBaselineSnapshotId).toBe("snap-1")
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith("org-1", expect.any(Function), "Org Demo")
  })

  it("permite clear pentru baseline-ul validat", async () => {
    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: MockBaselineState) => unknown) =>
      updater({
        snapshotHistory: [{ snapshotId: "snap-1" }],
        validatedBaselineSnapshotId: "snap-1",
        events: [],
      })
    )

    const response = await POST(
      new Request("http://localhost/api/state/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toContain("a fost eliminat")
    expect(payload.state.validatedBaselineSnapshotId).toBeUndefined()
  })

  it("respinge accesul pentru rol nepermis", async () => {
    mocks.requireFreshRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await POST(
      new Request("http://localhost/api/state/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
