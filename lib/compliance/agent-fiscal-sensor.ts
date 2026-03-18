// V6 — Fiscal Sensor Agent
// Monitorizare e-Factura: detectare automată facturi respinse,
// clasificare motiv, escalare inteligentă, vendor flagging.
// Extinde e-Factura Risk Signal V3 cu acțiuni agentice.

import type { ComplianceState } from "@/lib/compliance/types"
import {
  type EFacturaInvoiceSignal,
  buildEFacturaRiskFindings,
} from "@/lib/compliance/efactura-risk"
import {
  generateRunId,
  type AgentAction,
  type AgentOutput,
} from "@/lib/compliance/agentic-engine"

// ── Types ────────────────────────────────────────────────────────────────────

export type FiscalSensorInput = {
  orgId: string
  state: ComplianceState
  signals: EFacturaInvoiceSignal[]
  nowISO: string
}

type RejectionCategory = "cui-invalid" | "xml-structure" | "deadline-exceeded" | "other"

// ── Classification logic ─────────────────────────────────────────────────────

function classifyRejection(signal: EFacturaInvoiceSignal): RejectionCategory {
  const reason = (signal.reason ?? "").toLowerCase()
  if (reason.includes("cui") || reason.includes("cod") || reason.includes("tva") || reason.includes("cif")) {
    return "cui-invalid"
  }
  if (reason.includes("xml") || reason.includes("ubl") || reason.includes("structur")) {
    return "xml-structure"
  }
  if (reason.includes("termen") || reason.includes("depăș") || reason.includes("întârzi")) {
    return "deadline-exceeded"
  }
  return "other"
}

const CATEGORY_LABELS: Record<RejectionCategory, string> = {
  "cui-invalid": "CUI/Cod TVA invalid",
  "xml-structure": "Eroare structură XML/UBL",
  "deadline-exceeded": "Termen depășit",
  other: "Altul",
}

const CATEGORY_FIX: Record<RejectionCategory, string> = {
  "cui-invalid": "Verifică și corectează CUI-ul furnizorului în softul de facturare, apoi retrimite factura.",
  "xml-structure": "Verifică structura UBL a facturii. Folosește validatorul CompliScan pentru diagnosticul exact.",
  "deadline-exceeded": "Termenul de depunere a fost depășit. Contactează contabilul pentru opțiuni de regularizare.",
  other: "Verifică mesajul ANAF și consultă contabilul pentru acțiunea corectă.",
}

// ── Agent logic ──────────────────────────────────────────────────────────────

