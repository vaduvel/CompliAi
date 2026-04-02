import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

const mocks = vi.hoisted(() => ({
  buildDashboardPayloadMock: vi.fn(),
  canUseRepoSyncMock: vi.fn(),
  executeRepoSyncMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  normalizeRepoSyncFilesMock: vi.fn(),
  validateRepoSyncPayloadMock: vi.fn(),
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/repo-sync", () => ({
  canUseRepoSync: mocks.canUseRepoSyncMock,
  normalizeRepoSyncFiles: mocks.normalizeRepoSyncFilesMock,
  validateRepoSyncPayload: mocks.validateRepoSyncPayloadMock,
}))

vi.mock("@/lib/server/repo-sync-executor", () => ({
  executeRepoSync: mocks.executeRepoSyncMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

describe("POST /api/integrations/repo-sync", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
    mocks.canUseRepoSyncMock.mockReturnValue(true)
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-sync",
      orgName: "Org Sync",
      workspaceLabel: "Org Sync",
      workspaceOwner: "owner@example.com",
      workspaceInitials: "OS",
      userRole: "owner",
    })
  })

  it("blocheaza request-urile neautorizate", async () => {
    mocks.canUseRepoSyncMock.mockReturnValueOnce(false)

    const response = await POST(
      new Request("http://localhost/api/integrations/repo-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("REPO_SYNC_FORBIDDEN")
    expect(mocks.validateRepoSyncPayloadMock).not.toHaveBeenCalled()
  })

  it("respinge request-ul daca nu exista fisiere relevante", async () => {
    mocks.validateRepoSyncPayloadMock.mockReturnValueOnce({
      provider: "manual",
      repository: "demo/repo",
      files: [{ path: "README.md", content: "not relevant" }],
    })
    mocks.normalizeRepoSyncFilesMock.mockReturnValueOnce([])

    const response = await POST(
      new Request("http://localhost/api/integrations/repo-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [{ path: "README.md", content: "not relevant" }] }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("REPO_SYNC_NO_RELEVANT_FILES")
    expect(mocks.executeRepoSyncMock).not.toHaveBeenCalled()
  })

  it("propaga eroarea de validare intr-un raspuns coerent", async () => {
    mocks.validateRepoSyncPayloadMock.mockImplementationOnce(() => {
      throw new Error("Repo sync accepta maxim 12 fisiere per request.")
    })

    const response = await POST(
      new Request("http://localhost/api/integrations/repo-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [] }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("REPO_SYNC_FAILED")
    expect(payload.error).toContain("maxim 12 fisiere")
  })

  it("returneaza succes pentru fisiere relevante", async () => {
    mocks.validateRepoSyncPayloadMock.mockReturnValueOnce({
      provider: "manual",
      repository: "demo/repo",
      branch: "main",
      files: [{ path: "compliscan.yaml", content: "version: 1" }],
    })
    mocks.normalizeRepoSyncFilesMock.mockReturnValueOnce([
      { path: "compliscan.yaml", content: "version: 1" },
    ])
    mocks.executeRepoSyncMock.mockResolvedValueOnce({
      fileCount: 1,
      nextState: {
        scans: [],
        findings: [],
        alerts: [],
      },
    })

    const response = await POST(
      new Request("http://localhost/api/integrations/repo-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [{ path: "compliscan.yaml", content: "version: 1" }] }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toBe("Repo sync finalizat pentru 1 fisier relevante.")
    expect(mocks.executeRepoSyncMock).toHaveBeenCalledWith({
      provider: "manual",
      repository: "demo/repo",
      branch: "main",
      files: [{ path: "compliscan.yaml", content: "version: 1" }],
      orgId: "org-sync",
      orgName: "Org Sync",
    })
  })
})
