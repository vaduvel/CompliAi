// NIS2 Maturity Self-Assessment — 10 domenii NIS2 Art.21(2)
// Baza legală: OUG 155/2024 Art. 18(7) ✅
// Domenii: management risc, incidente, continuitate, supply chain, sisteme,
//          audit, igienă cibernetică, criptografie, control acces, MFA

import type { ScanFinding } from "@/lib/compliance/types"

export type MaturityAnswer = "yes" | "partial" | "no" | "na"
export type MaturityAnswers = Record<string, MaturityAnswer>
export type MaturityDomainStatus = "compliant" | "partial" | "non_compliant"

export interface MaturityQuestion {
  id: string
  text: string
}

export interface MaturityDomainDef {
  id: string
  name: string
  legalRef: string
  questions: MaturityQuestion[]
  closureRecipe: string
}

export interface MaturityDomainResult {
  id: string
  name: string
  score: number
  status: MaturityDomainStatus
  answeredCount: number
  applicableCount: number
}

export interface MaturityResult {
  overallScore: number
  level: "basic" | "important" | "essential"
  domains: MaturityDomainResult[]
}

export const MATURITY_DOMAINS: MaturityDomainDef[] = [
  {
    id: "risk-management",
    name: "Managementul riscului cibernetic",
    legalRef: "NIS2 Art.21(2)(a) + OUG 155/2024 Art.18",
    closureRecipe:
      "Documentează o Politică de Management al Riscului Cibernetic. Generează din Generatorul de Documente și atașează documentul semnat de management.",
    questions: [
      { id: "rm1", text: "Ai o politică documentată de management al riscului cibernetic?" },
      { id: "rm2", text: "Efectuezi evaluări de risc periodic (cel puțin anual)?" },
      { id: "rm3", text: "Riscurile identificate sunt înregistrate și tratate cu un plan de acțiune?" },
    ],
  },
  {
    id: "incident-response",
    name: "Gestionarea incidentelor",
    legalRef: "NIS2 Art.21(2)(b) + Art.23 + OUG 155/2024 Art.18",
    closureRecipe:
      "Creează un Plan de Răspuns la Incidente și înregistrează incidentele în modulul NIS2. Atașează planul semnat de management.",
    questions: [
      { id: "ir1", text: "Ai un plan documentat de răspuns la incidente cibernetice?" },
      { id: "ir2", text: "Incidentele sunt raportate la DNSC în termenele legale (24h / 72h)?" },
      { id: "ir3", text: "Există un registru de incidente cu analiză post-incident?" },
    ],
  },
  {
    id: "business-continuity",
    name: "Continuitatea activității (BCP / DRP)",
    legalRef: "NIS2 Art.21(2)(c)",
    closureRecipe:
      "Documentează planul BCP + DRP și testează backup-urile regulat. Atașează dovada ultimului test de recuperare.",
    questions: [
      { id: "bc1", text: "Ai un plan de continuitate a activității (BCP) documentat și testat?" },
      { id: "bc2", text: "Backup-urile de date sunt efectuate regulat și testate pentru recuperare?" },
      {
        id: "bc3",
        text: "Ai un plan de recuperare în caz de dezastru (DRP) testat în ultimele 12 luni?",
      },
    ],
  },
  {
    id: "supply-chain",
    name: "Securitatea lanțului de aprovizionare",
    legalRef: "NIS2 Art.21(2)(d)",
    closureRecipe:
      "Completează registrul de furnizori cu clauze de securitate. Verifică contractele furnizorilor critici și adaugă clauze NIS2 (Art.21(2)(d)).",
    questions: [
      { id: "sc1", text: "Ai un registru al furnizorilor critici cu clauze de securitate în contracte?" },
      {
        id: "sc2",
        text: "Furnizorilor care procesează date li se solicită dovezi de securitate (audit, certificare)?",
      },
    ],
  },
  {
    id: "secure-development",
    name: "Securitatea sistemelor și achiziții",
    legalRef: "NIS2 Art.21(2)(e)",
    closureRecipe:
      "Adoptă cerințe minime de securitate pentru achiziții IT. Documentează procesul de patch management și actualizări de securitate.",
    questions: [
      { id: "sd1", text: "Aplicați cerințe de securitate în procesul de achiziție a sistemelor IT?" },
      {
        id: "sd2",
        text: "Vulnerabilitățile sunt evaluate și remediate prin actualizări regulate (patch management)?",
      },
    ],
  },
  {
    id: "audit-testing",
    name: "Evaluarea eficacității măsurilor",
    legalRef: "NIS2 Art.21(2)(f)",
    closureRecipe:
      "Planifică un test de penetrare sau audit de securitate extern (cel puțin anual). Atașează raportul și planul de remediere.",
    questions: [
      { id: "at1", text: "Efectuezi teste de penetrare sau audituri de securitate (cel puțin anual)?" },
      { id: "at2", text: "Există un proces de monitorizare și revizuire a controalelor de securitate?" },
    ],
  },
  {
    id: "basic-hygiene",
    name: "Igienă cibernetică și training",
    legalRef: "NIS2 Art.21(2)(g)",
    closureRecipe:
      "Organizează training de securitate cibernetică pentru toți angajații (cel puțin anual). Documentează politica de igienă cibernetică și atașează dovada participării.",
    questions: [
      { id: "bh1", text: "Angajații primesc training de securitate cibernetică (cel puțin anual)?" },
      { id: "bh2", text: "Există politici documentate de igienă cibernetică (parole, actualizări, e-mail)?" },
      { id: "bh3", text: "Există un inventar actualizat al activelor IT?" },
    ],
  },
  {
    id: "cryptography",
    name: "Criptografie și protecția datelor",
    legalRef: "NIS2 Art.21(2)(h)",
    closureRecipe:
      "Activează HTTPS/TLS pentru toate serviciile expuse. Documentează politica de criptare și protecția datelor sensibile în tranzit și la stocare.",
    questions: [
      { id: "cr1", text: "Comunicațiile sensibile sunt criptate (TLS/HTTPS, e-mail criptat)?" },
      { id: "cr2", text: "Datele sensibile stocate sunt protejate prin criptare sau pseudonimizare?" },
    ],
  },
  {
    id: "access-control",
    name: "Securitatea resurselor umane și controlul accesului",
    legalRef: "NIS2 Art.21(2)(i)",
    closureRecipe:
      "Implementează principiul least-privilege și documentează procesul de offboarding. Atașează politica de control al accesului.",
    questions: [
      { id: "ac1", text: "Accesul la sisteme critice este acordat pe principiul 'need-to-know'?" },
      { id: "ac2", text: "Există un proces documentat de revocare a accesului la plecarea angajaților?" },
      { id: "ac3", text: "Privilegiile de administrator sunt separate de conturile uzuale?" },
    ],
  },
  {
    id: "mfa",
    name: "Autentificare multi-factor (MFA)",
    legalRef: "NIS2 Art.21(2)(j)",
    closureRecipe:
      "Activează MFA pe toate conturile critice (administratori, e-mail business, acces remote). Documentează în politica de acces și atașează dovada activării.",
    questions: [
      { id: "mf1", text: "MFA este activat pentru accesul la sistemele critice și e-mail business?" },
      { id: "mf2", text: "Conturile de administrator folosesc autentificare puternică (MFA + parolă complexă)?" },
    ],
  },
]

