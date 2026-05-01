// S2A.1 — Stripe ICP tier registry.
// Centralizează cele 14 SKU-uri Faza 1 (Doc 06): 5 ICP segmente × 2-3 tier-uri.
// Mapare la billingScope (org vs account) + validation per ICP segment.
//
// Env vars per SKU: STRIPE_PRICE_{TIER}_MONTHLY
// Ex: STRIPE_PRICE_CABINET_PRO_MONTHLY=price_xxxx_999eur

import type { OrgPlan, PartnerAccountPlan } from "@/lib/shared/plan-constants"
import type { IcpSegment } from "@/lib/server/white-label"

export type TierDefinition = {
  id: string
  /** Display label (Romanian, used in UI) */
  label: string
  /** Lunar EUR pentru afișare. NU e folosit la checkout (Stripe e source-of-truth). */
  priceLabelEur: number
  /** ICP segment căruia îi aparține. */
  icpSegment: IcpSegment
  /** Billingscope: "org" pentru solo/imm/cabinet client-level, "account" pentru cabinet partner aggregate */
  billingScope: "org" | "account"
  /** Env var care conține Stripe Price ID. */
  envVar: string
  /** Caracteristici incluse (display in UI). */
  features: string[]
  /** Fallback tier când env var lipsește (pentru dev/staging). */
  fallbackEnvVar?: string
}

export const STRIPE_TIER_REGISTRY: Record<string, TierDefinition> = {
  // ── Solo segment (Owner/Manager IMM mic) ──────────────────────────────────
  "solo-starter": {
    id: "solo-starter",
    label: "Solo Starter",
    priceLabelEur: 49,
    icpSegment: "solo",
    billingScope: "org",
    envVar: "STRIPE_PRICE_SOLO_STARTER_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PRO_MONTHLY",
    features: [
      "1 organizație",
      "GDPR + e-Factura validator",
      "10 documente generate / lună",
      "Audit Pack ZIP basic",
    ],
  },
  "solo-pro": {
    id: "solo-pro",
    label: "Solo Pro",
    priceLabelEur: 99,
    icpSegment: "solo",
    billingScope: "org",
    envVar: "STRIPE_PRICE_SOLO_PRO_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PRO_MONTHLY",
    features: [
      "1 organizație",
      "GDPR + e-Factura + AI Act + NIS2",
      "Documente nelimitate",
      "Audit Pack PDF + watermark",
      "Drift detection + alerts",
    ],
  },

  // ── IMM Internal segment ──────────────────────────────────────────────────
  "imm-internal-solo": {
    id: "imm-internal-solo",
    label: "IMM Internal — Solo",
    priceLabelEur: 99,
    icpSegment: "imm-internal",
    billingScope: "org",
    envVar: "STRIPE_PRICE_IMM_INTERNAL_SOLO_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PRO_MONTHLY",
    features: [
      "1 organizație internă",
      "Toate frameworks (GDPR/AI Act/NIS2/DORA)",
      "Audit Pack + baseline freeze",
      "Trust Profile public",
    ],
  },
  "imm-internal-pro": {
    id: "imm-internal-pro",
    label: "IMM Internal — Pro",
    priceLabelEur: 299,
    icpSegment: "imm-internal",
    billingScope: "org",
    envVar: "STRIPE_PRICE_IMM_INTERNAL_PRO_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PRO_MONTHLY",
    features: [
      "Tot ce conține Solo",
      "Multi-user (5 seats incluse)",
      "Custom templates + signature",
      "Mistral EU sovereignty option",
      "Monthly digest cabinet board",
    ],
  },

  // ── Cabinet DPO segment ──────────────────────────────────────────────────
  "cabinet-solo": {
    id: "cabinet-solo",
    label: "Cabinet DPO — Solo",
    priceLabelEur: 499,
    icpSegment: "cabinet-dpo",
    billingScope: "account",
    envVar: "STRIPE_PRICE_CABINET_SOLO_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PARTNER_MONTHLY",
    features: [
      "Până la 10 clienți",
      "White-label complet",
      "Magic link approve/reject + Resend",
      "Custom templates cabinet",
    ],
  },
  "cabinet-pro": {
    id: "cabinet-pro",
    label: "Cabinet DPO — Pro",
    priceLabelEur: 999,
    icpSegment: "cabinet-dpo",
    billingScope: "account",
    envVar: "STRIPE_PRICE_CABINET_PRO_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PARTNER_MONTHLY",
    features: [
      "Până la 25 clienți",
      "Tot ce conține Solo",
      "AI ON/OFF per client",
      "Monthly digest brand-uit cabinet",
      "Mistral EU option",
    ],
  },
  "cabinet-studio": {
    id: "cabinet-studio",
    label: "Cabinet DPO — Studio",
    priceLabelEur: 1999,
    icpSegment: "cabinet-dpo",
    billingScope: "account",
    envVar: "STRIPE_PRICE_CABINET_STUDIO_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PARTNER_MONTHLY",
    features: [
      "Până la 50 clienți + custom on top",
      "Tot ce conține Pro",
      "Priority support + onboarding partner",
      "Custom integrations",
      "SLA contractual",
    ],
  },

  // ── Cabinet Fiscal (Contabil CECCAR) segment ──────────────────────────
  "fiscal-solo": {
    id: "fiscal-solo",
    label: "Cabinet Fiscal — Solo",
    priceLabelEur: 299,
    icpSegment: "cabinet-fiscal",
    billingScope: "account",
    envVar: "STRIPE_PRICE_FISCAL_SOLO_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PARTNER_MONTHLY",
    features: [
      "Până la 25 clienți contabili",
      "Validator UBL CIUS-RO + e-TVA",
      "GDPR lite per client",
      "SmartBill/Saga/Oblio layer",
    ],
  },
  "fiscal-pro": {
    id: "fiscal-pro",
    label: "Cabinet Fiscal — Pro",
    priceLabelEur: 699,
    icpSegment: "cabinet-fiscal",
    billingScope: "account",
    envVar: "STRIPE_PRICE_FISCAL_PRO_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PARTNER_MONTHLY",
    features: [
      "Până la 100 clienți contabili",
      "Tot ce conține Solo",
      "ANAF SPV connector dedicat",
      "Cron auto-validare lunară facturi",
      "Multi-user + delegări",
    ],
  },

  // ── Legacy mappings (păstrate pentru backward-compat existing customers) ─
  pro: {
    id: "pro",
    label: "Pro (legacy)",
    priceLabelEur: 99,
    icpSegment: "solo",
    billingScope: "org",
    envVar: "STRIPE_PRICE_PRO_MONTHLY",
    features: ["Plan legacy — migrat automat la solo-pro la renewal"],
  },
  partner: {
    id: "partner",
    label: "Partner (legacy)",
    priceLabelEur: 999,
    icpSegment: "cabinet-dpo",
    billingScope: "account",
    envVar: "STRIPE_PRICE_PARTNER_MONTHLY",
    features: ["Plan legacy — migrat automat la cabinet-pro la renewal"],
  },
  partner_10: {
    id: "partner_10",
    label: "Partner (10 clienți)",
    priceLabelEur: 499,
    icpSegment: "cabinet-dpo",
    billingScope: "account",
    envVar: "STRIPE_PRICE_PARTNER_10_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PARTNER_MONTHLY",
    features: ["Echivalent cabinet-solo în segment cabinet-dpo"],
  },
  partner_25: {
    id: "partner_25",
    label: "Partner (25 clienți)",
    priceLabelEur: 999,
    icpSegment: "cabinet-dpo",
    billingScope: "account",
    envVar: "STRIPE_PRICE_PARTNER_25_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PARTNER_MONTHLY",
    features: ["Echivalent cabinet-pro în segment cabinet-dpo"],
  },
  partner_50: {
    id: "partner_50",
    label: "Partner (50 clienți)",
    priceLabelEur: 1999,
    icpSegment: "cabinet-dpo",
    billingScope: "account",
    envVar: "STRIPE_PRICE_PARTNER_50_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PARTNER_MONTHLY",
    features: ["Echivalent cabinet-studio în segment cabinet-dpo"],
  },
}

