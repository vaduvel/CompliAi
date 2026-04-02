import { beforeEach, describe, expect, it, vi } from "vitest"

import { RequestValidationError } from "@/lib/server/request-validation"

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
  buildDashboardPayloadMock: vi.fn(),
  createExtractedScanMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  requireFreshAuthenticatedSessionMock: vi.fn(),
  resolveOptionalEventActorMock: vi.fn(),
  validateScanInputPayloadMock: vi.fn(),
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
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

vi.mock("@/lib/server/scan-workflow", () => ({
  createExtractedScan: mocks.createExtractedScanMock,
  validateScanInputPayload: mocks.validateScanInputPayloadMock,
}))

describe("POST /api/scan/extract", () => {
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
      new Request("http://localhost/api/scan/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualText: "demo" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.code).toBe("AUTH_SESSION_REQUIRED")
  })

  it("mapeaza erorile de validare", async () => {
    mocks.validateScanInputPayloadMock.mockImplementationOnce(() => {
      throw new RequestValidationError("Textul depaseste limita maxima.", 400, "TEXT_TOO_LONG")
    })

    const response = await POST(
      new Request("http://localhost/api/scan/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualText: "x" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.code).toBe("TEXT_TOO_LONG")
    expect(payload.extractionStatus).toBe("needs_review")
  })

  it("returneaza 422 daca nu a fost extras text utilizabil", async () => {
    mocks.validateScanInputPayloadMock.mockReturnValueOnce({ manualText: "demo" })
    mocks.mutateStateForOrgMock.mockRejectedValueOnce(new Error("Nu am extras text utilizabil din document."))

    const response = await POST(
      new Request("http://localhost/api/scan/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualText: "demo" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(422)
    expect(payload.code).toBe("SCAN_EXTRACT_FAILED")
  })

  it("returneaza rezultatul extras si preview-ul", async () => {
    mocks.validateScanInputPayloadMock.mockReturnValueOnce({ manualText: "demo" })
    mocks.mutateStateForOrgMock.mockImplementationOnce(
      async (_orgId: string, updater: (state: unknown) => unknown) =>
        updater({ scans: [], findings: [], alerts: [] })
    )
    mocks.createExtractedScanMock.mockResolvedValueOnce({
      nextState: { scans: [{ id: "scan-1" }], findings: [], alerts: [] },
      result: {
        scan: { id: "scan-1", status: "extracted" },
        ocrUsed: true,
        ocrWarning: null,
        extractedTextPreview: "Primele randuri extrase",
      },
    })

    const response = await POST(
      new Request("http://localhost/api/scan/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualText: "demo" }),
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
      { scans: [{ id: "scan-1" }], findings: [], alerts: [] },
      expect.objectContaining({
        orgId: "org-1",
        orgName: "Demo Org SRL",
        workspaceLabel: "Demo Org SRL",
        workspaceOwner: "owner@example.com",
      })
    )
    expect(payload.message).toBe("Textul a fost extras. Revizuieste-l si porneste analiza.")
    expect(payload.scan.id).toBe("scan-1")
    expect(payload.extractedTextPreview).toBe("Primele randuri extrase")
  })
})
