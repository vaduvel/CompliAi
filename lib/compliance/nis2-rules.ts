// NIS2 Directive (2022/2555) assessment — 20 questions mapped to DNSC guidance
// convertNIS2GapsToFindings() bridges NIS2 gaps into the central ScanFinding board.
// Covers the 10 minimum security measures from Art. 21 + DNSC implementation guide.
//
// Sectors covered: energy, transport, banking, health, digital-infrastructure, public-admin, general

export type Nis2Sector =
  | "energy"
  | "transport"
  | "banking"
  | "health"
  | "digital-infrastructure"
  | "public-admin"
  | "general"

export type Nis2EntityType = "essential" | "important" | "not-applicable"

export type Nis2Answer = "yes" | "partial" | "no" | "na"

export type Nis2Answers = Record<string, Nis2Answer>

export type Nis2Question = {
  id: string
  text: string
  hint: string
  article: string // NIS2 article reference
  dnscRef?: string // DNSC guidance section
  category: Nis2Category
  weight: number // 1-3; 3 = mandatory/critical
  sectors: Nis2Sector[] | "all"
}

export type Nis2Category =
  | "risk-management"
  | "incident-response"
  | "supply-chain"
  | "access-control"
  | "cryptography"
  | "continuity"
  | "training"
  | "vulnerability"

export type Nis2Gap = {
  questionId: string
  question: string
  article: string
  severity: "critical" | "high" | "medium"
  remediationHint: string
}

export type Nis2Result = {
  score: number // 0-100
  maturityLabel: "non-conform" | "initial" | "partial" | "robust"
  entityType: Nis2EntityType
  gaps: Nis2Gap[]
  answeredCount: number
  totalCount: number
}

// ── Sector detection ──────────────────────────────────────────────────────────

const ESSENTIAL_SECTORS: Nis2Sector[] = ["energy", "transport", "banking", "health", "digital-infrastructure", "public-admin"]

export function detectEntityType(sector: Nis2Sector): Nis2EntityType {
  if (ESSENTIAL_SECTORS.includes(sector)) return "essential"
  return "important"
}

export function SECTOR_LABELS(): Record<Nis2Sector, string> {
  return {
    energy: "Energie",
    transport: "Transport",
    banking: "Servicii bancare / financiare",
    health: "Sănătate",
    "digital-infrastructure": "Infrastructură digitală / IT",
    "public-admin": "Administrație publică",
    general: "Alt sector (important)",
  }
}

// ── Questions ─────────────────────────────────────────────────────────────────

