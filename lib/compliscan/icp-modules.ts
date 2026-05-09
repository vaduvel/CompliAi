// ICP Module Visibility — sursa de adevăr pentru ce vede fiecare rol în UI.
//
// Conform documentului `docs/strategy/compliscan-IA-per-rol-2026-05-09.md`,
// fiecare ICP segment vede DOAR modulele relevante pentru rolul lui.
// Modulele ascunse rămân operaționale în engine (engine layer NU e atins),
// dar nu apar în sidebar / nav / quick actions.
//
// Layers de defense (vezi doc):
//   - Layer 3: filterNavByIcp în navigation.ts (UI)
//   - Layer 4: route guard în middleware.ts (defensive)
//   - Layer 5: API permission check în lib/server/icp-permissions.ts (server-side)
//
// Cross-sell: dacă utilizatorul vrea modul ascuns, "activează" prin Settings →
// Module disponibile (Layer 6 — UI standalone) → updates icpSegment override.

import type { IcpSegment } from "@/lib/server/white-label"
import type { DashboardNavId } from "@/components/compliscan/navigation"

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Access mode peste oricare icpSegment.
 * - "owner": full access la modulele ICP-ului (default)
 * - "patron": read-only executive view (Trust Profile + Aprobări + Dosar)
 * - "auditor-token": minimal evidence verification (audit pack download + hash verify)
 */
export type AccessMode = "owner" | "patron" | "auditor-token"

/**
 * Sub-flag-uri pentru rafinare per ICP. Aplicate ON TOP of MODULES_PER_ICP.
 * - "legal-only": Avocat (în cabinet-dpo) — fără cabinet-templates standard
 * - "cabinet-cyber": CISO (în enterprise) — focus pe cyber, GDPR minim
 * - "ai-gov": AI Governance (în enterprise) — focus pe AI Act
 * - "banking": Compliance Banking (în imm-internal) — focus DORA + NIS2 + GDPR
 */
export type SubFlag = "legal-only" | "cabinet-cyber" | "ai-gov" | "banking"

// ── MODULES_PER_ICP — TABEL CENTRAL ──────────────────────────────────────────
//
// Fiecare ICP segment listează DashboardNavId-urile pe care le vede în sidebar.
// Toate ID-urile menționate trebuie să existe în export type DashboardNavId
// din components/compliscan/navigation.ts (verificat prin TypeScript).
//
// Conform IA spec doc, există 7 ICP segments + 4 sub-flags + 3 access modes.

