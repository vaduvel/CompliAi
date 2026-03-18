// ANAF Signals Phase A — A1: e-Factura Signal Hardening
// Vendor repeated rejection tracking, pending-too-long, urgency scoring,
// reopen-until-confirmed logic.
// Pure functions — no I/O, safe in browser and server.

import type { ScanFinding } from "@/lib/compliance/types"
import type { EFacturaInvoiceSignal, EFacturaSignalStatus } from "@/lib/compliance/efactura-risk"
import { makeResolution } from "@/lib/compliance/finding-resolution"

// ── Types ────────────────────────────────────────────────────────────────────

export type VendorRejectionRecord = {
  vendorName: string
  rejectionCount: number
  lastRejectedAtISO: string
  signalIds: string[]
}

export type SignalUrgency = {
  signalId: string
  score: number        // 0-100, higher = more urgent
  label: "critic" | "ridicat" | "mediu" | "scăzut"
  reasons: string[]
}

export type PendingTooLongResult = {
  signalId: string
  vendorName: string
  pendingDays: number
  finding: ScanFinding
}

export type ReopenCheckResult = {
  signalId: string
  shouldReopen: boolean
  reason?: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000
const PENDING_TOO_LONG_HOURS = 48
const REPEATED_REJECTION_THRESHOLD = 2 // 2+ rejections = escalation
const URGENCY_AMOUNT_HIGH = 5000       // RON — above this = urgency bump
const URGENCY_AMOUNT_CRITICAL = 20000  // RON — above this = critical bump

// ── Urgency scoring ──────────────────────────────────────────────────────────

const STATUS_BASE_URGENCY: Record<EFacturaSignalStatus, number> = {
  rejected: 60,
  "xml-error": 50,
  "processing-delayed": 30,
  unsubmitted: 20,
}

/**
 * Compute urgency score (0-100) for a single signal.
 * Factors: status severity, amount, vendor tech flag, age, repeated rejections.
 */
export function computeSignalUrgency(
  signal: EFacturaInvoiceSignal,
  vendorHistory: VendorRejectionRecord[],
  nowISO: string,
): SignalUrgency {
  let score = STATUS_BASE_URGENCY[signal.status]
  const reasons: string[] = []

  // Amount factor
  if (signal.amount && signal.amount >= URGENCY_AMOUNT_CRITICAL) {
    score += 20
    reasons.push(`Sumă critică: ${signal.amount.toLocaleString("ro-RO")} RON`)
  } else if (signal.amount && signal.amount >= URGENCY_AMOUNT_HIGH) {
    score += 10
    reasons.push(`Sumă ridicată: ${signal.amount.toLocaleString("ro-RO")} RON`)
  }

  // Tech vendor → DPA/NIS2 implications
  if (signal.isTechVendor) {
    score += 10
    reasons.push("Furnizor tech/cloud — implicații DPA și NIS2")
  }

  // Signal age
  const ageMs = new Date(nowISO).getTime() - new Date(signal.date).getTime()
  const ageDays = Math.floor(ageMs / MS_PER_DAY)
  if (ageDays > 7) {
    score += 10
    reasons.push(`Semnal vechi de ${ageDays} zile fără rezolvare`)
  } else if (ageDays > 3) {
    score += 5
    reasons.push(`Semnal de ${ageDays} zile`)
  }

  // Repeated rejections for same vendor
  const vendorRecord = vendorHistory.find(
    (v) => v.vendorName.toLowerCase() === signal.vendorName.toLowerCase(),
  )
  if (vendorRecord && vendorRecord.rejectionCount >= REPEATED_REJECTION_THRESHOLD) {
    score += 15
    reasons.push(
      `Vendor cu ${vendorRecord.rejectionCount} respingeri repetate — posibil problem sistemic`,
    )
  }

  // Clamp 0-100
  score = Math.min(100, Math.max(0, score))

  const label: SignalUrgency["label"] =
    score >= 80 ? "critic" : score >= 60 ? "ridicat" : score >= 40 ? "mediu" : "scăzut"

  return { signalId: signal.id, score, label, reasons }
}

/**
 * Compute urgency for all signals in batch.
 */
export function computeBatchUrgency(
  signals: EFacturaInvoiceSignal[],
  nowISO: string,
): SignalUrgency[] {
  const vendorHistory = buildVendorRejectionHistory(signals)
  return signals.map((s) => computeSignalUrgency(s, vendorHistory, nowISO))
}

// ── Vendor repeated rejection tracking ───────────────────────────────────────

/**
 * Build rejection history per vendor from signal list.
 */
export function buildVendorRejectionHistory(
  signals: EFacturaInvoiceSignal[],
): VendorRejectionRecord[] {
  const map = new Map<string, VendorRejectionRecord>()

  for (const signal of signals) {
    if (signal.status !== "rejected" && signal.status !== "xml-error") continue

    const key = signal.vendorName.toLowerCase()
    const existing = map.get(key)
    if (existing) {
      existing.rejectionCount++
      existing.signalIds.push(signal.id)
      if (signal.date > existing.lastRejectedAtISO) {
        existing.lastRejectedAtISO = signal.date
      }
    } else {
      map.set(key, {
        vendorName: signal.vendorName,
        rejectionCount: 1,
        lastRejectedAtISO: signal.date,
        signalIds: [signal.id],
      })
    }
  }

  return Array.from(map.values())
}

/**
 * Detect vendors with repeated rejections (≥ threshold).
 * Returns findings for systemic vendor issues.
 */
export function detectRepeatedRejectionFindings(
  signals: EFacturaInvoiceSignal[],
  nowISO: string,
): ScanFinding[] {
  const history = buildVendorRejectionHistory(signals)
  const findings: ScanFinding[] = []

  for (const record of history) {
    if (record.rejectionCount < REPEATED_REJECTION_THRESHOLD) continue

    findings.push({
      id: `efactura-vendor-repeat-${record.vendorName.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}`,
      title: `Respingeri repetate — ${record.vendorName}`,
      detail: `${record.rejectionCount} facturi respinse/eroare XML de la ${record.vendorName}. Posibil problemă sistemică: verifică configurația furnizorului, CUI, format UBL.`,
      category: "E_FACTURA",
      severity: record.rejectionCount >= 3 ? "critical" : "high",
      risk: "high",
      principles: ["accountability"],
      createdAtISO: nowISO,
      sourceDocument: record.vendorName,
      legalReference: "OUG 120/2021 · CIUS-RO:1.0.1",
      remediationHint: "Contactează furnizorul pentru corectarea datelor fiscale. Verifică CUI, cod TVA, și formatul UBL CIUS-RO.",
      resolution: makeResolution(
        `${record.rejectionCount} facturi respinse de la ${record.vendorName}`,
        "Respingeri repetate indică o problemă sistemică — facturile nu vor fi acceptate de ANAF până la corectare.",
        "Contactează furnizorul, verifică datele fiscale (CUI, TVA, format), și retransmite facturile corectate.",
        {
          humanStep: "Contactează departamentul financiar al furnizorului și solicită corectarea datelor.",
          closureEvidence: "Confirmare ANAF SPV cu status 'ok' pentru facturile retransmise.",
          revalidation: "Monitorizează următoarele 3 facturi de la acest furnizor.",
        },
      ),
    })
  }

  return findings
}

// ── Pending too long ─────────────────────────────────────────────────────────

/**
 * Detect signals stuck in processing for too long (>48h).
 * Creates findings for delayed invoices.
 */
export function detectPendingTooLong(
  signals: EFacturaInvoiceSignal[],
  nowISO: string,
): PendingTooLongResult[] {
  const nowMs = new Date(nowISO).getTime()
  const results: PendingTooLongResult[] = []

  for (const signal of signals) {
    if (signal.status !== "processing-delayed") continue

    const signalMs = new Date(signal.date).getTime()
    const hoursElapsed = (nowMs - signalMs) / (1000 * 60 * 60)

    if (hoursElapsed < PENDING_TOO_LONG_HOURS) continue

    const pendingDays = Math.floor(hoursElapsed / 24)

    results.push({
      signalId: signal.id,
      vendorName: signal.vendorName,
      pendingDays,
      finding: {
        id: `efactura-pending-long-${signal.id}`,
        title: `Factură blocată ${pendingDays} zile — ${signal.vendorName}`,
        detail: `Factura ${signal.invoiceNumber ? `#${signal.invoiceNumber} ` : ""}de la ${signal.vendorName} este în prelucrare ANAF de ${pendingDays} zile (>${PENDING_TOO_LONG_HOURS}h). Verifică starea în portalul SPV.`,
        category: "E_FACTURA",
        severity: pendingDays > 5 ? "high" : "medium",
        risk: pendingDays > 5 ? "high" : "low",
        principles: ["accountability"],
        createdAtISO: nowISO,
        sourceDocument: signal.invoiceNumber ?? signal.vendorName,
        legalReference: "OUG 120/2021",
        remediationHint: "Verifică starea în SPV ANAF. Dacă e blocată, contactează asistența ANAF sau retransmite factura.",
        resolution: makeResolution(
          `Factură în prelucrare ANAF de ${pendingDays} zile`,
          "Facturile blocate nu pot fi deduse fiscal și pot genera discrepanțe în declarațiile e-TVA.",
          "Accesează portalul SPV ANAF, verifică starea facturii. Dacă nu se rezolvă, retransmite.",
          {
            humanStep: "Accesează portalul SPV și verifică starea facturii manual.",
            closureEvidence: "Confirmare ANAF SPV cu status final (ok sau respinsă cu motiv clar).",
            revalidation: "Verifică status SPV după 24h.",
          },
        ),
      },
    })
  }

  return results
}

// ── Reopen until confirmed ───────────────────────────────────────────────────

/**
 * Check if a resolved e-Factura finding should be reopened.
 * A finding stays open until ANAF confirmation (status 'ok').
 */
export function checkReopenSignals(
  signals: EFacturaInvoiceSignal[],
  resolvedFindingIds: string[],
): ReopenCheckResult[] {
  const results: ReopenCheckResult[] = []

  for (const signal of signals) {
    const findingId = `efactura-risk-${signal.id}`

    // Only check resolved findings
    if (!resolvedFindingIds.includes(findingId)) continue

    // If signal still has a problem status, reopen
    if (signal.status === "rejected" || signal.status === "xml-error" || signal.status === "processing-delayed") {
      results.push({
        signalId: signal.id,
        shouldReopen: true,
        reason: `Semnalul e-Factura încă activ (${signal.status}). Finding-ul nu poate fi închis până la confirmare ANAF.`,
      })
    } else {
      results.push({
        signalId: signal.id,
        shouldReopen: false,
      })
    }
  }

  return results
}

// ── Aggregate fiscal summary ─────────────────────────────────────────────────

export type FiscalSignalSummary = {
  totalSignals: number
  criticalUrgency: number
  highUrgency: number
  repeatedRejectionVendors: number
  pendingTooLong: number
  averageUrgency: number
  fiscalHealthLabel: "sănătos" | "atenție" | "critic"
}

/**
 * Build aggregate fiscal summary from signals.
 */
export function buildFiscalSummary(
  signals: EFacturaInvoiceSignal[],
  nowISO: string,
): FiscalSignalSummary {
  const urgencies = computeBatchUrgency(signals, nowISO)
  const vendorHistory = buildVendorRejectionHistory(signals)
  const pendingLong = detectPendingTooLong(signals, nowISO)

  const criticalUrgency = urgencies.filter((u) => u.label === "critic").length
  const highUrgency = urgencies.filter((u) => u.label === "ridicat").length
  const repeatedRejectionVendors = vendorHistory.filter(
    (v) => v.rejectionCount >= REPEATED_REJECTION_THRESHOLD,
  ).length
  const averageUrgency =
    urgencies.length > 0
      ? Math.round(urgencies.reduce((s, u) => s + u.score, 0) / urgencies.length)
      : 0

  const fiscalHealthLabel: FiscalSignalSummary["fiscalHealthLabel"] =
    criticalUrgency > 0 || repeatedRejectionVendors > 0
      ? "critic"
      : highUrgency > 0 || pendingLong.length > 0
        ? "atenție"
        : "sănătos"

  return {
    totalSignals: signals.length,
    criticalUrgency,
    highUrgency,
    repeatedRejectionVendors,
    pendingTooLong: pendingLong.length,
    averageUrgency,
    fiscalHealthLabel,
  }
}
