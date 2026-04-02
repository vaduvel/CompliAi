import { beforeEach, describe, expect, it, vi } from "vitest"

import { PATCH } from "./route"

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
  computeDashboardSummaryMock: vi.fn(),
  getPersistableTaskIdsMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  getTaskResolutionTargetsMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  normalizeComplianceStateMock: vi.fn(),
  requireRoleMock: vi.fn(),
  validateTaskAgainstStateMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/compliance/engine", () => ({
  computeDashboardSummary: mocks.computeDashboardSummaryMock,
  normalizeComplianceState: mocks.normalizeComplianceStateMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/compliance/task-ids", () => ({
  getPersistableTaskIds: mocks.getPersistableTaskIdsMock,
}))

vi.mock("@/lib/compliance/task-resolution", () => ({
  getTaskResolutionTargets: mocks.getTaskResolutionTargetsMock,
}))

vi.mock("@/lib/compliance/task-validation", () => ({
  validateTaskAgainstState: mocks.validateTaskAgainstStateMock,
}))

describe("PATCH /api/tasks/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "reviewer",
      exp: Date.now() + 1000,
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-ctx",
      orgName: "Workspace Org",
      workspaceLabel: "Workspace",
      workspaceOwner: "Owner",
      workspaceInitials: "WO",
      userRole: "reviewer",
    })
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
    mocks.normalizeComplianceStateMock.mockImplementation((state) => state)
    mocks.computeDashboardSummaryMock.mockReturnValue({ score: 50 })
    mocks.getPersistableTaskIdsMock.mockReturnValue(new Set(["task-1"]))
    mocks.getTaskResolutionTargetsMock.mockReturnValue({ alertIds: [], driftIds: [] })
    mocks.validateTaskAgainstStateMock.mockReturnValue({
      status: "passed",
      message: "Confirmare puternica. Semnalul exista.",
      confidence: "high",
      basis: "direct_signal",
      nextStatus: "done",
      checkedSource: "document",
    })
    mocks.computeDashboardSummaryMock
      .mockReturnValueOnce({ score: 50 })
      .mockReturnValueOnce({ score: 65 })
  })

  it("respinge payload-ul gol", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/tasks/task-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("TASK_PATCH_EMPTY")
  })

  it("respinge rolul nepermis", async () => {
    mocks.requireRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await PATCH(
      new Request("http://localhost/api/tasks/task-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })

  it("valideaza task-ul si intoarce feedback", async () => {
    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: {
      taskState: Record<string, unknown>
      alerts: unknown[]
      driftRecords: unknown[]
      events: unknown[]
    }) => unknown) =>
      updater({
        taskState: {},
        alerts: [],
        driftRecords: [],
        events: [],
      })
    )

    const response = await PATCH(
      new Request("http://localhost/api/tasks/task-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_done_and_validate" }),
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toBe("Task actualizat.")
    expect(payload.feedback.validationStatus).toBe("passed")
    expect(payload.feedback.validationConfidence).toBe("high")
    expect(payload.feedback.validationBasis).toBe("direct_signal")
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
  })
})
