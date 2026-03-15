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
  readFreshSessionFromRequestMock: vi.fn(),
  requireFreshAuthenticatedSessionMock: vi.fn(),
  requireFreshRoleMock: vi.fn(),
  listOrganizationMembersMock: vi.fn(),
  getApplicationHealthStatusMock: vi.fn(),
  buildRepoSyncStatusMock: vi.fn(),
  getReleaseReadinessStatusMock: vi.fn(),
  getSupabaseOperationalStatusMock: vi.fn(),
  createRequestContextMock: vi.fn(),
  getRequestDurationMsMock: vi.fn(),
  logRouteErrorMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  readFreshSessionFromRequest: mocks.readFreshSessionFromRequestMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
  requireFreshRole: mocks.requireFreshRoleMock,
  listOrganizationMembers: mocks.listOrganizationMembersMock,
}))

vi.mock("@/lib/server/app-health", () => ({
  getApplicationHealthStatus: mocks.getApplicationHealthStatusMock,
}))

vi.mock("@/lib/server/repo-sync", () => ({
  buildRepoSyncStatus: mocks.buildRepoSyncStatusMock,
}))

vi.mock("@/lib/server/release-readiness", () => ({
  getReleaseReadinessStatus: mocks.getReleaseReadinessStatusMock,
}))

vi.mock("@/lib/server/supabase-status", () => ({
  getSupabaseOperationalStatus: mocks.getSupabaseOperationalStatusMock,
}))

vi.mock("@/lib/server/request-context", () => ({
  createRequestContext: mocks.createRequestContextMock,
  getRequestDurationMs: mocks.getRequestDurationMsMock,
}))

vi.mock("@/lib/server/operational-logger", () => ({
  logRouteError: mocks.logRouteErrorMock,
}))

import { GET } from "./route"

describe("GET /api/settings/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRequestContextMock.mockReturnValue({
      route: "/api/settings/summary",
      requestId: "req-1",
      startedAt: Date.now(),
    })
    mocks.getRequestDurationMsMock.mockReturnValue(12)
    mocks.buildRepoSyncStatusMock.mockReturnValue({ configured: false, providers: [] })
    mocks.getApplicationHealthStatusMock.mockResolvedValue({
      status: "ok",
      checks: [],
    })
    mocks.getSupabaseOperationalStatusMock.mockResolvedValue({
      ok: true,
      issues: [],
    })
    mocks.getReleaseReadinessStatusMock.mockResolvedValue({
      status: "ready",
      blockers: [],
    })
  })

  it("foloseste sesiunea fresh pentru userul curent si sectiunile de owner", async () => {
    const session = {
      userId: "user-1",
      email: "owner@site.ro",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
      membershipId: "membership-1",
    }
    mocks.readFreshSessionFromRequestMock.mockResolvedValue(session)
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue(session)
    mocks.requireFreshRoleMock.mockResolvedValue(session)
    mocks.listOrganizationMembersMock.mockResolvedValue([
      {
        membershipId: "membership-1",
        userId: "user-1",
        email: "owner@site.ro",
        role: "owner",
        createdAtISO: "2026-03-15T10:00:00.000Z",
        orgId: "org-1",
        orgName: "Org Demo",
      },
    ])

    const response = await GET(new Request("http://localhost/api/settings/summary"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.currentUser).toEqual({
      email: "owner@site.ro",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
      membershipId: "membership-1",
    })
    expect(payload.members.members).toHaveLength(1)
    expect(payload.releaseReadiness.status).toBe("ready")
    expect(mocks.requireFreshRoleMock).toHaveBeenCalled()
  })

  it("ramane stabil fara sesiune valida", async () => {
    mocks.readFreshSessionFromRequestMock.mockResolvedValue(null)
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValue(
      new mocks.AuthzErrorMock("Ai nevoie de sesiune.", 401, "AUTH_SESSION_REQUIRED")
    )
    mocks.requireFreshRoleMock.mockRejectedValue(
      new mocks.AuthzErrorMock("Ai nevoie de sesiune.", 401, "AUTH_SESSION_REQUIRED")
    )

    const response = await GET(new Request("http://localhost/api/settings/summary"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.currentUser).toBeNull()
    expect(payload.members).toBeNull()
    expect(payload.membersError).toBe("Ai nevoie de sesiune.")
    expect(payload.appHealth).toBeNull()
    expect(payload.appHealthError).toBe("Ai nevoie de sesiune.")
  })
})
