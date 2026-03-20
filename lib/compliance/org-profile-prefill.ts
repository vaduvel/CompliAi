import type { OrgSector } from "@/lib/compliance/applicability"

export type PrefillConfidence = "high" | "medium" | "low"

export type PrefillSuggestion<T> = {
  value: T
  confidence: PrefillConfidence
  reason: string
}

export type OrgProfilePrefill = {
  source: "anaf_vat_registry"
  fetchedAtISO: string
  normalizedCui: string
  companyName: string
  address: string | null
  legalForm: string | null
  mainCaen: string | null
  fiscalStatus: string | null
  vatRegistered: boolean
  vatOnCashAccounting: boolean
  efacturaRegistered: boolean
  inactive: boolean
  vendorSignals?: {
    source: "efactura_validations"
    vendorCount: number
    invoiceCount: number
    topVendors: string[]
  }
  aiSignals?: {
    source: "ai_inventory"
    confirmedSystems: number
    detectedSystems: number
    personalDataSystems: number
    topSystems: string[]
  }
  documentSignals?: {
    source: "document_memory"
    generatedCount: number
    uploadedCount: number
    matchedSignals: string[]
    topDocuments: string[]
  }
  suggestions: {
    sector?: PrefillSuggestion<OrgSector>
    requiresEfactura?: PrefillSuggestion<boolean>
    usesAITools?: PrefillSuggestion<boolean>
    processesPersonalData?: PrefillSuggestion<boolean>
    usesExternalVendors?: PrefillSuggestion<boolean>
    hasSiteWithForms?: PrefillSuggestion<boolean>
    hasStandardContracts?: PrefillSuggestion<boolean>
  }
}
