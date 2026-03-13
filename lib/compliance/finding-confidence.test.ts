import { describe, expect, it } from "vitest"

import {
  buildFindingConfidenceReason,
  inferFindingConfidence,
} from "./finding-confidence"

describe("finding-confidence", () => {
  it("trateaza semnalele directe ca verdicte cu incredere mare", () => {
    expect(
      inferFindingConfidence({
        ruleId: "GDPR-003",
        verdictBasis: "direct_signal",
        signalConfidence: "high",
      })
    ).toBe("high")
  })

  it("trateaza semnalele din manifest ca verdicte cu incredere medie", () => {
    expect(
      inferFindingConfidence({
        ruleId: "EUAI-TR-001",
        verdictBasis: "inferred_signal",
        signalConfidence: "medium",
      })
    ).toBe("medium")
  })

  it("explica diferit motivul in functie de baza verdictului", () => {
    const directReason = buildFindingConfidenceReason({
      title: "Tracking",
      sourceDocument: "policy.txt",
      provenance: {
        ruleId: "GDPR-003",
        verdictBasis: "direct_signal",
        signalConfidence: "high",
      },
    })
    const inferredReason = buildFindingConfidenceReason({
      title: "Transparanta AI",
      sourceDocument: "requirements.txt",
      provenance: {
        ruleId: "EUAI-TR-001",
        verdictBasis: "inferred_signal",
        signalConfidence: "medium",
      },
    })

    expect(directReason).toContain("încredere mare")
    expect(inferredReason).toContain("încredere medie")
  })
})
