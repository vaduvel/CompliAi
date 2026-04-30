import type { OrgProfile, OrgSector } from "@/lib/compliance/applicability"
import type { FullIntakeAnswers, IntakeAnswer } from "@/lib/compliance/intake-engine"

type WebsiteSignals = {
  processesPersonalData?: boolean
  hasSiteWithForms?: boolean
  hasPrivacyPolicy?: boolean
  hasSitePrivacyPolicy?: boolean
  hasCookiesConsent?: boolean
}

type ImportBaselineOptions = {
  hasWebsite: boolean
  websiteSignals?: WebsiteSignals
}

const B2C_SECTORS: OrgSector[] = ["retail", "health"]
const DATA_HEAVY_SECTORS: OrgSector[] = [
  "health",
  "banking",
  "finance",
  "professional-services",
  "retail",
]
const VENDOR_HEAVY_SECTORS: OrgSector[] = [
  "health",
  "banking",
  "finance",
  "digital-infrastructure",
  "professional-services",
  "retail",
]

function signalYes(value: boolean | undefined): "yes" | undefined {
  return value === true ? "yes" : undefined
}

function isMediumPlus(profile: OrgProfile) {
  return profile.employeeCount === "50-249" || profile.employeeCount === "250+"
}

function contractBaseline(profile: OrgProfile): IntakeAnswer {
  if (profile.sector === "retail") return "no"
  if (profile.sector === "health" || profile.sector === "finance" || profile.sector === "banking") {
    return "partial"
  }
  if (isMediumPlus(profile)) return "partial"
  return "probably"
}

export function buildImportBaselineAnswers(
  profile: OrgProfile,
  options: ImportBaselineOptions
): FullIntakeAnswers {
  const hasEmployees = profile.employeeCount !== "1-9"
  const dataHeavy = DATA_HEAVY_SECTORS.includes(profile.sector)
  const vendorHeavy = VENDOR_HEAVY_SECTORS.includes(profile.sector)
  const b2c = B2C_SECTORS.includes(profile.sector)
  const websiteSignals = options.websiteSignals ?? {}

  return {
    sellsToConsumers: b2c ? "yes" : "no",
    hasEmployees: hasEmployees ? "yes" : "unknown",
    processesPersonalData:
      signalYes(websiteSignals.processesPersonalData) ?? (dataHeavy ? "yes" : "probably"),
    usesAITools: profile.usesAITools ? "yes" : "no",
    usesExternalVendors: vendorHeavy ? "probably" : "unknown",
    hasSiteWithForms:
      signalYes(websiteSignals.hasSiteWithForms) ??
      (options.hasWebsite && (b2c || dataHeavy) ? "probably" : "unknown"),
    hasStandardContracts: contractBaseline(profile),
    hasJobDescriptions: hasEmployees ? "no" : undefined,
    hasEmployeeRegistry: hasEmployees ? "no" : undefined,
    hasInternalProcedures: hasEmployees ? "no" : undefined,
    hasPrivacyPolicy: signalYes(websiteSignals.hasPrivacyPolicy) ?? "no",
    hasDsarProcess: "no",
    hasRopaRegistry: dataHeavy ? "no" : "partial",
    hasVendorDpas: vendorHeavy ? "no" : undefined,
    hasRetentionSchedule: "no",
    hasAiPolicy: profile.usesAITools ? "no" : undefined,
    aiUsesConfidentialData: profile.usesAITools && dataHeavy ? "probably" : undefined,
    hasVendorDocumentation: vendorHeavy ? "no" : undefined,
    vendorsSendPersonalData: vendorHeavy ? "probably" : undefined,
    hasSitePrivacyPolicy:
      signalYes(websiteSignals.hasSitePrivacyPolicy) ??
      (options.hasWebsite && (b2c || dataHeavy) ? "no" : undefined),
    hasCookiesConsent:
      signalYes(websiteSignals.hasCookiesConsent) ??
      (options.hasWebsite && b2c ? "no" : undefined),
  }
}
