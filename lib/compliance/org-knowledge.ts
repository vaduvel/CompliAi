// Multiplicator B — Progressive Data Enrichment / orgKnowledge
// Datele confirmate o dată sunt reutilizate în toate documentele viitoare.

import { nanoid } from "nanoid"

export type OrgKnowledgeCategory =
  | "data-categories"
  | "processing-purposes"
  | "vendors"
  | "tools"
  | "international-transfers"
  | "hr-data"
  | "cookies"
  | "forms"
  | "ai-usage"

export type OrgKnowledgeSource =
  | "onboarding"
  | "site-scan"
  | "vendor-review"
  | "privacy-policy-wizard"
  | "dsar"
  | "ai-systems"
  | "manual"

export type OrgKnowledgeItem = {
  id: string
  category: OrgKnowledgeCategory
  value: string
  confirmedAtISO: string
  lastReviewedAtISO: string
  source: OrgKnowledgeSource
  sourceLabel: string   // e.g. "Site scan la 24 Mar 2026"
  confidence: "high" | "medium" | "low"
  stale?: boolean       // computed: lastReviewedAt > 6 luni
}

export type OrgKnowledge = {
  items: OrgKnowledgeItem[]
  lastUpdatedAtISO: string
}

export const KNOWLEDGE_CATEGORY_LABELS: Record<OrgKnowledgeCategory, string> = {
  "data-categories":           "Categorii de date",
  "processing-purposes":       "Scopuri de prelucrare",
  "vendors":                   "Furnizori confirmate",
  "tools":                     "Tool-uri utilizate",
  "international-transfers":   "Transferuri internaționale",
  "hr-data":                   "Date HR",
  "cookies":                   "Cookie-uri / trackere",
  "forms":                     "Formulare de colectare",
  "ai-usage":                  "Utilizare AI",
}

// ── STALE check ───────────────────────────────────────────────────────────────

const STALE_MS = 6 * 30 * 24 * 3_600_000  // ~6 luni

export function isStale(item: OrgKnowledgeItem): boolean {
  return Date.now() - new Date(item.lastReviewedAtISO).getTime() > STALE_MS
}

export function withStaleFlags(items: OrgKnowledgeItem[]): OrgKnowledgeItem[] {
  return items.map((i) => ({ ...i, stale: isStale(i) }))
}

// ── FACTORY ───────────────────────────────────────────────────────────────────

export function makeKnowledgeItem(
  category: OrgKnowledgeCategory,
  value: string,
  source: OrgKnowledgeSource,
  sourceLabel: string,
  confidence: OrgKnowledgeItem["confidence"] = "medium",
): OrgKnowledgeItem {
  const now = new Date().toISOString()
  return {
    id: nanoid(8),
    category,
    value,
    confirmedAtISO: now,
    lastReviewedAtISO: now,
    source,
    sourceLabel,
    confidence,
    stale: false,
  }
}

// ── MERGE helper (upsert by category+value, dedup) ────────────────────────────

export function mergeKnowledgeItems(
  existing: OrgKnowledgeItem[],
  incoming: OrgKnowledgeItem[],
): OrgKnowledgeItem[] {
  const merged = [...existing]
  for (const item of incoming) {
    const idx = merged.findIndex(
      (e) => e.category === item.category && e.value.toLowerCase() === item.value.toLowerCase()
    )
    if (idx >= 0) {
      // Update source + lastReviewedAt on higher confidence
      const confidenceRank = { high: 3, medium: 2, low: 1 }
      if (confidenceRank[item.confidence] >= confidenceRank[merged[idx].confidence]) {
        merged[idx] = {
          ...merged[idx],
          lastReviewedAtISO: item.lastReviewedAtISO,
          source: item.source,
          sourceLabel: item.sourceLabel,
          confidence: item.confidence,
          stale: false,
        }
      }
    } else {
      merged.push(item)
    }
  }
  return merged
}

// ── READ helpers ──────────────────────────────────────────────────────────────