export const NIS2_QUESTIONS: Nis2Question[] = [
  // ── Risk management ───────────────────────────────────────────────────────
  {
    id: "nis2-rm-01",
    category: "risk-management",
    text: "Ai implementat un proces documentat de analiză și gestionare a riscurilor cibernetice?",
    hint: "Include inventar active, identificare amenințări, evaluare probabilitate și impact.",
    article: "Art. 21(2)(a)",
    dnscRef: "DNSC Ghid §3.1",
    weight: 3,
    sectors: "all",
  },
  {
    id: "nis2-rm-02",
    category: "risk-management",
    text: "Există o politică de securitate a informației aprobată de conducere și revizuită cel puțin anual?",
    hint: "Politica trebuie să acopere scopul, obiectivele, responsabilitățile și principiile de securitate.",
    article: "Art. 21(2)(a)",
    dnscRef: "DNSC Ghid §3.2",
    weight: 3,
    sectors: "all",
  },
  {
    id: "nis2-rm-03",
    category: "risk-management",
    text: "Ai un registru actualizat al activelor IT critice (sisteme, aplicații, date)?",
    hint: "Registrul trebuie să includă clasificarea activelor și proprietarul fiecărui activ.",
    article: "Art. 21(2)(a)",
    dnscRef: "DNSC Ghid §3.3",
    weight: 2,
    sectors: "all",
  },
  // ── Incident response ─────────────────────────────────────────────────────
  {
    id: "nis2-ir-01",
    category: "incident-response",
    text: "Ai un plan de răspuns la incidente de securitate cibernetică documentat și testat?",
    hint: "Include proceduri de detectare, escaladare, comunicare și recuperare post-incident.",
    article: "Art. 21(2)(b)",
    dnscRef: "DNSC Ghid §4.1",
    weight: 3,
    sectors: "all",
  },
  {
    id: "nis2-ir-02",
    category: "incident-response",
    text: "Există o procedură de notificare DNSC în termenele NIS2 (alertă inițială 24h, raport complet 72h)?",
    hint: "Notificarea tardivă constituie încălcare NIS2. Desemnează un responsabil pentru raportare.",
    article: "Art. 23",
    dnscRef: "DNSC Ghid §4.2",
    weight: 3,
    sectors: "all",
  },
  {
    id: "nis2-ir-03",
    category: "incident-response",
    text: "Loghezi și monitorizezi evenimentele de securitate cu retenție de minimum 12 luni?",
    hint: "Logurile trebuie să permită investigarea post-incident și să fie protejate împotriva modificării.",
    article: "Art. 21(2)(b)",
    dnscRef: "DNSC Ghid §4.3",
    weight: 2,
    sectors: "all",
  },
  // ── Business continuity ───────────────────────────────────────────────────
  {
    id: "nis2-bc-01",
    category: "continuity",
    text: "Ai un plan de continuitate a afacerii (BCP) care acoperă scenarii de atac cibernetic?",
    hint: "Include RTO/RPO definite, proceduri de failover și teste periodice.",
    article: "Art. 21(2)(c)",
    dnscRef: "DNSC Ghid §5.1",
    weight: 3,
    sectors: "all",
  },
  {
    id: "nis2-bc-02",
    category: "continuity",
    text: "Backup-urile sunt efectuate regulat, testate și stocate separat (inclusiv offline/offsite)?",
    hint: "Strategia 3-2-1: 3 copii, 2 medii diferite, 1 offsite. Testează restaurarea trimestrial.",
    article: "Art. 21(2)(c)",
    dnscRef: "DNSC Ghid §5.2",
    weight: 3,
    sectors: "all",
  },
  // ── Supply chain ──────────────────────────────────────────────────────────
  {
    id: "nis2-sc-01",
    category: "supply-chain",
    text: "Ai evaluat riscurile de securitate introduse de furnizori și subcontractori ICT critici?",
    hint: "Include clauze de securitate în contracte, evaluare periodică și drept de audit.",
    article: "Art. 21(2)(d)",
    dnscRef: "DNSC Ghid §6.1",
    weight: 3,
    sectors: "all",
  },
  {
    id: "nis2-sc-02",
    category: "supply-chain",
    text: "Contractele cu furnizorii ICT conțin clauze explicite privind notificarea incidentelor și SLA de securitate?",
    hint: "Clauzele trebuie să specifice timpi de notificare, responsabilități și dreptul de audit.",
    article: "Art. 21(2)(d)",
    dnscRef: "DNSC Ghid §6.2",
    weight: 2,
    sectors: "all",
  },
  // ── Access control ────────────────────────────────────────────────────────
  {
    id: "nis2-ac-01",
    category: "access-control",
    text: "Aplici principiul privilegiului minim (least privilege) pentru toate conturile cu acces la sisteme critice?",
    hint: "Revizuiește drepturile de acces cel puțin trimestrial. Dezactivează conturile inactive prompt.",
    article: "Art. 21(2)(i)",
    dnscRef: "DNSC Ghid §7.1",
    weight: 3,
    sectors: "all",
  },
  {
    id: "nis2-ac-02",
    category: "access-control",
    text: "Autentificarea multifactor (MFA) este activă pentru accesul la sisteme critice și acces remote?",
    hint: "MFA obligatoriu pentru admin, VPN, email corporate și aplicații critice.",
    article: "Art. 21(2)(i)",
    dnscRef: "DNSC Ghid §7.2",
    weight: 3,
    sectors: "all",
  },
  {
    id: "nis2-ac-03",
    category: "access-control",
    text: "Există un proces formal de onboarding/offboarding care include gestionarea accesurilor IT?",
    hint: "La plecare: retragere imediată acces, revocare token-uri, schimbare parole de sistem.",
    article: "Art. 21(2)(i)",
    dnscRef: "DNSC Ghid §7.3",
    weight: 2,
    sectors: "all",
  },
  // ── Cryptography ─────────────────────────────────────────────────────────
  {
    id: "nis2-cr-01",
    category: "cryptography",
    text: "Datele sensibile sunt criptate la stocare și în tranzit folosind algoritmi actuali (AES-256, TLS 1.2+)?",
    hint: "Evită MD5, SHA-1, DES, RC4. Auditează configurația TLS cu SSL Labs sau echivalent.",
    article: "Art. 21(2)(h)",
    dnscRef: "DNSC Ghid §8.1",
    weight: 2,
    sectors: "all",
  },
  // ── Training ──────────────────────────────────────────────────────────────
  {
    id: "nis2-tr-01",
    category: "training",
    text: "Angajații primesc training de securitate cibernetică cel puțin o dată pe an?",
    hint: "Include phishing awareness, parole sigure, raportare incidente. Documentează participarea.",
    article: "Art. 21(2)(g)",
    dnscRef: "DNSC Ghid §9.1",
    weight: 2,
    sectors: "all",
  },
  {
    id: "nis2-tr-02",
    category: "training",
    text: "Conducerea organizației (top management) a primit training specific privind obligațiile NIS2?",
    hint: "NIS2 Art. 20 impune răspunderea personală a managementului pentru aprobarea măsurilor de securitate.",
    article: "Art. 20",
    dnscRef: "DNSC Ghid §9.2",
    weight: 3,
    sectors: "all",
  },
  // ── Vulnerability management ──────────────────────────────────────────────
  {
    id: "nis2-vm-01",
    category: "vulnerability",
    text: "Ai un proces de management al vulnerabilităților care include scanare periodică și patch-uri la timp?",
    hint: "Patch-uri critice: <72h. Scanare infrastructură: minim lunar. Testare penetrare: anual.",
    article: "Art. 21(2)(e)",
    dnscRef: "DNSC Ghid §10.1",
    weight: 3,
    sectors: "all",
  },
  {
    id: "nis2-vm-02",
    category: "vulnerability",
    text: "Rețeaua este segmentată pentru a limita propagarea unui incident (DMZ, separare prod/dev)?",
    hint: "Zero Trust: verifică identitatea și device-ul, nu doar locația în rețea.",
    article: "Art. 21(2)(e)",
    dnscRef: "DNSC Ghid §10.2",
    weight: 2,
    sectors: "all",
  },
  // ── Sector-specific ───────────────────────────────────────────────────────
  {
    id: "nis2-hlt-01",
    category: "risk-management",
    text: "Sistemele medicale critice (RIS/PACS/EHR) sunt izolate de rețeaua generală?",
    hint: "Segmentare obligatorie pentru dispozitive medicale conectate. Actualizare firmware regulată.",
    article: "Art. 21(2)(e)",
    dnscRef: "DNSC Ghid Sănătate §2",
    weight: 3,
    sectors: ["health"],
  },
  {
    id: "nis2-nrg-01",
    category: "continuity",
    text: "Sistemele OT/SCADA sunt izolate de rețeaua IT și au proceduri specifice de incident response?",
    hint: "Air-gap sau zone demilitarizate OT/IT. Patch management adaptat la disponibilitate 24/7.",
    article: "Art. 21(2)(c)",
    dnscRef: "DNSC Ghid Energie §3",
    weight: 3,
    sectors: ["energy", "transport"],
  },
]

