import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

const mocks = vi.hoisted(() => ({
  mutateStateForOrgMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
  readSessionFromRequestMock: vi.fn(),
  resolveOptionalEventActorMock: vi.fn(),
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

vi.mock("@/lib/server/event-actor", () => ({
  resolveOptionalEventActor: mocks.resolveOptionalEventActorMock,
}))

describe("POST /api/scan/[id]/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
    mocks.readSessionFromRequestMock.mockReturnValue({ orgId: "org-1", orgName: "Demo Org SRL" })
    mocks.resolveOptionalEventActorMock.mockResolvedValue(undefined)
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
    expect(payload.message).toBe("Analiza a fost rulata pe textul revizuit.")
  })
})
