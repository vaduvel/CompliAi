import { describe, expect, it } from "vitest"

import {
  buildDocumentPrefillSignals,
  enrichOrgProfilePrefillWithDocumentSignals,
} from "@/lib/server/document-prefill-signals"

describe("document-prefill-signals", () => {
  it("deriveaza sugestii din documente generate si documente scanate", () => {
    const result = buildDocumentPrefillSignals({
      generatedDocuments: [
        {
          id: "doc-privacy",
          documentType: "privacy-policy",
          title: "Politică de Confidențialitate",
          generatedAtISO: "2026-03-20T10:00:00.000Z",
          llmUsed: false,
        },
        {
          id: "doc-dpa",
          documentType: "dpa",
          title: "Acord de Prelucrare a Datelor (DPA)",
          generatedAtISO: "2026-03-20T11:00:00.000Z",
          llmUsed: true,
        },
      ],
      scans: [
        {
          id: "scan-cookie",
          documentName: "policy-tracking.txt",
          contentPreview: "tracking analytics cookies si newsletter",
          contentExtracted: "tracking analytics cookies si newsletter",
          createdAtISO: "2026-03-20T12:00:00.000Z",
          findingsCount: 1,
          sourceKind: "document",
        },
      ],
    })

    expect(result.suggestions.processesPersonalData).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
        source: "document_memory",
      })
    )
    expect(result.suggestions.usesExternalVendors).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "medium",
        source: "document_memory",
      })
    )
    expect(result.suggestions.hasStandardContracts).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "medium",
        source: "document_memory",
      })
    )
    expect(result.suggestions.hasSiteWithForms).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "medium",
        source: "document_memory",
      })
    )
    expect(result.documentSignals).toEqual({
      source: "document_memory",
      generatedCount: 2,
      uploadedCount: 1,
      matchedSignals: ["date personale", "vendori externi", "contracte standard", "site cu cookies sau formulare"],
      topDocuments: [
        "Politică de Confidențialitate",
        "Acord de Prelucrare a Datelor (DPA)",
        "policy-tracking.txt",
      ],
    })
  })

  it("completeaza doar sugestiile lipsa cand exista deja semnale mai puternice", () => {
    const result = enrichOrgProfilePrefillWithDocumentSignals(
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
          usesExternalVendors: {
            value: true,
            confidence: "high",
            reason: "Semnalul vine deja din e-Factura.",
            source: "efactura_validations",
          },
        },
      },
      {
        generatedDocuments: [
          {
            id: "doc-dpa",
            documentType: "dpa",
            title: "Acord de Prelucrare a Datelor (DPA)",
            generatedAtISO: "2026-03-20T11:00:00.000Z",
            llmUsed: true,
          },
        ],
        scans: [],
      }
    )

    expect(result?.suggestions.usesExternalVendors).toEqual({
      value: true,
      confidence: "high",
      reason: "Semnalul vine deja din e-Factura.",
      source: "efactura_validations",
    })
    expect(result?.suggestions.hasStandardContracts).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "medium",
        source: "document_memory",
      })
    )
    expect(result?.documentSignals?.generatedCount).toBe(1)
  })
})
