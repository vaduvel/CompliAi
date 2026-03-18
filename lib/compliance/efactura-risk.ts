// V3 P0.3 — e-Factura Risk Dashboard + Findings
// Strict compliance signal layer: risc, respingeri, semnale, handoff spre remediation.
// NU emite, NU editează, NU gestionează facturi — detectează și semnalează.

import type { ScanFinding } from "@/lib/compliance/types"
import { makeResolution } from "@/lib/compliance/finding-resolution"

export type EFacturaSignalStatus =
  | "rejected"          // ANAF: nok — factura respinsă
  | "xml-error"         // ANAF: xml_erori — erori structurale UBL
  | "processing-delayed" // ANAF: in_prelucrare prea lung (>48h)
  | "unsubmitted"       // Factura generată dar netransmisă spre SPV

export type EFacturaInvoiceSignal = {
  id: string
  vendorName: string
  invoiceNumber?: string
  date: string            // ISO date string
  status: EFacturaSignalStatus
  amount?: number         // RON
  currency?: string
  reason?: string         // Mesaj ANAF sau motiv intern
  isTechVendor?: boolean  // Furnizor tech → semnalizare DPA NIS2
}

export const EFACTURA_RISK_FINDING_PREFIX = "efactura-risk-"

// ── Mock signals (demo mode) ──────────────────────────────────────────────────

export function buildMockEFacturaSignals(): EFacturaInvoiceSignal[] {
  const today = new Date()
  const daysAgo = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - n)
    return d.toISOString().slice(0, 10)
  }

  return [
    {
      id: "efact-sig-001",
      vendorName: "Amazon Web Services EMEA SARL",
      invoiceNumber: "AWS-2026-0312",
      date: daysAgo(3),
      status: "rejected",
      amount: 4820,
      currency: "RON",
      reason: "Cod TVA furnizor invalid în câmpul AccountingSupplierParty",
      isTechVendor: true,
    },
    {
      id: "efact-sig-002",
      vendorName: "Microsoft Ireland Operations Limited",
      invoiceNumber: "MSFT-INV-20260310",
      date: daysAgo(5),
      status: "xml-error",
      amount: 1240,
      currency: "RON",
      reason: "CustomizationID lipsă sau incorect (CIUS-RO:1.0.1 necesar)",
      isTechVendor: true,
    },
    {
      id: "efact-sig-003",
      vendorName: "Fan Courier Express SRL",
      invoiceNumber: "FC-00294811",
      date: daysAgo(7),
      status: "processing-delayed",
      amount: 380,
      currency: "RON",
      reason: "Factura în prelucrare ANAF de peste 72 ore fără confirmare",
      isTechVendor: false,
    },
    {
      id: "efact-sig-004",
      vendorName: "OpenAI OpCo LLC",
      invoiceNumber: "INV-OAI-2026-03",
      date: daysAgo(1),
      status: "unsubmitted",
      amount: 2100,
      currency: "RON",
      reason: "Factură generată local, netransmisă spre SPV ANAF",
      isTechVendor: true,
    },
    {
      id: "efact-sig-005",
      vendorName: "Telekom Romania Communications SA",
      invoiceNumber: "TEL-2026-0280",
      date: daysAgo(14),
      status: "rejected",
      amount: 650,
      currency: "RON",
      reason: "InvoiceTypeCode incorect (trebuie 380, primit 0)",
      isTechVendor: false,
    },
  ]
}

// ── Finding builder ──────────────────────────────────────────────────────────

const STATUS_LABELS: Record<EFacturaSignalStatus, string> = {
  rejected: "Respinsă ANAF",
  "xml-error": "Eroare XML/UBL",
  "processing-delayed": "Prelucrare blocată",
  unsubmitted: "Netransmisă SPV",
}

const STATUS_SEVERITY: Record<EFacturaSignalStatus, "high" | "medium"> = {
  rejected: "high",
  "xml-error": "high",
  "processing-delayed": "medium",
  unsubmitted: "medium",
}

