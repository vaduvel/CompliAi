import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createSessionTokenMock: vi.fn(),
  getSessionCookieOptionsMock: vi.fn(),
  readFreshSessionFromRequestMock: vi.fn(),
  getClaimInviteByTokenMock: vi.fn(),
  acceptClaimInviteMock: vi.fn(),
  claimOrganizationOwnershipMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  createSessionToken: mocks.createSessionTokenMock,
  getSessionCookieOptions: mocks.getSessionCookieOptionsMock,
  readFreshSessionFromRequest: mocks.readFreshSessionFromRequestMock,
  claimOrganizationOwnership: mocks.claimOrganizationOwnershipMock,
  SESSION_COOKIE: "compliscan_session",
}))

vi.mock("@/lib/server/claim-ownership", () => ({
  getClaimInviteByToken: mocks.getClaimInviteByTokenMock,
  acceptClaimInvite: mocks.acceptClaimInviteMock,
}))

import { POST } from "./route"

describe("POST /api/auth/claim-accept", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSessionCookieOptionsMock.mockReturnValue({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    })
    mocks.createSessionTokenMock.mockReturnValue("claimed-token")
    mocks.getClaimInviteByTokenMock.mockResolvedValue({
      id: "claim-1",
      orgId: "org-1",
      orgName: "Client SRL",
      invitedEmail: "ceo@client.ro",
      createdAtISO: "2026-03-23T10:00:00.000Z",
      expiresAtISO: "2026-03-30T10:00:00.000Z",
      token: "claim-token",
      claimUrl: "http://localhost:3000/claim?token=claim-token",
      status: "pending",
    })
    mocks.acceptClaimInviteMock.mockResolvedValue({
      id: "claim-1",
      status: "accepted",
    })
  })

  it("accepta claim-ul si creeaza sesiune noua", async () => {
    mocks.readFreshSessionFromRequestMock.mockResolvedValue(null)
    mocks.claimOrganizationOwnershipMock.mockResolvedValue({
      id: "user-owner",
      orgId: "org-1",
      orgName: "Client SRL",
      email: "ceo@client.ro",
      role: "owner",
      membershipId: "membership-owner",
    })

    const response = await POST(
      new Request("http://localhost/api/auth/claim-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "claim-token", password: "super-secret" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.role).toBe("owner")
    expect(response.headers.get("set-cookie")).toContain("compliscan_session=claimed-token")
    expect(mocks.claimOrganizationOwnershipMock).toHaveBeenCalledWith(
      "org-1",
      "ceo@client.ro",
      expect.objectContaining({ password: "super-secret" })
    )
  })

  it("respinge sesiunea care nu corespunde cu emailul invitat", async () => {
    mocks.readFreshSessionFromRequestMock.mockResolvedValue({
      userId: "user-x",
      email: "alt@client.ro",
    })

    const response = await POST(
      new Request("http://localhost/api/auth/claim-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "claim-token" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("CLAIM_EMAIL_MISMATCH")
  })

  it("intoarce 401 cand emailul invitat are deja cont si trebuie login", async () => {
    mocks.readFreshSessionFromRequestMock.mockResolvedValue(null)
    mocks.claimOrganizationOwnershipMock.mockRejectedValueOnce(new Error("CLAIM_LOGIN_REQUIRED"))

    const response = await POST(
      new Request("http://localhost/api/auth/claim-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "claim-token" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("CLAIM_LOGIN_REQUIRED")
  })
})
