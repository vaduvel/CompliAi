import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readSessionFromRequestMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  resolveOptionalEventActorMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
  appendComplianceEventsMock: vi.fn(),
  createComplianceEventMock: vi.fn(),
  getAnafModeMock: vi.fn(),
  getAnafEnvironmentMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  readSessionFromRequest: mocks.readSessionFromRequestMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/event-actor", () => ({
  resolveOptionalEventActor: mocks.resolveOptionalEventActorMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/compliance/events", () => ({
  appendComplianceEvents: mocks.appendComplianceEventsMock,
  createComplianceEvent: mocks.createComplianceEventMock,
}))

vi.mock("@/lib/server/efactura-anaf-client", () => ({
  getAnafMode: mocks.getAnafModeMock,
  getAnafEnvironment: mocks.getAnafEnvironmentMock,
}))

import { POST } from "./route"

describe("POST /api/integrations/efactura/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-fallback",
      orgName: "Workspace Fallback",
      workspaceLabel: "Workspace local",
      workspaceOwner: "Ion Popescu",
      workspaceInitials: "IP",
      userRole: "viewer",
    })
    mocks.resolveOptionalEventActorMock.mockResolvedValue(undefined)
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId, updater) =>
      updater({
        events: [],
      })
    )
    mocks.buildDashboardPayloadMock.mockResolvedValue({
      state: {},
      summary: {},
      remediationPlan: [],
      workspace: { orgId: "org-1" },
      compliancePack: {},
      traceabilityMatrix: [],
      dsarSummary: { total: 0, urgent: 0, dueToday: 0 },
    })
    mocks.appendComplianceEventsMock.mockImplementation((current, events) => [...(current.events ?? []), ...events])
    mocks.createComplianceEventMock.mockImplementation((payload) => payload)
    mocks.getAnafModeMock.mockReturnValue("test")
    mocks.getAnafEnvironmentMock.mockReturnValue("test")
  })

  it("sincronizeaza e-Factura pe org-ul din sesiune", async () => {
    const response = await POST(new Request("http://localhost/api/integrations/efactura/sync", { method: "POST" }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
    expect(mocks.buildDashboardPayloadMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        orgId: "org-1",
        orgName: "Org Demo",
        workspaceLabel: "Workspace local",
      })
    )
    expect(payload.mode).toBe("test")
  })
})
