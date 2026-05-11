// F#4 — Certificate SPV manager.
//
// Pain validat (forum SAGA + SmartBill help + factureaza.ro): cabinetele
// gestionează zeci de certificate digitale calificate per client. La reînnoire,
// SPV ANAF returnează "Utilizator neautorizat" timp de 10-17 zile, blocând
// transmiterea facturilor.
//
// Sursa de adevăr: per client (CIF), cabinetul stochează metadata certificatului
// (serie, fingerprint, owner email, data expirare, data ultimei reînrolări în
// SPV). Cron `cert-spv-expiry-watcher` rulează zilnic și emite reminders + dacă
// detectează "Utilizator neautorizat" la o factură recentă, sugerează re-auth.
//
// LEGAL: NU stocăm cheia privată. Doar metadata publică (fingerprint hash).
// Reînnoirea se face prin SPV ANAF (manual de contabil) — noi doar tracking +
// reminders.

// Inline RO holidays + isWorkingDay (sync cu efactura-validator/efactura-pending-alert)
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

export type CertSpvStatus =
  | "active"            // valid, înrolat în SPV, fără probleme
  | "expiring_soon"      // ≤30 zile până la expirare
  | "expiring_critical"  // ≤7 zile
  | "expired"            // după data de expirare
  | "renewed_pending"    // reînnoit dar nu confirmat de ANAF SPV (grace period)
  | "unauthorized"       // detectat eroare "utilizator neautorizat" la SPV
  | "unknown"            // metadata insuficientă

export type CertSpvRecord = {
  id: string
  /** Per client al cabinetului (CIF). */
  clientCif: string
  clientName: string
  /** Numărul de serie sau primele 12 hex din fingerprint (NU cheia privată). */
  certSerial: string
  /** Numele titularului (cf. CN în certificat). */
  ownerName: string
  /** Email titular pentru notificări. */
  ownerEmail?: string
  /** Furnizor cert (CertSign, DigiSign, TransSped, Alfasign, AlfaTrust, etc.). */
  provider?: string
  /** Data validitate de la (ISO). */
  validFromISO: string
  /** Data expirare (ISO). */
  validUntilISO: string
  /** Data ultimei reînrolări în SPV (ISO). null dacă niciodată. */
  lastSpvEnrollmentISO?: string
  /** Data ultimei verificări dacă SPV-ul recunoaște certul (HTTP 200 sau "Utilizator neautorizat"). */
  lastSpvVerifiedISO?: string
  /** Răspuns ultima verificare. */
  lastSpvVerifiedOk?: boolean
  status: CertSpvStatus
  notes?: string
  createdAtISO: string
  updatedAtISO: string
}

export type CertSpvSnapshot = {
  total: number
  active: number
  expiringSoon: number
  expiringCritical: number
  expired: number
  unauthorized: number
  renewedPending: number
  atRiskRecords: CertSpvRecord[]
}

// ── Pure functions ────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000

export function daysUntilExpiry(validUntilISO: string, nowISO: string): number {
  const now = new Date(nowISO).getTime()
  const expiry = new Date(validUntilISO).getTime()
  return Math.ceil((expiry - now) / MS_PER_DAY)
}

export function computeStatus(record: Omit<CertSpvRecord, "status">, nowISO: string): CertSpvStatus {
  const days = daysUntilExpiry(record.validUntilISO, nowISO)
  if (days < 0) return "expired"

  // Dacă a fost reînnoit recent (≤14 zile) dar SPV n-a confirmat încă (sau
  // ultima verificare a eșuat), e în grace period.
  if (record.lastSpvEnrollmentISO) {
    const enrollAge = Math.floor(
      (new Date(nowISO).getTime() - new Date(record.lastSpvEnrollmentISO).getTime()) / MS_PER_DAY,
    )
    if (enrollAge <= 14 && record.lastSpvVerifiedOk === false) {
      return "renewed_pending"
    }
  }

  if (record.lastSpvVerifiedOk === false) return "unauthorized"
  if (days <= 7) return "expiring_critical"
  if (days <= 30) return "expiring_soon"
  return "active"
}

export function recomputeStatus(record: CertSpvRecord, nowISO: string): CertSpvRecord {
  return {
    ...record,
    status: computeStatus(record, nowISO),
    updatedAtISO: nowISO,
  }
}

export function buildSnapshot(records: CertSpvRecord[]): CertSpvSnapshot {
  const counts = records.reduce(
    (acc, r) => {
      switch (r.status) {
        case "active":
          acc.active++
          break
        case "expiring_soon":
          acc.expiringSoon++
          break
        case "expiring_critical":
          acc.expiringCritical++
          break
        case "expired":
          acc.expired++
          break
        case "unauthorized":
          acc.unauthorized++
          break
        case "renewed_pending":
          acc.renewedPending++
          break
        case "unknown":
          break
      }
      return acc
    },
    { active: 0, expiringSoon: 0, expiringCritical: 0, expired: 0, unauthorized: 0, renewedPending: 0 },
  )

  const atRiskRecords = records
    .filter(
      (r) =>
        r.status === "expiring_critical" ||
        r.status === "expired" ||
        r.status === "unauthorized" ||
        r.status === "renewed_pending" ||
        r.status === "expiring_soon",
    )
    .sort((a, b) => {
      // Cele expirate sau unauthorized PRIMUL
      const order: Record<CertSpvStatus, number> = {
        expired: 0,
        unauthorized: 1,
        expiring_critical: 2,
        renewed_pending: 3,
        expiring_soon: 4,
        active: 5,
        unknown: 6,
      }
      return order[a.status] - order[b.status]
    })

  return {
    total: records.length,
    ...counts,
    atRiskRecords,
  }
}

// ── State helpers (pentru integrare cu mvp-store) ────────────────────────────

export function upsertCertRecord(
  existing: CertSpvRecord[],
  record: CertSpvRecord,
): CertSpvRecord[] {
  const idx = existing.findIndex((r) => r.id === record.id)
  if (idx === -1) return [...existing, record]
  const next = [...existing]
  next[idx] = record
  return next
}

export function deleteCertRecord(existing: CertSpvRecord[], id: string): CertSpvRecord[] {
  return existing.filter((r) => r.id !== id)
}

// ── Trigger zile pentru alert email ──────────────────────────────────────────

/**
 * Zile înainte de expirare la care se trimite email reminder.
 * 30 zile = primul ping, apoi 14, 7, 3, 1 (escalation).
 * Plus ziua 0 = day-of expiry.
 */
export const ALERT_TRIGGER_DAYS = [30, 14, 7, 3, 1, 0] as const

export function shouldSendAlert(daysUntil: number): boolean {
  return ALERT_TRIGGER_DAYS.includes(daysUntil as (typeof ALERT_TRIGGER_DAYS)[number])
}

/**
 * Calcul "următoarea zi lucrătoare de alert" — folosit ca să planificăm cron-ul
 * să trimită doar în zile lucrătoare (nu sâmbătă/duminică/sărbători).
 */
export function isAlertableToday(nowISO: string): boolean {
  return isWorkingDay(new Date(nowISO))
}
