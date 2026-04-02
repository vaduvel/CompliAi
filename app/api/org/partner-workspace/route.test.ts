import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readSessionFromRequestMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  trackEventMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: class AuthzError extends Error {
    status = 403
    code = "AUTH_ROLE_FORBIDDEN"
  },
  readSessionFromRequest: mocks.readSessionFromRequestMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/analytics", () => ({
  trackEvent: mocks.trackEventMock,
}))

import { POST } from "./route"

describe("POST /api/org/partner-workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionFromRequestMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Partner Org",
      email: "partner@example.com",
      role: "partner_manager",
    })
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId, updater) =>
      updater({
        partnerWorkspace: {
          orgName: "Partner Org",
        },
      })
    )
  })

  it("salveaza workspace-ul partenerului pe org-ul din sesiune", async () => {
    const response = await POST(
      new Request("http://localhost/api/org/partner-workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgName: "Partner Org",
          cui: "RO12345678",
          clientScale: "5-20",
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Partner Org"
    )
    expect(mocks.trackEventMock).toHaveBeenCalledWith("org-1", "completed_partner_workspace", {
      clientScale: "5-20",
    })
  })
})
