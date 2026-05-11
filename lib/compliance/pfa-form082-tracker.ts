// PFA / CNP Form 082 tracker — obligație din OG 6/2026 + Ordin ANAF 378/2026.
//
// Context legal:
//   - OG 6/2026: PFA și persoane fizice identificate fiscal prin CNP au
//     obligația e-Factura din **1 iunie 2026** (postpus de la 1 ian 2026).
//   - Ordin ANAF 378/2026 (M.Of. 250 / 31 mar 2026): actualizează Formular
//     082 ("Cerere de înregistrare în Registrul RO e-Factura").
//   - **Deadline registrare: 26 mai 2026** (cu 5 zile lucrătoare înainte de
//     activarea obligației).
//
// Pain real pentru cabinete fiscale:
//   - Cabinetele cu portofoliu de clienți PFA habar n-au că trebuie să
//     verifice fiecare client + să depună Form 082 până la 26 mai 2026.
//   - Fără registrare → VAT non-deductibility + amenzi pentru e-Factura
//     netransmisă (PFA-ul nu poate emite legal după 1 iun 2026 fără registrare).
//
// Cei 8 pași workflow per client PFA:
//   1. Identifică PFA-uri din portofoliu (intake/manual)
//   2. Verifică status în Registrul RO e-Factura (manual prin SPV / automat dacă avem API)
//   3. Marchează status: not_registered | registered | unknown
//   4. Pentru not_registered: pregătește Form 082 (online prin SPV cu certificat digital)
//   5. Depune + obține confirmare
//   6. Salvează confirmare ca dovadă audit
//   7. Cron alertă: 14 / 7 / 3 / 1 zile înainte de 26 mai 2026
//   8. Status final: registered ÎNAINTE de 26 mai 2026 = OK

export const PFA_FORM082_DEADLINE_ISO = "2026-05-26T23:59:59.000Z"
export const PFA_EFACTURA_OBLIGATION_START_ISO = "2026-06-01T00:00:00.000Z"

export type PfaRegistrationStatus =
  | "not_registered"   // necesită Form 082
  | "form_submitted"    // depus, în așteptare confirmare ANAF
  | "registered"        // confirmat în Registrul RO e-Factura
  | "exempt"            // exempt (ex: regim agricol special — OUG 52/2025)
  | "unknown"           // nu am verificat încă

export type PfaClientRecord = {
  id: string
  /** CNP sau CIF de identificare fiscală */
  taxId: string
  /** Nume client */
  name: string
  /** Status curent registrare */
  status: PfaRegistrationStatus
  /** Data depunere Form 082 dacă există */
  form082SubmittedAtISO?: string
  /** Data confirmare ANAF dacă există */
  confirmationAtISO?: string
  /** Note interne contabil */
  notes?: string
  /** Adăugat în portofoliu */
  createdAtISO: string
  /** Ultima actualizare status */
  updatedAtISO: string
}

export type PfaTrackerSnapshot = {
  totalClients: number
  registered: number
  formSubmitted: number
  notRegistered: number
  exempt: number
  unknown: number
  /** Zile rămase până la deadline (poate fi negativ după 26 mai 2026) */
  daysUntilDeadline: number
  /** Severity bazat pe % registrare + zile rămase */
  urgency: "critical" | "high" | "medium" | "low" | "passed"
  /** Lista clienți cu probleme (not_registered + form_submitted după 26 mai) */
  atRiskClients: PfaClientRecord[]
}

// ── Pure functions ────────────────────────────────────────────────────────────

export function computeDaysUntilDeadline(nowISO: string): number {
  const now = new Date(nowISO).getTime()
  const deadline = new Date(PFA_FORM082_DEADLINE_ISO).getTime()
  return Math.ceil((deadline - now) / 86_400_000)
}

