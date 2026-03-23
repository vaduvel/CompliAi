import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readSessionFromRequestMock: vi.fn(),
  setUserModeMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  readSessionFromRequest: mocks.readSessionFromRequestMock,
  setUserMode: mocks.setUserModeMock,
}))

import { POST } from "./route"

describe("POST /api/auth/set-user-mode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
