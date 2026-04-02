import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

const mocks = vi.hoisted(() => ({
  buildDashboardPayloadMock: vi.fn(),
  canUseRepoSyncMock: vi.fn(),
  executeRepoSyncMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  normalizeProviderRepoSyncPayloadMock: vi.fn(),
  normalizeRepoSyncFilesMock: vi.fn(),
  validateProviderRepoSyncPayloadMock: vi.fn(),
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/repo-sync", () => ({
  canUseRepoSync: mocks.canUseRepoSyncMock,
  normalizeProviderRepoSyncPayload: mocks.normalizeProviderRepoSyncPayloadMock,
  normalizeRepoSyncFiles: mocks.normalizeRepoSyncFilesMock,
  validateProviderRepoSyncPayload: mocks.validateProviderRepoSyncPayloadMock,
}))

vi.mock("@/lib/server/repo-sync-executor", () => ({
  executeRepoSync: mocks.executeRepoSyncMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

describe("POST /api/integrations/repo-sync/gitlab", () => {
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
      new Request("http://localhost/api/integrations/repo-sync/gitlab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("REPO_SYNC_GITLAB_FORBIDDEN")
  })

  it("respinge request-ul daca nu exista fisiere relevante", async () => {
    mocks.validateProviderRepoSyncPayloadMock.mockReturnValueOnce({
      projectPath: "demo/repo",
      manifests: { "README.md": "ignore" },
    })
    mocks.normalizeProviderRepoSyncPayloadMock.mockReturnValueOnce({
      provider: "gitlab",
      repository: "demo/repo",
      files: [{ path: "README.md", content: "ignore" }],
    })
    mocks.normalizeRepoSyncFilesMock.mockReturnValueOnce([])

    const response = await POST(
      new Request("http://localhost/api/integrations/repo-sync/gitlab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifests: { "README.md": "ignore" } }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("REPO_SYNC_GITLAB_NO_RELEVANT_FILES")
    expect(mocks.normalizeProviderRepoSyncPayloadMock).toHaveBeenCalledWith("gitlab", {
      projectPath: "demo/repo",
      manifests: { "README.md": "ignore" },
    })
  })

  it("returneaza succes pentru fisiere relevante", async () => {
    mocks.validateProviderRepoSyncPayloadMock.mockReturnValueOnce({
      projectPath: "demo/repo",
      manifests: { "compliscan.yaml": "version: 1" },
    })
    mocks.normalizeProviderRepoSyncPayloadMock.mockReturnValueOnce({
      provider: "gitlab",
      repository: "demo/repo",
      files: [{ path: "compliscan.yaml", content: "version: 1" }],
    })
    mocks.normalizeRepoSyncFilesMock.mockReturnValueOnce([
      { path: "compliscan.yaml", content: "version: 1" },
    ])
    mocks.executeRepoSyncMock.mockResolvedValueOnce({
      fileCount: 1,
      nextState: { scans: [], findings: [], alerts: [] },
    })

    const response = await POST(
      new Request("http://localhost/api/integrations/repo-sync/gitlab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifests: { "compliscan.yaml": "version: 1" } }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toBe("GitLab repo sync finalizat pentru 1 fisier relevante.")
    expect(mocks.executeRepoSyncMock).toHaveBeenCalledWith({
      provider: "gitlab",
      repository: "demo/repo",
      files: [{ path: "compliscan.yaml", content: "version: 1" }],
      orgId: "org-sync",
      orgName: "Org Sync",
    })
  })
})
