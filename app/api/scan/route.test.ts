import { beforeEach, describe, expect, it, vi } from "vitest"

import { initialComplianceState } from "@/lib/compliance/engine"

const mocks = vi.hoisted(() => ({
  buildDashboardPayloadMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  readSessionFromRequestMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/auth", () => ({
  readSessionFromRequest: mocks.readSessionFromRequestMock,
}))

import { POST } from "./route"

describe("POST /api/scan", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
    mocks.readSessionFromRequestMock.mockReturnValue({ orgId: "org-1", orgName: "Demo Org SRL" })
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
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.message).toContain("Scanare finalizată")
  })
})
