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
  buildAuditPackMock: vi.fn(),
  buildAuditPackBundleMock: vi.fn(),
  buildCompliScanSnapshotMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  requireFreshRoleMock: vi.fn(),
  requirePlanMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
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

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: mocks.readNis2StateMock,
}))

vi.mock("@/lib/server/audit-pack", () => ({
  buildAuditPack: mocks.buildAuditPackMock,
}))

vi.mock("@/lib/server/audit-pack-bundle", () => ({
  buildAuditPackBundle: mocks.buildAuditPackBundleMock,
}))

vi.mock("@/lib/server/plan", () => ({
  PlanError: class PlanError extends Error {
    status = 403
    code = "PLAN_REQUIRED"
  },
  requirePlan: mocks.requirePlanMock,
}))

import { GET } from "./route"

describe("GET /api/exports/audit-pack/bundle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 1000,
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-fallback",
      orgName: "Workspace Fallback",
      workspaceLabel: "Workspace local",
      workspaceOwner: "Ion Popescu",
      workspaceInitials: "IP",
      userRole: "viewer",
    })
    mocks.requirePlanMock.mockResolvedValue("pro")
    mocks.readFreshStateForOrgMock.mockResolvedValue({})
    mocks.readNis2StateMock.mockResolvedValue({
      assessment: { score: 72 },
      incidents: [{ id: "incident-1", severity: "high" }],
      vendors: [],
      updatedAtISO: "2026-03-13T09:00:00.000Z",
    })
    mocks.buildDashboardPayloadMock.mockResolvedValue({
      state: {
        snapshotHistory: [],
        taskState: {
          "rem-task-1": {
            attachedEvidenceMeta: {
              id: "evidence-1",
              fileName: "proof.pdf",
              storageProvider: "supabase_private",
              accessPath: "/api/tasks/rem-task-1/evidence/evidence-1",
            },
          },
        },
      },
      remediationPlan: [],
      workspace: { orgName: "Magazin Online S.R.L." },
      compliancePack: { entries: [], summary: { openFindings: 0, sourceCoverage: [] } },
    })
    mocks.buildCompliScanSnapshotMock.mockReturnValue({
      workspace: { name: "Magazin Online S.R.L." },
      generatedAt: "2026-03-13T09:00:00.000Z",
    })
    mocks.buildAuditPackMock.mockReturnValue({
      generatedAt: "2026-03-13T09:00:00.000Z",
      evidenceLedger: [
        {
          taskId: "rem-task-1",
          evidence: {
            id: "evidence-1",
            fileName: "proof.pdf",
            storageProvider: "supabase_private",
            accessPath: "/api/tasks/rem-task-1/evidence/evidence-1",
          },
        },
      ],
    })
    mocks.buildAuditPackBundleMock.mockResolvedValue({
      fileName: "audit-pack-dossier-magazin-online-s-r-l-2026-03-13.zip",
      buffer: Buffer.from("zip-binary"),
    })
  })

  it("genereaza bundle-ul ZIP si pastreaza evidence-ul venit din registrul cloud", async () => {
    const response = await GET(new Request("http://localhost/api/exports/audit-pack/bundle"))
    const body = Buffer.from(await response.arrayBuffer())

    expect(response.status).toBe(200)
    expect(mocks.readFreshStateForOrgMock).toHaveBeenCalledWith("org-1", "Org Demo")
    expect(mocks.buildDashboardPayloadMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        orgId: "org-1",
        orgName: "Org Demo",
        workspaceLabel: "Workspace local",
        userRole: "owner",
      })
    )
    expect(response.headers.get("content-type")).toContain("application/zip")
    expect(response.headers.get("content-disposition")).toContain(
      'attachment; filename="audit-pack-dossier-magazin-online-s-r-l-2026-03-13.zip"'
    )
    expect(body.toString()).toBe("zip-binary")
    expect(mocks.buildAuditPackBundleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceLedger: [
          expect.objectContaining({
            evidence: expect.objectContaining({
              storageProvider: "supabase_private",
              accessPath: "/api/tasks/rem-task-1/evidence/evidence-1",
            }),
          }),
        ],
      })
    )
    expect(mocks.buildAuditPackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nis2State: expect.objectContaining({
          incidents: [expect.objectContaining({ id: "incident-1" })],
        }),
      })
    )
  })

  it("respinge exportul pentru rol nepermis", async () => {
    mocks.requireFreshRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await GET(new Request("http://localhost/api/exports/audit-pack/bundle"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
