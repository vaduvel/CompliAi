// Incident Response Checklists — per attack type
// NIS2 Art. 23 + GDPR Art. 33/34 aligned.
// Each checklist is specific to the incident type and includes
// legal deadlines, immediate actions, and evidence requirements.

import type { Nis2AttackType } from "@/lib/server/nis2-store"

export type ChecklistStep = {
  id: string
  order: number
  text: string
  category: "immediate" | "investigation" | "notification" | "recovery" | "evidence"
  legalBasis?: string
  deadlineHours?: number
  critical: boolean
}

export type IncidentChecklist = {
  attackType: Nis2AttackType
  label: string
  description: string
  steps: ChecklistStep[]
}

// ── Data Breach (GDPR Art. 33/34 + NIS2 Art. 23) ────────────────────────────

const DATA_BREACH_CHECKLIST: IncidentChecklist = {
  attackType: "data-breach",
  label: "Breach de date personale",
  description:
    "Acces neautorizat, exfiltrare sau expunere de date cu caracter personal. " +
    "Notificare ANSPDCP obligatorie în 72h dacă există risc pentru persoanele vizate.",
  steps: [
    {
      id: "db-1",
      order: 1,
      text: "Izolează sistemul afectat — nu opri, izolează de rețea",
      category: "immediate",
      critical: true,
    },
    {
      id: "db-2",
      order: 2,
      text: "Documentează ce date au fost expuse: tip, volum, categorii de persoane vizate",
      category: "immediate",
      critical: true,
    },
    {
      id: "db-3",
      order: 3,
      text: "Verifică dacă datele expuse erau criptate sau pseudonimizate",
      category: "investigation",
      critical: true,
    },
    {
      id: "db-4",
      order: 4,
      text: "Notifică DPO-ul intern (dacă există) sau responsabilul de conformitate",
      category: "immediate",
      critical: false,
    },
    {
      id: "db-5",
      order: 5,
      text: "Pregătește notificarea ANSPDCP — CompliScan generează formularul",
      category: "notification",
      legalBasis: "GDPR Art. 33",
      deadlineHours: 72,
      critical: true,
    },
    {
      id: "db-6",
      order: 6,
      text: "Evaluează dacă persoanele vizate trebuie notificate individual (risc ridicat)",
      category: "notification",
      legalBasis: "GDPR Art. 34",
      critical: true,
    },
    {
      id: "db-7",
      order: 7,
      text: "Dacă ești entitate NIS2: notifică DNSC în primele 24h (early warning)",
      category: "notification",
      legalBasis: "NIS2 Art. 23(4)(a)",
      deadlineHours: 24,
      critical: true,
    },
    {
      id: "db-8",
      order: 8,
      text: "Colectează și conservă loguri, capturi ecran și evidențe forensice",
      category: "evidence",
      critical: true,
    },
    {
      id: "db-9",
      order: 9,
      text: "Documentează cronologia completă: descoperire, conținere, notificări",
      category: "evidence",
      critical: false,
    },
    {
      id: "db-10",
      order: 10,
      text: "Implementează măsuri de prevenire a recurenței (patch, MFA, reconfigurare)",
      category: "recovery",
      critical: false,
    },
  ],
}

// ── DDoS / Indisponibilitate ─────────────────────────────────────────────────

