import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

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
  mutateStateForOrgMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  requireFreshAuthenticatedSessionMock: vi.fn(),
  resolveOptionalEventActorMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorClass,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/event-actor", () => ({
  resolveOptionalEventActor: mocks.resolveOptionalEventActorMock,
}))

describe("POST /api/scan/[id]/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      orgId: "org-1",
      orgName: "Demo Org SRL",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "fallback-org",
      orgName: "Fallback Org",
      workspaceLabel: "Fallback Workspace",
      workspaceOwner: "fallback@example.com",
      workspaceInitials: "FW",
    })
    mocks.resolveOptionalEventActorMock.mockResolvedValue(undefined)
  })

  it("respinge fără sesiune activă", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorClass("Ai nevoie de sesiune activa.")
    )

    const response = await POST(
      new Request("http://localhost/api/scan/scan-1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedContent: "text" }),
      }),
      { params: Promise.resolve({ id: "scan-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("AUTH_SESSION_REQUIRED")
  })

  it("respinge payload-ul invalid", async () => {
    const response = await POST(
      new Request("http://localhost/api/scan/scan-1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(["gresit"]),
      }),
      { params: Promise.resolve({ id: "scan-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("INVALID_REQUEST")
  })

  it("mapeaza scan not found", async () => {
    mocks.mutateStateForOrgMock.mockRejectedValueOnce(new Error("SCAN_NOT_FOUND"))

    const response = await POST(
      new Request("http://localhost/api/scan/scan-1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedContent: "text" }),
      }),
      { params: Promise.resolve({ id: "scan-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.code).toBe("SCAN_NOT_FOUND")
  })

  it("mapeaza scan deja analizat", async () => {
    mocks.mutateStateForOrgMock.mockRejectedValueOnce(new Error("SCAN_ALREADY_ANALYZED"))

    const response = await POST(
      new Request("http://localhost/api/scan/scan-1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedContent: "text" }),
      }),
      { params: Promise.resolve({ id: "scan-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.code).toBe("SCAN_ALREADY_ANALYZED")
  })

  it("returneaza succes pentru analiza valida", async () => {
    mocks.mutateStateForOrgMock.mockResolvedValueOnce({
      scans: [{ id: "scan-1" }],
      findings: [],
      alerts: [],
      events: [],
    })

    const response = await POST(
      new Request("http://localhost/api/scan/scan-1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedContent: "text revizuit" }),
      }),
      { params: Promise.resolve({ id: "scan-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Demo Org SRL"
    )
    expect(mocks.buildDashboardPayloadMock).toHaveBeenCalledWith(
      {
        scans: [{ id: "scan-1" }],
        findings: [],
        alerts: [],
        events: [],
      },
      expect.objectContaining({
        orgId: "org-1",
        orgName: "Demo Org SRL",
        workspaceLabel: "Demo Org SRL",
        workspaceOwner: "owner@example.com",
      })
    )
    expect(payload.message).toBe("Analiza a fost rulata pe textul revizuit.")
  })
})
