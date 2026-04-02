import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readSessionMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  readSessionFromRequest: mocks.readSessionMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: mocks.readStateForOrgMock,
}))

vi.mock("@/lib/server/nis2-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/nis2-store")>("@/lib/server/nis2-store")
  return {
    ...actual,
    readNis2State: mocks.readNis2StateMock,
  }
})

import { GET } from "./route"

describe("GET /api/nis2/package", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSessionMock.mockReturnValue({ userId: "user-1", orgId: "org-1", email: "demo@site.ro" })
    mocks.readStateForOrgMock.mockResolvedValue({
      applicability: { entries: [{ tag: "nis2", certainty: "certain" }] },
    })
    mocks.readNis2StateMock.mockResolvedValue({
      assessment: { score: 42, completedAtISO: "2026-03-17T10:00:00.000Z" },
      incidents: [],
      vendors: [],
      dnscRegistrationStatus: "not-started",
      updatedAtISO: "2026-03-17T10:00:00.000Z",
    })
  })

  it("returnează pachetul NIS2 structurat și findings-urile derivate", async () => {
    const response = await GET(new Request("http://localhost/api/nis2/package"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.applicable).toBe(true)
    expect(body.exportReady).toBe(false)
    expect(body.nis2Package.assessmentScore).toBe(42)
    expect(mocks.readStateForOrgMock).toHaveBeenCalledWith("org-1")
    expect(body.findings.map((finding: { id: string }) => finding.id)).toEqual(
      expect.arrayContaining(["nis2-dnsc-registration", "nis2-assessment-gap"])
    )
  })

  it("returnează exportReady când nu există gap-uri active", async () => {
    mocks.readNis2StateMock.mockResolvedValue({
      assessment: { score: 88, completedAtISO: "2026-03-17T10:00:00.000Z" },
      incidents: [],
      vendors: [],
      dnscRegistrationStatus: "confirmed",
      maturityAssessment: { overallScore: 71 },
      updatedAtISO: "2026-03-17T10:00:00.000Z",
    })

    const response = await GET(new Request("http://localhost/api/nis2/package"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.applicable).toBe(true)
    expect(body.exportReady).toBe(true)
    expect(body.findings).toEqual([])
  })

  it("respinge accesul fără sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)

    const response = await GET(new Request("http://localhost/api/nis2/package"))

    expect(response.status).toBe(401)
  })
})