export function getStripeTier(tierId: string): TierDefinition | null {
  return STRIPE_TIER_REGISTRY[tierId] ?? null
}

export function getStripePriceId(tierId: string): string | null {
  const tier = getStripeTier(tierId)
  if (!tier) return null
  const primary = process.env[tier.envVar]?.trim()
  if (primary) return primary
  if (tier.fallbackEnvVar) {
    const fallback = process.env[tier.fallbackEnvVar]?.trim()
    if (fallback) return fallback
  }
  return null
}

export function listTiersForIcp(segment: IcpSegment): TierDefinition[] {
  return Object.values(STRIPE_TIER_REGISTRY)
    .filter((t) => t.icpSegment === segment && !t.id.startsWith("partner_") && t.id !== "pro" && t.id !== "partner")
    .sort((a, b) => a.priceLabelEur - b.priceLabelEur)
}

export function listAllIcpTiers(): TierDefinition[] {
  return Object.values(STRIPE_TIER_REGISTRY).filter(
    (t) => !t.id.startsWith("partner_") && t.id !== "pro" && t.id !== "partner"
  )
}

export function isValidTier(tierId: string): boolean {
  return tierId in STRIPE_TIER_REGISTRY
}

export function isAccountScopedTier(tierId: string): boolean {
  return getStripeTier(tierId)?.billingScope === "account"
}

export function isOrgScopedTier(tierId: string): boolean {
  return getStripeTier(tierId)?.billingScope === "org"
}

/**
 * Mapează un tier ICP nou la planul existent (OrgPlan).
 * Schema OrgPlan e legacy (free/pro/partner) — tier-urile noi sunt alias-uri.
 * Tier-urile cabinet-* mapează la "partner" (le folosim ca account-scoped însă).
 */
export function tierToOrgPlan(tierId: string): OrgPlan | null {
  const tier = getStripeTier(tierId)
  if (!tier) return null
  // Account-scoped tiers nu au org plan
  if (tier.billingScope === "account") return null
  // Tier ICP solo/imm-internal/imm-hr → mapăm la "pro"
  if (tier.icpSegment === "solo" || tier.icpSegment === "imm-internal" || tier.icpSegment === "imm-hr") return "pro"
  // Legacy "pro" rămâne pro
  if (tierId === "pro") return "pro"
  return null
}

/**
 * Mapează un tier ICP cabinet la PartnerAccountPlan (10/25/50 clienți).
 * Bazat pe limita de clienți declarată în features.
 */
export function tierToPartnerAccountPlan(tierId: string): PartnerAccountPlan | null {
  const tier = getStripeTier(tierId)
  if (!tier) return null
  if (tier.billingScope !== "account") return null
  // Mapping bazat pe limit clienți (din features text)
  const tierMap: Record<string, PartnerAccountPlan> = {
    "cabinet-solo": "partner_10",
    "cabinet-pro": "partner_25",
    "cabinet-studio": "partner_50",
    "fiscal-solo": "partner_25",
    "fiscal-pro": "partner_50",
    // Legacy direct
    partner: "partner_25",
    partner_10: "partner_10",
    partner_25: "partner_25",
    partner_50: "partner_50",
  }
  return tierMap[tierId] ?? null
}
