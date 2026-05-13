// Smart Pattern Engine V1 — memorie de fix-uri + detector recurrent + suggester.
//
// Filosofia: aplicația învață ce fix-uri au funcționat pentru fiecare combinație
// (org, finding type, client CUI, error code). Când o problemă se repetă de ≥3
// ori în 30 zile, marcăm pattern recurrent + sugerăm fix-ul anterior care a mers.
//
// Cazuri de uz reale:
// - Aceeași factură către SC PARTENER SRL respinsă în 3 luni consecutive cu
//   "CUI invalid" → recurring. Sugerăm fix-ul "anaf_vat_lookup_update".
// - D406 SAF-T cu rectificări repetate pe același client → recurring. Sugerăm
//   "saft_account_structure_check".
// - PFA Form 082 cu erori repetate la submit → recurring. Sugerăm template-ul
//   anterior.
//
// Pure functions — pot rula client-side sau server-side. State e gestionat
// în state.fixPatternMemory[] (mvp-store).

// ── Types ────────────────────────────────────────────────────────────────────

/** O înregistrare în memoria de fix-uri — un fix aplicat pe un finding. */
export type FixPatternRecord = {
  /** ID unic (UUID-like). */
  id: string
  /** Org-ul care a aplicat fix-ul. */
  orgId: string
  /** Tip finding canonic (EF-003, EF-005, FREQUENCY-MISMATCH, etc.). */
  findingTypeId: string
  /** Categorie (E_FACTURA, GDPR, etc.). */
  category: string
  /** CIF client (cabinet) sau "self" pentru solo user — pentru pattern cross-client. */
  clientCif: string
  /** Cod eroare ANAF / detector intern (opțional, pentru pattern fin). */
  errorCode?: string
  /** Tip de fix aplicat — vine din evidenceType din cockpit. */
  fixApplied: string
  /** Etichetă human-readable a fix-ului. */
  fixLabel: string
  /** True dacă fix-ul a fost confirmat ca succes (finding resolved). */
  success: boolean
  /** Când s-a aplicat. */
  appliedAtISO: string
  /** ID-ul finding-ului pe care s-a aplicat (pentru audit trail). */
  findingId: string
  /** Note opționale — partener problematic, sumă, perioadă, etc. */
  context?: Record<string, string>
}

/** Pattern detectat = aceeași combinație (findingType, clientCif, errorCode) apare ≥ threshold. */
export type RecurringPattern = {
  /** Cheia compusă — folosită ca ID în UI. */
  patternKey: string
  findingTypeId: string
  clientCif: string
  errorCode?: string
  /** Câte ori a apărut în fereastra de timp. */
  occurrenceCount: number
  /** Fereastra în zile (default 30). */
  windowDays: number
  /** Data primei apariții în fereastră. */
  firstSeenISO: string
  /** Data ultimei apariții. */
  lastSeenISO: string
  /** Fix-ul anterior care a avut succes (preselect în UI). Null dacă niciun fix de succes. */
  suggestedFix: FixPatternRecord | null
  /** Toate fix-urile aplicate pe această cheie (cele succes + cele eșuate). */
  history: FixPatternRecord[]
  /** Severitate inferată — escalează cu numărul de apariții. */
  severity: "low" | "medium" | "high" | "critical"
}

/** Threshold pentru a marca un pattern recurrent. */
const RECURRENCE_THRESHOLD = 3
/** Fereastra de detecție implicită. */
const DEFAULT_WINDOW_DAYS = 30

// ── Recorder — adaugă un fix la memorie ──────────────────────────────────────

/**
 * Creează un FixPatternRecord nou. Caller-ul (server-side) este responsabil
 * de a-l adăuga în state.fixPatternMemory[].
 */
