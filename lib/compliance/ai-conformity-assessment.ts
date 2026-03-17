// EU AI Act Conformity Assessment — 10-question workflow → gap analysis.
// Each question maps to specific EU AI Act articles and generates remediation actions.

export type AssessmentAnswer = "yes" | "no" | "partial" | "na"

export type AssessmentQuestion = {
  id: string
  text: string
  hint: string
  /** EU AI Act article(s) */
  legalRef: string
  /** Weight in conformity score (0–10) */
  weight: number
  /** If yes = good, or no = good */
  positiveAnswer: "yes" | "no"
  /** What action to take when non-conformant */
  remediationHint: string
  category: "risk_class" | "human_oversight" | "documentation" | "data_governance" | "transparency" | "registration"
}

export const AI_CONFORMITY_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q1-risk-class",
    text: "Sistemul AI face parte dintr-o categorie de risc ridicat conform Anexei III EU AI Act?",
    hint: "Anexa III include: biometrie, infrastructură critică, educație, angajare, servicii esențiale, aplicarea legii, migrație, administrare justiție.",
    legalRef: "EU AI Act Anexa III + Art. 6",
    weight: 10,
    positiveAnswer: "no",
    remediationHint: "Dacă sistemul face parte din Anexa III, aplică toate cerințele pentru risc ridicat: documentație tehnică, QMS, înregistrare UE, etc.",
    category: "risk_class",
  },
  {
    id: "q2-prohibited",
    text: "Sistemul AI folosește practici interzise (manipulare subliminală, scoruri sociale, identificare biometrică în timp real în spații publice)?",
    hint: "Practicile interzise din Art. 5 includ: manipularea comportamentală exploatativă, sisteme de scoring social de stat, identificare biometrică în timp real în spații publice de către autorități (cu excepții).",
    legalRef: "EU AI Act Art. 5",
    weight: 10,
    positiveAnswer: "no",
    remediationHint: "Practicile interzise duc la amenzi de până la €35M sau 7% din CA. Oprește imediat și consultă un jurist specializat în AI Act.",
    category: "risk_class",
  },
  {
    id: "q3-human-oversight",
    text: "Există supraveghere umană efectivă a deciziilor sistemului AI (human in the loop)?",
    hint: "Un om competent poate opri, corecta sau suprascrie orice decizie a sistemului. Există proceduri documentate pentru intervenție umană.",
    legalRef: "EU AI Act Art. 14",
    weight: 9,
    positiveAnswer: "yes",
    remediationHint: "Implementează un mecanism de override manual, desemnează responsabili, documentează procedura de supraveghere. Instruiește utilizatorii.",
    category: "human_oversight",
  },
  {
    id: "q4-technical-doc",
    text: "Există documentație tehnică completă conform Art. 11 + Anexa IV?",
    hint: "Documentația tehnică (Annexa IV) include: descrierea sistemului, arhitectura, datele de antrenament, metricile de performanță, limitele cunoscute, cerințele hardware.",
    legalRef: "EU AI Act Art. 11 + Anexa IV",
    weight: 8,
    positiveAnswer: "yes",
    remediationHint: "Creează documentația tehnică cu toate elementele din Anexa IV. CompliScan poate genera un template Annex IV cu datele sistemului tău.",
    category: "documentation",
  },
  {
    id: "q5-qms",
    text: "Există un sistem de management al calității (QMS) documentat conform Art. 9?",
    hint: "QMS include: politici de gestionare a riscului, proceduri de testare, responsabilități, înregistrări de conformitate, revizuiri periodice.",
    legalRef: "EU AI Act Art. 9",
    weight: 8,
    positiveAnswer: "yes",
    remediationHint: "Implementează un QMS minim: politică de risc AI, proceduri de testare, log-uri de incidente, revizuire anuală. Documentează totul.",
    category: "documentation",
  },
  {
    id: "q6-data-governance",
    text: "Există politici de guvernanță a datelor de antrenament și testare (calitate, bias, origine)?",
    hint: "Datele folosite pentru antrenament trebuie să fie relevante, reprezentative, fără bias discriminatoriu, cu origine verificabilă.",
    legalRef: "EU AI Act Art. 10",
    weight: 7,
    positiveAnswer: "yes",
    remediationHint: "Documentează originea, procesarea și calitatea datelor de antrenament. Rulează analize de bias. Menține un data card / model card.",
    category: "data_governance",
  },
  {
    id: "q7-transparency",
    text: "Utilizatorii sunt informați că interacționează cu un sistem AI (transparență Art. 13)?",
    hint: "Sistemele de risc ridicat trebuie să fie transparente față de utilizatori: capabilități, limitări, nivel de acuratețe, contact pentru întrebări.",
    legalRef: "EU AI Act Art. 13",
    weight: 7,
    positiveAnswer: "yes",
    remediationHint: "Adaugă notificări clare că utilizatorii interacționează cu AI. Publică instrucțiunile de utilizare. Menționează limitele și acuratețea.",
    category: "transparency",
  },
  {
    id: "q8-logging",
    text: "Există logging automat al deciziilor sistemului (trasabilitate Art. 12)?",
    hint: "Sistemele de risc ridicat trebuie să logheze automat evenimentele relevante: decizii, inputuri, timestamps, pentru a permite auditul.",
    legalRef: "EU AI Act Art. 12",
    weight: 6,
    positiveAnswer: "yes",
    remediationHint: "Implementează logging structurat al deciziilor: input, output, timestamp, ID utilizator. Păstrează log-urile minim 6 luni.",
    category: "documentation",
  },
  {
    id: "q9-post-market",
    text: "Există un plan de monitorizare post-implementare (post-market monitoring)?",
    hint: "Providerii de sisteme de risc ridicat trebuie să monitorizeze performanța și să raporteze incidentele grave la autorități.",
    legalRef: "EU AI Act Art. 72–73",
    weight: 6,
    positiveAnswer: "yes",
    remediationHint: "Stabilește KPI-uri de monitorizare, un proces de raportare a incidentelor și un calendar de revizuire periodică a performanței.",
    category: "documentation",
  },
  {
    id: "q10-registration",
    text: "Sistemul de risc ridicat este înregistrat în baza de date UE (EU AI Act Art. 71)?",
    hint: "Sistemele de risc ridicat trebuie înregistrate în baza de date EU AI Act înainte de introducerea pe piață sau punerea în funcțiune.",
    legalRef: "EU AI Act Art. 71",
    weight: 5,
    positiveAnswer: "yes",
    remediationHint: "Înregistrează sistemul în EU AI Act database (euaidb.eu). Necesită documentația tehnică completă și declarația de conformitate.",
    category: "registration",
  },
]

