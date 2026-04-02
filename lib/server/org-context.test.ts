import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
  readSessionFromRequestMock: vi.fn(),
  verifySessionTokenMock: vi.fn(),
}))

vi.mock("next/headers", () => ({
  cookies: mocks.cookiesMock,
  headers: mocks.headersMock,
}))

vi.mock("@/lib/server/auth", () => ({
  SESSION_COOKIE: "compliscan_session",
  readSessionFromRequest: mocks.readSessionFromRequestMock,
  verifySessionToken: mocks.verifySessionTokenMock,
}))

import { getOrgContext } from "./org-context"

describe("getOrgContext", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.COMPLISCAN_ORG_ID
    delete process.env.COMPLISCAN_ORG_NAME
    delete process.env.COMPLISCAN_WORKSPACE_OWNER
    delete process.env.COMPLISCAN_WORKSPACE_LABEL
    delete process.env.COMPLISCAN_WORKSPACE_INITIALS

    mocks.cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    })
    mocks.headersMock.mockResolvedValue(new Headers())
    mocks.readSessionFromRequestMock.mockReturnValue(null)
    mocks.verifySessionTokenMock.mockReturnValue(null)
  })

  it("preferă sesiunea când headerele intră în conflict", async () => {
    mocks.cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "token-1" }),
    })
    mocks.headersMock.mockResolvedValue(
      new Headers({
        "x-compliscan-org-id": "wrong-org",
        "x-compliscan-org-name": "Wrong Org",
        "x-compliscan-user-email": "wrong@example.com",
      })
    )
    mocks.verifySessionTokenMock.mockReturnValue({
      orgId: "org-session",
      orgName: "Session Org",
      email: "owner@example.com",
      role: "owner",
    })

    const context = await getOrgContext({ allowHeaderFallback: true })

    expect(context.orgId).toBe("org-session")
    expect(context.orgName).toBe("Session Org")
    expect(context.workspaceOwner).toBe("owner@example.com")
    expect(context.userRole).toBe("owner")
  })

  it("ignoră headerele by default când nu există sesiune", async () => {
    mocks.headersMock.mockResolvedValue(
      new Headers({
        "x-compliscan-org-id": "wrong-org",
        "x-compliscan-org-name": "Wrong Org",
        "x-compliscan-user-email": "wrong@example.com",
      })
    )

    const context = await getOrgContext()

    expect(context.orgId).toBe("org-local-workspace")
    expect(context.orgName).toBe("Magazin Online S.R.L.")
    expect(context.workspaceOwner).toBe("Ion Popescu")
  })

  it("poate folosi header fallback doar când este cerut explicit", async () => {
    const request = new Request("http://localhost/internal", {
      headers: {
        "x-compliscan-org-id": "org-header",
        "x-compliscan-org-name": "Header Org",
        "x-compliscan-user-email": "header@example.com",
      },
    })

    const context = await getOrgContext({ request, allowHeaderFallback: true })

    expect(context.orgId).toBe("org-header")
    expect(context.orgName).toBe("Header Org")
    expect(context.workspaceOwner).toBe("header@example.com")
  })

  it("folosește sesiunea din request înaintea header fallback-ului", async () => {
    const request = new Request("http://localhost/internal", {
      headers: {
        "x-compliscan-org-id": "wrong-org",
        "x-compliscan-org-name": "Wrong Org",
        "x-compliscan-user-email": "wrong@example.com",
      },
    })
    mocks.readSessionFromRequestMock.mockReturnValue({
      orgId: "org-request-session",
      orgName: "Session Org",
      email: "session@example.com",
      role: "partner_manager",
    })

    const context = await getOrgContext({ request, allowHeaderFallback: true })

    expect(context.orgId).toBe("org-request-session")
    expect(context.orgName).toBe("Session Org")
    expect(context.workspaceOwner).toBe("session@example.com")
    expect(context.userRole).toBe("partner_manager")
  })
})
