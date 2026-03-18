// ANAF Signals Phase D — D1: Fiscal Sensor Agent Rail
// Pure functions that process e-Factura signals into agent actions.
// Input: rejected/pending invoices, vendor rejection history.
// Output: rescoring, reopen findings, work item suggestions, partner alerts.
// No dependency on V6 agent types — standalone module.

import type { ScanFinding } from "@/lib/compliance/types"
import type { EFacturaInvoiceSignal } from "@/lib/compliance/efactura-risk"
import {
  computeBatchUrgency,
  buildVendorRejectionHistory,
  detectPendingTooLong,
  type SignalUrgency,
  type VendorRejectionRecord,
  type PendingTooLongResult,
} from "@/lib/compliance/efactura-signal-hardening"

// ── Types ────────────────────────────────────────────────────────────────────

export type FiscalSensorAction =
  | { type: "rescore_signal"; signalId: string; newUrgency: SignalUrgency; reason: string }
  | { type: "reopen_finding"; findingId: string; reason: string }
  | { type: "work_item"; title: string; description: string; priority: "critical" | "high" | "medium"; ownerId?: string }
  | { type: "partner_alert"; orgId: string; message: string; severity: "critical" | "high" | "medium" }

export type FiscalSensorOutput = {
  actions: FiscalSensorAction[]
  rescored: number
  reopened: number
  workItems: number
  partnerAlerts: number
  summary: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const REPEATED_REJECTION_ALERT_THRESHOLD = 3
const URGENCY_RESCORE_THRESHOLD = 70 // signals above this get re-examined

// ── Core logic ───────────────────────────────────────────────────────────────

/**
 * Run Fiscal Sensor agent rail logic.
 * Takes raw e-Factura signals and produces structured actions.
 */
export function runFiscalSensorRail(input: {
  signals: EFacturaInvoiceSignal[]
  resolvedFindingIds: string[]
  orgId: string
  nowISO: string
}): FiscalSensorOutput {
  const { signals, resolvedFindingIds, orgId, nowISO } = input
  const actions: FiscalSensorAction[] = []

  if (signals.length === 0) {
    return { actions: [], rescored: 0, reopened: 0, workItems: 0, partnerAlerts: 0, summary: "Niciun semnal e-Factura." }
  }

  // 1. Urgency rescoring — batch compute and flag high-urgency signals
  const urgencies = computeBatchUrgency(signals, nowISO)
  const highUrgency = urgencies.filter((u) => u.score >= URGENCY_RESCORE_THRESHOLD)

  for (const urg of highUrgency) {
    actions.push({
      type: "rescore_signal",
      signalId: urg.signalId,
      newUrgency: urg,
      reason: `Urgență ${urg.label} (scor ${urg.score}): ${urg.reasons.join(", ")}`,
    })
  }

  // 2. Reopen findings — signals still active but finding resolved
  for (const signal of signals) {
    const findingId = `efactura-risk-${signal.id}`
    if (!resolvedFindingIds.includes(findingId)) continue

    if (signal.status === "rejected" || signal.status === "xml-error" || signal.status === "processing-delayed") {
      actions.push({
        type: "reopen_finding",
        findingId,
        reason: `Semnalul e-Factura "${signal.invoiceNumber ?? signal.id}" încă activ (${signal.status}). Finding-ul nu poate fi închis.`,
      })
    }
  }

  // 3. Vendor repeated rejection → work items
  const vendorHistory = buildVendorRejectionHistory(signals)
  const criticalVendors = vendorHistory.filter(
    (v) => v.rejectionCount >= REPEATED_REJECTION_ALERT_THRESHOLD,
  )

  for (const vendor of criticalVendors) {
    actions.push({
      type: "work_item",
      title: `Vendor cu respingeri repetate: ${vendor.vendorName}`,
      description: `${vendor.vendorName} are ${vendor.rejectionCount} facturi respinse. Verifică integrarea e-Factura și contactează vendorul.`,
      priority: vendor.rejectionCount >= 5 ? "critical" : "high",
    })
  }

  // 4. Pending too long → work items
  const pendingLong = detectPendingTooLong(signals, nowISO)
  for (const pending of pendingLong) {
    actions.push({
      type: "work_item",
      title: `Factură blocată >48h: ${pending.vendorName}`,
      description: `Factura de la ${pending.vendorName} este în procesare de ${pending.pendingDays} zile. Verifică statusul pe SPV ANAF.`,
      priority: pending.pendingDays > 5 ? "critical" : "high",
    })
  }

  // 5. Partner alerts for critical situations
  if (criticalVendors.length > 0 || highUrgency.length >= 3) {
    actions.push({
      type: "partner_alert",
      orgId,
      message: `Atenție: ${highUrgency.length} semnale e-Factura cu urgență ridicată, ${criticalVendors.length} vendori cu respingeri repetate.`,
      severity: criticalVendors.length > 0 ? "critical" : "high",
    })
  }

  const rescored = actions.filter((a) => a.type === "rescore_signal").length
  const reopened = actions.filter((a) => a.type === "reopen_finding").length
  const workItems = actions.filter((a) => a.type === "work_item").length
  const partnerAlerts = actions.filter((a) => a.type === "partner_alert").length

  return {
    actions,
    rescored,
    reopened,
    workItems,
    partnerAlerts,
    summary: `Fiscal Sensor: ${rescored} rescorat, ${reopened} redeschise, ${workItems} work items, ${partnerAlerts} alerte partener.`,
  }
}