// ── Scoring ───────────────────────────────────────────────────────────────────

export function scoreNis2Assessment(
  answers: Nis2Answers,
  sector: Nis2Sector = "general"
): Nis2Result {
  const applicable = NIS2_QUESTIONS.filter(
    (q) => q.sectors === "all" || q.sectors.includes(sector)
  )

  const totalWeight = applicable.reduce((sum, q) => sum + q.weight, 0)
  let earnedWeight = 0
  const gaps: Nis2Gap[] = []
  let answeredCount = 0

  for (const q of applicable) {
    const answer = answers[q.id]
    if (!answer || answer === "na") continue
    answeredCount++

    if (answer === "yes") {
      earnedWeight += q.weight
    } else if (answer === "partial") {
      earnedWeight += q.weight * 0.4
      gaps.push({
        questionId: q.id,
        question: q.text,
        article: q.article,
        severity: q.weight === 3 ? "high" : "medium",
        remediationHint: q.hint,
      })
    } else {
      // no
      gaps.push({
        questionId: q.id,
        question: q.text,
        article: q.article,
        severity: q.weight === 3 ? "critical" : "high",
        remediationHint: q.hint,
      })
    }
  }

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0
  gaps.sort((a, b) => {
    const rank: Record<string, number> = { critical: 0, high: 1, medium: 2 }
    return rank[a.severity] - rank[b.severity]
  })

  const maturityLabel: Nis2Result["maturityLabel"] =
    score >= 75 ? "robust" : score >= 50 ? "partial" : score >= 25 ? "initial" : "non-conform"

  return {
    score,
    maturityLabel,
    entityType: detectEntityType(sector),
    gaps,
    answeredCount,
    totalCount: applicable.length,
  }
}

// ── Central board bridge ───────────────────────────────────────────────────────

import type { ScanFinding } from "@/lib/compliance/types"

/**
 * Converts NIS2 assessment gaps into ScanFindings suitable for the central
 * remediation board. Each gap gets a stable ID derived from its questionId so
 * re-running the assessment replaces findings in-place rather than duplicating.
 * Pure function — no I/O, safe to call anywhere.
 */
export function convertNIS2GapsToFindings(
  gaps: Nis2Gap[],
  sector: Nis2Sector,
  assessedAtISO: string
): ScanFinding[] {
  return gaps.map((gap) => ({
    id: `nis2-finding-${gap.questionId}`,
    title: gap.question,
    detail: gap.remediationHint,
    category: "NIS2" as const,
    severity: gap.severity,
    risk: (gap.severity === "critical" || gap.severity === "high" ? "high" : "low") as "high" | "low",
    principles: ["robustness", "accountability", "oversight"] as ScanFinding["principles"],
    createdAtISO: assessedAtISO,
    sourceDocument: `Evaluare NIS2 — sector: ${sector}`,
    legalReference: gap.article,
    remediationHint: gap.remediationHint,
  }))
}

export const NIS2_CATEGORY_LABELS: Record<Nis2Category, string> = {
  "risk-management": "Gestiunea riscurilor",
  "incident-response": "Răspuns la incidente",
  "supply-chain": "Securitate lanț de aprovizionare",
  "access-control": "Control acces",
  cryptography: "Criptografie",
  continuity: "Continuitate operațională",
  training: "Formare și conștientizare",
  vulnerability: "Gestiunea vulnerabilităților",
}