export function scoreDomain(domainId: string, answers: MaturityAnswers): MaturityDomainResult {
  const domain = MATURITY_DOMAINS.find((d) => d.id === domainId)!
  const allAnswered = domain.questions.filter((q) => answers[q.id] !== undefined)
  const applicable = allAnswered.filter((q) => answers[q.id] !== "na")
  const applicableCount = applicable.length

  if (applicableCount === 0) {
    return {
      id: domainId,
      name: domain.name,
      score: 0,
      status: "non_compliant",
      answeredCount: allAnswered.length,
      applicableCount: 0,
    }
  }

  const sum = applicable.reduce((acc, q) => {
    const a = answers[q.id]
    if (a === "yes") return acc + 100
    if (a === "partial") return acc + 50
    return acc // "no"
  }, 0)

  const score = Math.round(sum / applicableCount)
  const status: MaturityDomainStatus =
    score >= 70 ? "compliant" : score >= 40 ? "partial" : "non_compliant"

  return { id: domainId, name: domain.name, score, status, answeredCount: allAnswered.length, applicableCount }
}

export function scoreMaturity(answers: MaturityAnswers): MaturityResult {
  const domains = MATURITY_DOMAINS.map((d) => scoreDomain(d.id, answers))
  const scoredDomains = domains.filter((d) => d.applicableCount > 0)
  const overallScore =
    scoredDomains.length === 0
      ? 0
      : Math.round(scoredDomains.reduce((sum, d) => sum + d.score, 0) / scoredDomains.length)
  const level: MaturityResult["level"] =
    overallScore >= 80 ? "essential" : overallScore >= 50 ? "important" : "basic"
  return { overallScore, level, domains }
}

/**
 * Converts maturity domain gaps (score < 50%) into ScanFindings for the central board.
 * Uses stable IDs so re-running replaces existing findings.
 */
export function convertMaturityGapsToFindings(
  domains: MaturityDomainResult[],
  assessedAtISO: string
): ScanFinding[] {
  return domains
    .filter((d) => d.applicableCount > 0 && d.score < 50)
    .map((d) => {
      const def = MATURITY_DOMAINS.find((x) => x.id === d.id)!
      const severity: ScanFinding["severity"] = d.score < 25 ? "high" : "medium"
      return {
        id: `nis2-maturity-${d.id}`,
        title: `Maturitate insuficientă: ${d.name} (${d.score}%)`,
        detail: `Domeniu NIS2 cu scor sub 50%. ${def.closureRecipe}`,
        category: "NIS2" as const,
        severity,
        risk: (severity === "high" ? "high" : "low") as "high" | "low",
        principles: ["robustness", "accountability"] as ScanFinding["principles"],
        createdAtISO: assessedAtISO,
        sourceDocument: "Auto-evaluare maturitate DNSC (OUG 155/2024 Art.18(7))",
        legalReference: def.legalRef,
        remediationHint: def.closureRecipe,
      }
    })
}
