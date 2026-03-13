import { beforeEach, describe, expect, it, vi } from "vitest"

import { initialComplianceState } from "@/lib/compliance/engine"
import { buildDetectedAISystemRecord } from "@/lib/compliance/ai-inventory"

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

import { PATCH } from "./route"

describe("PATCH /api/ai-systems/detected/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Math, "random").mockReturnValue(0.123456789)
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
  })

  it("confirma detectia si o muta in inventarul oficial", async () => {
    const candidate = buildDetectedAISystemRecord(
      {
        name: "Support assistant · OpenAI",
        purpose: "support-chatbot",
        vendor: "OpenAI",
        modelType: "gpt-4o",
        usesPersonalData: true,
        makesAutomatedDecisions: false,
        impactsRights: false,
        hasHumanReview: true,
        discoveryMethod: "auto",
        confidence: "high",
        frameworks: ["openai-sdk"],
        evidence: ["openai"],
        sourceDocument: "package.json",
      },
      "2026-03-13T10:00:00.000Z"
    )

    mocks.mutateStateMock.mockImplementationOnce(
      async (updater: (state: typeof initialComplianceState) => unknown) =>
        updater({
          ...initialComplianceState,
          detectedAISystems: [candidate],
        })
    )

    const response = await PATCH(
      new Request(`http://localhost/api/ai-systems/detected/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      }),
      { params: Promise.resolve({ id: candidate.id }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toContain("confirmat in inventar")
    expect(payload.state.aiSystems).toHaveLength(1)
    expect(payload.state.aiSystems[0].vendor).toBe("OpenAI")
    expect(payload.state.detectedAISystems[0].detectionStatus).toBe("confirmed")
    expect(payload.state.detectedAISystems[0].confirmedSystemId).toBe(payload.state.aiSystems[0].id)
  })

  it("respinge actiunea invalida", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/ai-systems/detected/det-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ceva-gresit" }),
      }),
      { params: Promise.resolve({ id: "det-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toContain("invalida")
  })
})
