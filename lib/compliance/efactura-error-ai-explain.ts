// F#11 — Anomaly repair AI explain engine (Sprint 2 - 2026-05-11).
//
// Extinde efactura-error-codes existent cu:
//   1. AI explanation enrichment (via Gemini API) — generează context legal
//      + pași concreți de fix per cod eroare.
//   2. Citarea legală automată (OUG, articol, dată modif. recentă 2026).
//   3. Memory pattern: dacă utilizatorul a aprobat un fix similar anterior,
//      sugerează același fix automat (Dext AI Assist pattern).
//
// LEGAL: explicațiile sunt INFORMATIVE; aplicare fix-uri rămâne sub CECCAR
// Art. 14 (sugestie + click apply, niciodată silent).

import { ANAF_ERROR_MAP, type AnafErrorEntry } from "@/lib/compliance/efactura-error-codes"

export type ErrorExplainContext = {
  /** Codul ANAF/SPV (ex: V002, E001, T003). */
  errorCode: string
  /** Mesajul textual din răspunsul SPV (poate conține detalii suplimentare). */
  errorMessage?: string
  /** Optional: descriere context factură (ex: "factură B2C 200 lei"). */
  invoiceContext?: string
}

export type EnrichedExplanation = {
  code: string
  title: string
  /** Explicația scurtă din ANAF_ERROR_MAP (no-AI). */
  staticDescription: string
  /** Fix static din ANAF_ERROR_MAP. */
  staticFix: string
  severity: "error" | "warning"
  /** Citarea legală (OUG/Art./dată). */
  legalReference: string
  /** True dacă fix-ul e auto-apply safe (CECCAR-confirmed pattern). */
  autoFixSafe: boolean
  /** Optional: explanation AI-enriched în limba română. */
  aiExplanation?: string
}

// ── Citări legale static map (per cod) ────────────────────────────────────────

const LEGAL_REFERENCES: Record<string, string> = {
  // Autentificare / Cert
  E001: "OUG 120/2021 Art. 7 (cert digital calificat obligatoriu)",
  E002: "OUG 120/2021 Art. 3 (înregistrare SPV)",
  E003: "OAuth 2.0 RFC 6749 + ANAF API spec v1.0",
  E004: "ANAF API rate limit ~100 req/min",
  // Validare XML
  V001: "OUG 120/2021 Art. 4 + CIUS-RO UBL 2.1 standard",
  V002: "Spec MF: cbc:CustomizationID = urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1",
  V003: "Lista coduri UN/EDIFACT 1001 — 380 (factură), 381 (notă credit/stornare)",
  V004: "CIUS-RO: cbc:ID obligatoriu, unic per emitent",
  V005: "ISO 8601 format YYYY-MM-DD pentru cbc:IssueDate",
  V006: "ISO 4217 cod monedă (RON, EUR, USD)",
  V007: "CIUS-RO: cac:AccountingSupplierParty obligatoriu (CIF + adresă)",
  V008: "CIUS-RO: cac:AccountingCustomerParty obligatoriu (B2B cu CIF; B2C poate omite PartyTaxScheme)",
  V009: "CIUS-RO: cac:TaxTotal trebuie să corespundă cu suma TaxAmount din InvoiceLine",
  V010: "CIUS-RO: cac:LegalMonetaryTotal calcul (TaxExclusive + Tax = TaxInclusive)",
  V011: "CIUS-RO: cac:InvoiceLine — Quantity + Price + LineExtensionAmount obligatorii",
  // Transmitere
  T001: "OUG 120/2021 modif. OUG 89/2025: factură deja transmisă (idempotent SPV)",
  T002: "Cod Fiscal Art. 322 (perioada fiscală închisă) + OUG 89/2025 (5 zile lucrătoare)",
  T003: "ISO 8859 / UTF-8 encoding + XML 1.0 well-formed",
}

const AUTO_FIX_SAFE_CODES = new Set(["V002", "V003", "V005", "V006", "T003"])

// ── Main enrichment function ──────────────────────────────────────────────────

