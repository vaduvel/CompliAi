import { describe, expect, it } from "vitest"

import {
  buildDocumentRequests,
  buildInitialFindings,
  buildInitialIntakeAnswers,
  buildNextBestAction,
  deriveSuggestedAnswers,
  getVisibleConditionalQuestions,
} from "@/lib/compliance/intake-engine"

describe("intake-engine", () => {
  it("derives suggested answers from org profile signals", () => {
    const suggestions = deriveSuggestedAnswers({
      sector: "retail",
      employeeCount: "10-49",
      usesAITools: true,
      requiresEfactura: true,
      completedAtISO: "2026-03-20T00:00:00.000Z",
    })

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          questionId: "usesAITools",
          value: "yes",
          confidence: "high",
          source: "profile_confirmed",
        }),
        expect.objectContaining({
          questionId: "processesPersonalData",
          value: "probably",
          confidence: "medium",
          source: "profile_inference",
        }),
        expect.objectContaining({
          questionId: "usesExternalVendors",
          value: "probably",
          confidence: "medium",
          source: "profile_inference",
        }),
        expect.objectContaining({
          questionId: "sellsToConsumers",
          value: "yes",
          confidence: "medium",
          source: "profile_inference",
        }),
      ])
    )
  })

  it("prefers direct vendor signals from prefill over generic e-Factura heuristics", () => {
    const suggestions = deriveSuggestedAnswers(
      {
        sector: "professional-services",
        employeeCount: "1-9",
        usesAITools: false,
        requiresEfactura: false,
        completedAtISO: "2026-03-20T00:00:00.000Z",
      },
      {
        source: "anaf_vat_registry",
        fetchedAtISO: "2026-03-20T10:00:00.000Z",
        normalizedCui: "RO14399840",
        companyName: "DANTE INTERNATIONAL SA",
        address: "BUCURESTI",
        legalForm: "SA",
        mainCaen: "6201",
        fiscalStatus: "INREGISTRAT",
        vatRegistered: true,
        vatOnCashAccounting: false,
        efacturaRegistered: true,
        inactive: false,
        vendorSignals: {
          source: "efactura_validations",
          vendorCount: 2,
          invoiceCount: 3,
          topVendors: ["Amazon Web Services EMEA SARL", "Microsoft Ireland Operations Limited"],
        },
        suggestions: {
          usesExternalVendors: {
            value: true,
            confidence: "high",
            reason: "Am detectat 2 furnizori în 3 validări e-Factura, deci folosești deja vendorii externi.",
            source: "efactura_validations",
          },
        },
      }
    )

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          questionId: "usesExternalVendors",
          value: "yes",
          confidence: "high",
        }),
      ])
    )
  })

  it("prefers direct personal-data signals from prefill over generic sector heuristics", () => {
    const suggestions = deriveSuggestedAnswers(
      {
        sector: "other",
        employeeCount: "1-9",
        usesAITools: true,
        requiresEfactura: false,
        completedAtISO: "2026-03-20T00:00:00.000Z",
      },
      {
        source: "anaf_vat_registry",
        fetchedAtISO: "2026-03-20T10:00:00.000Z",
        normalizedCui: "RO14399840",
        companyName: "DANTE INTERNATIONAL SA",
        address: "BUCURESTI",
        legalForm: "SA",
        mainCaen: "6201",
        fiscalStatus: "INREGISTRAT",
        vatRegistered: true,
        vatOnCashAccounting: false,
        efacturaRegistered: true,
        inactive: false,
        aiSignals: {
          source: "ai_inventory",
          confirmedSystems: 1,
          detectedSystems: 0,
          personalDataSystems: 1,
          topSystems: ["ChatGPT Support Assistant"],
        },
        suggestions: {
          processesPersonalData: {
            value: true,
            confidence: "high",
            reason: "1 sistem AI confirmat procesează date personale.",
            source: "ai_inventory",
          },
          aiUsesConfidentialData: {
            value: true,
            confidence: "high",
            reason: "1 sistem AI confirmat folosește date personale.",
            source: "ai_inventory",
          },
        },
      }
    )

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          questionId: "processesPersonalData",
          value: "yes",
          confidence: "high",
        }),
        expect.objectContaining({
          questionId: "aiUsesConfidentialData",
          value: "yes",
          confidence: "high",
          source: "ai_inventory",
        }),
      ])
    )
  })

  it("surfaces direct document-memory signals for decisive and conditional questions", () => {
    const suggestions = deriveSuggestedAnswers(
      {
        sector: "professional-services",
        employeeCount: "1-9",
        usesAITools: false,
        requiresEfactura: false,
        completedAtISO: "2026-03-20T00:00:00.000Z",
      },
      {
        source: "anaf_vat_registry",
        fetchedAtISO: "2026-03-20T10:00:00.000Z",
        normalizedCui: "RO14399840",
        companyName: "DANTE INTERNATIONAL SA",
        address: "BUCURESTI",
        legalForm: "SA",
        mainCaen: "6201",
        fiscalStatus: "INREGISTRAT",
        vatRegistered: true,
        vatOnCashAccounting: false,
        efacturaRegistered: true,
        inactive: false,
        documentSignals: {
          source: "document_memory",
          generatedCount: 2,
          uploadedCount: 1,
          matchedSignals: ["site cu cookies sau formulare", "contracte standard"],
          topDocuments: ["Politică de Cookies", "DPA template", "policy-tracking.txt"],
        },
        suggestions: {
          hasSiteWithForms: {
            value: true,
            confidence: "high",
            reason: "Ai deja o politică de cookies generată în workspace.",
            source: "document_memory",
          },
          hasStandardContracts: {
            value: true,
            confidence: "medium",
            reason: "Există deja documente contractuale și DPA-uri în workspace.",
            source: "document_memory",
          },
          hasVendorDpas: {
            value: true,
            confidence: "medium",
            reason: "Există deja DPA-uri și drafturi pentru vendorii activi.",
            source: "document_memory",
          },
          hasVendorDocumentation: {
            value: true,
            confidence: "medium",
            reason: "Există deja documentație contractuală pentru vendorii activi.",
            source: "document_memory",
          },
        },
      }
    )

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          questionId: "hasSiteWithForms",
          value: "yes",
          confidence: "high",
        }),
        expect.objectContaining({
          questionId: "hasStandardContracts",
          value: "yes",
          confidence: "medium",
        }),
        expect.objectContaining({
          questionId: "hasVendorDpas",
          value: "yes",
          confidence: "medium",
          source: "document_memory",
        }),
        expect.objectContaining({
          questionId: "hasVendorDocumentation",
          value: "yes",
          confidence: "medium",
          source: "document_memory",
        }),
      ])
    )
  })

  it("auto-completeaza doar sugestiile cu încredere mare", () => {
    const answers = buildInitialIntakeAnswers(
      {
        sector: "professional-services",
        employeeCount: "1-9",
        usesAITools: false,
        requiresEfactura: false,
        completedAtISO: "2026-03-20T00:00:00.000Z",
      },
      {
        source: "anaf_vat_registry",
        fetchedAtISO: "2026-03-20T10:00:00.000Z",
        normalizedCui: "RO14399840",
        companyName: "DANTE INTERNATIONAL SA",
        address: "BUCURESTI",
        legalForm: "SA",
        mainCaen: "6201",
        fiscalStatus: "INREGISTRAT",
        vatRegistered: true,
        vatOnCashAccounting: false,
        efacturaRegistered: true,
        inactive: false,
        suggestions: {
          hasSiteWithForms: {
            value: true,
            confidence: "high",
            reason: "Ai deja o politică de cookies generată în workspace.",
            source: "document_memory",
          },
          hasStandardContracts: {
            value: true,
            confidence: "medium",
            reason: "Există deja documente contractuale și DPA-uri în workspace.",
            source: "document_memory",
          },
          hasAiPolicy: {
            value: true,
            confidence: "high",
            reason: "Ai deja o politică AI generată în workspace.",
            source: "document_memory",
          },
        },
      }
    )

    expect(answers.usesAITools).toBe("no")
    expect(answers.hasSiteWithForms).toBe("yes")
    expect(answers.hasStandardContracts).toBeUndefined()
    expect(answers.hasAiPolicy).toBe("yes")
  })

  it("shows only conditional questions unlocked by current answers", () => {
    const visibleQuestions = getVisibleConditionalQuestions({
      hasEmployees: "mixed",
      processesPersonalData: "yes",
      usesAITools: "probably",
      usesExternalVendors: "yes",
      hasSiteWithForms: "probably",
    })

    expect(visibleQuestions.map((question) => question.id)).toEqual(
      expect.arrayContaining([
        "hasJobDescriptions",
        "hasEmployeeRegistry",
        "hasInternalProcedures",
        "hasPrivacyPolicy",
        "hasDsarProcess",
        "hasVendorDpas",
        "hasRetentionSchedule",
        "aiUsesConfidentialData",
        "hasAiPolicy",
        "hasVendorDocumentation",
        "vendorsSendPersonalData",
        "hasSitePrivacyPolicy",
        "hasCookiesConsent",
        "collectsLeads",
      ])
    )
    expect(visibleQuestions).toHaveLength(14)
  })

  it("builds findings, document requests and next best action for a realistic intake path", () => {
    const answers = {
      sellsToConsumers: "yes",
      hasEmployees: "yes",
      processesPersonalData: "yes",
      usesAITools: "yes",
      usesExternalVendors: "yes",
      hasSiteWithForms: "yes",
      hasStandardContracts: "partial",
      hasJobDescriptions: "no",
      hasEmployeeRegistry: "no",
      hasInternalProcedures: "no",
      hasPrivacyPolicy: "no",
      hasDsarProcess: "no",
      hasVendorDpas: "no",
      hasRetentionSchedule: "no",
      aiUsesConfidentialData: "yes",
      hasAiPolicy: "no",
      hasVendorDocumentation: "no",
      vendorsSendPersonalData: "yes",
      hasSitePrivacyPolicy: "no",
      hasCookiesConsent: "no",
      collectsLeads: "yes",
    } as const

    const findings = buildInitialFindings(answers)
    const documentRequests = buildDocumentRequests(answers)
    const nextBestAction = buildNextBestAction(findings)

    expect(findings.map((finding) => finding.id)).toEqual(
      expect.arrayContaining([
        "intake-b2c-privacy",
        "intake-hr-job-descriptions",
        "intake-hr-registry",
        "intake-hr-procedures",
        "intake-gdpr-privacy-policy",
        "intake-gdpr-dsar",
        "intake-gdpr-retention",
        "intake-ai-missing-policy",
        "intake-ai-confidential-data",
        "intake-vendor-missing-docs",
        "intake-vendor-no-dpa",
        "intake-site-privacy-policy",
        "intake-site-cookies",
        "intake-contracts-baseline",
      ])
    )
    expect(findings).toHaveLength(14)
    expect(findings.find((finding) => finding.id === "intake-ai-missing-policy")).toEqual(
      expect.objectContaining({
        suggestedDocumentType: "ai-governance",
      })
    )

    expect(documentRequests.map((document) => document.id)).toEqual(
      expect.arrayContaining([
        "privacy-policy",
        "cookies-policy",
        "dpa-template",
        "contracts-template",
        "hr-procedures",
        "job-descriptions",
        "ai-governance",
        "dsar-procedure",
        "retention-policy",
        "vendor-docs",
      ])
    )
    expect(documentRequests).toHaveLength(10)

    expect(nextBestAction).toEqual({
      label: "Generează prima politică GDPR",
      href: "/dashboard/resolve/intake-b2c-privacy?action=generate",
      estimatedMinutes: 3,
    })
  })

  it("keeps the AI policy gap on the finding cockpit generator path", () => {
    const answers = {
      sellsToConsumers: "no",
      hasEmployees: "no",
      processesPersonalData: "no",
      usesAITools: "yes",
      usesExternalVendors: "no",
      hasSiteWithForms: "no",
      hasStandardContracts: "yes",
      hasAiPolicy: "no",
      aiUsesConfidentialData: "no",
    } as const

    const findings = buildInitialFindings(answers)
    const documentRequests = buildDocumentRequests(answers)
    const nextBestAction = buildNextBestAction(findings)

    expect(findings).toHaveLength(1)
    expect(findings[0]).toEqual(
      expect.objectContaining({
        id: "intake-ai-missing-policy",
        suggestedDocumentType: "ai-governance",
      })
    )
    expect(documentRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ai-governance",
        }),
      ])
    )
    expect(nextBestAction).toEqual({
      label: "Deschide politica AI în cockpit",
      href: "/dashboard/resolve/intake-ai-missing-policy?action=generate",
      estimatedMinutes: 4,
    })
  })

  it("trimite vendor governance pe cockpitul vendor pack", () => {
    const findings = buildInitialFindings({
      sellsToConsumers: "no",
      hasEmployees: "no",
      processesPersonalData: "no",
      usesAITools: "no",
      usesExternalVendors: "yes",
      hasVendorDocumentation: "no",
      hasSiteWithForms: "no",
      hasStandardContracts: "yes",
    } as const)

    const nextBestAction = buildNextBestAction(findings)

    expect(findings.map((finding) => finding.id)).toContain("intake-vendor-missing-docs")
    expect(nextBestAction).toEqual({
      label: "Deschide pachetul vendor în cockpit",
      href: "/dashboard/resolve/intake-vendor-missing-docs",
      estimatedMinutes: 5,
    })
  })

  it("creează finding și document request pentru retenție când regula nu este clară", () => {
    const answers = {
      sellsToConsumers: "no",
      hasEmployees: "no",
      processesPersonalData: "yes",
      usesAITools: "no",
      usesExternalVendors: "no",
      hasSiteWithForms: "no",
      hasStandardContracts: "yes",
      hasPrivacyPolicy: "yes",
      hasDsarProcess: "yes",
      hasRetentionSchedule: "partial",
    } as const

    const findings = buildInitialFindings(answers)
    const documentRequests = buildDocumentRequests(answers)

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "intake-gdpr-retention",
          suggestedDocumentType: "retention-policy",
        }),
      ])
    )
    expect(documentRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "retention-policy",
          priority: "required",
        }),
      ])
    )
  })
})
