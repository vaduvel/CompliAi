// ANAF Signals Phase A — A3: Sector Risk Mode
// ANAF targeted sectors, vigilance levels, severity boost for findings.
// Pure functions — no I/O, safe in browser and server.

import type { OrgSector } from "@/lib/compliance/applicability"
import type { ComplianceSeverity } from "@/lib/compliance/constitution"

// ── Types ────────────────────────────────────────────────────────────────────

export type VigilanceLevel = "normal" | "elevated" | "high"

export type SectorRiskProfile = {
  sector: OrgSector
  vigilanceLevel: VigilanceLevel
  reason: string
  anafTargeted: boolean
  severityBoost: number // 0, 1, or 2 levels to bump
}

// ── ANAF targeted sectors ────────────────────────────────────────────────────

/**
 * Sectors known to be under increased ANAF scrutiny.
 * Based on ANAF annual inspection priorities and known enforcement patterns.
 *
 * Sources:
 * - ANAF Plan de control fiscal anual
 * - Istoric controale ANAF pe sectoare (2023-2025)
 * - Sectoare cu TVA gap ridicat
 */
const ANAF_HIGH_VIGILANCE_SECTORS: OrgSector[] = [
  "retail",              // TVA gap ridicat, tranzacții cash
  "manufacturing",       // lanțuri de aprovizionare complexe
  "professional-services", // servicii intra-grup, prețuri de transfer
]

const ANAF_ELEVATED_VIGILANCE_SECTORS: OrgSector[] = [
  "digital-infrastructure", // e-commerce, servicii digitale transfrontaliere
  "transport",              // accize, TVA pe transport internațional
  "energy",                 // accize, prețuri reglementate
]

// ── Engine ───────────────────────────────────────────────────────────────────

/**
 * Determine sector risk profile for an organization.
 */
export function evaluateSectorRisk(sector: OrgSector): SectorRiskProfile {
  if (ANAF_HIGH_VIGILANCE_SECTORS.includes(sector)) {
    return {
      sector,
      vigilanceLevel: "high",
      reason: `Sectorul "${SECTOR_LABELS[sector]}" este în zona de atenție ANAF — TVA gap ridicat sau controale frecvente.`,
      anafTargeted: true,
      severityBoost: 1,
    }
  }

  if (ANAF_ELEVATED_VIGILANCE_SECTORS.includes(sector)) {
    return {
      sector,
      vigilanceLevel: "elevated",
      reason: `Sectorul "${SECTOR_LABELS[sector]}" are risc moderat ANAF — tranzacții transfrontaliere sau accize.`,
      anafTargeted: true,
      severityBoost: 0,
    }
  }

  return {
    sector,
    vigilanceLevel: "normal",
    reason: `Sectorul "${SECTOR_LABELS[sector]}" nu este în zona prioritară ANAF curentă.`,
    anafTargeted: false,
    severityBoost: 0,
  }
}

// ── Severity boost ───────────────────────────────────────────────────────────

const SEVERITY_ORDER: ComplianceSeverity[] = ["low", "medium", "high", "critical"]

/**
 * Boost finding severity based on sector risk.
 * Only applies to fiscal findings (E_FACTURA category).
 */
export function boostFiscalSeverity(
  baseSeverity: ComplianceSeverity,
  sectorProfile: SectorRiskProfile,
): ComplianceSeverity {
  if (sectorProfile.severityBoost === 0) return baseSeverity

  const idx = SEVERITY_ORDER.indexOf(baseSeverity)
  const boosted = Math.min(idx + sectorProfile.severityBoost, SEVERITY_ORDER.length - 1)
  return SEVERITY_ORDER[boosted]
}

// ── Labels ───────────────────────────────────────────────────────────────────

const SECTOR_LABELS: Record<OrgSector, string> = {
  energy: "Energie",
  transport: "Transport",
  banking: "Servicii bancare",
  health: "Sănătate",
  "digital-infrastructure": "Infrastructură digitală",
  "public-admin": "Administrație publică",
  finance: "Finanțe",
  retail: "Comerț / Retail",
  manufacturing: "Producție / Industrie",
  "professional-services": "Servicii profesionale",
  other: "Alt sector",
}

export const VIGILANCE_LABELS: Record<VigilanceLevel, string> = {
  normal: "Normal",
  elevated: "Ridicat",
  high: "Atenție maximă",
}

export const VIGILANCE_COLORS: Record<VigilanceLevel, string> = {
  normal: "#22C55E",   // green
  elevated: "#EAB308", // yellow
  high: "#EF4444",     // red
}

/**
 * Get dashboard vigilance strip data.
 */
export function getVigilanceStrip(sector: OrgSector): {
  visible: boolean
  level: VigilanceLevel
  label: string
  color: string
  message: string
} {
  const profile = evaluateSectorRisk(sector)

  if (profile.vigilanceLevel === "normal") {
    return {
      visible: false,
      level: "normal",
      label: VIGILANCE_LABELS.normal,
      color: VIGILANCE_COLORS.normal,
      message: "",
    }
  }

  return {
    visible: true,
    level: profile.vigilanceLevel,
    label: VIGILANCE_LABELS[profile.vigilanceLevel],
    color: VIGILANCE_COLORS[profile.vigilanceLevel],
    message: profile.reason,
  }
}
