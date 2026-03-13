import { beforeEach, describe, expect, it, vi } from "vitest"

import { initialComplianceState } from "@/lib/compliance/engine"

const mocks = vi.hoisted(() => ({
  buildDashboardPayloadMock: vi.fn(),
  mutateStateMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: mocks.mutateStateMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

import { POST } from "./route"

describe("POST /api/scan", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
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
    expect(payload.code).toBe("INVALID_REQUEST")
  })

  it("mapeaza lipsa de continut extras ca 422", async () => {
    mocks.mutateStateMock.mockRejectedValueOnce(
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
    expect(payload.code).toBe("SCAN_FAILED")
  })

  it("returneaza succes pentru scanare valida", async () => {
    mocks.mutateStateMock.mockImplementationOnce(async (updater: (state: typeof initialComplianceState) => unknown) =>
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
    expect(payload.message).toContain("Scanare finalizată")
  })
})