const DDOS_CHECKLIST: IncidentChecklist = {
  attackType: "ddos",
  label: "DDoS / Indisponibilitate serviciu",
  description:
    "Atac distribuit de denial-of-service sau indisponibilitate majoră a serviciilor. " +
    "Notificare DNSC obligatorie în 24h dacă ești entitate NIS2.",
  steps: [
    {
      id: "dd-1",
      order: 1,
      text: "Activează planul de continuitate a activității (dacă există)",
      category: "immediate",
      critical: true,
    },
    {
      id: "dd-2",
      order: 2,
      text: "Contactează furnizorul de hosting/cloud pentru mitigare la nivel de infrastructură",
      category: "immediate",
      critical: true,
    },
    {
      id: "dd-3",
      order: 3,
      text: "Documentează: ora începerii, durata, serviciile afectate, IP-uri sursă (dacă vizibile)",
      category: "investigation",
      critical: true,
    },
    {
      id: "dd-4",
      order: 4,
      text: "Verifică dacă atacul DDoS acoperă o exfiltrare de date (common tactic)",
      category: "investigation",
      critical: true,
    },
    {
      id: "dd-5",
      order: 5,
      text: "Notifică DNSC — early warning în 24h",
      category: "notification",
      legalBasis: "NIS2 Art. 23(4)(a)",
      deadlineHours: 24,
      critical: true,
    },
    {
      id: "dd-6",
      order: 6,
      text: "Trimite raport complet la DNSC în 72h cu detalii tehnice",
      category: "notification",
      legalBasis: "NIS2 Art. 23(4)(b)",
      deadlineHours: 72,
      critical: true,
    },
    {
      id: "dd-7",
      order: 7,
      text: "Conservă loguri firewall, WAF, CDN ca dovadă pentru raport",
      category: "evidence",
      critical: false,
    },
    {
      id: "dd-8",
      order: 8,
      text: "Evaluează impactul operațional: câți utilizatori/clienți au fost afectați",
      category: "investigation",
      critical: false,
    },
    {
      id: "dd-9",
      order: 9,
      text: "Implementează protecții anti-DDoS (rate limiting, CDN, WAF rules)",
      category: "recovery",
      critical: false,
    },
  ],
}

// ── Ransomware ───────────────────────────────────────────────────────────────

const RANSOMWARE_CHECKLIST: IncidentChecklist = {
  attackType: "ransomware",
  label: "Ransomware",
  description:
    "Criptare malițioasă a datelor cu cerere de răscumpărare. " +
    "NU plăti răscumpărarea. Notificare DNSC în 24h, raportează la DIICOT.",
  steps: [
    {
      id: "rw-1",
      order: 1,
      text: "NU plăti răscumpărarea — plata nu garantează recuperarea datelor",
      category: "immediate",
      critical: true,
    },
    {
      id: "rw-2",
      order: 2,
      text: "Deconectează IMEDIAT sistemul infectat de la rețea (cablu + WiFi)",
      category: "immediate",
      critical: true,
    },
    {
      id: "rw-3",
      order: 3,
      text: "Verifică ce backup-uri sunt disponibile și neafectate (offline/cloud separat)",
      category: "immediate",
      critical: true,
    },
    {
      id: "rw-4",
      order: 4,
      text: "Documentează: tip ransomware, nota de răscumpărare, extensia fișierelor criptate",
      category: "investigation",
      critical: true,
    },
    {
      id: "rw-5",
      order: 5,
      text: "Verifică dacă date personale au fost exfiltrate ÎNAINTE de criptare (double extortion)",
      category: "investigation",
      critical: true,
    },
    {
      id: "rw-6",
      order: 6,
      text: "Notifică DNSC — early warning în 24h",
      category: "notification",
      legalBasis: "NIS2 Art. 23(4)(a)",
      deadlineHours: 24,
      critical: true,
    },
    {
      id: "rw-7",
      order: 7,
      text: "Raportează la Poliția Română / DIICOT (infracțiune informatică)",
      category: "notification",
      legalBasis: "Cod Penal Art. 362",
      critical: true,
    },
    {
      id: "rw-8",
      order: 8,
      text: "Dacă date personale exfiltrate: notifică ANSPDCP în 72h",
      category: "notification",
      legalBasis: "GDPR Art. 33",
      deadlineHours: 72,
      critical: true,
    },
    {
      id: "rw-9",
      order: 9,
      text: "Conservă imagini disk, sample ransomware, loguri ca dovadă",
      category: "evidence",
      critical: true,
    },
    {
      id: "rw-10",
      order: 10,
      text: "Restaurează din backup verificat, schimbă toate credențialele, activează MFA",
      category: "recovery",
      critical: false,
    },
  ],
}

// ── Acces neautorizat ────────────────────────────────────────────────────────