export const MODULES_PER_ICP: Record<IcpSegment, ReadonlyArray<DashboardNavId>> = {
  // ── solo ────────────────────────────────────────────────────────────────
  // Patron / Owner IMM mic. Set minim, simplu.
  "solo": [
    "home",
    "scan",
    "resolve",
    "dosar",
    "settings",
    "calendar",
  ],

  // ── cabinet-dpo ─────────────────────────────────────────────────────────
  // DPO solo + Cabinet DPO multi-tenant + Avocat (cu sub-flag legal-only).
  // Vede DOAR DPO modules. NU vede Fiscal/Pay Transparency/DORA/NIS2 detail.
  "cabinet-dpo": [
    "home",
    "scan",
    "resolve",
    "dosar",
    "settings",
    "calendar",
    // GDPR core
    "ropa",
    "dsar",
    "dpia",
    "breach",
    "training",
    "politici",
    "generator",
    // Cabinet workflows
    "magic-links",
    "cabinet-templates",
    "approvals",
    "review-cycles",
    "scheduled-reports",
    "vendor-review",
    // Whistleblowing advisory (NU full module)
    "whistleblowing",
    // Multi-client portfolio
    "partner",
    "dpo-migration",
    "portfolio-overview",
    "portfolio-alerts",
    "portfolio-tasks",
    "portfolio-vendors",
    "portfolio-reports",
  ],

  // ── cabinet-fiscal ──────────────────────────────────────────────────────
  // Contabil CECCAR. NUMAI Fiscal — TOTUL ELSE ASCUNS.
  "cabinet-fiscal": [
    "home",
    "scan",
    "resolve",
    "dosar",
    "settings",
    "calendar",
    // Fiscal core
    "fiscal",
    // Cabinet workflows aplicabile
    "approvals", // patron approval pe cabinet contabil
    "scheduled-reports", // rapoarte fiscal lunar
    "agenti", // agent fiscal sensor
    // Multi-client portfolio fiscal
    "partner",
    "portfolio-overview",
    "portfolio-alerts",
    "portfolio-tasks",
    "portfolio-reports",
    // NU vede: ropa, dsar, dpia, breach, training, nis2, dora,
    //         pay-transparency, whistleblowing, magic-links,
    //         cabinet-templates, vendor-review
  ],

  // ── cabinet-hr ──────────────────────────────────────────────────────────
  // Cabinet HR consultant multi-tenant. Pay Transparency + Whistleblowing + HR.
  "cabinet-hr": [
    "home",
    "scan",
    "resolve",
    "dosar",
    "settings",
    "calendar",
    // HR core
    "pay-transparency",
    "whistleblowing",
    "training",
    // Cabinet workflows
    "approvals",
    "scheduled-reports",
    // Multi-client portfolio HR
    "partner",
    "portfolio-overview",
    "portfolio-alerts",
    "portfolio-reports",
    // NU vede: ropa, dsar, dpia, breach, fiscal, nis2, dora,
    //         magic-links, cabinet-templates, vendor-review
  ],

  // ── imm-hr ──────────────────────────────────────────────────────────────
  // HR Director / CHRO intern firmă (NU multi-tenant).
  "imm-hr": [
    "home",
    "scan",
    "resolve",
    "dosar",
    "settings",
    "calendar",
    // HR core
    "pay-transparency",
    "whistleblowing",
    "training",
    // NU multi-tenant — NU partner/portfolio
  ],

  // ── imm-internal ────────────────────────────────────────────────────────
  // Compliance Officer intern (cross-framework). Vede MULT — vrea TOT ce-i aplicabil.
  // Sub-flag "banking" rafinează către DORA + NIS2 + GDPR (fără Fiscal/Pay Transp).
  "imm-internal": [
    "home",
    "scan",
    "resolve",
    "dosar",
    "settings",
    "calendar",
    // GDPR
    "ropa",
    "dsar",
    "dpia",
    "breach",
    "training",
    "politici",
    "generator",
    // NIS2 + DORA
    "nis2",
    "dora",
    // Whistleblowing intern
    "whistleblowing",
    // Fiscal direct (firma face în-house)
    "fiscal",
    // Pay Transparency
    "pay-transparency",
    // Vendor + workflows
    "vendor-review",
    "approvals",
    "magic-links",
    "review-cycles",
    "scheduled-reports",
    "agenti",
  ],

  // ── enterprise ──────────────────────────────────────────────────────────
  // CISO + AI Gov + Multi-framework Enterprise.
  // Sub-flag-uri: "cabinet-cyber" (CISO), "ai-gov" (AI Governance specialist).
  "enterprise": [
    "home",
    "scan",
    "resolve",
    "dosar",
    "settings",
    "calendar",
    // Cyber-first
    "nis2",
    "dora",
    "breach",
    // Cross-framework essential
    "ropa",
    "dsar",
    "training",
    "whistleblowing",
    "politici",
    "generator",
    // Workflows
    "vendor-review",
    "approvals",
    "magic-links",
    "review-cycles",
    "scheduled-reports",
    "agenti",
    // Multi-client (CISO cabinet)
    "partner",
    "portfolio-overview",
    "portfolio-alerts",
    "portfolio-tasks",
    "portfolio-vendors",
    "portfolio-reports",
  ],
}

// ── Access Mode Overrides ────────────────────────────────────────────────────

/**
 * Patron access mode — read-only executive view.
 * Apply OVER icpSegment (intersection logic — patron primește MIN(patron, icp)).
 *
 * Patron vede:
 *  - Trust Profile + status global
 *  - Aprobări magic links de la consultant
 *  - Dosar download read-only
 *  - Settings (profil + billing + invite consultant)
 *
 * Patron NU vede: detalii tehnice (RoPA fields, XML SAF-T, NIS2 questions, etc.)
 */
export const PATRON_MODULES: ReadonlyArray<DashboardNavId> = [
  "home", // Trust Profile
  "approvals", // approve magic links
  "dosar", // download read-only
  "settings", // profil + billing
]

/**
 * Auditor token mode — minimal evidence verification.
 * Token-based read-only access (NO icpSegment, NO login required).
 *
 * Auditor vede:
 *  - Audit Pack download (MANIFEST.json + traceability matrix)
 *  - Hash chain verify
 *
 * Auditor NU vede: nimic altceva. Token expirat → access lost.
 */
export const AUDITOR_MODULES: ReadonlyArray<DashboardNavId> = [
  "dosar", // read-only audit pack
]

