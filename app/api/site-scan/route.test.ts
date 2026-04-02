import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  mutateStateForOrgMock: vi.fn(),
  readSessionFromRequestMock: vi.fn(),
  scanSiteMock: vi.fn(),
  knowledgeFromSiteScanMock: vi.fn(),
  mergeKnowledgeItemsMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  readSessionFromRequest: mocks.readSessionFromRequestMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/compliance/site-scanner", () => ({
  scanSite: mocks.scanSiteMock,
}))

vi.mock("@/lib/compliance/org-knowledge", () => ({
  knowledgeFromSiteScan: mocks.knowledgeFromSiteScanMock,
  mergeKnowledgeItems: mocks.mergeKnowledgeItemsMock,
}))

import { POST } from "./route"

describe("POST /api/site-scan", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 1000,
    })
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId: string, updater: (state: Record<string, unknown>) => unknown) =>
      updater({
        siteScanJobs: {},
        orgProfile: {},
        orgKnowledge: { items: [], lastUpdatedAtISO: null },
      })
    )
    mocks.scanSiteMock.mockResolvedValue({
      reachable: true,
      scannedAtISO: "2026-04-02T08:00:00.000Z",
      url: "https://example.com",
      trackers: [],
      vendorCandidates: [],
      forms: [],
      hasCookieBanner: true,
      hasPrivacyPolicy: true,
      findingSuggestions: [],
    })
    mocks.knowledgeFromSiteScanMock.mockReturnValue([])
    mocks.mergeKnowledgeItemsMock.mockImplementation((_existing: unknown[], items: unknown[]) => items)
  })

  it("respinge request fara URL", async () => {
    const response = await POST(
      new Request("http://localhost/api/site-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    )

    const payload = await response.json()
    expect(response.status).toBe(400)
    expect(payload.code).toBe("MISSING_URL")
  })

  it("scrie jobul in org-ul din sesiune si intoarce rezultatul", async () => {
    const response = await POST(
      new Request("http://localhost/api/site-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://example.com", saveToProfile: true }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe("done")
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalled()
    expect(mocks.mutateStateForOrgMock).toHaveBeenNthCalledWith(
      1,
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
  })
})