const UNAUTHORIZED_ACCESS_CHECKLIST: IncidentChecklist = {
  attackType: "unauthorized-access",
  label: "Acces neautorizat",
  description:
    "Acces neautorizat la sisteme, conturi sau date. " +
    "Evaluează impactul și notifică autoritățile dacă sunt afectate date personale.",
  steps: [
    {
      id: "ua-1",
      order: 1,
      text: "Schimbă IMEDIAT credențialele contului compromis (parolă + API keys)",
      category: "immediate",
      critical: true,
    },
    {
      id: "ua-2",
      order: 2,
      text: "Revocă toate sesiunile active ale contului compromis",
      category: "immediate",
      critical: true,
    },
    {
      id: "ua-3",
      order: 3,
      text: "Verifică logurile de acces — ce a fost accesat, descărcat, modificat",
      category: "investigation",
      critical: true,
    },
    {
      id: "ua-4",
      order: 4,
      text: "Documentează: vector de atac, durata accesului, date accesate, acțiuni efectuate",
      category: "investigation",
      critical: true,
    },
    {
      id: "ua-5",
      order: 5,
      text: "Evaluează dacă date personale au fost accesate — dacă da, notifică ANSPDCP (72h)",
      category: "notification",
      legalBasis: "GDPR Art. 33",
      deadlineHours: 72,
      critical: true,
    },
    {
      id: "ua-6",
      order: 6,
      text: "Dacă ești entitate NIS2 și impactul e semnificativ: notifică DNSC (24h)",
      category: "notification",
      legalBasis: "NIS2 Art. 23(4)(a)",
      deadlineHours: 24,
      critical: false,
    },
    {
      id: "ua-7",
      order: 7,
      text: "Implementează MFA pe toate conturile afectate (dacă nu exista)",
      category: "recovery",
      critical: true,
    },
    {
      id: "ua-8",
      order: 8,
      text: "Conservă loguri de autentificare, IP-uri, timestamps ca evidență",
      category: "evidence",
      critical: false,
    },
  ],
}

// ── Phishing ─────────────────────────────────────────────────────────────────

const PHISHING_CHECKLIST: IncidentChecklist = {
  attackType: "phishing",
  label: "Phishing / Inginerie socială",
  description:
    "Atac prin email/mesaj fraudulos care vizează furtul de credențiale sau date. " +
    "Evaluează dacă credențiale au fost compromise și dacă date au fost expuse.",
  steps: [
    {
      id: "ph-1",
      order: 1,
      text: "Izolează emailul/mesajul: nu șterge, mută în carantină sau folder dedicat",
      category: "immediate",
      critical: true,
    },
    {
      id: "ph-2",
      order: 2,
      text: "Dacă s-au introdus credențiale: schimbă imediat parola + activează MFA",
      category: "immediate",
      critical: true,
    },
    {
      id: "ph-3",
      order: 3,
      text: "Verifică dacă alte persoane din organizație au primit același mesaj",
      category: "investigation",
      critical: false,
    },
    {
      id: "ph-4",
      order: 4,
      text: "Verifică loguri pentru acces suspect din locații/IP-uri necunoscute",
      category: "investigation",
      critical: true,
    },
    {
      id: "ph-5",
      order: 5,
      text: "Dacă credențiale bancare compromise: contactează banca imediat",
      category: "immediate",
      critical: true,
    },
    {
      id: "ph-6",
      order: 6,
      text: "Notifică echipa IT/securitate pentru blocarea domeniului/URL-ului malițios",
      category: "recovery",
      critical: false,
    },
    {
      id: "ph-7",
      order: 7,
      text: "Documentează: expeditor, subiect, URL-uri malițioase, atașamente",
      category: "evidence",
      critical: false,
    },
    {
      id: "ph-8",
      order: 8,
      text: "Dacă date personale expuse: evaluează notificare ANSPDCP (72h)",
      category: "notification",
      legalBasis: "GDPR Art. 33",
      deadlineHours: 72,
      critical: false,
    },
  ],
}

// ── Supply Chain ─────────────────────────────────────────────────────────────

