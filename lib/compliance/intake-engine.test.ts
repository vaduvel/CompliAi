import { describe, expect, it } from "vitest"

import {
  buildDocumentRequests,
  buildInitialFindings,
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
        }),
        expect.objectContaining({
          questionId: "processesPersonalData",
          value: "probably",
          confidence: "medium",
        }),
        expect.objectContaining({
          questionId: "usesExternalVendors",
          value: "probably",
          confidence: "medium",
        }),
        expect.objectContaining({
          questionId: "sellsToConsumers",
          value: "yes",
          confidence: "medium",
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
        "aiUsesConfidentialData",
        "hasAiPolicy",
        "hasVendorDocumentation",
        "vendorsSendPersonalData",
        "hasSitePrivacyPolicy",
        "hasCookiesConsent",
        "collectsLeads",
      ])
    )
    expect(visibleQuestions).toHaveLength(13)
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
        "intake-ai-missing-policy",
        "intake-ai-confidential-data",
        "intake-vendor-missing-docs",
        "intake-vendor-no-dpa",
        "intake-site-privacy-policy",
        "intake-site-cookies",
        "intake-contracts-baseline",
      ])
    )
    expect(findings).toHaveLength(13)

    expect(documentRequests.map((document) => document.id)).toEqual(
      expect.arrayContaining([
        "privacy-policy",
        "cookies-policy",
        "dpa-template",
        "contracts-template",
        "hr-procedures",
        "job-descriptions",
        "ai-policy",
        "dsar-procedure",
        "vendor-docs",
      ])
    )
    expect(documentRequests).toHaveLength(9)

    expect(nextBestAction).toEqual({
      label: "Generează prima politică GDPR",
      href: "/dashboard/scanari",
      estimatedMinutes: 3,
    })
  })
})
