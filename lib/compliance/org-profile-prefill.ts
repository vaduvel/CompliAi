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
  suggestions: {
    sector?: PrefillSuggestion<OrgSector>
    requiresEfactura?: PrefillSuggestion<boolean>
  }
}
