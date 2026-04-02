import { beforeEach, describe, expect, it, vi } from "vitest"

import { NextRequest } from "next/server"

import { initialComplianceState } from "@/lib/compliance/engine"

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
  createSessionTokenMock: vi.fn(),
  createWorkspacePreferenceTokenMock: vi.fn(),
  findUserByEmailMock: vi.fn(),
  findUserByIdMock: vi.fn(),
  getSessionCookieOptionsMock: vi.fn(),
  getUserModeMock: vi.fn(),
  getWorkspacePreferenceCookieOptionsMock: vi.fn(),
  hashPasswordMock: vi.fn(),
  linkUserToExternalIdentityMock: vi.fn(),
  listUserMembershipsMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  readLastRouteFromRequestMock: vi.fn(),
  readFreshSessionFromRequestMock: vi.fn(),
  readSessionFromRequestMock: vi.fn(),
  readWorkspacePreferenceFromRequestMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  resolveUserForMembershipMock: vi.fn(),
  resolveUserModeMock: vi.fn(),
  requireRoleMock: vi.fn(),
  serializeCompliScanYamlMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  createSessionToken: mocks.createSessionTokenMock,
  createWorkspacePreferenceToken: mocks.createWorkspacePreferenceTokenMock,
  findUserByEmail: mocks.findUserByEmailMock,
  findUserById: mocks.findUserByIdMock,
  getSessionCookieOptions: mocks.getSessionCookieOptionsMock,
  getUserMode: mocks.getUserModeMock,
  getWorkspacePreferenceCookieOptions: mocks.getWorkspacePreferenceCookieOptionsMock,
  hashPassword: mocks.hashPasswordMock,
  linkUserToExternalIdentity: mocks.linkUserToExternalIdentityMock,
  listUserMemberships: mocks.listUserMembershipsMock,
  readLastRouteFromRequest: mocks.readLastRouteFromRequestMock,
  readFreshSessionFromRequest: mocks.readFreshSessionFromRequestMock,
  readSessionFromRequest: mocks.readSessionFromRequestMock,
  readWorkspacePreferenceFromRequest: mocks.readWorkspacePreferenceFromRequestMock,
  resolveUserForMembership: mocks.resolveUserForMembershipMock,
  resolveUserMode: mocks.resolveUserModeMock,
  requireRole: mocks.requireRoleMock,
  SESSION_COOKIE: "compliscan_session",
  WORKSPACE_PREF_COOKIE: "compliscan_workspace_pref",
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
  readStateForOrg: mocks.readStateForOrgMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/compliscan-export", () => ({
  buildCompliScanFileName: mocks.buildCompliScanFileNameMock,
  buildCompliScanSnapshot: mocks.buildCompliScanSnapshotMock,
  serializeCompliScanYaml: mocks.serializeCompliScanYamlMock,
}))

import { POST as loginPOST } from "@/app/api/auth/login/route"
import { GET as meGET } from "@/app/api/auth/me/route"
import { POST as logoutPOST } from "@/app/api/auth/logout/route"
import { POST as scanPOST } from "@/app/api/scan/route"
import { GET as exportGET } from "@/app/api/exports/compliscan/route"

describe("api smoke flow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSessionCookieOptionsMock.mockReturnValue({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    })
    mocks.getWorkspacePreferenceCookieOptionsMock.mockReturnValue({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    })
    mocks.createSessionTokenMock.mockReturnValue("signed-token")
    mocks.createWorkspacePreferenceTokenMock.mockReturnValue("workspace-pref")
    mocks.findUserByEmailMock.mockResolvedValue({
      id: "user-1",
      email: "demo@site.ro",
      passwordHash: "hashed",
      salt: "salt",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
    })
    mocks.findUserByIdMock.mockResolvedValue(null)
    mocks.getUserModeMock.mockResolvedValue("solo")
    mocks.hashPasswordMock.mockReturnValue("hashed")
    mocks.linkUserToExternalIdentityMock.mockResolvedValue(null)
    mocks.listUserMembershipsMock.mockResolvedValue([])
    mocks.readLastRouteFromRequestMock.mockReturnValue(null)
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      email: "demo@site.ro",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 1000,
    })
    mocks.readFreshSessionFromRequestMock.mockResolvedValue({
      userId: "user-1",
      email: "demo@site.ro",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 1000,
    })
    mocks.readWorkspacePreferenceFromRequestMock.mockReturnValue(null)
    mocks.resolveUserModeMock.mockResolvedValue(null)
    mocks.resolveUserForMembershipMock.mockResolvedValue(null)
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      email: "demo@site.ro",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 1000,
    })
    mocks.mutateStateForOrgMock.mockImplementation(
      async (_orgId: string, updater: (state: typeof initialComplianceState) => unknown) =>
        updater(initialComplianceState)
    )
    mocks.readStateForOrgMock.mockResolvedValue({})
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({
      state: {
        driftRecords: [],
        ...(state as object),
      },
      workspace: { name: "Org Demo" },
    }))
    mocks.buildCompliScanSnapshotMock.mockReturnValue({
      workspace: { name: "Org Demo" },
      generatedAt: "2026-03-13T10:10:00.000Z",
      drift: [],
    })
    mocks.buildCompliScanFileNameMock.mockReturnValue("compliscan-export.json")
    mocks.serializeCompliScanYamlMock.mockReturnValue("version: '1.0'")
  })

  it("parcurge fluxul login -> session -> scan -> export -> logout", async () => {
    const loginResponse = await loginPOST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@site.ro", password: "secret123" }),
      })
    )
    expect(loginResponse.status).toBe(200)
    const sessionCookie = loginResponse.headers.get("set-cookie") || ""
    expect(sessionCookie).toContain("compliscan_session=signed-token")
    expect(sessionCookie).toContain("compliscan_workspace_pref=workspace-pref")

    const meResponse = await meGET(
      new Request("http://localhost/api/auth/me", {
        headers: { cookie: "compliscan_session=signed-token" },
      })
    )
    const mePayload = await meResponse.json()
    expect(meResponse.status).toBe(200)
    expect(mePayload.user.email).toBe("demo@site.ro")
    expect(mePayload.user.role).toBe("owner")

    const scanResponse = await scanPOST(
      new Request("http://localhost/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: "policy-tracking.txt",
          content: "tracking analytics cookies",
        }),
      })
    )
    const scanPayload = await scanResponse.json()
    expect(scanResponse.status).toBe(200)
    expect(scanPayload.message).toContain("Scanare finalizată")

    const exportResponse = await exportGET(
      new NextRequest("http://localhost/api/exports/compliscan")
    )
    expect(exportResponse.status).toBe(200)
    expect(exportResponse.headers.get("content-disposition")).toContain(
      'filename="compliscan-export.json"'
    )

    const logoutResponse = await logoutPOST()
    const logoutPayload = await logoutResponse.json()
    expect(logoutResponse.status).toBe(200)
    expect(logoutPayload.ok).toBe(true)
  })
})
