// Cross-validation status ERP local (SmartBill/Oblio/Saga) vs ANAF SPV real.
//
// Pain point research: contabilul vede în SmartBill „Factură transmisă" dar
// în SPV ANAF apare respinsă/lipsă. Acest modul detectează disparitățile.
//
// Pure functions — input: 2 liste (ERP invoices + SPV invoices), output:
// disparities + findings.

import type { ScanFinding } from "@/lib/compliance/types"
import { makeResolution } from "@/lib/compliance/finding-resolution"

export type ErpInvoiceSnapshot = {
  source: "smartbill" | "oblio" | "saga" | "manual"
  series: string
  number: string
  issueDate: string
  total: number
  efacturaStatus?:
    | "valida"
    | "in_validare"
    | "in_curs"
    | "de_trimis"
    | "cu_eroare"
    | "trimis"
    | "respins"
    | "necunoscut"
}

export type SpvInvoiceSnapshot = {
  invoiceNumber: string             // așa cum apare în SPV
  spvStatus: "valida" | "respinsa" | "in_validare" | "absenta"
  spvIndex?: string                 // ID e-Factura ANAF
  detectedAtISO: string
}

export type ErpSpvDisparity = {
  invoiceKey: string                // {series}-{number}
  type:
    | "erp_says_sent_spv_says_missing"
    | "erp_says_valid_spv_says_rejected"
    | "erp_says_pending_spv_says_valid"
    | "spv_has_invoice_erp_doesnt"
    | "status_inconsistent"
  severity: "critical" | "high" | "medium"
  erpStatus: string
  spvStatus: string
  invoiceNumber: string
  series: string
  message: string
}

function buildKey(s: string, n: string): string {
  return `${s.trim()}-${n.trim()}`.toUpperCase()
}

function normalizeSpvNumber(num: string): string {
  // Numerele SPV apar uneori ca "FACT-001" sau "FACT001" sau cu spații
  return num.replace(/\s/g, "").toUpperCase()
}

// ── Reconciler principal ─────────────────────────────────────────────────────