export function runFiscalSensor(input: FiscalSensorInput): AgentOutput {
  const runId = generateRunId("fiscal_sensor")
  const startedAtISO = new Date().toISOString()
  const actions: AgentAction[] = []
  let itemsScanned = 0
  let issuesFound = 0

  const rejected = input.signals.filter((s) => s.status === "rejected")
  const xmlErrors = input.signals.filter((s) => s.status === "xml-error")
  const delayed = input.signals.filter((s) => s.status === "processing-delayed")
  const unsubmitted = input.signals.filter((s) => s.status === "unsubmitted")

  itemsScanned = input.signals.length

  // 1. Process rejected invoices — highest priority
  for (const signal of rejected) {
    issuesFound++
    const category = classifyRejection(signal)
    actions.push({
      type: "finding_created",
      description: `Factură respinsă: ${signal.invoiceNumber ?? signal.vendorName} — ${CATEGORY_LABELS[category]}. ${CATEGORY_FIX[category]}`,
      targetId: `efactura-risk-${signal.id}`,
      approvalLevel: 1,
      autoApplied: true,
    })

    // Tech vendor flagging — DPA/NIS2 signal
    if (signal.isTechVendor) {
      actions.push({
        type: "vendor_rescored",
        description: `Furnizor tech "${signal.vendorName}" cu factură respinsă — verifică DPA și contract NIS2.`,
        targetId: signal.id,
        approvalLevel: 1,
        autoApplied: true,
      })
    }
  }

  // 2. Process XML errors
  for (const signal of xmlErrors) {
    issuesFound++
    actions.push({
      type: "finding_created",
      description: `Eroare XML/UBL: ${signal.invoiceNumber ?? signal.vendorName} — ${signal.reason ?? "structură invalidă"}. Validează cu CIUS-RO.`,
      targetId: `efactura-risk-${signal.id}`,
      approvalLevel: 1,
      autoApplied: true,
    })
  }

  // 3. Processing delayed (>48h)
  for (const signal of delayed) {
    issuesFound++
    actions.push({
      type: "alert_created",
      description: `Factură în prelucrare >48h: ${signal.invoiceNumber ?? signal.vendorName}. Monitorizează status SPV.`,
      targetId: `efactura-risk-${signal.id}`,
      approvalLevel: 1,
      autoApplied: true,
    })
  }

  // 4. Unsubmitted invoices
  for (const signal of unsubmitted) {
    issuesFound++
    actions.push({
      type: "alert_created",
      description: `Factură generată dar netransmisă: ${signal.invoiceNumber ?? signal.vendorName}. Trimite către SPV ANAF.`,
      targetId: `efactura-risk-${signal.id}`,
      approvalLevel: 1,
      autoApplied: true,
    })
  }

  // 5. Escalation: 3+ rejected in same week = critical alert
  if (rejected.length >= 3) {
    actions.push({
      type: "escalation_raised",
      description: `Escalare: ${rejected.length} facturi respinse detectate. Posibilă problemă sistemică — verifică configurarea facturării.`,
      approvalLevel: 1,
      autoApplied: true,
    })
    actions.push({
      type: "notification_sent",
      description: `Alertă critică: ${rejected.length} facturi respinse. Notificare trimisă contabilului și administratorului.`,
      approvalLevel: 1,
      autoApplied: true,
    })
  }

  // 6. Generate findings for central board
  const generatedFindings = buildEFacturaRiskFindings(input.signals, input.nowISO)

  // 7. Weekly summary reasoning
  const totalAmount = rejected.reduce((sum, s) => sum + (s.amount ?? 0), 0)
  const reasoning = buildReasoning(input.signals.length, rejected.length, xmlErrors.length, delayed.length, unsubmitted.length, totalAmount)

  return {
    agentType: "fiscal_sensor",
    runId,
    status: "completed",
    actions,
    confidence: rejected.length === 0 && xmlErrors.length === 0 ? 0.95 : 0.8,
    reasoning,
    startedAtISO,
    completedAtISO: new Date().toISOString(),
    metrics: {
      itemsScanned,
      issuesFound,
      actionsAutoApplied: actions.filter((a) => a.autoApplied).length,
      actionsPendingApproval: actions.filter((a) => !a.autoApplied).length,
    },
  }
}

function buildReasoning(
  total: number,
  rejected: number,
  xmlErrors: number,
  delayed: number,
  unsubmitted: number,
  totalAmount: number,
): string {
  if (total === 0) return "Niciun semnal e-Factura detectat. Monitorizare activă."

  const parts: string[] = [`Scanat ${total} semnale e-Factura.`]

  if (rejected > 0) {
    parts.push(`${rejected} facturi respinse${totalAmount > 0 ? ` (valoare totală: ${totalAmount.toLocaleString("ro-RO")} RON)` : ""}.`)
  }
  if (xmlErrors > 0) parts.push(`${xmlErrors} erori XML/UBL.`)
  if (delayed > 0) parts.push(`${delayed} facturi în prelucrare >48h.`)
  if (unsubmitted > 0) parts.push(`${unsubmitted} facturi netransmise.`)

  if (rejected === 0 && xmlErrors === 0) {
    parts.push("Nicio problemă critică. Monitorizare continuă.")
  }

  return parts.join(" ")
}
