import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createSessionTokenMock: vi.fn(),
  createWorkspacePreferenceTokenMock: vi.fn(),
  getSessionCookieOptionsMock: vi.fn(),
  getWorkspacePreferenceCookieOptionsMock: vi.fn(),
  readSessionFromRequestMock: vi.fn(),
  setUserModeMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  createSessionToken: mocks.createSessionTokenMock,
  createWorkspacePreferenceToken: mocks.createWorkspacePreferenceTokenMock,
  getSessionCookieOptions: mocks.getSessionCookieOptionsMock,
  getWorkspacePreferenceCookieOptions: mocks.getWorkspacePreferenceCookieOptionsMock,
  readSessionFromRequest: mocks.readSessionFromRequestMock,
  SESSION_COOKIE: "compliscan_session",
  WORKSPACE_PREF_COOKIE: "compliscan_workspace_pref",
  setUserMode: mocks.setUserModeMock,
}))

import { POST } from "./route"

describe("POST /api/auth/set-user-mode", () => {
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
  })

  it("salveaza modul si rescrie sesiunea cu userMode", async () => {
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "owner",
      membershipId: "membership-1",
      workspaceMode: "org",
      exp: Date.now() + 60_000,
    })

    const response = await POST(
      new Request("http://localhost/api/auth/set-user-mode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "partner" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.userMode).toBe("partner")
    expect(mocks.setUserModeMock).toHaveBeenCalledWith("user-1", "partner")
    expect(mocks.createSessionTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ userMode: "partner", workspaceMode: "org" })
    )
    expect(response.headers.get("set-cookie")).toContain("compliscan_session=signed-token")
  })

  it("mapeaza USER_NOT_FOUND controlat", async () => {
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "owner",
      exp: Date.now() + 60_000,
    })
    mocks.setUserModeMock.mockRejectedValueOnce(new Error("USER_NOT_FOUND"))

    const response = await POST(
      new Request("http://localhost/api/auth/set-user-mode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "partner" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.code).toBe("AUTH_USER_NOT_FOUND")
  })
})
