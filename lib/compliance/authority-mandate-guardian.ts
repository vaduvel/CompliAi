// FC-10 (2026-05-14) — Authority & Mandate Guardian.
//
// Doc 09 cap 6: cabinetul trebuie să poată verifica DAILY:
//   - certificate digitale calificate valabile (expirare în ≤ 30 zile = alert)
//   - împuterniciri SPV active (expirare + scope: cine poate semna pentru cine)
//   - drepturi de reprezentare (ANAF, ONRC, eDeclarații)
//   - mandate semnătură (notarial, conformitate Cod Civil Art. 2009-2042)
//
// Acest module gestionează inventarul certificatelor + împuternicirilor și
// generează alerte automate cu pre-anunț.

// ── Types ────────────────────────────────────────────────────────────────────

export type CertificateType =
  | "qualified-signature" // semnătură electronică calificată (eIDAS)
  | "non-qualified-signature" // semnătură electronică simplă/avansată
  | "anaf-spv-token" // token ANAF SPV
  | "cnp-cert" // certificat persoană fizică
  | "company-seal" // sigiliu electronic firmă

export type CertificateAuthority =
  | "certSIGN"
  | "DigiSign"
  | "Trans Sped"
  | "AlfaSign"
  | "AlfaTrust"
  | "EasySign"
  | "ANAF"
  | "alt"

export type MandateType =
  | "anaf-spv" // împuternicire SPV ANAF (form 270)
  | "edeclaratii" // împuternicire pentru depunere declarații
  | "onrc" // împuternicire ONRC (modificări act)
  | "casa-marcat" // împuternicire instalare casă marcat
  | "general-notarial" // procură generală notarială

export type MandateScope =
  | "submit-declarations" // poate depune D300, D205 etc.
  | "view-fiscal-data" // poate vedea date fiscale
  | "represent-anaf" // reprezintă în fața ANAF (control, audit)
  | "modify-onrc" // poate semna modificări ONRC
  | "sign-contracts" // poate semna contracte
  | "all" // mandat general

export type DigitalCertificate = {
  id: string
  /** Cărei firme/persoane îi aparține. */
  ownerOrgId: string
  ownerOrgName: string
  /** Nume titular (persoana fizică pentru care e emis). */
  holderName: string
  /** CNP titular (mascat în UI). */
  holderCNP?: string
  type: CertificateType
  authority: CertificateAuthority
  /** Serial number certificat. */
  serialNumber: string
  /** Issue date ISO. */
  issuedAtISO: string
  /** Expiry date ISO. */
  expiresAtISO: string
  /** Status. */
  status: "active" | "expiring-soon" | "expired" | "revoked"
  /** Cabinet user care a înregistrat acest certificat. */
  registeredByEmail: string
  /** Cabinet ID — pentru a putea filtra cross-client de cabinet. */
  cabinetOrgId?: string
  /** Note libere. */
  notes?: string
}

export type RepresentationMandate = {
  id: string
  /** Cine reprezintă (cabinet sau persoană). */
  representativeOrgId: string
  representativeOrgName: string
  representativeName: string
  /** Cine e reprezentat (firma client). */
  clientOrgId: string
  clientOrgName: string
  /** Tip mandat. */
  type: MandateType
  /** Scope-uri permise. */
  scopes: MandateScope[]
  /** Issue date ISO. */
  issuedAtISO: string
  /** Expiry date ISO (null = nelimitat, dar nu recomandat). */
  expiresAtISO: string | null
  /** Document sursă (URL/path la copia scanată). */
  documentRef?: string
  /** Număr document (ex: nr. înregistrare ANAF). */
  documentNumber?: string
  status: "active" | "expiring-soon" | "expired" | "revoked" | "draft"
  /** Notar (dacă procură notarială). */
  notaryName?: string
  /** Note libere. */
  notes?: string
  /** Înregistrat de. */
  registeredByEmail: string
}

