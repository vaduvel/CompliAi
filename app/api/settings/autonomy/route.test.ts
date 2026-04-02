import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET, PATCH } from "./route"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  getAutonomySettingsMock: vi.fn(),
  saveAutonomySettingsMock: vi.fn(),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/autonomy-resolver", () => ({
  getAutonomySettings: mocks.getAutonomySettingsMock,
  saveAutonomySettings: mocks.saveAutonomySettingsMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", orgName: "Org Test", email: "owner@test.ro" }

describe("GET /api/settings/autonomy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.getAutonomySettingsMock.mockResolvedValue({ lowRiskPolicy: "auto" })
  })

  it("citește setările de autonomie din org-ul sesiunii", async () => {
    const res = await GET(new Request("http://localhost/api/settings/autonomy"))

    expect(res.status).toBe(200)
    expect(mocks.getAutonomySettingsMock).toHaveBeenCalledWith("user-1", "org-1")
  })
})

describe("PATCH /api/settings/autonomy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
    mocks.saveAutonomySettingsMock.mockResolvedValue({ lowRiskPolicy: "manual" })
  })

  it("salvează setările de autonomie în org-ul sesiunii", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/settings/autonomy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lowRiskPolicy: "manual" }),
      })
    )

    expect(res.status).toBe(200)
    expect(mocks.saveAutonomySettingsMock).toHaveBeenCalledWith(
      "user-1",
      "org-1",
      expect.objectContaining({ lowRiskPolicy: "manual" })
    )
  })
})
