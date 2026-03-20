import type { OrgSector } from "@/lib/compliance/applicability"

export type PrefillConfidence = "high" | "medium" | "low"
export type PrefillSuggestionSource =
  | "anaf_vat_registry"
  | "efactura_validations"
  | "ai_inventory"
  | "document_memory"
  | "profile_confirmed"
  | "profile_inference"

export type PrefillSuggestion<T> = {
  value: T
  confidence: PrefillConfidence
  reason: string
  source: PrefillSuggestionSource
}

export function prefillSuggestionSourceLabel(source: PrefillSuggestionSource) {
  switch (source) {
    case "anaf_vat_registry":
      return "ANAF"
    case "efactura_validations":
      return "e-Factura"
    case "ai_inventory":
      return "AI inventory"
    case "document_memory":
      return "document memory"
    case "profile_confirmed":
      return "profil confirmat"
    case "profile_inference":
      return "inferență profil"
    default:
      return source
  }
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
    hasPrivacyPolicy?: PrefillSuggestion<boolean>
    hasVendorDpas?: PrefillSuggestion<boolean>
    aiUsesConfidentialData?: PrefillSuggestion<boolean>
    hasAiPolicy?: PrefillSuggestion<boolean>
    hasVendorDocumentation?: PrefillSuggestion<boolean>
    vendorsSendPersonalData?: PrefillSuggestion<boolean>
    hasSitePrivacyPolicy?: PrefillSuggestion<boolean>
  }
}