// ── Scoring ───────────────────────────────────────────────────────────────────

export type AssessmentAnswers = Record<string, AssessmentAnswer>

export type AssessmentGapItem = {
  questionId: string
  question: string
  legalRef: string
  severity: "critical" | "high" | "medium"
  remediationHint: string
}

export type AssessmentResult = {
  score: number
  maxScore: number
  conformityPercent: number
  riskLabel: "risc-acceptabil" | "lacune-moderate" | "neconform-critic"
  gaps: AssessmentGapItem[]
  passedCount: number
  totalCount: number
}

function questionPasses(q: AssessmentQuestion, answer: AssessmentAnswer): boolean {
  if (answer === "na") return true
  if (q.positiveAnswer === "yes") return answer === "yes"
  return answer === "no"
}

function questionWeight(q: AssessmentQuestion, answer: AssessmentAnswer): number {
  if (answer === "na") return q.weight
  if (questionPasses(q, answer)) return q.weight
  if (answer === "partial") return Math.round(q.weight * 0.4)
  return 0
}

function gapSeverity(q: AssessmentQuestion): "critical" | "high" | "medium" {
  if (q.weight >= 9) return "critical"
  if (q.weight >= 7) return "high"
  return "medium"
}

export function scoreAssessment(answers: AssessmentAnswers): AssessmentResult {
  let score = 0
  let maxScore = 0
  let passedCount = 0
  const gaps: AssessmentGapItem[] = []

  for (const q of AI_CONFORMITY_QUESTIONS) {
    const answer = answers[q.id] ?? "no"
    maxScore += q.weight
    const earned = questionWeight(q, answer)
    score += earned

    if (questionPasses(q, answer)) {
      passedCount++
    } else {
      gaps.push({
        questionId: q.id,
        question: q.text,
        legalRef: q.legalRef,
        severity: gapSeverity(q),
        remediationHint: q.remediationHint,
      })
    }
  }

  const conformityPercent = Math.round((score / maxScore) * 100)

  let riskLabel: AssessmentResult["riskLabel"]
  if (conformityPercent >= 80) riskLabel = "risc-acceptabil"
  else if (conformityPercent >= 50) riskLabel = "lacune-moderate"
  else riskLabel = "neconform-critic"

  return {
    score,
    maxScore,
    conformityPercent,
    riskLabel,
    gaps: gaps.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2 }
      return order[a.severity] - order[b.severity]
    }),
    passedCount,
    totalCount: AI_CONFORMITY_QUESTIONS.length,
  }
}
