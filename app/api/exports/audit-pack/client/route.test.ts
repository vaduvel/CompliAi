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
  buildClientAuditPackDocumentMock: vi.fn(),
  buildCompliScanSnapshotMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
  requireRoleMock: vi.fn(),
  readStateMock: vi.fn(),
}))

vi.mock("@/lib/server/compliscan-export", () => ({
  buildCompliScanSnapshot: mocks.buildCompliScanSnapshotMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
}))

vi.mock("@/lib/server/audit-pack", () => ({
  buildAuditPack: mocks.buildAuditPackMock,
}))

vi.mock("@/lib/server/audit-pack-client", () => ({
  buildClientAuditPackDocument: mocks.buildClientAuditPackDocumentMock,
}))

import { GET } from "./route"

describe("GET /api/exports/audit-pack/client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 1000,
    })
    mocks.readStateMock.mockResolvedValue({})
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
    mocks.buildClientAuditPackDocumentMock.mockReturnValue({
      fileName: "audit-pack-client-magazin-online-s-r-l-2026-03-13.html",
      html: "<html><body>ok</body></html>",
    })
  })

  it("genereaza documentul client-facing si pastreaza traseul hidratat pentru evidence", async () => {
    const response = await GET(new Request("http://localhost/api/exports/audit-pack/client"))
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("text/html")
    expect(response.headers.get("content-disposition")).toContain(
      'inline; filename="audit-pack-client-magazin-online-s-r-l-2026-03-13.html"'
    )
    expect(body).toContain("ok")
    expect(mocks.buildAuditPackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.objectContaining({
          taskState: expect.objectContaining({
            "rem-task-1": expect.objectContaining({
              attachedEvidenceMeta: expect.objectContaining({
                storageProvider: "supabase_private",
                accessPath: "/api/tasks/rem-task-1/evidence/evidence-1",
              }),
            }),
          }),
        }),
      })
    )
  })

  it("respinge exportul pentru rol nepermis", async () => {
    mocks.requireRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await GET(new Request("http://localhost/api/exports/audit-pack/client"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
