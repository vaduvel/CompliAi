import { beforeEach, describe, expect, it, vi } from "vitest"

import { NextRequest } from "next/server"

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
  buildCompliScanFileNameMock: vi.fn(),
  buildCompliScanSnapshotMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  requireFreshRoleMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  serializeCompliScanYamlMock: vi.fn(),
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/compliscan-export", () => ({
  buildCompliScanFileName: mocks.buildCompliScanFileNameMock,
  buildCompliScanSnapshot: mocks.buildCompliScanSnapshotMock,
  serializeCompliScanYaml: mocks.serializeCompliScanYamlMock,
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

import { GET } from "./route"

describe("GET /api/exports/compliscan", () => {
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
    mocks.readFreshStateForOrgMock.mockResolvedValue({})
    mocks.buildDashboardPayloadMock.mockResolvedValue({
      state: {
        driftRecords: [
          {
            id: "drift-1",
            snapshotId: "snap-2",
            comparedToSnapshotId: "snap-1",
            type: "compliance_drift",
            change: "model_changed",
            severity: "high",
            systemLabel: "sys-1",
            sourceDocument: "compliscan.yaml",
            detectedAtISO: "2026-03-13T09:10:00.000Z",
            before: { model: "gpt-4o-mini" },
            after: { model: "gpt-4o" },
          },
        ],
      },
      workspace: { name: "Magazin Online S.R.L." },
    })
    mocks.buildCompliScanSnapshotMock.mockReturnValue({
      workspace: { name: "Magazin Online S.R.L." },
      generatedAt: "2026-03-13T09:00:00.000Z",
      drift: [],
    })
    mocks.buildCompliScanFileNameMock.mockImplementation(
      (_workspace: string, _generatedAt: string, format: "json" | "yaml") =>
        `compliscan-export.${format}`
    )
    mocks.serializeCompliScanYamlMock.mockReturnValue("version: '1.0'")
  })

  it("exporta json implicit", async () => {
    const response = await GET(new NextRequest("http://localhost/api/exports/compliscan"))
    const body = await response.json()

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
    expect(response.headers.get("content-type")).toContain("application/json")
    expect(response.headers.get("content-disposition")).toContain('filename="compliscan-export.json"')
    expect(body.drift).toHaveLength(1)
    expect(body.drift[0].change).toBe("model_changed")
    expect(mocks.buildCompliScanFileNameMock).toHaveBeenCalledWith(
      "Magazin Online S.R.L.",
      "2026-03-13T09:00:00.000Z",
      "json"
    )
  })

  it("exporta yaml cand este cerut explicit", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/exports/compliscan?format=yaml")
    )
    const body = await response.text()

    expect(response.headers.get("content-type")).toContain("application/yaml")
    expect(response.headers.get("content-disposition")).toContain('filename="compliscan-export.yaml"')
    expect(body).toBe("version: '1.0'")
    expect(mocks.serializeCompliScanYamlMock).toHaveBeenCalledTimes(1)
  })

  it("respinge exportul pentru rol nepermis", async () => {
    mocks.requireFreshRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await GET(new NextRequest("http://localhost/api/exports/compliscan"))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
