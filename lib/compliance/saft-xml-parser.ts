// GAP #4 (Sprint 3) — SAF-T XML metadata parser.
//
// Parser SIMPLU pentru fișiere SAF-T D406 (extracție metadata only).
// NU validare completă XSD (asta cere Validator ANAF oficial).
//
// Extrage din header:
//   - Periodă raportare (Period)
//   - Data emiterii (DateCreated)
//   - Tip raport (Standard / Reporting)
//   - Indicator dacă e rectificare (din header Document)
//   - CIF reporter (CompanyID din SourceDocuments)

import type { FilingRecord } from "@/lib/compliance/filing-discipline"

export type SaftMetadata = {
  reportingPeriodStart: string  // ISO date — start period
  reportingPeriodEnd: string    // ISO date — end period
  period: string                 // "2026-04" (luna fiscală)
  dateCreated: string            // ISO timestamp — data emiterii
  cif: string | null             // CompanyID
  isRectification: boolean       // True dacă XML are header rectifying
  rectificationCount: number     // Câte rectificări (din header revision)
  errors: string[]               // Erori parser (fields lipsă etc.)
  warnings: string[]             // Warnings (best-effort suggestions)
}

// ── Regex helpers (pentru XML simplu, fără DOM parser dependency) ────────────

function findTagValue(xml: string, tag: string): string {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(
    `<(?:(?:\\w|-)+:)?${escapedTag}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:(?:\\w|-)+:)?${escapedTag}>`,
    "i",
  )
  const match = xml.match(pattern)
  return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || ""
}

function findTagValueRequired(xml: string, tag: string): { value: string; missing: boolean } {
  const value = findTagValue(xml, tag)
  return { value, missing: !value }
}

// ── Period extraction ────────────────────────────────────────────────────────

function extractPeriod(periodStart: string): string {
  // Period format YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS — extract YYYY-MM
  if (!periodStart) return ""
  const match = periodStart.match(/^(\d{4})-(\d{2})/)
  if (!match) return ""
  return `${match[1]}-${match[2]}`
}

// ── Main parser ──────────────────────────────────────────────────────────────

export function parseSaftMetadata(xml: string): SaftMetadata {
  const errors: string[] = []
  const warnings: string[] = []

  const trimmed = xml.trim()
  if (!trimmed.startsWith("<")) {
    errors.push("S001 Conținutul nu pare XML valid. Asigură-te că fișierul este UTF-8.")
  }

  // Verify root element AuditFile (SAF-T standard)
  const isAuditFile = /<(?:\w+:)?AuditFile[\s>]/i.test(trimmed)
  if (!isAuditFile) {
    errors.push(
      "S002 Rădăcina XML trebuie să fie AuditFile (SAF-T standard). Verifică schema RO_SAFT.",
    )
  }

  // Extract Header
  const headerMatch = trimmed.match(
    /<(?:\w+:)?Header[\s\S]*?<\/(?:\w+:)?Header>/i,
  )
  const header = headerMatch?.[0] ?? ""

  if (!header) {
    errors.push("S003 Lipsește blocul Header din SAF-T.")
  }

  // Extract SelectionCriteria.PeriodStart and PeriodEnd
  const selectionMatch = trimmed.match(
    /<(?:\w+:)?SelectionCriteria[\s\S]*?<\/(?:\w+:)?SelectionCriteria>/i,
  )
  const selection = selectionMatch?.[0] ?? ""

  const periodStartRaw = findTagValue(selection || header, "PeriodStart")
  const periodEndRaw = findTagValue(selection || header, "PeriodEnd")

  if (!periodStartRaw) {
    errors.push("S004 Lipsește SelectionCriteria.PeriodStart (perioada raportare).")
  }

  // DateCreated
  const dateCreatedRaw = findTagValue(header, "DateCreated")
  if (!dateCreatedRaw) {
    warnings.push("S005 Lipsește Header.DateCreated. Folosim data curentă ca fallback.")
  }
  const dateCreated = dateCreatedRaw || new Date().toISOString().split("T")[0]

  // CIF (CompanyID)
  const companyMatch = header.match(
    /<(?:\w+:)?Company[\s\S]*?<\/(?:\w+:)?Company>/i,
  )
  const cifRaw = companyMatch
    ? findTagValue(companyMatch[0], "CompanyID")
    : findTagValue(header, "CompanyID")
  const cif = cifRaw ? cifRaw.replace(/^RO/i, "").replace(/\D/g, "") : null

  if (!cif) {
    warnings.push("S006 Lipsește Company.CompanyID (CIF). Asociază manual la org.")
  }

  // Rectification detection — RevisionNumber > 0 = rectificat
  const revisionRaw = findTagValue(header, "RevisionNumber") || findTagValue(header, "AuditFileVersion")
  const rectificationCount = revisionRaw ? parseInt(revisionRaw, 10) || 0 : 0
  const isRectification = rectificationCount > 0

  return {
    reportingPeriodStart: periodStartRaw || dateCreated,
    reportingPeriodEnd: periodEndRaw || periodStartRaw || dateCreated,
    period: extractPeriod(periodStartRaw),
    dateCreated,
    cif,
    isRectification,
    rectificationCount,
    errors,
    warnings,
  }
}

// ── Build FilingRecord from SAF-T metadata ───────────────────────────────────

/**
 * Convertește metadata SAF-T parsed la FilingRecord (compatibil cu engine
 * existing computeSAFTHygiene + buildSAFTHygieneFindings).
 */
export function saftMetadataToFilingRecord(
  meta: SaftMetadata,
  filedAtISO: string,
  existingRectificationCount = 0,
): FilingRecord {
  const filingId = `saft-d406-${meta.period}-${Date.now()}`
  return {
    id: filingId,
    type: "saft",
    period: meta.period,
    status: meta.isRectification ? "rectified" : "on_time",
    dueISO: meta.reportingPeriodEnd,
    filedAtISO,
    rectificationCount: meta.isRectification
      ? Math.max(meta.rectificationCount, existingRectificationCount + 1)
      : existingRectificationCount,
    note: meta.errors.length > 0
      ? `Erori parser: ${meta.errors.slice(0, 2).join("; ")}`
      : undefined,
  }
}
