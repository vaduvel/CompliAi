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
  requireFreshRoleMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  saveDnscRegistrationNumberMock: vi.fn(),
  saveDnscRegistrationStatusMock: vi.fn(),
  mutateFreshStateForOrgMock: vi.fn(),
  detectEntityTypeMock: vi.fn(),
  buildDnscRescueFindingMock: vi.fn(),
  preserveRuntimeStateForSingleFindingMock: vi.fn(),
  mergeNis2PackageFindingsMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorClass,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: mocks.readNis2StateMock,
  saveDnscRegistrationNumber: mocks.saveDnscRegistrationNumberMock,
  saveDnscRegistrationStatus: mocks.saveDnscRegistrationStatusMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateFreshStateForOrg: mocks.mutateFreshStateForOrgMock,
}))

vi.mock("@/lib/compliance/nis2-rules", () => ({
  detectEntityType: mocks.detectEntityTypeMock,
}))

vi.mock("@/lib/compliance/nis2-rescue", () => ({
  buildDnscRescueFinding: mocks.buildDnscRescueFindingMock,
  DNSC_RESCUE_FINDING_ID: "nis2-rescue-dnsc-registration",
}))

vi.mock("@/lib/server/preserve-finding-runtime-state", () => ({
  preserveRuntimeStateForSingleFinding: mocks.preserveRuntimeStateForSingleFindingMock,
}))

vi.mock("@/lib/server/nis2-package-sync", () => ({
  mergeNis2PackageFindings: mocks.mergeNis2PackageFindingsMock,
}))

import { GET, PUT } from "./route"

describe("NIS2 DNSC status route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      orgId: "org-session",
      orgName: "Marketing Growth Hub SRL",
      role: "owner",
    })
    mocks.readNis2StateMock.mockResolvedValue({
      assessment: { sector: "digital-infrastructure" },
      dnscRegistrationStatus: "in-progress",
      dnscRegistrationNumber: "DNSC-001",
      dnscRegistrationCorrespondence: [{ id: "c1" }],
    })
    mocks.saveDnscRegistrationStatusMock.mockResolvedValue({
      dnscRegistrationStatus: "confirmed",
    })
    mocks.detectEntityTypeMock.mockReturnValue("essential")
    mocks.buildDnscRescueFindingMock.mockReturnValue(null)
    mocks.preserveRuntimeStateForSingleFindingMock.mockImplementation((_existing: unknown, finding: unknown) => finding)
    mocks.mergeNis2PackageFindingsMock.mockImplementation((findings: unknown) => findings)
    mocks.mutateFreshStateForOrgMock.mockImplementation(async (_orgId: string, updater: (current: { findings: unknown[] }) => unknown) => {
      return updater({ findings: [] })
    })
  })

  it("citește statusul DNSC pe org-ul din sesiune", async () => {
    const response = await GET(
      new Request("http://localhost/api/nis2/dnsc-status", {
        headers: { "x-compliscan-org-id": "wrong-org" },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.readNis2StateMock).toHaveBeenCalledWith("org-session")
    expect(body.status).toBe("in-progress")
    expect(body.registrationNumber).toBe("DNSC-001")
  })

  it("actualizează statusul și sincronizează findings pe org-ul sesiunii", async () => {
    const response = await PUT(
      new Request("http://localhost/api/nis2/dnsc-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-compliscan-org-id": "wrong-org" },
        body: JSON.stringify({ status: "confirmed", registrationNumber: "DNSC-002" }),
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.saveDnscRegistrationStatusMock).toHaveBeenCalledWith("org-session", "confirmed")
    expect(mocks.saveDnscRegistrationNumberMock).toHaveBeenCalledWith("org-session", "DNSC-002")
    expect(mocks.mutateFreshStateForOrgMock).toHaveBeenCalledWith(
      "org-session",
      expect.any(Function),
      "Marketing Growth Hub SRL"
    )
    expect(body.status).toBe("confirmed")
  })

  it("refuză accesul fără sesiune", async () => {
    mocks.requireFreshRoleMock.mockRejectedValueOnce(
      new mocks.AuthzErrorClass("Ai nevoie de sesiune activa.")
    )

    const response = await GET(new Request("http://localhost/api/nis2/dnsc-status"))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.code).toBe("AUTH_SESSION_REQUIRED")
  })
})
