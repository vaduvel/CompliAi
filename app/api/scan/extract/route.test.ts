import { beforeEach, describe, expect, it, vi } from "vitest"

import { RequestValidationError } from "@/lib/server/request-validation"

import { POST } from "./route"

const mocks = vi.hoisted(() => ({
  buildDashboardPayloadMock: vi.fn(),
  createExtractedScanMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  readSessionFromRequestMock: vi.fn(),
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
  readSessionFromRequest: mocks.readSessionFromRequestMock,
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
    mocks.readSessionFromRequestMock.mockReturnValue({ orgId: "org-1", orgName: "Demo Org SRL" })
    mocks.resolveOptionalEventActorMock.mockResolvedValue(undefined)
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
    expect(payload.message).toBe("Textul a fost extras. Revizuieste-l si porneste analiza.")
    expect(payload.scan.id).toBe("scan-1")
    expect(payload.extractedTextPreview).toBe("Primele randuri extrase")
  })
})
