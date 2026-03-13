import { describe, expect, it } from "vitest"

import { detectComplianceSignals } from "./signal-detection"
import { simulateFindings } from "./engine"

describe("signal-detection", () => {
  it("marcheaza keyword match-ul ca semnal direct cu incredere mare", () => {
    const signals = detectComplianceSignals({
      documentName: "policy-tracking.txt",
      content: "Acest document mentioneaza cookies, tracking si analytics.",
    })

    const trackingSignal = signals.find((signal) => signal.ruleId === "GDPR-003")

    expect(trackingSignal).toBeDefined()
    expect(trackingSignal?.signalSource).toBe("keyword")
    expect(trackingSignal?.verdictBasis).toBe("direct_signal")
    expect(trackingSignal?.signalConfidence).toBe("high")
  })

  it("marcheaza manifest key-ul ca semnal inferat cu incredere medie si il propaga in finding", () => {
    const signals = detectComplianceSignals({
      documentName: "requirements.txt",
      content: "dependinte aplicatie interne",
      manifestSignals: ["openai"],
    })
    const transparencySignal = signals.find((signal) => signal.ruleId === "EUAI-TR-001")

    expect(transparencySignal).toBeDefined()
    expect(transparencySignal?.signalSource).toBe("manifest")
    expect(transparencySignal?.verdictBasis).toBe("inferred_signal")
    expect(transparencySignal?.signalConfidence).toBe("medium")

    const result = simulateFindings(
      "requirements.txt",
      "dependinte aplicatie interne",
      "2026-03-13T10:00:00.000Z",
      undefined,
      { manifestSignals: ["openai"] }
    )
    const propagated = result.findings.find((finding) => finding.provenance?.ruleId === "EUAI-TR-001")

    expect(propagated?.provenance?.signalSource).toBe("manifest")
    expect(propagated?.provenance?.verdictBasis).toBe("inferred_signal")
    expect(propagated?.provenance?.signalConfidence).toBe("medium")
  })
})