export type GuardianAlert = {
  id: string
  category: "certificate" | "mandate"
  severity: "critical" | "warning" | "info"
  /** Cărui element îi corespunde. */
  refId: string
  refName: string
  /** Tip element (ex: "Certificate certSIGN - Mihai Pop"). */
  refType: string
  /** Date expirare. */
  expiresAtISO: string
  /** Zile rămase (negativ = expirat). */
  daysUntilExpiry: number
  /** Mesaj. */
  message: string
  /** Acțiune recomandată. */
  recommendedAction: string
  /** Legal reference. */
  legalReference: string
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Alert WARNING dacă expiră în ≤ 30 zile. */
const WARNING_DAYS_BEFORE = 30
/** Alert CRITICAL dacă expiră în ≤ 7 zile. */
const CRITICAL_DAYS_BEFORE = 7

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(iso: string, nowISO?: string): number {
  const now = new Date(nowISO ?? new Date().toISOString()).getTime()
  const target = new Date(iso).getTime()
  return Math.floor((target - now) / 86400000)
}

function deriveCertStatus(
  cert: DigitalCertificate,
  nowISO?: string,
): DigitalCertificate["status"] {
  if (cert.status === "revoked") return "revoked"
  const days = daysUntil(cert.expiresAtISO, nowISO)
  if (days < 0) return "expired"
  if (days <= WARNING_DAYS_BEFORE) return "expiring-soon"
  return "active"
}

function deriveMandateStatus(
  m: RepresentationMandate,
  nowISO?: string,
): RepresentationMandate["status"] {
  if (m.status === "revoked" || m.status === "draft") return m.status
  if (!m.expiresAtISO) return "active"
  const days = daysUntil(m.expiresAtISO, nowISO)
  if (days < 0) return "expired"
  if (days <= WARNING_DAYS_BEFORE) return "expiring-soon"
  return "active"
}

// ── Engine ───────────────────────────────────────────────────────────────────

export function refreshCertificateStatuses(
  certs: DigitalCertificate[],
  nowISO?: string,
): DigitalCertificate[] {
  return certs.map((c) => ({ ...c, status: deriveCertStatus(c, nowISO) }))
}

export function refreshMandateStatuses(
  mandates: RepresentationMandate[],
  nowISO?: string,
): RepresentationMandate[] {
  return mandates.map((m) => ({ ...m, status: deriveMandateStatus(m, nowISO) }))
}

export function generateGuardianAlerts(
  certs: DigitalCertificate[],
  mandates: RepresentationMandate[],
  nowISO?: string,
): GuardianAlert[] {
  const alerts: GuardianAlert[] = []

  for (const cert of certs) {
    if (cert.status === "revoked") continue
    const days = daysUntil(cert.expiresAtISO, nowISO)
    if (days >= 0 && days > WARNING_DAYS_BEFORE) continue
    const severity: GuardianAlert["severity"] =
      days < 0 ? "critical" : days <= CRITICAL_DAYS_BEFORE ? "critical" : "warning"
    alerts.push({
      id: `cert-${cert.id}`,
      category: "certificate",
      severity,
      refId: cert.id,
      refName: `${cert.holderName} (${cert.authority})`,
      refType: certTypeLabel(cert.type),
      expiresAtISO: cert.expiresAtISO,
      daysUntilExpiry: days,
      message:
        days < 0
          ? `Certificat ${cert.serialNumber} expirat de ${Math.abs(days)} zile — semnătura nu mai funcționează.`
          : `Certificat ${cert.serialNumber} expiră în ${days} zile.`,
      recommendedAction:
        days < 0
          ? "Reînnoiește URGENT la autoritatea emitentă; toate depunerile vor eșua."
          : `Programează reînnoire la ${cert.authority}. Procesul durează 2-5 zile.`,
      legalReference: "Regulament eIDAS 910/2014 + Legea 455/2001 semnătură electronică",
    })
  }

  for (const m of mandates) {
    if (m.status === "revoked" || m.status === "draft" || !m.expiresAtISO) continue
    const days = daysUntil(m.expiresAtISO, nowISO)
    if (days >= 0 && days > WARNING_DAYS_BEFORE) continue
    const severity: GuardianAlert["severity"] =
      days < 0 ? "critical" : days <= CRITICAL_DAYS_BEFORE ? "critical" : "warning"
    alerts.push({
      id: `mandate-${m.id}`,
      category: "mandate",
      severity,
      refId: m.id,
      refName: `${m.representativeName} → ${m.clientOrgName}`,
      refType: mandateTypeLabel(m.type),
      expiresAtISO: m.expiresAtISO,
      daysUntilExpiry: days,
      message:
        days < 0
          ? `Împuternicirea ${m.documentNumber ?? m.id} a expirat — nu mai poți reprezenta acest client.`
          : `Împuternicirea ${m.documentNumber ?? m.id} expiră în ${days} zile.`,
      recommendedAction:
        days < 0
          ? "Solicită URGENT reînnoirea împuternicirii (form 270 ANAF / act notarial)."
          : "Programează reînnoirea împuternicirii. Pentru SPV: form 270 ANAF.",
      legalReference: m.type === "anaf-spv"
        ? "OMF 2520/2010 + Ordin 2594/2008 SPV"
        : "Cod Civil Art. 2009-2042 mandat",
    })
  }

  // Sortare: critical primul, apoi după zile rămase
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      const order = { critical: 0, warning: 1, info: 2 }
      return order[a.severity] - order[b.severity]
    }
    return a.daysUntilExpiry - b.daysUntilExpiry
  })
}

