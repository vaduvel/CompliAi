import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  resolveUserModeMock: vi.fn(),
  getWhiteLabelConfigMock: vi.fn(),
  saveWhiteLabelConfigMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 403, code = "AUTH_ERROR") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshRole: mocks.requireFreshRoleMock,
  resolveUserMode: mocks.resolveUserModeMock,
}))

vi.mock("@/lib/server/white-label", () => ({
  getWhiteLabelConfig: mocks.getWhiteLabelConfigMock,
  saveWhiteLabelConfig: mocks.saveWhiteLabelConfigMock,
}))

import { GET, PATCH } from "./route"

describe("partner white-label route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      orgId: "partner-org-1",
      userId: "user-1",
      email: "owner@example.com",
      role: "partner_manager",
    })
    mocks.resolveUserModeMock.mockResolvedValue("partner")
  })

  it("GET citește configurația din org-ul sesiunii, nu din header", async () => {
    mocks.getWhiteLabelConfigMock.mockResolvedValue({
      orgId: "partner-org-1",
      partnerName: "Partner Demo",
      tagline: null,
      logoUrl: null,
      brandColor: "#112233",
      updatedAtISO: "2026-04-02T08:00:00.000Z",
    })

    const response = await GET(
      new Request("http://localhost/api/partner/white-label", {
        headers: {
          "x-compliscan-org-id": "wrong-org",
        },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.getWhiteLabelConfigMock).toHaveBeenCalledWith("partner-org-1")
    expect(body.config.orgId).toBe("partner-org-1")
  })

  it("PATCH salvează configurația în org-ul sesiunii", async () => {
    mocks.saveWhiteLabelConfigMock.mockResolvedValue({
      orgId: "partner-org-1",
      partnerName: "Partner Demo",
      tagline: "Audit & compliance",
      logoUrl: "https://cdn.example.com/logo.svg",
      brandColor: "#112233",
      updatedAtISO: "2026-04-02T08:05:00.000Z",
    })

    const response = await PATCH(
      new Request("http://localhost/api/partner/white-label", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-compliscan-org-id": "wrong-org",
        },
        body: JSON.stringify({
          partnerName: "Partner Demo",
          tagline: "Audit & compliance",
          logoUrl: "https://cdn.example.com/logo.svg",
          brandColor: "#112233",
        }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.saveWhiteLabelConfigMock).toHaveBeenCalledWith("partner-org-1", {
      partnerName: "Partner Demo",
      tagline: "Audit & compliance",
      logoUrl: "https://cdn.example.com/logo.svg",
      brandColor: "#112233",
    })
    expect(body.config.orgId).toBe("partner-org-1")
  })
})
