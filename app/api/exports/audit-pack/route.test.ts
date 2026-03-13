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

import { GET } from "./route"

describe("GET /api/exports/audit-pack", () => {
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
      },
      remediationPlan: { tasks: [] },
      workspace: { orgName: "Magazin Online S.R.L." },
      compliancePack: { systems: [] },
    })
    mocks.buildCompliScanSnapshotMock.mockReturnValue({
      workspace: { name: "Magazin Online S.R.L." },
      generatedAt: "2026-03-13T09:00:00.000Z",
    })
    mocks.buildAuditPackMock.mockReturnValue({
      generatedAt: "2026-03-13T09:00:00.000Z",
      summary: { status: "ok" },
    })
  })

  it("genereaza fisier json pentru audit pack", async () => {
    const response = await GET(new Request("http://localhost/api/exports/audit-pack"))
    const body = await response.text()

    expect(response.headers.get("content-type")).toContain("application/json")
    expect(response.headers.get("content-disposition")).toContain(
      'attachment; filename="audit-pack-v2-1-magazin-online-s-r-l-2026-03-13.json"'
    )
    expect(JSON.parse(body)).toEqual({
      generatedAt: "2026-03-13T09:00:00.000Z",
      summary: { status: "ok" },
    })
  })

  it("foloseste snapshot fallback daca nu exista in stare", async () => {
    await GET(new Request("http://localhost/api/exports/audit-pack"))

    expect(mocks.buildCompliScanSnapshotMock).toHaveBeenCalledTimes(1)
    expect(mocks.buildAuditPackMock).toHaveBeenCalledTimes(1)
  })

  it("respinge exportul pentru rol nepermis", async () => {
    mocks.requireRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await GET(new Request("http://localhost/api/exports/audit-pack"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
