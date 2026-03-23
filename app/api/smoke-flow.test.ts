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
  findUserByEmailMock: vi.fn(),
  getSessionCookieOptionsMock: vi.fn(),
  hashPasswordMock: vi.fn(),
  mutateStateMock: vi.fn(),
  readFreshSessionFromRequestMock: vi.fn(),
  readSessionFromRequestMock: vi.fn(),
  readStateMock: vi.fn(),
  resolveUserModeMock: vi.fn(),
  requireRoleMock: vi.fn(),
  serializeCompliScanYamlMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  createSessionToken: mocks.createSessionTokenMock,
  findUserByEmail: mocks.findUserByEmailMock,
  getSessionCookieOptions: mocks.getSessionCookieOptionsMock,
  hashPassword: mocks.hashPasswordMock,
  readFreshSessionFromRequest: mocks.readFreshSessionFromRequestMock,
  readSessionFromRequest: mocks.readSessionFromRequestMock,
  resolveUserMode: mocks.resolveUserModeMock,
  requireRole: mocks.requireRoleMock,
  SESSION_COOKIE: "compliscan_session",
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: mocks.mutateStateMock,
  readState: mocks.readStateMock,
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
    mocks.createSessionTokenMock.mockReturnValue("signed-token")
    mocks.findUserByEmailMock.mockResolvedValue({
      id: "user-1",
      email: "demo@site.ro",
      passwordHash: "hashed",
      salt: "salt",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
    })
    mocks.hashPasswordMock.mockReturnValue("hashed")
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
    mocks.resolveUserModeMock.mockResolvedValue(null)
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      email: "demo@site.ro",
      orgId: "org-1",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 1000,
    })
    mocks.mutateStateMock.mockImplementation(async (updater: (state: typeof initialComplianceState) => unknown) =>
      updater(initialComplianceState)
    )
    mocks.readStateMock.mockResolvedValue({})
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
