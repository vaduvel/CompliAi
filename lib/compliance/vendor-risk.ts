// Vendor Supply Chain Risk Score — NIS2 Art. 21(2)(d)
// Sprint 5.4

import type { Nis2Vendor } from "@/lib/server/nis2-store"
import type { ScanFinding } from "@/lib/compliance/types"
import { buildVendorRiskResolution } from "@/lib/compliance/finding-resolution"

export type VendorRiskLevel = "low" | "medium" | "high"

export type VendorRiskResult = {
  riskScore: number
  riskLevel: VendorRiskLevel
  factors: {
    isTechVendor: boolean
    hasDPA: boolean
    hasSecuritySLA: boolean
    dataProcessingVolume: "none" | "low" | "high"
  }
}

/**
 * Computes risk score per vendor.
 * Formula: NIS2 Art. 21(2)(d) supply chain security evaluation.
 *
 * riskScore = 0
 * if (isTechVendor)              += 30
 * if (!hasDPA && isTechVendor)   += 25
 * if (!hasSLA && isTechVendor)   += 15
 * if (dataProcessing === 'high') += 20
 * riskLevel: >= 60 → high, >= 30 → medium, < 30 → low
 */
export function computeVendorRisk(vendor: Nis2Vendor): VendorRiskResult {
  const isTechVendor = vendor.techConfidence != null
  const hasDPA = vendor.hasDPA ?? false
  const hasSecuritySLA = vendor.hasSecuritySLA ?? false
  const dataProcessingVolume = vendor.dataProcessingVolume ?? "none"

  let riskScore = 0
  if (isTechVendor) riskScore += 30
  if (!hasDPA && isTechVendor) riskScore += 25
  if (!hasSecuritySLA && isTechVendor) riskScore += 15
  if (dataProcessingVolume === "high") riskScore += 20

  const riskLevel: VendorRiskLevel =
    riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low"

  return {
    riskScore,
    riskLevel,
    factors: { isTechVendor, hasDPA, hasSecuritySLA, dataProcessingVolume },
  }
}

/**
 * Generates NIS2 findings for high-risk vendors without recent review.
 * Finding IDs are stable (prefixed nis2-vendor-risk-) so re-runs replace instead of accumulate.
 */
export function buildVendorRiskFindings(vendors: Nis2Vendor[], nowISO: string): ScanFinding[] {
  const findings: ScanFinding[] = []
  const now = new Date(nowISO).getTime()
  const STALE_REVIEW_MS = 365 * 24 * 60 * 60 * 1000 // 12 luni

  for (const vendor of vendors) {
    const { riskLevel, factors } = computeVendorRisk(vendor)

    if (riskLevel !== "high") continue

    // Check if review is recent (< 12 months ago)
    const lastReview = vendor.lastReviewDate ? new Date(vendor.lastReviewDate).getTime() : 0
    const reviewIsStale = !vendor.lastReviewDate || now - lastReview > STALE_REVIEW_MS

    if (reviewIsStale) {
      findings.push({
        id: `nis2-vendor-risk-${vendor.id}`,
        title: `Furnizorul ${vendor.name} are risc ridicat și nu a fost revizuit`,
        detail: [
          `Furnizorul "${vendor.name}" a obținut scor de risc ridicat conform evaluării automate NIS2 Art. 21(2)(d).`,
          !factors.hasDPA ? "• Lipsă DPA (acord de procesare date)" : "",
          !factors.hasSecuritySLA ? "• Lipsă SLA de securitate" : "",
          factors.dataProcessingVolume === "high" ? "• Volum ridicat de date procesate" : "",
          "Verifică DPA, SLA și politica de securitate a furnizorului.",
        ]
          .filter(Boolean)
          .join("\n"),
        category: "NIS2" as const,
        severity: "high",
        risk: "high",
        principles: ["security", "accountability"] as ScanFinding["principles"],
        createdAtISO: nowISO,
        sourceDocument: "Registru Furnizori NIS2",
        legalReference: "NIS2 Art. 21(2)(d) / OUG 155/2024",
        remediationHint: `Revizuiește contractul cu ${vendor.name}: solicită DPA, SLA cu clauze de securitate și drept de audit. Marchează revizuirea în registru.`,
        resolution: buildVendorRiskResolution(vendor.name, !factors.hasDPA, !factors.hasSecuritySLA),
      })
    }
  }

  return findings
}