export function buildFixPatternRecord(input: {
  orgId: string
  finding: {
    id: string
    findingTypeId?: string
    category: string
  }
  clientCif: string
  fixApplied: string
  fixLabel: string
  success: boolean
  nowISO: string
  errorCode?: string
  context?: Record<string, string>
}): FixPatternRecord {
  return {
    id: `fix-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    orgId: input.orgId,
    findingTypeId: input.finding.findingTypeId ?? "UNKNOWN",
    category: input.finding.category,
    clientCif: input.clientCif,
    errorCode: input.errorCode,
    fixApplied: input.fixApplied,
    fixLabel: input.fixLabel,
    success: input.success,
    appliedAtISO: input.nowISO,
    findingId: input.finding.id,
    context: input.context,
  }
}

// ── Detector — caută pattern-uri recurrente ──────────────────────────────────

/**
 * Cheie compusă pentru gruparea fix-urilor. Definește ce înseamnă "aceeași
 * problemă recurentă". Includem `errorCode` pentru pattern fin.
 */
function patternKey(record: FixPatternRecord): string {
  return [record.findingTypeId, record.clientCif, record.errorCode ?? "any"].join("|")
}

/**
 * Detector main: găsește pattern-uri unde aceeași combinație (findingType,
 * clientCif, errorCode) apare ≥ threshold în fereastra dată.
 */
export function detectRecurringPatterns(
  records: FixPatternRecord[],
  nowISO: string,
  opts: { windowDays?: number; threshold?: number } = {},
): RecurringPattern[] {
  const windowDays = opts.windowDays ?? DEFAULT_WINDOW_DAYS
  const threshold = opts.threshold ?? RECURRENCE_THRESHOLD
  const cutoffMs = new Date(nowISO).getTime() - windowDays * 86_400_000

  // Filtrăm doar înregistrările din fereastră
  const inWindow = records.filter(
    (r) => new Date(r.appliedAtISO).getTime() >= cutoffMs,
  )

  // Grupăm pe patternKey
  const groups = new Map<string, FixPatternRecord[]>()
  for (const record of inWindow) {
    const key = patternKey(record)
    const list = groups.get(key) ?? []
    list.push(record)
    groups.set(key, list)
  }

  const patterns: RecurringPattern[] = []

  for (const [key, history] of groups.entries()) {
    if (history.length < threshold) continue

    // Sortăm cronologic
    const sorted = [...history].sort((a, b) =>
      a.appliedAtISO.localeCompare(b.appliedAtISO),
    )

    const first = sorted[0]!
    const last = sorted[sorted.length - 1]!
    const occurrenceCount = history.length

    // Suggester: cel mai recent fix DE SUCCES
    const suggested =
      [...sorted].reverse().find((r) => r.success) ?? null

    // Severitate inferată din count
    const severity: RecurringPattern["severity"] =
      occurrenceCount >= 8
        ? "critical"
        : occurrenceCount >= 5
          ? "high"
          : occurrenceCount >= 4
            ? "medium"
            : "low"

    patterns.push({
      patternKey: key,
      findingTypeId: first.findingTypeId,
      clientCif: first.clientCif,
      errorCode: first.errorCode,
      occurrenceCount,
      windowDays,
      firstSeenISO: first.appliedAtISO,
      lastSeenISO: last.appliedAtISO,
      suggestedFix: suggested,
      history: sorted,
      severity,
    })
  }

  // Sortăm descrescător după occurrenceCount (cele mai problematice primele)
  patterns.sort((a, b) => b.occurrenceCount - a.occurrenceCount)

  return patterns
}

// ── Suggester per finding nou — recomandare fix pe baza istoricului ──────────

/**
 * Pentru un finding nou (înainte de a-l rezolva), caută în memorie fix-uri
 * anterioare care au funcționat pentru aceeași cheie. Returnează cel mai
 * recent fix de succes, sau null dacă nu există.
 */
export function suggestFixForFinding(
  records: FixPatternRecord[],
  input: {
    findingTypeId: string
    clientCif: string
    errorCode?: string
  },
): FixPatternRecord | null {
  const targetKey = patternKey({
    findingTypeId: input.findingTypeId,
    clientCif: input.clientCif,
    errorCode: input.errorCode,
  } as FixPatternRecord)

  const matches = records.filter(
    (r) => patternKey(r) === targetKey && r.success,
  )
  if (matches.length === 0) return null

  // Sortăm descrescător cronologic, returnăm cel mai recent
  matches.sort((a, b) => b.appliedAtISO.localeCompare(a.appliedAtISO))
  return matches[0] ?? null
}

// ── Summary pentru dashboard ─────────────────────────────────────────────────

export type PatternMemorySummary = {
  totalFixesApplied: number
  totalSuccessful: number
  successRate: number // 0..1
  recurringPatternsCount: number
  topRecurringClients: Array<{ clientCif: string; count: number }>
}

export function computePatternMemorySummary(
  records: FixPatternRecord[],
  patterns: RecurringPattern[],
): PatternMemorySummary {
  const total = records.length
  const successful = records.filter((r) => r.success).length
  const successRate = total > 0 ? successful / total : 0

  // Top clienți cu probleme recurrente
  const byClient = new Map<string, number>()
  for (const pattern of patterns) {
    byClient.set(
      pattern.clientCif,
      (byClient.get(pattern.clientCif) ?? 0) + pattern.occurrenceCount,
    )
  }
  const topRecurringClients = Array.from(byClient.entries())
    .map(([clientCif, count]) => ({ clientCif, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalFixesApplied: total,
    totalSuccessful: successful,
    successRate,
    recurringPatternsCount: patterns.length,
    topRecurringClients,
  }
}

// ── Idempotent merge ─────────────────────────────────────────────────────────

/**
 * Adaugă un record nou la memorie. Idempotent — dacă un record cu același
 * (findingId, fixApplied) există deja, nu duplicăm.
 */
export function appendFixPatternRecord(
  existing: FixPatternRecord[],
  record: FixPatternRecord,
): FixPatternRecord[] {
  const duplicate = existing.find(
    (r) => r.findingId === record.findingId && r.fixApplied === record.fixApplied,
  )
  if (duplicate) return existing
  return [...existing, record]
}

// ── Cap memorie pentru a evita state bloat ───────────────────────────────────

/**
 * Păstrăm doar ultimele N records — celelalte se șterg. Detectorul de
 * recurență oricum lucrează pe fereastra de 30 zile, deci păstrarea pe 90 zile
 * e suficientă.
 */
export function pruneFixPatternMemory(
  records: FixPatternRecord[],
  nowISO: string,
  retentionDays: number = 90,
): FixPatternRecord[] {
  const cutoffMs = new Date(nowISO).getTime() - retentionDays * 86_400_000
  return records.filter(
    (r) => new Date(r.appliedAtISO).getTime() >= cutoffMs,
  )
}
