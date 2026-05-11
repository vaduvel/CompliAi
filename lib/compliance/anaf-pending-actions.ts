// Pending-actions watcher pentru pain-uri #2 + #4 validate:
//
// #2 CUI desync 24-48h: companii noi în registru comerțului dar încă necunoscute
//     în Registrul TVA / e-Factura. CompliScan flagsuje + auto-recheck.
// #4 Cert digital recognition lag >24h după renew: certificatul SPV nou nu e
//     recunoscut imediat. Tracker cu grace period + alert auto.
//
// Pattern unic: PendingAction cu retry policy + status transitions.
// Pure functions — state e gestionat în mvp-store.

export type PendingActionType = "cui_desync" | "cert_renewal_grace"

export type PendingActionStatus = "pending" | "resolved" | "expired_unresolved"

export type PendingActionRecord = {
  id: string
  type: PendingActionType
  /** ID-ul resursei urmărite (CIF pentru CUI desync, cert fingerprint pentru cert). */
  resourceId: string
  /** Descriere human-readable. */
  description: string
  createdAtISO: string
  /** Următoarea verificare automată. */
  nextCheckAtISO: string
  /** Câte încercări au fost făcute. */
  attemptCount: number
  /** Maxim încercări înainte de marcare ca expirat. */
  maxAttempts: number
  status: PendingActionStatus
  /** Ultima eroare / motiv. */
  lastReason?: string
  resolvedAtISO?: string
}

// ── Retry policies ────────────────────────────────────────────────────────────

/**
 * CUI desync: încearcă la 6h, 12h, 24h, 48h, 72h (5 încercări). Apoi expiră.
 */
const CUI_BACKOFF_HOURS = [6, 12, 24, 48, 72]

/**
 * Cert renewal grace: verifică la 12h, 24h, 36h, 48h (4 încercări).
 * Documentația ANAF spune ~24h dar contabilii raportează până la 48h.
 */
const CERT_BACKOFF_HOURS = [12, 24, 36, 48]

function backoffForType(type: PendingActionType): number[] {
  return type === "cui_desync" ? CUI_BACKOFF_HOURS : CERT_BACKOFF_HOURS
}

function nextCheckTime(type: PendingActionType, attemptCount: number, nowISO: string): string {
  const backoff = backoffForType(type)
  const hours = backoff[Math.min(attemptCount, backoff.length - 1)]
  const next = new Date(nowISO).getTime() + hours * 3_600_000
  return new Date(next).toISOString()
}

// ── Constructors ─────────────────────────────────────────────────────────────

export function createCuiDesyncAction(args: {
  cif: string
  companyName?: string
  nowISO: string
}): PendingActionRecord {
  return {
    id: `pa-cui-${args.cif}-${Date.now().toString(36)}`,
    type: "cui_desync",
    resourceId: args.cif,
    description: `CUI ${args.cif}${args.companyName ? ` (${args.companyName})` : ""} — desync ANAF / registru comerțului. Auto-recheck la 6h.`,
    createdAtISO: args.nowISO,
    nextCheckAtISO: nextCheckTime("cui_desync", 0, args.nowISO),
    attemptCount: 0,
    maxAttempts: CUI_BACKOFF_HOURS.length,
    status: "pending",
  }
}

export function createCertRenewalGraceAction(args: {
  certFingerprint: string
  ownerEmail?: string
  nowISO: string
}): PendingActionRecord {
  return {
    id: `pa-cert-${args.certFingerprint.slice(0, 10)}-${Date.now().toString(36)}`,
    type: "cert_renewal_grace",
    resourceId: args.certFingerprint,
    description: `Certificat digital nou (${args.certFingerprint.slice(0, 10)}…)${args.ownerEmail ? ` pentru ${args.ownerEmail}` : ""} — grace ANAF până la 48h. Auto-recheck la 12h.`,
    createdAtISO: args.nowISO,
    nextCheckAtISO: nextCheckTime("cert_renewal_grace", 0, args.nowISO),
    attemptCount: 0,
    maxAttempts: CERT_BACKOFF_HOURS.length,
    status: "pending",
  }
}

// ── State transitions ────────────────────────────────────────────────────────

export type CheckResult =
  | { success: true; nowISO: string }
  | { success: false; reason: string; nowISO: string }

export function applyCheckResult(
  action: PendingActionRecord,
  result: CheckResult,
): PendingActionRecord {
  if (result.success) {
    return { ...action, status: "resolved", resolvedAtISO: result.nowISO }
  }
  const attemptCount = action.attemptCount + 1
  if (attemptCount >= action.maxAttempts) {
    return {
      ...action,
      attemptCount,
      status: "expired_unresolved",
      lastReason: result.reason,
    }
  }
  return {
    ...action,
    attemptCount,
    nextCheckAtISO: nextCheckTime(action.type, attemptCount, result.nowISO),
    lastReason: result.reason,
  }
}

export function getDueChecks(
  actions: PendingActionRecord[],
  nowISO: string,
): PendingActionRecord[] {
  const nowMs = new Date(nowISO).getTime()
  return actions.filter(
    (a) => a.status === "pending" && new Date(a.nextCheckAtISO).getTime() <= nowMs,
  )
}

export function summarize(actions: PendingActionRecord[]): {
  total: number
  pending: number
  resolved: number
  expired: number
  byType: Record<PendingActionType, number>
} {
  const byType: Record<PendingActionType, number> = {
    cui_desync: 0,
    cert_renewal_grace: 0,
  }
  let pending = 0
  let resolved = 0
  let expired = 0
  for (const a of actions) {
    byType[a.type]++
    if (a.status === "pending") pending++
    else if (a.status === "resolved") resolved++
    else expired++
  }
  return { total: actions.length, pending, resolved, expired, byType }
}
