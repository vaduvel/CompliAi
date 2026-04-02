import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorClass: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "AUTH_SESSION_REQUIRED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readNis2EligibilityMock: vi.fn(),
  saveNis2EligibilityMock: vi.fn(),
  evaluateNis2EligibilityMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  writeStateForOrgMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorClass,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2Eligibility: mocks.readNis2EligibilityMock,
  saveNis2Eligibility: mocks.saveNis2EligibilityMock,
}))

vi.mock("@/lib/compliscan/nis2-eligibility", () => ({
  NIS2_SECTORS: [
    { id: "digital-infrastructure", annex: "1" },
    { id: "banking", annex: "1" },
  ],
  evaluateNis2Eligibility: mocks.evaluateNis2EligibilityMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
  writeStateForOrg: mocks.writeStateForOrgMock,
}))

import { GET, POST } from "./route"

describe("NIS2 eligibility route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      orgId: "org-session",
      orgName: "Marketing Growth Hub SRL",
      role: "owner",
      email: "owner@example.com",
    })
    mocks.readNis2EligibilityMock.mockResolvedValue(null)
    mocks.evaluateNis2EligibilityMock.mockReturnValue({
      result: "intri",
      description: "Firma intră sub incidența NIS2.",
      recommendation: "Pregătește înregistrarea DNSC.",
    })
    mocks.readFreshStateForOrgMock.mockResolvedValue({ findings: [] })
  })

  it("citește eligibilitatea pentru org-ul sesiunii", async () => {
    const response = await GET(
      new Request("http://localhost/api/nis2/eligibility", {
        headers: { "x-compliscan-org-id": "wrong-org" },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readNis2EligibilityMock).toHaveBeenCalledWith("org-session")
    expect(body.eligibility).toBeNull()
  })

  it("salvează eligibilitatea și finding-ul pe org-ul sesiunii", async () => {
    const response = await POST(
      new Request("http://localhost/api/nis2/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-compliscan-org-id": "wrong-org" },
        body: JSON.stringify({
          sectorId: "digital-infrastructure",
          employees: "50-250",
          revenue: "10-50m",
        }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.saveNis2EligibilityMock).toHaveBeenCalledWith(
      "org-session",
      expect.objectContaining({
        sectorId: "digital-infrastructure",
        result: "intri",
      })
    )
    expect(mocks.writeStateForOrgMock).toHaveBeenCalledWith(
      "org-session",
      expect.objectContaining({
        findings: [
          expect.objectContaining({
            id: "nis2-finding-eligibility",
            category: "NIS2",
          }),
        ],
      }),
      "Marketing Growth Hub SRL"
    )
    expect(body.ok).toBe(true)
    expect(body.output.result).toBe("intri")
  })

  it("refuză accesul fără sesiune", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorClass("Ai nevoie de sesiune activa.")
    )

    const response = await GET(new Request("http://localhost/api/nis2/eligibility"))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.code).toBe("AUTH_SESSION_REQUIRED")
  })
})
