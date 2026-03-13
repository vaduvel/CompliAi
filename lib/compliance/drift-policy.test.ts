import { describe, expect, it } from "vitest"

import { assessDriftPolicy, getDriftPolicyFromRecord } from "./drift-policy"

describe("drift-policy", () => {
  it("ridica human_review_removed la critic pentru sisteme high-risk si blocheaza auditul", () => {
    const policy = assessDriftPolicy({
      change: "human_review_removed",
      type: "compliance_drift",
      system: {
        riskClass: "high",
        automatedDecisions: true,
        impactsRights: true,
      },
      after: {
        detectedAtISO: "2026-03-13T10:00:00.000Z",
      },
    })

    expect(policy.severity).toBe("critical")
    expect(policy.escalationTier).toBe("critical")
    expect(policy.escalationSlaHours).toBe(8)
    expect(policy.blocksAudit).toBe(true)
    expect(policy.blocksBaseline).toBe(true)
    expect(policy.requiresHumanApproval).toBe(true)
    expect(policy.escalationDueAtISO).toBe("2026-03-13T18:00:00.000Z")
    expect(policy.severityReason).toContain("review-ul uman")
  })

  it("aplica override de severitate si recalculeaza escalarea pentru provider_added", () => {
    const policy = assessDriftPolicy({
      change: "provider_added",
      type: "operational_drift",
      settings: {
        severityOverrides: {
          provider_added: "high",
        },
      },
      after: {
        detectedAtISO: "2026-03-13T10:00:00.000Z",
      },
    })

    expect(policy.severity).toBe("high")
    expect(policy.escalationTier).toBe("urgent")
    expect(policy.escalationSlaHours).toBe(24)
    expect(policy.blocksAudit).toBe(true)
    expect(policy.blocksBaseline).toBe(true)
    expect(policy.requiresHumanApproval).toBe(false)
    expect(policy.escalationDueAtISO).toBe("2026-03-14T10:00:00.000Z")
  })

  it("pastreaza campurile explicite din record si completeaza ownerSuggestion din politica", () => {
    const policy = getDriftPolicyFromRecord({
      change: "tracking_detected",
      type: "compliance_drift",
      severity: "high",
      impactSummary: "Impact custom",
      nextAction: "Actiune custom",
      evidenceRequired: "Dovada custom",
      lawReference: "GDPR Art. 7 custom",
      severityReason: "Motiv custom",
      escalationTier: "urgent",
      escalationSlaHours: 16,
      escalationDueAtISO: "2026-03-14T02:00:00.000Z",
      blocksAudit: true,
      blocksBaseline: false,
      requiresHumanApproval: false,
      before: {},
      after: {
        detectedAtISO: "2026-03-13T10:00:00.000Z",
      },
    })

    expect(policy.severity).toBe("high")
    expect(policy.impactSummary).toBe("Impact custom")
    expect(policy.nextAction).toBe("Actiune custom")
    expect(policy.evidenceRequired).toBe("Dovada custom")
    expect(policy.lawReference).toBe("GDPR Art. 7 custom")
    expect(policy.severityReason).toBe("Motiv custom")
    expect(policy.escalationTier).toBe("urgent")
    expect(policy.escalationSlaHours).toBe(16)
    expect(policy.escalationDueAtISO).toBe("2026-03-14T02:00:00.000Z")
    expect(policy.ownerSuggestion).toBe("Marketing Ops + Frontend")
  })
})
