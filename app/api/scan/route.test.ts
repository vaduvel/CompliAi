import { beforeEach, describe, expect, it, vi } from "vitest"

import { initialComplianceState } from "@/lib/compliance/engine"

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
  buildDashboardPayloadMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  readFreshSessionFromRequestMock: vi.fn(),
  readSessionFromRequestMock: vi.fn(),
  requireFreshAuthenticatedSessionMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorClass,
  readFreshSessionFromRequest: mocks.readFreshSessionFromRequestMock,
  readSessionFromRequest: mocks.readSessionFromRequestMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

import { POST } from "./route"

describe("POST /api/scan", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Demo Org SRL",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readFreshSessionFromRequestMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Demo Org SRL",
      email: "owner@example.com",
      role: "owner",
    })
    mocks.readSessionFromRequestMock.mockReturnValue({
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
  })

  it("respinge fără sesiune activă", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValueOnce(
      new mocks.AuthzErrorClass("Ai nevoie de sesiune activa.")
    )

    const response = await POST(
      new Request("http://localhost/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentName: "scan.pdf", pdfBase64: "JVBERi0xLjQK" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("AUTH_SESSION_REQUIRED")
  })

  it("respinge payload-ul invalid", async () => {
    const response = await POST(
      new Request("http://localhost/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.code).toBe("INVALID_REQUEST")
  })

  it("mapeaza lipsa de continut extras ca 422", async () => {
    mocks.mutateStateForOrgMock.mockRejectedValueOnce(
      new Error("Nu am extras continut util din fisier. Revizuieste OCR-ul sau adauga text manual.")
    )

    const response = await POST(
      new Request("http://localhost/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentName: "scan.pdf", pdfBase64: "JVBERi0xLjQK" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(422)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.code).toBe("SCAN_FAILED")
  })

  it("returneaza succes pentru scanare valida", async () => {
    mocks.mutateStateForOrgMock.mockImplementationOnce(
      async (_orgId: string, updater: (state: typeof initialComplianceState) => unknown) =>
        updater(initialComplianceState)
    )

    const response = await POST(
      new Request("http://localhost/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: "policy-tracking.txt",
          content: "tracking analytics cookies",
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Demo Org SRL"
    )
    expect(mocks.buildDashboardPayloadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scans: expect.any(Array),
        findings: expect.any(Array),
        alerts: expect.any(Array),
      }),
      expect.objectContaining({
        orgId: "org-1",
        orgName: "Demo Org SRL",
        workspaceLabel: "Demo Org SRL",
        workspaceOwner: "owner@example.com",
      })
    )
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.message).toContain("Scanare finalizată")
  })
})
