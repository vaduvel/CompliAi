import { beforeEach, describe, expect, it, vi } from "vitest"

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
  requireRoleMock: vi.fn(),
  readStateMock: vi.fn(),
  mutateStateMock: vi.fn(),
  getOrgContextMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
  mutateState: mocks.mutateStateMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

import { GET, PATCH } from "./route"

describe("HR REGES reconciliation route", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-demo",
      orgName: "Demo HR SRL",
    })
    mocks.readStateMock.mockResolvedValue({
      orgProfile: {
        sector: "professional-services",
        employeeCount: "10-49",
        usesAITools: true,
      },
      hrRegistryReconciliations: {
        "intake-hr-registry": {
          findingId: "intake-hr-registry",
          rosterSnapshot: "Ana Popescu — CIM activ\nMihai Ionescu — Sales",
          registryChecklistText: "Verifică modificarea salarială din martie\nConfirmă exportul final",
          updatedAtISO: "2026-03-30T10:00:00.000Z",
        },
      },
    })
    mocks.mutateStateMock.mockImplementation(async (updater: (state: Record<string, unknown>) => Record<string, unknown>) => {
      const current = {
        orgProfile: {
          sector: "professional-services",
          employeeCount: "10-49",
          usesAITools: true,
        },
        hrRegistryReconciliations: {},
        events: [],
      }
      return updater(current)
    })
  })

  it("returnează reconcilierea salvată și summary-ul derivat", async () => {
    const response = await GET(new Request("http://localhost/api/hr/reconciliation?findingId=intake-hr-registry"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.reconciliation.findingId).toBe("intake-hr-registry")
    expect(payload.derived.rosterCount).toBe(2)
    expect(payload.derived.registryChecklistCount).toBe(2)
    expect(payload.derived.readiness).toBe("ready")
  })

  it("salvează reconcilierea și întoarce nota de handoff", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/hr/reconciliation", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          findingId: "intake-hr-registry",
          rosterSnapshot: "Ana Popescu — CIM activ\nMihai Ionescu — Sales",
          registryChecklistText: "Verifică modificarea salarială din martie\nConfirmă exportul final",
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.derived.readiness).toBe("ready")
    expect(payload.derived.handoffEvidenceNote).toContain("snapshotul intern include 2 intrări")
    expect(mocks.mutateStateMock).toHaveBeenCalled()
  })
})
