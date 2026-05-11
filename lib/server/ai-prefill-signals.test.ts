import { describe, expect, it } from "vitest"

import { buildAISystemRecord, buildDetectedAISystemRecord } from "@/lib/compliance/ai-inventory"
import { buildAiPrefillSignals, enrichOrgProfilePrefillWithAiSignals } from "@/lib/server/ai-prefill-signals"

describe("ai-prefill-signals", () => {
  it("produce sugestii high confidence pentru sisteme AI confirmate", () => {
    const nowISO = "2026-03-20T10:00:00.000Z"
    const result = buildAiPrefillSignals({
      aiSystems: [
        buildAISystemRecord(
          {
            name: "ChatGPT Support Assistant",
            purpose: "support-chatbot",
            vendor: "OpenAI",
            modelType: "gpt-4.1",
            usesPersonalData: true,
            makesAutomatedDecisions: false,
            impactsRights: false,
            hasHumanReview: true,
          },
          nowISO
        ),
      ],
      detectedAISystems: [],
    })

    expect(result.usesAITools).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
        source: "ai_inventory",
      })
    )
    expect(result.processesPersonalData).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
        source: "ai_inventory",
      })
    )
    expect(result.aiUsesConfidentialData).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
        source: "ai_inventory",
      })
    )
    expect(result.aiSignals).toEqual({
      source: "ai_inventory",
      confirmedSystems: 1,
      detectedSystems: 0,
      personalDataSystems: 1,
      topSystems: ["ChatGPT Support Assistant"],
    })
  })

  it("folosește confidence medie pentru sisteme detectate dar neconfirmate", () => {
    const nowISO = "2026-03-20T10:00:00.000Z"
    const result = buildAiPrefillSignals({
      aiSystems: [],
      detectedAISystems: [
        buildDetectedAISystemRecord(
          {
            name: "Copilot drafting",
            purpose: "document-assistant",
            vendor: "Microsoft",
            modelType: "Copilot",
            usesPersonalData: true,
            makesAutomatedDecisions: false,
            impactsRights: false,
            hasHumanReview: true,
            discoveryMethod: "auto",
            confidence: "high",
            frameworks: ["eu_ai_act"],
            evidence: ["manifest.yml"],
          },
          nowISO
        ),
      ],
    })

    expect(result.usesAITools).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "medium",
        source: "ai_inventory",
      })
    )
    expect(result.processesPersonalData).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "medium",
        source: "ai_inventory",
      })
    )
    expect(result.aiUsesConfidentialData).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "medium",
        source: "ai_inventory",
      })
    )
    expect(result.aiSignals?.detectedSystems).toBe(1)
  })

  it("îmbogățește prefill-ul ANAF cu semnale AI când există inventar", () => {
    const nowISO = "2026-03-20T10:00:00.000Z"
    const result = enrichOrgProfilePrefillWithAiSignals(
      {
        source: "anaf_vat_registry",
        fetchedAtISO: nowISO,
        normalizedCui: "RO14399840",
        companyName: "DANTE INTERNATIONAL SA",
        address: "BUCURESTI",
        legalForm: "SA",
        mainCaen: "4754",
        caenDescription: null,
        fiscalStatus: "INREGISTRAT",
        vatRegistered: true,
        vatOnCashAccounting: false,
        efacturaRegistered: true,
        inactive: false,
        suggestions: {},
      },
      {
        aiSystems: [
          buildAISystemRecord(
            {
              name: "ChatGPT Support Assistant",
              purpose: "support-chatbot",
              vendor: "OpenAI",
              modelType: "gpt-4.1",
              usesPersonalData: false,
              makesAutomatedDecisions: false,
              impactsRights: false,
              hasHumanReview: true,
            },
            nowISO
          ),
        ],
        detectedAISystems: [],
      }
    )

    expect(result?.suggestions.usesAITools).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
        source: "ai_inventory",
      })
    )
    expect(result?.suggestions.aiUsesConfidentialData).toBeUndefined()
    expect(result?.aiSignals).toEqual({
      source: "ai_inventory",
      confirmedSystems: 1,
      detectedSystems: 0,
      personalDataSystems: 0,
      topSystems: ["ChatGPT Support Assistant"],
    })
  })
})
