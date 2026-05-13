// Snapshot ONRC pentru cross-correlation R3 (AGA procent ↔ ONRC procent).
//
// ONRC RECOM real SOAP necesită subscripție plătită portaljust.ro. Pentru
// publicul larg, datele de bază (denumire, CUI, status TVA, CAEN) sunt
// disponibile FREE via ANAF API (webservicesp.anaf.ro/v9).
//
// Asociații / cota deținere apar DOAR în ONRC RECOM — utilizatorul îi
// introduce MANUAL (de pe certificat ONRC sau extras BPI). Sursa = "manual"
// față de "anaf" (auto) sau "recom-soap" (dacă cont plătit).
//
// State extension: `onrcSnapshots` ↦ per CUI, ultima fotografie + assoc list.

export type OnrcAssociate = {
  /** Tip identificator. */
  idType: "CNP" | "CUI" | "unknown"
  /** Identificator (CNP 13 cifre sau CUI). */
  id: string | null
  /** Nume / denumire. */
  name: string
  /** Cota deținere (procent 0-100). */
  ownershipPercent: number
  /** Tip asociat (asociat / actionar / asociat unic). */
  role?: string
}

export type OnrcDataSource =
  | "anaf-v9" // ANAF webservicesp.anaf.ro/v9 (free, fără asociați)
  | "recom-soap" // ONRC RECOM real (necesită subscripție)
  | "manual" // utilizator a introdus manual
  | "mixt" // ANAF + manual

export type OnrcSnapshotRecord = {
  id: string
  /** CUI normalizat (fără prefix RO). */
  cui: string
  /** Denumire firmă. */
  companyName: string | null
  /** Cod CAEN principal. */
  mainCaen: string | null
  /** Forma juridică (SRL, SA, etc.). */
  legalForm: string | null
  /** Adresa sediu social. */
  registeredAddress: string | null
  /** Status fiscal (activă/inactivă). */
  fiscalStatus: string | null
  /** Înregistrat în scopuri TVA. */
  vatRegistered: boolean
  /** Înregistrat e-Factura. */
  efacturaRegistered: boolean
  /** Înregistrare J (J40/1234/2020). */
  registrationNumber: string | null
  /** Asociați (cu cote). */
  associates: OnrcAssociate[]
  /** Cota majoritară (pentru detection control). */
  majorityOwner: OnrcAssociate | null
  /** Suma totală deținere — pentru sanity check (~ 100%). */
  totalOwnershipPercent: number
  /** Surse folosite la construire. */
  sources: OnrcDataSource[]
  /** Data ultimei fetch ANAF. */
  anafFetchedAtISO: string | null
  /** Data ultimei confirmări manuale asociați. */
  associatesConfirmedAtISO: string | null
  /** Indicator: snapshot complet (are asociați și ownership ~ 100%). */
  isComplete: boolean
  parsedAtISO: string
  errors: string[]
  warnings: string[]
}

export type StateWithOnrcSnapshots = {
  onrcSnapshots?: OnrcSnapshotRecord[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MAX_SNAPSHOTS = 100

/** Normalizează CUI: elimină prefix RO și whitespace. */
export function normalizeCui(raw: string): string {
  return raw.replace(/\s+/g, "").trim().toUpperCase().replace(/^RO/, "")
}

/**
 * Validează un CUI românesc: 2-10 cifre, optional RO prefix.
 */
export function isValidCui(raw: string): boolean {
  const n = normalizeCui(raw)
  return /^\d{2,10}$/.test(n)
}

/**
 * Calculează totalOwnership + majoritar + isComplete.
 */
export function computeSnapshotDerived(
  record: Omit<OnrcSnapshotRecord, "totalOwnershipPercent" | "majorityOwner" | "isComplete">,
): OnrcSnapshotRecord {
  const total = record.associates.reduce((s, a) => s + (a.ownershipPercent ?? 0), 0)
  let majorityOwner: OnrcAssociate | null = null
  for (const a of record.associates) {
    if (a.ownershipPercent > 50 && (!majorityOwner || a.ownershipPercent > majorityOwner.ownershipPercent)) {
      majorityOwner = a
    }
  }
  // Asociat unic = 100%
  if (!majorityOwner && record.associates.length === 1 && record.associates[0]!.ownershipPercent >= 99) {
    majorityOwner = record.associates[0]!
  }
  const isComplete =
    record.associates.length > 0 && Math.abs(total - 100) < 2
  return {
    ...record,
    totalOwnershipPercent: total,
    majorityOwner,
    isComplete,
  }
}

/**
 * Append idempotent pe CUI. Înlocuiește snapshot anterior pentru același CUI.
 */
export function upsertOnrcSnapshot(
  existing: OnrcSnapshotRecord[],
  record: OnrcSnapshotRecord,
): OnrcSnapshotRecord[] {
  const filtered = existing.filter((r) => r.cui !== record.cui)
  const next = [...filtered, record]
  if (next.length <= MAX_SNAPSHOTS) return next
  const sorted = next.sort((a, b) => b.parsedAtISO.localeCompare(a.parsedAtISO))
  return sorted.slice(0, MAX_SNAPSHOTS)
}

/** Găsește snapshot pentru un CUI dat. */
export function findOnrcSnapshot(
  records: OnrcSnapshotRecord[],
  cui: string,
): OnrcSnapshotRecord | null {
  const normalized = normalizeCui(cui)
  return records.find((r) => r.cui === normalized) ?? null
}

/** Sumar pentru dashboard. */
export function summarizeOnrcSnapshots(records: OnrcSnapshotRecord[]): {
  total: number
  complete: number
  withRecomSoap: number
  outdatedAnaf: number // ANAF mai vechi de 90 zile
} {
  const now = Date.now()
  const NINETY_DAYS = 90 * 24 * 3_600 * 1000
  let complete = 0
  let withRecomSoap = 0
  let outdatedAnaf = 0
  for (const r of records) {
    if (r.isComplete) complete++
    if (r.sources.includes("recom-soap")) withRecomSoap++
    if (r.anafFetchedAtISO) {
      const age = now - new Date(r.anafFetchedAtISO).getTime()
      if (age > NINETY_DAYS) outdatedAnaf++
    }
  }
  return { total: records.length, complete, withRecomSoap, outdatedAnaf }
}
