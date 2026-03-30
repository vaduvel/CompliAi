import { describe, expect, it } from "vitest"

import {
  getQuestionIdsForIntakeFlowStep,
  getVisibleConditionalIntakeSteps,
} from "@/lib/compliscan/onboarding-steps"

describe("onboarding-steps", () => {
  it("returns the question ids for each fixed intake step", () => {
    expect(getQuestionIdsForIntakeFlowStep("intake-core-data")).toEqual([
      "sellsToConsumers",
      "hasEmployees",
      "processesPersonalData",
    ])

    expect(getQuestionIdsForIntakeFlowStep("intake-ai")).toEqual([
      "aiUsesConfidentialData",
      "hasAiPolicy",
    ])

    expect(getQuestionIdsForIntakeFlowStep("intake-gdpr")).toEqual([
      "hasPrivacyPolicy",
      "hasDsarProcess",
      "hasRopaRegistry",
      "hasVendorDpas",
      "hasRetentionSchedule",
    ])
  })

  it("keeps conditional steps ordered and only visible when needed", () => {
    expect(
      getVisibleConditionalIntakeSteps([
        { id: "hasVendorDocumentation" },
        { id: "hasPrivacyPolicy" },
        { id: "collectsLeads" },
      ])
    ).toEqual(["intake-gdpr", "intake-vendors", "intake-site"])
  })

  it("skips conditional steps when none of their questions are visible", () => {
    expect(getVisibleConditionalIntakeSteps([])).toEqual([])
  })
})
