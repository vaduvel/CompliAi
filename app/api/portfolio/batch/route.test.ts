import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  resolveUserModeMock: vi.fn(),
  resolvePolicyMock: vi.fn(),
  createPendingActionMock: vi.fn(),
  executeBatchActionForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 403, code = "AUTH_ERROR") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshRole: mocks.requireFreshRoleMock,
  resolveUserMode: mocks.resolveUserModeMock,
}))

vi.mock("@/lib/server/autonomy-resolver", () => ({
  resolvePolicy: mocks.resolvePolicyMock,
}))

vi.mock("@/lib/server/approval-queue", () => ({
  createPendingAction: mocks.createPendingActionMock,
}))

vi.mock("@/lib/server/batch-executor", () => ({
  executeBatchActionForOrg: mocks.executeBatchActionForOrgMock,
}))

import { POST } from "./route"

describe("portfolio batch route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      orgId: "partner-org-session",
      userId: "user-session",
      email: "partner@example.com",
      role: "partner_manager",
    })
    mocks.resolveUserModeMock.mockResolvedValue("partner")
  })

  it("folosește sesiunea pentru auto batch și returnează detail per firmă", async () => {
    mocks.resolvePolicyMock.mockResolvedValue("auto")
    mocks.executeBatchActionForOrgMock.mockResolvedValue({
      success: true,
      detail: "Audit Pack evaluat: gata de export (83/100).",
      summary: {
        readiness: "audit_ready",
        blockerCount: 0,
        complianceScore: 83,
      },
    })

    const response = await POST(
      new Request("http://localhost/api/portfolio/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-compliscan-org-id": "wrong-header-org",
          "x-compliscan-user-id": "wrong-header-user",
        },
        body: JSON.stringify({
          actionType: "export_audit_pack",
          orgIds: ["client-1"],
          config: {
            orgNames: {
              "client-1": "Client One",
            },
          },
        }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.resolvePolicyMock).toHaveBeenCalledWith({
      userId: "user-session",
      orgId: "partner-org-session",
      actionType: "batch_action",
      riskLevel: "low",
    })
    expect(body.results).toEqual([
      expect.objectContaining({
        orgId: "client-1",
        orgName: "Client One",
        status: "success",
        detail: "Audit Pack evaluat: gata de export (83/100).",
        nextStep: "Intră în firmă și deschide Audit Pack din Dovadă sau Reports.",
        summary: {
          readiness: "audit_ready",
          blockerCount: 0,
          complianceScore: 83,
        },
      }),
    ])
  })

  it("creează aprobări pe org-ul sesiunii, nu pe header", async () => {
    mocks.resolvePolicyMock.mockResolvedValue("semi")
    mocks.createPendingActionMock.mockResolvedValue({ id: "approval-1" })

    const response = await POST(
      new Request("http://localhost/api/portfolio/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-compliscan-org-id": "wrong-header-org",
        },
        body: JSON.stringify({
          actionType: "run_baseline_scan",
          orgIds: ["client-2"],
          config: {
            orgNames: {
              "client-2": "Client Two",
            },
          },
        }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.createPendingActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "partner-org-session",
        userId: "user-session",
        actionType: "batch_action",
      })
    )
    expect(body.results).toEqual([
      expect.objectContaining({
        orgId: "client-2",
        status: "pending_approval",
        pendingActionId: "approval-1",
        detail: "Așteaptă aprobarea pentru baseline scan.",
        nextStep: "Deschide Aprobări și pornește scanarea baseline pentru client.",
        summary: {
          policy: "semi",
          riskLevel: "medium",
        },
      }),
    ])
  })
})