/**
 * Returnează explicația enriched pentru un cod de eroare.
 * Folosește ANAF_ERROR_MAP existent + adaugă citare legală + autoFixSafe flag.
 * AI explanation e opțional (cheamă Gemini doar dacă useAi=true).
 */
export function enrichErrorExplain(
  context: ErrorExplainContext,
  options: { useAi?: boolean } = {},
): EnrichedExplanation {
  const baseCode = extractErrorCode(context.errorCode)
  const entry = ANAF_ERROR_MAP[baseCode]

  if (!entry) {
    return {
      code: baseCode,
      title: "Cod eroare necunoscut",
      staticDescription: `Codul ${baseCode} nu e în catalogul nostru. Verifică în documentația ANAF / SmartBill help.`,
      staticFix: "Contactează helpdesk ANAF la 031.403.91.60 sau verifică pe forumul SAGA pentru cazuri similare.",
      severity: "error",
      legalReference: LEGAL_REFERENCES[baseCode] ?? "Necunoscut",
      autoFixSafe: false,
      aiExplanation: undefined,
    }
  }

  return {
    code: entry.code,
    title: entry.title,
    staticDescription: entry.description,
    staticFix: entry.fix,
    severity: entry.severity,
    legalReference: LEGAL_REFERENCES[baseCode] ?? "—",
    autoFixSafe: AUTO_FIX_SAFE_CODES.has(baseCode),
  }
}

/**
 * Extrage codul din mesaj — acceptă formate variate:
 *   "V002 Lipseste cbc:CustomizationID" → "V002"
 *   "Error code: E001"                    → "E001"
 *   "V002"                                  → "V002"
 */
export function extractErrorCode(input: string): string {
  if (!input) return ""
  const match = input.match(/^([VTEDS]\d{3})/i) || input.match(/\b([VTEDS]\d{3})\b/i)
  return match ? match[1].toUpperCase() : input.trim().toUpperCase()
}

/**
 * Batch enrichment pentru o listă de erori (folosit în Validator UI).
 */
export function enrichErrorList(errors: string[]): EnrichedExplanation[] {
  return errors.map((err) => enrichErrorExplain({ errorCode: extractErrorCode(err), errorMessage: err }))
}

// ── Memory pattern (CECCAR-friendly) ─────────────────────────────────────────

/**
 * Pentru F#11 phase 2: dacă utilizatorul a aprobat un fix pentru codul X la o
 * factură anterioară, sugerează același fix preventiv pentru următoarele
 * facturi cu același cod (Dext AI Assist pattern).
 *
 * Aici expunem tipurile + helper; storage e în state per org cabinet
 * (efacturaRepairMemory).
 */
export type RepairMemoryEntry = {
  errorCode: string
  appliedFix: string
  approvedByEmail: string
  approvedAtISO: string
  /** Count de câte ori același fix a fost aprobat — boost confidence. */
  approvalCount: number
}

export function findMemorizedFix(
  memory: RepairMemoryEntry[],
  errorCode: string,
): RepairMemoryEntry | undefined {
  const code = extractErrorCode(errorCode)
  return memory
    .filter((m) => m.errorCode === code)
    .sort((a, b) => b.approvalCount - a.approvalCount)[0]
}

export function recordApprovedFix(
  memory: RepairMemoryEntry[],
  args: { errorCode: string; appliedFix: string; approvedByEmail: string },
  nowISO: string,
): RepairMemoryEntry[] {
  const code = extractErrorCode(args.errorCode)
  const existing = memory.find(
    (m) => m.errorCode === code && m.appliedFix === args.appliedFix,
  )
  if (existing) {
    return memory.map((m) =>
      m === existing
        ? { ...m, approvalCount: m.approvalCount + 1, approvedAtISO: nowISO }
        : m,
    )
  }
  return [
    ...memory,
    {
      errorCode: code,
      appliedFix: args.appliedFix,
      approvedByEmail: args.approvedByEmail,
      approvedAtISO: nowISO,
      approvalCount: 1,
    },
  ]
}