export function getKnowledgeByCategory(
  knowledge: OrgKnowledge | undefined,
  category: OrgKnowledgeCategory,
): OrgKnowledgeItem[] {
  if (!knowledge) return []
  return withStaleFlags(knowledge.items.filter((i) => i.category === category))
}

export function getKnowledgeValues(
  knowledge: OrgKnowledge | undefined,
  category: OrgKnowledgeCategory,
): string[] {
  return getKnowledgeByCategory(knowledge, category).map((i) => i.value)
}

export function hasStaleKnowledge(knowledge: OrgKnowledge | undefined): boolean {
  if (!knowledge) return false
  return knowledge.items.some(isStale)
}

// ── STALE finding ─────────────────────────────────────────────────────────────

import type { ScanFinding } from "@/lib/compliance/types"

export function buildOrgKnowledgeStaleFinding(
  knowledge: OrgKnowledge | undefined,
  nowISO: string,
): ScanFinding | null {
  if (!knowledge || knowledge.items.length === 0) return null
  const staleItems = knowledge.items.filter(isStale)
  if (staleItems.length === 0) return null

  return {
    id: "org-knowledge-stale",
    title: "Datele din profilul operațional nu au fost reconfirmate recent",
    detail: `${staleItems.length} ${staleItems.length === 1 ? "înregistrare" : "înregistrări"} din profilul firmei (${staleItems.slice(0, 3).map((i) => i.value).join(", ")}${staleItems.length > 3 ? " ș.a." : ""}) nu au fost revizuite de peste 6 luni. Datele pot fi inexacte sau depășite, ceea ce afectează corectitudinea documentelor generate.`,
    category: "GDPR",
    severity: "medium",
    risk: "low",
    principles: ["accountability", "privacy_data_governance"],
    createdAtISO: nowISO,
    sourceDocument: "Profil operațional (orgKnowledge)",
    legalReference: "GDPR Art. 5(1)(d) — principiul exactității",
    remediationHint: "Deschide Profil Operațional → revizuiește datele marcate și confirmă sau actualizează-le.",
    findingStatus: "open",
  }
}

// ── WRITE adapter: site scan → orgKnowledge ───────────────────────────────────

import type { SiteScanResult } from "@/lib/compliance/site-scanner"

export function knowledgeFromSiteScan(result: SiteScanResult): OrgKnowledgeItem[] {
  const dateLabel = `Site scan la ${new Date(result.scannedAtISO).toLocaleDateString("ro-RO")}`
  const items: OrgKnowledgeItem[] = []

  // Trackere → cookies + vendors
  for (const tracker of result.trackers) {
    items.push(makeKnowledgeItem("cookies", tracker.name, "site-scan", dateLabel,
      tracker.gdprRisk === "high" ? "high" : "medium"))
    if (tracker.dpaVendorId) {
      items.push(makeKnowledgeItem("vendors", tracker.name, "site-scan", dateLabel, "medium"))
    }
  }

  // Forms → data categories
  const formTypeToCategory: Record<string, string> = {
    "contact":        "date contact (email, nume)",
    "newsletter":     "date contact (email, abonare)",
    "checkout":       "date financiare (card, facturare)",
    "login":          "credențiale autentificare",
    "hr-application": "date HR / candidați (CV, documente)",
  }
  for (const form of result.forms) {
    const val = formTypeToCategory[form.type] ?? `formular tip ${form.type}`
    items.push(makeKnowledgeItem("data-categories", val, "site-scan", dateLabel, "medium"))
    items.push(makeKnowledgeItem("forms", form.hint, "site-scan", dateLabel, "medium"))
  }

  // Analytics trackers → behavioral data category
  if (result.trackers.some((t) => t.category === "analytics")) {
    items.push(makeKnowledgeItem(
      "data-categories", "date comportamentale (navigare, sesiune, dispozitiv)",
      "site-scan", dateLabel, "high"
    ))
  }
  // Advertising trackers → advertising data category
  if (result.trackers.some((t) => t.category === "advertising")) {
    items.push(makeKnowledgeItem(
      "data-categories", "date publicitare (profil, remarketing, conversii)",
      "site-scan", dateLabel, "high"
    ))
  }

  return items
}