const SUPPLY_CHAIN_CHECKLIST: IncidentChecklist = {
  attackType: "supply-chain",
  label: "Atac pe lanțul de aprovizionare",
  description:
    "Compromiterea unui furnizor sau componentă software care afectează organizația. " +
    "Evaluare urgentă a impactului + notificare DNSC pentru entități NIS2.",
  steps: [
    {
      id: "sc-1",
      order: 1,
      text: "Identifică furnizorul/componenta compromisă și oprește actualizările automate",
      category: "immediate",
      critical: true,
    },
    {
      id: "sc-2",
      order: 2,
      text: "Verifică dacă versiunea compromisă e instalată în sistemele tale",
      category: "investigation",
      critical: true,
    },
    {
      id: "sc-3",
      order: 3,
      text: "Izolează sistemele care folosesc componenta afectată",
      category: "immediate",
      critical: true,
    },
    {
      id: "sc-4",
      order: 4,
      text: "Contactează furnizorul pentru confirmare și remediere oficială",
      category: "recovery",
      critical: true,
    },
    {
      id: "sc-5",
      order: 5,
      text: "Notifică DNSC — NIS2 Art. 23 cere raportare pentru atacuri pe supply chain",
      category: "notification",
      legalBasis: "NIS2 Art. 23(4)(a)",
      deadlineHours: 24,
      critical: true,
    },
    {
      id: "sc-6",
      order: 6,
      text: "Documentează: ce componente, ce versiuni, ce sisteme afectate",
      category: "evidence",
      critical: false,
    },
    {
      id: "sc-7",
      order: 7,
      text: "Revizuiește procesul de vendor review pentru furnizorul afectat",
      category: "recovery",
      critical: false,
    },
  ],
}

// ── Generic / Unknown ────────────────────────────────────────────────────────

const GENERIC_CHECKLIST: IncidentChecklist = {
  attackType: "unknown",
  label: "Incident de securitate — tip necunoscut",
  description:
    "Checklist general pentru incidente de securitate al căror tip nu este încă determinat.",
  steps: [
    {
      id: "gen-1",
      order: 1,
      text: "Izolează sistemele potențial afectate",
      category: "immediate",
      critical: true,
    },
    {
      id: "gen-2",
      order: 2,
      text: "Documentează ce s-a observat: simptome, timestamps, sisteme afectate",
      category: "investigation",
      critical: true,
    },
    {
      id: "gen-3",
      order: 3,
      text: "Verifică dacă date personale sunt potențial afectate",
      category: "investigation",
      critical: true,
    },
    {
      id: "gen-4",
      order: 4,
      text: "Contactează echipa IT/securitate sau un specialist extern",
      category: "immediate",
      critical: true,
    },
    {
      id: "gen-5",
      order: 5,
      text: "Dacă entitate NIS2: pregătește early warning DNSC (24h ca precauție)",
      category: "notification",
      legalBasis: "NIS2 Art. 23(4)(a)",
      deadlineHours: 24,
      critical: false,
    },
    {
      id: "gen-6",
      order: 6,
      text: "Conservă orice evidențe disponibile (loguri, capturi, emailuri)",
      category: "evidence",
      critical: false,
    },
  ],
}

// ── Public API ───────────────────────────────────────────────────────────────

const ALL_CHECKLISTS: IncidentChecklist[] = [
  DATA_BREACH_CHECKLIST,
  DDOS_CHECKLIST,
  RANSOMWARE_CHECKLIST,
  UNAUTHORIZED_ACCESS_CHECKLIST,
  PHISHING_CHECKLIST,
  SUPPLY_CHAIN_CHECKLIST,
  GENERIC_CHECKLIST,
]

/**
 * Returns the checklist for a specific attack type.
 * Falls back to generic checklist for unknown/other types.
 */
export function getIncidentChecklist(
  attackType: Nis2AttackType | undefined | null
): IncidentChecklist {
  if (!attackType) return GENERIC_CHECKLIST

  const found = ALL_CHECKLISTS.find((c) => c.attackType === attackType)
  return found ?? GENERIC_CHECKLIST
}

/**
 * Returns all available checklists (for UI listing or admin).
 */
export function getAllIncidentChecklists(): IncidentChecklist[] {
  return ALL_CHECKLISTS
}

/**
 * Returns only the critical steps for a given attack type.
 * Useful for the first-response email or notification.
 */
export function getCriticalSteps(
  attackType: Nis2AttackType | undefined | null
): ChecklistStep[] {
  return getIncidentChecklist(attackType).steps.filter((s) => s.critical)
}