export function computeUrgency(
  daysUntilDeadline: number,
  notRegisteredCount: number,
  totalCount: number,
): PfaTrackerSnapshot["urgency"] {
  if (daysUntilDeadline < 0) return "passed"
  if (totalCount === 0 || notRegisteredCount === 0) return "low"
  const ratio = notRegisteredCount / totalCount
  if (daysUntilDeadline <= 3 && notRegisteredCount > 0) return "critical"
  if (daysUntilDeadline <= 7 && ratio > 0.3) return "critical"
  if (daysUntilDeadline <= 14 && ratio > 0.2) return "high"
  if (ratio > 0.5) return "high"
  if (ratio > 0.2) return "medium"
  return "low"
}

export function buildSnapshot(
  clients: PfaClientRecord[],
  nowISO: string,
): PfaTrackerSnapshot {
  const counts = clients.reduce(
    (acc, c) => {
      switch (c.status) {
        case "registered":
          acc.registered++
          break
        case "form_submitted":
          acc.formSubmitted++
          break
        case "not_registered":
          acc.notRegistered++
          break
        case "exempt":
          acc.exempt++
          break
        case "unknown":
          acc.unknown++
          break
      }
      return acc
    },
    { registered: 0, formSubmitted: 0, notRegistered: 0, exempt: 0, unknown: 0 },
  )
  const daysUntilDeadline = computeDaysUntilDeadline(nowISO)
  const urgency = computeUrgency(daysUntilDeadline, counts.notRegistered + counts.unknown, clients.length)
  const atRiskClients = clients.filter(
    (c) => c.status === "not_registered" || c.status === "unknown" || c.status === "form_submitted",
  )
  return {
    totalClients: clients.length,
    ...counts,
    daysUntilDeadline,
    urgency,
    atRiskClients,
  }
}

// ── CNP detection helper ──────────────────────────────────────────────────────

/**
 * Detectează dacă un identificator fiscal este CNP (13 cifre, începe cu 1/2/5/6).
 * Util pentru a flagua automat clienții care intră sub OG 6/2026.
 */
export function isCnpFormat(taxId: string): boolean {
  const clean = taxId.replace(/\s+/g, "")
  return /^[1-6]\d{12}$/.test(clean)
}

/**
 * Detectează dacă identificatorul e PFA (CIF cu prefix special) sau persoană
 * fizică pe baza pattern-ului.
 *
 * Notă: PFA-urile primesc CIF (RO + cifre) la registrare, dar mulți încă
 * folosesc CNP-ul în acte fiscale.
 */
export function inferPfaCnpScope(taxId: string): "cnp" | "cif_pfa" | "cif_company" | "unknown" {
  if (isCnpFormat(taxId)) return "cnp"
  const clean = taxId.replace(/\s+/g, "").toUpperCase()
  // CIF RO + 2-10 cifre — pot fi PFA sau companie; nu putem diferenția fără date externe.
  // Pentru MVP: presupunem că filtrarea PFA vs company se face manual de contabil
  // prin câmpul `notes` sau printr-un flag separat în state.
  if (/^(RO)?\d{2,10}$/.test(clean)) return "cif_company"
  return "unknown"
}

// ── State helpers (pentru integrare cu mvp-store) ────────────────────────────

export function upsertPfaClient(
  existing: PfaClientRecord[],
  client: PfaClientRecord,
): PfaClientRecord[] {
  const idx = existing.findIndex((c) => c.id === client.id)
  if (idx === -1) return [...existing, client]
  const next = [...existing]
  next[idx] = client
  return next
}

export function updatePfaStatus(
  existing: PfaClientRecord[],
  clientId: string,
  status: PfaRegistrationStatus,
  nowISO: string,
  patch?: Partial<PfaClientRecord>,
): PfaClientRecord[] {
  return existing.map((c) => {
    if (c.id !== clientId) return c
    return {
      ...c,
      ...patch,
      status,
      updatedAtISO: nowISO,
      ...(status === "form_submitted" && !c.form082SubmittedAtISO
        ? { form082SubmittedAtISO: nowISO }
        : {}),
      ...(status === "registered" && !c.confirmationAtISO
        ? { confirmationAtISO: nowISO }
        : {}),
    }
  })
}
