import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshAuthenticatedSessionMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  resolveOptionalEventActorMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
  appendComplianceEventsMock: vi.fn(),
  createComplianceEventMock: vi.fn(),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "UNAUTHORIZED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
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

import { POST } from "./route"

describe("POST /api/efactura/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-demo",
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
        efacturaValidations: [],
        events: [],
      })
    )
    mocks.buildDashboardPayloadMock.mockResolvedValue({
      state: { findings: [] },
      summary: {},
      remediationPlan: [],
      workspace: { orgId: "org-demo" },
      compliancePack: {},
      traceabilityMatrix: [],
      dsarSummary: { total: 0, urgent: 0, dueToday: 0 },
    })
    mocks.appendComplianceEventsMock.mockImplementation((current, events) => [...(current.events ?? []), ...events])
    mocks.createComplianceEventMock.mockImplementation((payload) => payload)
  })

  it("valideaza XML-ul pe org-ul din sesiune", async () => {
    const response = await POST(
      new Request("http://localhost/api/efactura/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: "factura.xml",
          xml: "<Invoice></Invoice>",
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-demo",
      expect.any(Function),
      "Org Demo"
    )
    expect(mocks.buildDashboardPayloadMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        orgId: "org-demo",
        orgName: "Org Demo",
        workspaceLabel: "Workspace local",
      })
    )
    expect(mocks.getOrgContextMock).toHaveBeenCalledWith({
      request: expect.any(Request),
    })
    expect(payload.validation.documentName).toBe("factura.xml")
  })
})