// ── Sub-flag Restrictions ────────────────────────────────────────────────────

/**
 * Sub-flag fine-tuning peste icpSegment.
 * Aplicat după resolveAllowedModules base lookup.
 */
export const SUBFLAG_RESTRICTIONS: Partial<
  Record<
    SubFlag,
    {
      removeFromIcp?: ReadonlyArray<DashboardNavId>
      addToIcp?: ReadonlyArray<DashboardNavId>
    }
  >
> = {
  // Avocat (cabinet-dpo + legal-only)
  // Avocatul are templates juridice proprii — NU folosește cabinet-templates standard
  // și NU se ocupă de vendor risk register
  "legal-only": {
    removeFromIcp: ["cabinet-templates", "vendor-review"],
  },

  // CISO (enterprise + cabinet-cyber)
  // Focus brutal pe cyber — GDPR detalii sunt minime, advisory only
  "cabinet-cyber": {
    removeFromIcp: ["ropa", "dsar", "dpia"],
  },

  // AI Governance (enterprise + ai-gov)
  // Focus pe AI Act — NU pe NIS2/DORA/cyber
  "ai-gov": {
    removeFromIcp: ["nis2", "dora", "breach"],
  },

  // Compliance Banking (imm-internal + banking)
  // Focus pe DORA + NIS2 + GDPR — NU pe Fiscal/Pay Transparency
  "banking": {
    removeFromIcp: ["fiscal", "pay-transparency"],
  },
}

// ── Resolver ─────────────────────────────────────────────────────────────────

/**
 * Returns the resolved set of DashboardNavId allowed for given user context.
 *
 * Algorithm:
 *   1. accessMode "auditor-token" → return AUDITOR_MODULES (override total)
 *   2. accessMode "patron" → return PATRON_MODULES ∩ MODULES_PER_ICP[icp]
 *      (patron vede DOAR ce e și în ICP-ul lui)
 *   3. accessMode "owner" (default):
 *      a. icpSegment null → fallback la set safe (home/scan/resolve/dosar/settings/calendar)
 *      b. Lookup MODULES_PER_ICP[icp]
 *      c. Apply SUBFLAG_RESTRICTIONS[subFlag] (remove + add)
 */
export function resolveAllowedModules(
  icpSegment: IcpSegment | null,
  subFlag: SubFlag | null = null,
  accessMode: AccessMode = "owner",
): Set<DashboardNavId> {
  // Auditor mode: total override, minim evidence-only
  if (accessMode === "auditor-token") {
    return new Set(AUDITOR_MODULES)
  }

  // Patron mode: intersection cu ICP (patron vede DOAR ce-i și în ICP)
  if (accessMode === "patron") {
    const patronSet = new Set(PATRON_MODULES)
    if (!icpSegment) return patronSet
    const icpSet = new Set(MODULES_PER_ICP[icpSegment])
    // Intersection: păstrează DOAR ce-i în ambele
    const intersection = new Set<DashboardNavId>()
    patronSet.forEach((id) => {
      if (icpSet.has(id)) intersection.add(id)
    })
    return intersection
  }

  // Owner mode (default)
  if (!icpSegment) {
    // Fallback safe: utilizator nou înainte de onboarding completat
    return new Set<DashboardNavId>([
      "home",
      "scan",
      "resolve",
      "dosar",
      "settings",
      "calendar",
    ])
  }

  // Lookup base ICP
  const allowed = new Set<DashboardNavId>(MODULES_PER_ICP[icpSegment])

  // Apply sub-flag restrictions
  if (subFlag && SUBFLAG_RESTRICTIONS[subFlag]) {
    const restrictions = SUBFLAG_RESTRICTIONS[subFlag]!
    if (restrictions.removeFromIcp) {
      restrictions.removeFromIcp.forEach((id) => allowed.delete(id))
    }
    if (restrictions.addToIcp) {
      restrictions.addToIcp.forEach((id) => allowed.add(id))
    }
  }

  return allowed
}

/**
 * Helper: check if a specific module is allowed for given user context.
 * Folosit în route guards + API permission checks (Layer 4 + Layer 5).
 */
export function isModuleAllowed(
  moduleId: DashboardNavId,
  icpSegment: IcpSegment | null,
  subFlag: SubFlag | null = null,
  accessMode: AccessMode = "owner",
): boolean {
  return resolveAllowedModules(icpSegment, subFlag, accessMode).has(moduleId)
}