function buildSignalFinding(signal: EFacturaInvoiceSignal, nowISO: string): ScanFinding {
  const statusLabel = STATUS_LABELS[signal.status]
  const severity = STATUS_SEVERITY[signal.status]
  const amountStr = signal.amount
    ? ` (${signal.amount.toLocaleString("ro-RO")} ${signal.currency ?? "RON"})`
    : ""

  const action =
    signal.status === "rejected"
      ? "Corectează datele facturii și retransmite spre ANAF SPV. Verifică CUI, TVA și câmpurile obligatorii UBL CIUS-RO."
      : signal.status === "xml-error"
        ? "Corectează structura XML conform CIUS-RO:1.0.1 și retransmite. Folosește validatorul e-Factura din CompliAI."
        : signal.status === "processing-delayed"
          ? "Verifică starea facturii în portalul SPV ANAF. Dacă e blocată, contactează ANAF sau retransmite."
          : "Transmite factura spre SPV ANAF. Verifică că fișierul XML este valid înainte de upload."

  return {
    id: `${EFACTURA_RISK_FINDING_PREFIX}${signal.id}`,
    title: `Factură ${statusLabel} — ${signal.vendorName}`,
    detail: [
      `Factură ${signal.invoiceNumber ? `#${signal.invoiceNumber} ` : ""}de la ${signal.vendorName}${amountStr} are status: ${statusLabel}.`,
      signal.reason ? `\nMotiv: ${signal.reason}` : "",
      signal.isTechVendor
        ? "\nAcest furnizor este clasificat ca tech/cloud — verifică existența DPA (GDPR Art. 28) și SLA de securitate."
        : "",
    ]
      .filter(Boolean)
      .join(""),
    category: "E_FACTURA",
    severity,
    risk: severity === "high" ? "high" : "low",
    principles: ["accountability"],
    createdAtISO: nowISO,
    sourceDocument: signal.invoiceNumber ?? signal.vendorName,
    legalReference: "OUG 120/2021 · CIUS-RO:1.0.1 · Legea 296/2023",
    remediationHint: action,
    resolution: makeResolution(
      `Factură ${statusLabel} de la ${signal.vendorName}${signal.reason ? ` — ${signal.reason}` : ""}`,
      "Facturile nepreluate sau respinse pot atrage penalități fiscale și întârzieri în deducerea TVA.",
      action,
      {
        generatedAsset:
          signal.status === "xml-error"
            ? "Raport de erori XML generat de validatorul e-Factura CompliAI"
            : undefined,
        humanStep: "Accesează portalul ANAF SPV, verifică starea facturii și retransmite dacă e necesar.",
        closureEvidence: "Confirmare ANAF SPV cu status 'ok' sau numărul mesajului de acceptare",
        revalidation: "Verifică status SPV după 24h de la retransmitere.",
      }
    ),
  }
}

/**
 * Converts e-Factura risk signals into ScanFindings for the central compliance board.
 * Only includes signals with actionable risk (rejected, xml-error, processing-delayed, unsubmitted).
 */
export function buildEFacturaRiskFindings(
  signals: EFacturaInvoiceSignal[],
  nowISO: string
): ScanFinding[] {
  return signals
    .filter((s) => s.status !== "unsubmitted" || signals.length <= 3) // always include if small dataset
    .map((s) => buildSignalFinding(s, nowISO))
}

// ── Summary helpers ──────────────────────────────────────────────────────────

export type EFacturaRiskSummary = {
  total: number
  rejected: number
  xmlErrors: number
  delayed: number
  unsubmitted: number
  techVendors: number
}

export function summarizeEFacturaSignals(signals: EFacturaInvoiceSignal[]): EFacturaRiskSummary {
  return {
    total: signals.length,
    rejected: signals.filter((s) => s.status === "rejected").length,
    xmlErrors: signals.filter((s) => s.status === "xml-error").length,
    delayed: signals.filter((s) => s.status === "processing-delayed").length,
    unsubmitted: signals.filter((s) => s.status === "unsubmitted").length,
    techVendors: signals.filter((s) => s.isTechVendor).length,
  }
}
