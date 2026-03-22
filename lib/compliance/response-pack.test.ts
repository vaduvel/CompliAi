import { describe, expect, it } from "vitest"

import { initialComplianceState } from "@/lib/compliance/engine"
import { buildComplianceResponse } from "@/lib/compliance/response-pack"
import type { DashboardSummary } from "@/lib/compliance/types"

const summary: DashboardSummary = {
  score: 78,
  riskLabel: "Risc Mediu",
  riskColor: "#ca8a04",
  redAlerts: 0,
  yellowAlerts: 0,
  openAlerts: 0,
}

describe("buildComplianceResponse", () => {
  it("numără doar sistemele AI confirmate în evidence summary", () => {
    const state = {
      ...initialComplianceState,
      aiSystems: [],
      detectedAISystems: [
        {
          id: "det-1",
          name: "Recruitment AI",
          purpose: "hr-screening" as const,
          vendor: "OpenAI",
          modelType: "GPT",
          usesPersonalData: true,
          makesAutomatedDecisions: true,
          impactsRights: true,
          hasHumanReview: false,
          riskLevel: "high" as const,
          recommendedActions: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          detectedAtISO: "2026-03-22T10:00:00.000Z",
          discoveryMethod: "auto" as const,
          detectionStatus: "detected" as const,
          confidence: "high" as const,
          frameworks: [],
          evidence: [],
        },
        {
          id: "det-2",
          name: "Support AI",
          purpose: "support-chatbot" as const,
          vendor: "OpenAI",
          modelType: "GPT",
          usesPersonalData: true,
          makesAutomatedDecisions: false,
          impactsRights: false,
          hasHumanReview: true,
          riskLevel: "limited" as const,
          recommendedActions: [],
          createdAtISO: "2026-03-22T10:00:00.000Z",
          detectedAtISO: "2026-03-22T10:00:00.000Z",
          discoveryMethod: "auto" as const,
          detectionStatus: "confirmed" as const,
          confidence: "high" as const,
          frameworks: [],
          evidence: [],
        },
      ],
      highRisk: 14,
    }

    const report = buildComplianceResponse(state, summary, [], "Demo SRL", "2026-03-22T10:00:00.000Z")

    expect(report.evidenceSummary.aiSystemsInventoried).toBe(1)
    expect(report.evidenceSummary.highRiskAiSystems).toBe(0)
  })
})