export function reconcileErpVsSpv(
  erpInvoices: ErpInvoiceSnapshot[],
  spvInvoices: SpvInvoiceSnapshot[],
): ErpSpvDisparity[] {
  const disparities: ErpSpvDisparity[] = []

  // Index SPV by normalized invoice number
  const spvIndex = new Map<string, SpvInvoiceSnapshot>()
  for (const spv of spvInvoices) {
    spvIndex.set(normalizeSpvNumber(spv.invoiceNumber), spv)
  }

  // Index ERP by series+number
  const erpKeys = new Set<string>()

  for (const erp of erpInvoices) {
    const key = buildKey(erp.series, erp.number)
    erpKeys.add(key)
    const spvLookupKey = normalizeSpvNumber(`${erp.series}${erp.number}`)
    const spvAlt = normalizeSpvNumber(`${erp.series}-${erp.number}`)
    const spv = spvIndex.get(spvLookupKey) ?? spvIndex.get(spvAlt) ?? spvIndex.get(normalizeSpvNumber(erp.number))

    if (!spv) {
      // ERP zice transmisă/validă, dar SPV nu o are deloc
      const erpClaimsSent = ["valida", "in_validare", "in_curs", "trimis"].includes(
        erp.efacturaStatus ?? "necunoscut",
      )
      if (erpClaimsSent) {
        disparities.push({
          invoiceKey: key,
          type: "erp_says_sent_spv_says_missing",
          severity: "critical",
          erpStatus: erp.efacturaStatus ?? "necunoscut",
          spvStatus: "absenta",
          invoiceNumber: erp.number,
          series: erp.series,
          message: `Factură ${erp.series}${erp.number}: ${erp.source} marchează ca „${erp.efacturaStatus}" dar NU apare în SPV ANAF. Risc 15% amendă.`,
        })
      }
      continue
    }

    // Both sides have it — compare statuses
    if (erp.efacturaStatus === "valida" && spv.spvStatus === "respinsa") {
      disparities.push({
        invoiceKey: key,
        type: "erp_says_valid_spv_says_rejected",
        severity: "critical",
        erpStatus: erp.efacturaStatus,
        spvStatus: spv.spvStatus,
        invoiceNumber: erp.number,
        series: erp.series,
        message: `Factură ${erp.series}${erp.number}: ${erp.source} arată „valida" dar SPV ANAF a respins-o. Verifică imediat motivul respingerii și retransmite.`,
      })
    } else if (
      ["in_validare", "in_curs", "trimis"].includes(erp.efacturaStatus ?? "") &&
      spv.spvStatus === "valida"
    ) {
      disparities.push({
        invoiceKey: key,
        type: "erp_says_pending_spv_says_valid",
        severity: "medium",
        erpStatus: erp.efacturaStatus!,
        spvStatus: spv.spvStatus,
        invoiceNumber: erp.number,
        series: erp.series,
        message: `Factură ${erp.series}${erp.number}: ${erp.source} încă în „${erp.efacturaStatus}" dar SPV a marcat-o validă. Sincronizare ERP întârziată — refresh manual.`,
      })
    } else if (
      erp.efacturaStatus === "valida" &&
      spv.spvStatus !== "valida" &&
      spv.spvStatus !== "respinsa"
    ) {
      disparities.push({
        invoiceKey: key,
        type: "status_inconsistent",
        severity: "high",
        erpStatus: erp.efacturaStatus,
        spvStatus: spv.spvStatus,
        invoiceNumber: erp.number,
        series: erp.series,
        message: `Factură ${erp.series}${erp.number}: status inconsistent între ${erp.source} (valida) și SPV (${spv.spvStatus}).`,
      })
    }
  }

  // Verifică SPV are facturi pe care ERP nu le are deloc (rare dar posibil)
  // Normalizăm ERP keys (eliminăm dashes/spații) ca să match-uim cu SPV format
  const erpKeysNormalized = new Set(
    Array.from(erpKeys).map((k) => normalizeSpvNumber(k.replace(/-/g, ""))),
  )
  for (const [spvKey, spv] of spvIndex.entries()) {
    const spvKeyClean = normalizeSpvNumber(spvKey.replace(/-/g, ""))
    const matchedAny = Array.from(erpKeysNormalized).some(
      (k) => k === spvKeyClean || k.includes(spvKeyClean) || spvKeyClean.includes(k),
    )
    if (!matchedAny) {
      disparities.push({
        invoiceKey: spvKey,
        type: "spv_has_invoice_erp_doesnt",
        severity: "medium",
        erpStatus: "absent",
        spvStatus: spv.spvStatus,
        invoiceNumber: spv.invoiceNumber,
        series: "—",
        message: `Factură ${spv.invoiceNumber} apare în SPV ANAF dar nu există în ${
          erpInvoices[0]?.source ?? "ERP-ul tău"
        }. Posibilă transmitere directă din alt sistem sau eroare nomenclator.`,
      })
    }
  }

  return disparities
}

// ── Findings builder ─────────────────────────────────────────────────────────

export function buildErpSpvDisparityFindings(
  disparities: ErpSpvDisparity[],
  nowISO: string,
): ScanFinding[] {
  return disparities.map((d) => ({
    id: `erp-spv-disparity-${d.invoiceKey.toLowerCase()}`,
    title: `e-Factura: Discordanță ${d.type === "erp_says_sent_spv_says_missing" ? "ERP→SPV" : "status"} pe ${d.invoiceNumber}`,
    detail: d.message,
    category: "E_FACTURA",
    severity: d.severity,
    risk: d.severity === "critical" ? "high" : "low",
    principles: ["accountability"],
    createdAtISO: nowISO,
    sourceDocument: `e-Factura ${d.series}${d.number}`,
    legalReference: "OUG 120/2021 modif. OUG 115/2023 · Cod Procedură Fiscală Art. 105",
    remediationHint:
      d.type === "erp_says_sent_spv_says_missing"
        ? "Re-transmite factura imediat din ERP. Risc amendă 15% din valoare."
        : d.type === "erp_says_valid_spv_says_rejected"
          ? "Verifică motivul respingerii în SPV, corectează XML-ul și retransmite."
          : 'Sincronizare ERP — folosește butonul "Refresh status" din integrare.',
    resolution: makeResolution(
      d.message,
      "Discordanță status afectează deductibilitatea TVA și expune la amenzi 15%.",
      "Verifică în SPV ANAF + ERP, identifică sursa de adevăr și acționează.",
      {
        humanStep: "Contabilul intră în SPV și verifică statusul real.",
        closureEvidence: "Status sincronizat ERP = SPV = valida.",
        revalidation: "Cron lunar de cross-validation rulează automat.",
      },
    ),
  }))
}
