import type { SiteScanJob } from "@/lib/compliance/types"
import type { SiteScanResult } from "@/lib/compliance/site-scanner"

export type SiteScanDrivenDocumentType = "privacy-policy" | "cookie-policy"

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function getLatestSuccessfulSiteScanResult(
  jobs?: Record<string, SiteScanJob>
): SiteScanResult | null {
  if (!jobs) return null

  const latestJob = Object.values(jobs)
    .filter((job): job is SiteScanJob & { result: SiteScanResult } => job.status === "done" && !!job.result)
    .sort((left, right) => {
      const leftISO = left.completedAtISO ?? left.createdAtISO
      const rightISO = right.completedAtISO ?? right.createdAtISO
      return new Date(rightISO).getTime() - new Date(leftISO).getTime()
    })[0]

  return latestJob?.result ?? null
}

export function buildSiteScanContextForDocument(
  documentType: SiteScanDrivenDocumentType,
  result: SiteScanResult
) {
  const trackerNames = uniq(result.trackers.map((tracker) => tracker.name)).slice(0, 8)
  const vendorNames = uniq(result.vendorCandidates).slice(0, 8)
  const formHints = uniq(
    result.forms.filter((form) => form.collectsPersonalData).map((form) => form.hint)
  ).slice(0, 6)
  const dataCategories = uniq(result.dataCategories).slice(0, 8)
  const consentFindings = result.findingSuggestions
    .filter(
      (suggestion) =>
        suggestion.type === "missing-consent" || suggestion.type === "cookie-banner-mismatch"
    )
    .map((suggestion) => suggestion.title)
    .slice(0, 4)

  if (documentType === "cookie-policy") {
    return [
      `Ultimul site scan pentru ${result.url} a rulat la ${new Date(result.scannedAtISO).toLocaleString("ro-RO")}.`,
      result.hasCookieBanner
        ? "Există un banner cookie detectat pe site."
        : "Nu există un banner cookie detectat pe site.",
      trackerNames.length > 0
        ? `Trackere detectate: ${trackerNames.join(", ")}.`
        : "Nu au fost detectate trackere la acest scan.",
      consentFindings.length > 0
        ? `Semnale de consimțământ: ${consentFindings.join("; ")}.`
        : "Nu mai există semnale critice de consimțământ în acest scan.",
      vendorNames.length > 0
        ? `Vendori / terți detectați: ${vendorNames.join(", ")}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ")
  }

  return [
    `Ultimul site scan pentru ${result.url} a rulat la ${new Date(result.scannedAtISO).toLocaleString("ro-RO")}.`,
    result.hasPrivacyPolicy
      ? "Există o pagină de politică de confidențialitate detectată."
      : "Nu există o pagină clară de politică de confidențialitate detectată.",
    formHints.length > 0
      ? `Formulare care colectează date: ${formHints.join(", ")}.`
      : "Nu au fost detectate formulare explicite care colectează date personale.",
    dataCategories.length > 0
      ? `Categorii de date observate pe site: ${dataCategories.join(", ")}.`
      : "",
    vendorNames.length > 0
      ? `Vendori / terți detectați: ${vendorNames.join(", ")}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ")
}
