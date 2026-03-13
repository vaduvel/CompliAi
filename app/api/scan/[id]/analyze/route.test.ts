import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

const mocks = vi.hoisted(() => ({
  mutateStateMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: mocks.mutateStateMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

describe("POST /api/scan/[id]/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
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
    mocks.mutateStateMock.mockRejectedValueOnce(new Error("SCAN_NOT_FOUND"))

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
    mocks.mutateStateMock.mockRejectedValueOnce(new Error("SCAN_ALREADY_ANALYZED"))

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
    mocks.mutateStateMock.mockResolvedValueOnce({
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
    expect(payload.message).toBe("Analiza a fost rulata pe textul revizuit.")
  })
})
