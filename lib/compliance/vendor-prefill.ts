// C1 — Vendor Intake Prefill
// At vendor addition:
// 1. Fetch ANAF CUI → company name, address, CAEN
// 2. From CAEN → classify vendor type (software/cloud/processor/AI/unknown)
// 3. From e-Factura history → transaction count
// 4. From org AI systems → check if vendor is an AI vendor
// All values marked as 'suggested' — user confirms.

import { lookupOrgProfilePrefillByCui } from "@/lib/server/anaf-company-lookup"
import type { Nis2Vendor } from "@/lib/server/nis2-store"
import type { EfacturaSupplierImportRecord } from "@/lib/server/efactura-vendor-signals"

// ── Vendor type classification from CAEN ────────────────────────────────────

export type VendorType = "software" | "cloud" | "processor" | "ai" | "consulting" | "unknown"

const CAEN_VENDOR_MAP: Record<string, VendorType> = {
  // Software / IT
  "6201": "software",
  "6202": "software",
  "6209": "software",
  // Cloud / hosting
  "6311": "cloud",
  "6312": "cloud",
  // Data processing
  "6391": "processor",
  "6399": "processor",
  // Consulting
  "6920": "consulting",
  "7022": "consulting",
  "7112": "consulting",
}

function classifyVendorByCaen(caen: string | null | undefined): VendorType {
  if (!caen) return "unknown"
  const code = caen.replace(/\D/g, "").slice(0, 4)
  return CAEN_VENDOR_MAP[code] ?? "unknown"
}

// ── Prefill result type ─────────────────────────────────────────────────────

export type VendorPrefillSuggestion<T> = {
  value: T
  confidence: "high" | "medium" | "low"
  source: "anaf" | "efactura" | "ai-systems" | "inferred"
}

export type VendorPrefillResult = {
  companyName?: VendorPrefillSuggestion<string>
  address?: VendorPrefillSuggestion<string>
  mainCaen?: VendorPrefillSuggestion<string>
  vendorType?: VendorPrefillSuggestion<VendorType>
  vatRegistered?: VendorPrefillSuggestion<boolean>
  efacturaRegistered?: VendorPrefillSuggestion<boolean>
  invoiceCount?: VendorPrefillSuggestion<number>
  isAIVendor?: VendorPrefillSuggestion<boolean>
  riskLevel?: VendorPrefillSuggestion<"low" | "medium" | "high" | "critical">
  processesPersonalData?: VendorPrefillSuggestion<boolean>
}

// ── Main prefill function ───────────────────────────────────────────────────

export async function prefillVendor(params: {
  cui: string
  efacturaSuppliers?: EfacturaSupplierImportRecord[]
  aiSystemVendorNames?: string[]
}): Promise<VendorPrefillResult> {
  const result: VendorPrefillResult = {}

  // 1. ANAF CUI lookup
  const anafProfile = await lookupOrgProfilePrefillByCui(params.cui)

  if (anafProfile) {
    if (anafProfile.companyName) {
      result.companyName = {
        value: anafProfile.companyName,
        confidence: "high",
        source: "anaf",
      }
    }

    if (anafProfile.address) {
      result.address = {
        value: anafProfile.address,
        confidence: "high",
        source: "anaf",
      }
    }

    if (anafProfile.mainCaen) {
      result.mainCaen = {
        value: anafProfile.mainCaen,
        confidence: "high",
        source: "anaf",
      }
    }

    result.vatRegistered = {
      value: anafProfile.vatRegistered,
      confidence: "high",
      source: "anaf",
    }

    result.efacturaRegistered = {
      value: anafProfile.efacturaRegistered,
      confidence: "high",
      source: "anaf",
    }

    // 2. CAEN → vendor type classification
    const vendorType = classifyVendorByCaen(anafProfile.mainCaen)
    result.vendorType = {
      value: vendorType,
      confidence: vendorType === "unknown" ? "low" : "medium",
      source: "inferred",
    }

    // Infer risk level from vendor type
    const riskMap: Record<VendorType, "low" | "medium" | "high"> = {
      software: "medium",
      cloud: "high",
      processor: "high",
      ai: "high",
      consulting: "low",
      unknown: "medium",
    }
    result.riskLevel = {
      value: riskMap[vendorType],
      confidence: "medium",
      source: "inferred",
    }

    // Infer personal data processing from vendor type
    const processesData = ["processor", "cloud", "ai", "software"].includes(vendorType)
    result.processesPersonalData = {
      value: processesData,
      confidence: "medium",
      source: "inferred",
    }
  }

  // 3. e-Factura history → transaction count
  if (params.efacturaSuppliers) {
    const match = params.efacturaSuppliers.find(
      (s) => s.cui === params.cui
    )
    if (match && match.invoiceCount) {
      result.invoiceCount = {
        value: match.invoiceCount,
        confidence: "high",
        source: "efactura",
      }
    }
  }

  // 4. AI systems check → is this vendor an AI vendor?
  if (params.aiSystemVendorNames && result.companyName) {
    const vendorName = result.companyName.value.toLowerCase()
    const isAI = params.aiSystemVendorNames.some(
      (name) => name.toLowerCase().includes(vendorName) ||
        vendorName.includes(name.toLowerCase())
    )
    if (isAI) {
      result.isAIVendor = {
        value: true,
        confidence: "medium",
        source: "ai-systems",
      }
      // Upgrade vendor type to AI
      result.vendorType = {
        value: "ai",
        confidence: "medium",
        source: "ai-systems",
      }
    }
  }

  return result
}

/**
 * Convert prefill result to a partial Nis2Vendor for pre-filling the vendor form.
 */
export function prefillToVendorDraft(
  prefill: VendorPrefillResult,
  cui: string
): Partial<Nis2Vendor> {
  return {
    name: prefill.companyName?.value ?? "",
    cui,
    service: prefill.vendorType?.value ?? "unknown",
    riskLevel: prefill.riskLevel?.value ?? "medium",
    hasSecurityClause: false,
    hasIncidentNotification: false,
    hasAuditRight: false,
    notes: buildPrefillNotes(prefill),
  }
}

function buildPrefillNotes(prefill: VendorPrefillResult): string {
  const lines: string[] = []

  if (prefill.mainCaen) {
    lines.push(`CAEN: ${prefill.mainCaen.value}`)
  }
  if (prefill.vendorType && prefill.vendorType.value !== "unknown") {
    lines.push(`Tip: ${prefill.vendorType.value} (${prefill.vendorType.source})`)
  }
  if (prefill.invoiceCount) {
    lines.push(`Facturi e-Factura: ${prefill.invoiceCount.value}`)
  }
  if (prefill.isAIVendor?.value) {
    lines.push("⚠ Detectat ca furnizor AI")
  }
  if (prefill.processesPersonalData?.value) {
    lines.push("⚠ Probabil procesează date personale → necesită DPA")
  }

  return lines.length > 0 ? `[Auto-prefill] ${lines.join(" · ")}` : ""
}