export type GuardianSummary = {
  totalCertificates: number
  totalMandates: number
  expiringCertsCount: number
  expiredCertsCount: number
  expiringMandatesCount: number
  expiredMandatesCount: number
  totalAlerts: number
  criticalAlerts: number
  /** Cross-client: câți clienți au mandate active. */
  clientsWithActiveMandates: number
  /** Recomandare strategică. */
  topRecommendation: string
}

export function summarizeGuardian(
  certs: DigitalCertificate[],
  mandates: RepresentationMandate[],
  alerts: GuardianAlert[],
): GuardianSummary {
  const expiringCertsCount = certs.filter((c) => c.status === "expiring-soon").length
  const expiredCertsCount = certs.filter((c) => c.status === "expired").length
  const expiringMandatesCount = mandates.filter((m) => m.status === "expiring-soon").length
  const expiredMandatesCount = mandates.filter((m) => m.status === "expired").length
  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length
  const clientsWithActiveMandates = new Set(
    mandates.filter((m) => m.status === "active" || m.status === "expiring-soon").map((m) => m.clientOrgId),
  ).size

  let topRecommendation: string
  if (expiredCertsCount > 0) {
    topRecommendation = `${expiredCertsCount} certificat(e) EXPIRAT(E) — toate depunerile către ANAF eșuează acum. Reînnoiește URGENT.`
  } else if (expiredMandatesCount > 0) {
    topRecommendation = `${expiredMandatesCount} împuternicire(i) expirat(e) — nu mai poți reprezenta legal acel(i) client(i). Solicită reînnoire.`
  } else if (criticalAlerts > 0) {
    topRecommendation = `${criticalAlerts} alertă(e) critică(e) — element(e) care expiră în ≤7 zile. Programează reînnoirile imediat.`
  } else if (expiringCertsCount + expiringMandatesCount > 0) {
    topRecommendation = `${expiringCertsCount + expiringMandatesCount} element(e) expiră în ≤30 zile — planifică reînnoirile săptămâna asta.`
  } else {
    topRecommendation = `Toate certificatele și împuternicirile sunt active și valide. Re-verifică săptămânal.`
  }

  return {
    totalCertificates: certs.length,
    totalMandates: mandates.length,
    expiringCertsCount,
    expiredCertsCount,
    expiringMandatesCount,
    expiredMandatesCount,
    totalAlerts: alerts.length,
    criticalAlerts,
    clientsWithActiveMandates,
    topRecommendation,
  }
}

// ── Labels ───────────────────────────────────────────────────────────────────

export function certTypeLabel(t: CertificateType): string {
  return {
    "qualified-signature": "Semnătură calificată",
    "non-qualified-signature": "Semnătură simplă/avansată",
    "anaf-spv-token": "Token SPV ANAF",
    "cnp-cert": "Certificat persoană fizică",
    "company-seal": "Sigiliu electronic firmă",
  }[t]
}

export function mandateTypeLabel(t: MandateType): string {
  return {
    "anaf-spv": "Împuternicire SPV (form 270)",
    edeclaratii: "Împuternicire eDeclarații",
    onrc: "Împuternicire ONRC",
    "casa-marcat": "Mandat casă marcat",
    "general-notarial": "Procură notarială",
  }[t]
}

// ── ID generator ─────────────────────────────────────────────────────────────

let _idCounter = 0
export function generateCertId(): string {
  _idCounter++
  return `cert-${Date.now().toString(36)}-${_idCounter}-${Math.random().toString(36).slice(2, 6)}`
}
export function generateMandateId(): string {
  _idCounter++
  return `mandate-${Date.now().toString(36)}-${_idCounter}-${Math.random().toString(36).slice(2, 6)}`
}
