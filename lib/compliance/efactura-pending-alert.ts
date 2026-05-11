// Alert ziua 3 lucrătoare per factură emisă neîn transmisă.
//
// Pain validat de research (#7): "Termen 5 zile lucrătoare conflict cu cycle-uri
// plată — forțează transmiterea înainte de confirmare client".
//
// Soluția: alert preventiv pe ziua 3 lucrătoare după emitere → contabilul are
// 2 zile lucrătoare să transmită ÎNAINTE de expirarea termenului legal.
//
// Pure functions. Input: lista facturi pending (cu issueDate, customerType,
// transmitted bool). Output: lista alerturi cu urgență.

export type PendingInvoiceForAlert = {
  invoiceNumber: string
  issueDateISO: string
  customerType?: "b2b" | "b2c" | "unknown"
  /** Dacă a fost transmisă cu succes în SPV. */
  transmitted: boolean
  /** Suma totală facturii — pentru prioritizare (cele mari sus). */
  totalAmount?: number
}

export type InvoiceAlert = {
  invoiceNumber: string
  issueDateISO: string
  /** Câte zile lucrătoare au trecut de la emitere. */
  workingDaysSinceIssue: number
  /** Câte zile lucrătoare au rămas până la 5 zile lucrătoare deadline. */
  workingDaysRemaining: number
  /** Termen exact ISO. */
  deadlineISO: string
  urgency: "critical" | "high" | "medium" | "info"
  customerType?: "b2b" | "b2c" | "unknown"
  totalAmount?: number
  /** Mesaj human-readable. */
  message: string
}

// Sărbători RO 2025-2027 (set fix; sync cu efactura-validator.ts)
const RO_HOLIDAYS = new Set([
  "2025-01-01", "2025-01-02", "2025-01-24", "2025-04-18", "2025-04-20", "2025-04-21",
  "2025-05-01", "2025-06-01", "2025-06-08", "2025-06-09", "2025-08-15", "2025-11-30",
  "2025-12-01", "2025-12-25", "2025-12-26",
  "2026-01-01", "2026-01-02", "2026-01-24", "2026-04-10", "2026-04-12", "2026-04-13",
  "2026-05-01", "2026-05-31", "2026-06-01", "2026-08-15", "2026-11-30",
  "2026-12-01", "2026-12-25", "2026-12-26",
])

function isWorkingDay(d: Date): boolean {
  const day = d.getUTCDay()
  if (day === 0 || day === 6) return false
  return !RO_HOLIDAYS.has(d.toISOString().slice(0, 10))
}

function countWorkingDaysBetween(startISO: string, endISO: string): number {
  const start = new Date(`${startISO.slice(0, 10)}T00:00:00.000Z`)
  const end = new Date(`${endISO.slice(0, 10)}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  if (end <= start) return 0
  let count = 0
  const cur = new Date(start)
  while (cur < end) {
    cur.setUTCDate(cur.getUTCDate() + 1)
    if (isWorkingDay(cur)) count++
  }
  return count
}

function addWorkingDays(start: Date, count: number): Date {
  const cur = new Date(start)
  let added = 0
  while (added < count) {
    cur.setUTCDate(cur.getUTCDate() + 1)
    if (isWorkingDay(cur)) added++
  }
  return cur
}

/**
 * Generează alerturi pentru facturile pending. Pragul urgenței:
 *  - critical: ≥4 zile lucrătoare după issueDate (≤1 zi rămas)
 *  - high: 3 zile lucrătoare după issueDate (2 zile rămase)
 *  - medium: 2 zile lucrătoare după issueDate
 *  - info: <2 zile lucrătoare
 *
 * Reguli legale aplicate post-2026-01-01 (OUG 89/2025): 5 zile lucrătoare
 * pentru B2B + B2C + B2G unificat.
 */
export function buildPendingInvoiceAlerts(
  invoices: PendingInvoiceForAlert[],
  nowISO: string,
): InvoiceAlert[] {
  return invoices
    .filter((inv) => !inv.transmitted)
    .map((inv) => {
      const workingDaysSinceIssue = countWorkingDaysBetween(inv.issueDateISO, nowISO)
      const workingDaysRemaining = Math.max(0, 5 - workingDaysSinceIssue)
      const deadlineDate = addWorkingDays(new Date(`${inv.issueDateISO.slice(0, 10)}T00:00:00.000Z`), 5)
      let urgency: InvoiceAlert["urgency"] = "info"
      let message = ""
      if (workingDaysSinceIssue >= 5) {
        urgency = "critical"
        message = `Factura ${inv.invoiceNumber}: termenul de 5 zile lucrătoare a EXPIRAT (emisă acum ${workingDaysSinceIssue} zile lucrătoare).`
      } else if (workingDaysSinceIssue === 4) {
        urgency = "critical"
        message = `Factura ${inv.invoiceNumber}: ULTIMA ZI LUCRĂTOARE pentru transmitere SPV (1 zi rămasă).`
      } else if (workingDaysSinceIssue === 3) {
        urgency = "high"
        message = `Factura ${inv.invoiceNumber}: ziua 3 lucrătoare — transmite în următoarele 2 zile lucrătoare.`
      } else if (workingDaysSinceIssue === 2) {
        urgency = "medium"
        message = `Factura ${inv.invoiceNumber}: 3 zile lucrătoare rămase pentru transmitere.`
      } else {
        urgency = "info"
        message = `Factura ${inv.invoiceNumber}: ${workingDaysRemaining} zile lucrătoare rămase.`
      }
      return {
        invoiceNumber: inv.invoiceNumber,
        issueDateISO: inv.issueDateISO,
        workingDaysSinceIssue,
        workingDaysRemaining,
        deadlineISO: deadlineDate.toISOString(),
        urgency,
        customerType: inv.customerType,
        totalAmount: inv.totalAmount,
        message,
      }
    })
    .sort((a, b) => {
      // Sortare: critical → high → medium → info; în interior după sumă desc
      const urgencyOrder = { critical: 0, high: 1, medium: 2, info: 3 }
      const cmp = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      if (cmp !== 0) return cmp
      return (b.totalAmount ?? 0) - (a.totalAmount ?? 0)
    })
}

export function summarizeAlerts(alerts: InvoiceAlert[]): {
  critical: number
  high: number
  medium: number
  info: number
  total: number
  totalAmountAtRisk: number
} {
  return alerts.reduce(
    (acc, a) => {
      acc[a.urgency]++
      acc.total++
      acc.totalAmountAtRisk += a.totalAmount ?? 0
      return acc
    },
    { critical: 0, high: 0, medium: 0, info: 0, total: 0, totalAmountAtRisk: 0 },
  )
}
