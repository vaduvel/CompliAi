import { beforeEach, describe, expect, it, vi } from "vitest"

import { initialComplianceState } from "@/lib/compliance/engine"

const mocks = vi.hoisted(() => ({
  requireAuthenticatedSessionMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  logRouteErrorMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  requireAuthenticatedSession: mocks.requireAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/operational-logger", () => ({
  logRouteError: mocks.logRouteErrorMock,
}))

import { POST } from "./route"

describe("POST /api/agent/commit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAuthenticatedSessionMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      orgName: "Org Demo",
      email: "owner@site.ro",
      role: "owner",
    })
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId: string, updater: (state: typeof initialComplianceState) => unknown) => {
      updater(structuredClone(initialComplianceState))
      return structuredClone(initialComplianceState)
    })
  })

  it("respinge commitul fara confirmare umana explicita", async () => {
    const response = await POST(
      new Request("http://localhost/api/agent/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: "source-1",
          intake: { proposedSystems: [], sourceSummary: "sumar" },
          findings: [],
          drifts: [],
          evidence: {
            auditReadiness: "partial",
            missingEvidence: [],
            reusableEvidenceIds: [],
            controlCoverage: [],
            executiveSummaryDraft: "",
            stakeholderChecklist: [],
          },
          reviewState: "needs_review",
        }),
      }) as never
    )
    const payload = await response.json()

    expect(response.status).toBe(422)
    expect(payload.code).toBe("AGENT_REVIEW_REQUIRED")
    expect(mocks.mutateStateForOrgMock).not.toHaveBeenCalled()
  })

  it("respinge commitul daca nu a ramas nimic confirmat", async () => {
    const response = await POST(
      new Request("http://localhost/api/agent/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: "source-1",
          intake: { proposedSystems: [], sourceSummary: "sumar" },
          findings: [],
          drifts: [],
          evidence: {
            auditReadiness: "partial",
            missingEvidence: [],
            reusableEvidenceIds: [],
            controlCoverage: [],
            executiveSummaryDraft: "",
            stakeholderChecklist: [],
          },
          reviewState: "confirmed",
        }),
      }) as never
    )
    const payload = await response.json()

    expect(response.status).toBe(422)
    expect(payload.code).toBe("AGENT_NOTHING_CONFIRMED")
    expect(mocks.mutateStateForOrgMock).not.toHaveBeenCalled()
  })

  it("permite commitul doar dupa confirmare explicita", async () => {
    const response = await POST(
      new Request("http://localhost/api/agent/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: "source-1",
          intake: {
            proposedSystems: [
              {
                tempId: "temp-1",
                systemName: "HR Scorer",
                provider: "Vendor",
                model: "Model A",
                purpose: "hr-screening",
                riskClassSuggested: "high",
                dataUsed: ["candidate data"],
                humanOversight: "present",
                fieldStatus: {
                  provider: "detected",
                  model: "detected",
                  purpose: "detected",
                  risk_class: "inferred",
                },
                sourceSignals: ["manifest"],
                confidence: "high",
              },
            ],
            sourceSummary: "sumar",
          },
          findings: [],
          drifts: [],
          evidence: {
            auditReadiness: "partial",
            missingEvidence: [],
            reusableEvidenceIds: [],
            controlCoverage: [],
            executiveSummaryDraft: "",
            stakeholderChecklist: [],
          },
          reviewState: "confirmed",
        }),
      }) as never
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
  })
})
