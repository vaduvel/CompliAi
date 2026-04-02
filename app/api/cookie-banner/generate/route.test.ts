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
  generateCookieBannerSnippetMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  requireRoleMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
}))

vi.mock("@/lib/server/cookie-banner-generator", () => ({
  generateCookieBannerSnippet: mocks.generateCookieBannerSnippetMock,
}))

import { POST } from "./route"

describe("POST /api/cookie-banner/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-cookie",
      orgName: "Marketing Growth Hub SRL",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readStateForOrgMock.mockResolvedValue({
      orgProfile: {
        website: "https://marketinghub.ro",
      },
      orgProfilePrefill: {
        companyName: "Marketing Growth Hub SRL",
        normalizedWebsite: "https://marketinghub.ro",
      },
      siteScanJobs: {
        "scan-1": {
          status: "done",
          completedAtISO: "2026-04-02T09:00:00.000Z",
          result: {
            reachable: true,
            trackers: [
              { name: "GA4", category: "analytics", requiresConsent: true },
              { name: "Meta Pixel", category: "marketing", requiresConsent: true },
            ],
          },
        },
      },
    })
    mocks.generateCookieBannerSnippetMock.mockReturnValue({
      html: "<div>banner</div>",
    })
  })

  it("citește tracker-ele și profilul de pe org-ul din sesiune", async () => {
    const response = await POST(new Request("http://localhost/api/cookie-banner/generate", { method: "POST" }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ html: "<div>banner</div>" })
    expect(mocks.readStateForOrgMock).toHaveBeenCalledWith("org-cookie")
    expect(mocks.generateCookieBannerSnippetMock).toHaveBeenCalledWith({
      orgName: "Marketing Growth Hub SRL",
      orgWebsite: "https://marketinghub.ro",
      privacyPolicyUrl: "https://marketinghub.ro/politica-de-confidentialitate",
      trackers: [
        { name: "GA4", category: "analytics", requiresConsent: true },
        { name: "Meta Pixel", category: "marketing", requiresConsent: true },
      ],
    })
  })

  it("propagă erorile de autorizare coerent", async () => {
    mocks.requireRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Interzis", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await POST(new Request("http://localhost/api/cookie-banner/generate", { method: "POST" }))
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })
})
