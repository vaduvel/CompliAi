// V3 P2.1 — Shadow AI Questionnaire
// Ajută organizațiile să identifice utilizarea nedeclarată a sistemelor AI (Shadow AI)
// și să evalueze riscul de conformitate EU AI Act + GDPR.

import type { ScanFinding } from "@/lib/compliance/types"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShadowAiQuestionType = "yes-no" | "multi-select" | "radio"

export type ShadowAiOption = {
  value: string
  label: string
  riskFlag?: boolean   // dacă selectat, adaugă risc
}

export type ShadowAiQuestion = {
  id: string
  section: string
  text: string
  helpText?: string
  type: ShadowAiQuestionType
  options?: ShadowAiOption[]
  riskWeight: number   // 1-3: cât de grav e un răspuns risc
  aiActRef?: string
}

export type ShadowAiAnswer = {
  questionId: string
  value: string | string[]
}

export type ShadowAiRiskLevel = "critical" | "high" | "medium" | "low" | "none"

export type ShadowAiAssessmentResult = {
  completedAtISO: string
  riskLevel: ShadowAiRiskLevel
  riskScore: number          // 0-100
  detectedCategories: string[]   // categorii de shadow AI identificate
  recommendations: string[]
  findings: ScanFinding[]
}

// ── Questionnaire definition ──────────────────────────────────────────────────

export const SHADOW_AI_QUESTIONS: ShadowAiQuestion[] = [
  // Secțiunea 1 — Utilizare generală
  {
    id: "sq-general-chatgpt",
    section: "Utilizare generală AI",
    text: "Angajații utilizează instrumente AI generative (ChatGPT, Claude, Gemini, Copilot) pentru activități de lucru?",
    helpText: "Include utilizarea conturilor personale pentru sarcini profesionale.",
    type: "radio",
    options: [
      { value: "no", label: "Nu, nu există utilizare AI la nivel de organizație" },
      { value: "personal-only", label: "Doar conturi personale, neoficial", riskFlag: true },
      { value: "approved", label: "Da, cu instrumente aprobate de IT" },
      { value: "mixed", label: "Mix — unii folosesc aprobat, alții neoficial", riskFlag: true },
      { value: "unknown", label: "Nu știm / nu am verificat", riskFlag: true },
    ],
    riskWeight: 3,
    aiActRef: "EU AI Act Art. 28 — Obligațiile utilizatorilor de sisteme AI",
  },
  {
    id: "sq-sensitive-data",
    section: "Utilizare generală AI",
    text: "Sunt procesate date sensibile sau confidențiale prin instrumente AI externe?",
    helpText: "Date despre clienți, angajați, date financiare, IP, date personale (GDPR).",
    type: "radio",
    options: [
      { value: "no", label: "Nu, nu intrăm date sensibile în AI extern" },
      { value: "sometimes", label: "Uneori, fără politică clară", riskFlag: true },
      { value: "yes", label: "Da, în mod regulat", riskFlag: true },
      { value: "unknown", label: "Nu știm exact ce date introduc angajații", riskFlag: true },
    ],
    riskWeight: 3,
    aiActRef: "GDPR Art. 9 + EU AI Act Art. 10 — Guvernanța datelor",
  },

  // Secțiunea 2 — Instrumente specifice
  {
    id: "sq-tools-used",
    section: "Instrumente AI utilizate",
    text: "Ce categorii de instrumente AI sunt utilizate în organizație (oficial sau neoficial)?",
    type: "multi-select",
    options: [
      { value: "writing-assistants", label: "Asistenți de scriere (Grammarly AI, etc.)" },
      { value: "code-assistants", label: "Asistenți de cod (GitHub Copilot, Cursor, etc.)", riskFlag: true },
      { value: "document-ai", label: "Procesare documente cu AI (rezumate, extracție date)" },
      { value: "hr-ai", label: "Instrumente AI în HR (screening CV-uri, evaluare performanță)", riskFlag: true },
      { value: "customer-facing", label: "Chatbots sau AI customer-facing", riskFlag: true },
      { value: "analytics-ai", label: "AI în analytics / BI (previziuni, anomalii)" },
      { value: "email-ai", label: "AI integrat în email / calendar (drafturi automate)" },
      { value: "meeting-ai", label: "Transcriere/rezumare ședințe cu AI (Otter, Fireflies)", riskFlag: true },
      { value: "none", label: "Niciun instrument AI identificat" },
    ],
    riskWeight: 2,
    aiActRef: "EU AI Act Art. 49 — Cerințe de înregistrare",
  },
  {
    id: "sq-saas-embedded",
    section: "Instrumente AI utilizate",
    text: "Există instrumente SaaS utilizate de organizație care includ funcționalități AI integrate (Copilot în Office 365, AI în Salesforce, Notion AI etc.)?",
    type: "radio",
    options: [
      { value: "no", label: "Nu sau nu știm" },
      { value: "yes-reviewed", label: "Da, și am verificat implicațiile de conformitate" },
      { value: "yes-not-reviewed", label: "Da, dar nu am verificat conformitatea", riskFlag: true },
    ],
    riskWeight: 2,
    aiActRef: "EU AI Act Art. 28 — Utilizatori de sisteme AI",
  },

  // Secțiunea 3 — Politici și control
  {
    id: "sq-ai-policy",
    section: "Politici și guvernanță AI",
    text: "Organizația are o politică formală de utilizare a instrumentelor AI?",
    type: "radio",
    options: [
      { value: "yes-enforced", label: "Da, politică aprobată și comunicată angajaților" },
      { value: "yes-draft", label: "Da, în lucru / draft neaprobat încă" },
      { value: "no", label: "Nu există politică AI", riskFlag: true },
      { value: "unknown", label: "Nu știm / nu a fost discutat", riskFlag: true },
    ],
    riskWeight: 2,
    aiActRef: "EU AI Act Art. 9 — Sisteme de management al riscului",
  },
  {
    id: "sq-ai-inventory",
    section: "Politici și guvernanță AI",
    text: "Există un inventar al tuturor sistemelor și instrumentelor AI utilizate în organizație?",
    type: "radio",
    options: [
      { value: "yes-complete", label: "Da, inventar complet și actualizat" },
      { value: "yes-partial", label: "Da, parțial / incomplete" },
      { value: "no", label: "Nu există inventar formal", riskFlag: true },
    ],
    riskWeight: 2,
    aiActRef: "EU AI Act Art. 49 — Înregistrare și documentare",
  },
  {
    id: "sq-approval-process",
    section: "Politici și guvernanță AI",
    text: "Există un proces de aprobare pentru adoptarea de noi instrumente AI?",
    type: "radio",
    options: [
      { value: "yes", label: "Da, fiecare instrument nou necesită aprobare IT/Compliance" },
      { value: "informal", label: "Informal, fără proces documentat", riskFlag: true },
      { value: "no", label: "Nu, angajații adoptă liber ce instrumente doresc", riskFlag: true },
    ],
    riskWeight: 2,
  },

  // Secțiunea 4 — Impact și risc
  {
    id: "sq-high-risk-decisions",
    section: "Impact și risc",
    text: "Sunt utilizate instrumente AI în procese care afectează decizii cu impact semnificativ asupra persoanelor?",
    helpText: "Ex: recrutare, evaluare performanță, aprobare credite, scoring clienți, acces la servicii.",
    type: "radio",
    options: [
      { value: "no", label: "Nu, AI-ul nu influențează decizii critice" },
      { value: "supporting-only", label: "Doar suport informațional, decizia o ia omul" },
      { value: "yes-with-oversight", label: "Da, cu supraveghere umană documentată" },
      { value: "yes-automated", label: "Da, parțial automatizat fără supraveghere clară", riskFlag: true },
    ],
    riskWeight: 3,
    aiActRef: "EU AI Act Annex III — Sisteme AI cu risc ridicat",
  },
  {
    id: "sq-data-processing-third-party",
    section: "Impact și risc",
    text: "Date despre angajați sau clienți ajung la furnizori AI terți fără consimțământ explicit sau DPA (Data Processing Agreement)?",
    type: "radio",
    options: [
      { value: "no", label: "Nu, toate DPA-urile sunt la zi" },
      { value: "partial", label: "Parțial — unii furnizori nu au DPA semnat", riskFlag: true },
      { value: "yes", label: "Da, fără DPA în mai multe cazuri", riskFlag: true },
      { value: "unknown", label: "Nu știm care furnizori AI au DPA", riskFlag: true },
    ],
    riskWeight: 3,
    aiActRef: "GDPR Art. 28 — Operatori și persoane împuternicite",
  },
]

// ── Risk calculation ──────────────────────────────────────────────────────────

export function calculateShadowAiRisk(answers: ShadowAiAnswer[]): {
  riskScore: number
  riskLevel: ShadowAiRiskLevel
  detectedCategories: string[]
} {
  let weightedRiskPoints = 0
  let maxPossiblePoints = 0
  const detectedCategories: string[] = []

  for (const q of SHADOW_AI_QUESTIONS) {
    const answer = answers.find((a) => a.questionId === q.id)
    if (!answer) continue

    maxPossiblePoints += q.riskWeight * 3  // max risk per question

    const values = Array.isArray(answer.value) ? answer.value : [answer.value]

    if (q.type === "multi-select") {
      const riskOptions = (q.options ?? []).filter(
        (opt) => opt.riskFlag && values.includes(opt.value)
      )
      if (riskOptions.length > 0) {
        weightedRiskPoints += q.riskWeight * Math.min(riskOptions.length, 3)
        // map to category names
        if (values.includes("hr-ai")) detectedCategories.push("AI în HR")
        if (values.includes("customer-facing")) detectedCategories.push("AI customer-facing")
        if (values.includes("code-assistants")) detectedCategories.push("Asistenți cod neaprobați")
        if (values.includes("meeting-ai")) detectedCategories.push("Transcriere ședințe AI")
      }
    } else {
      const selectedOption = (q.options ?? []).find((opt) => opt.value === values[0])
      if (selectedOption?.riskFlag) {
        weightedRiskPoints += q.riskWeight * 2

        // detect categories based on question + answer
        if (q.id === "sq-general-chatgpt" && values[0] !== "approved") {
          detectedCategories.push("AI generativ neaprobat")
        }
        if (q.id === "sq-sensitive-data" && values[0] !== "no") {
          detectedCategories.push("Date sensibile în AI extern")
        }
        if (q.id === "sq-high-risk-decisions" && values[0] === "yes-automated") {
          detectedCategories.push("Decizii automate cu impact uman")
        }
        if (q.id === "sq-data-processing-third-party" && values[0] !== "no") {
          detectedCategories.push("Furnizori AI fără DPA")
        }
      }
    }
  }

  if (maxPossiblePoints === 0) {
    return { riskScore: 0, riskLevel: "none", detectedCategories: [] }
  }

  const riskScore = Math.round((weightedRiskPoints / maxPossiblePoints) * 100)
  const riskLevel: ShadowAiRiskLevel =
    riskScore >= 70 ? "critical" :
    riskScore >= 45 ? "high" :
    riskScore >= 25 ? "medium" :
    riskScore > 0 ? "low" : "none"

  return { riskScore, riskLevel, detectedCategories: [...new Set(detectedCategories)] }
}

// ── Finding generation ────────────────────────────────────────────────────────

export function buildShadowAiFindings(
  result: Pick<ShadowAiAssessmentResult, "riskLevel" | "detectedCategories">,
  nowISO: string
): ScanFinding[] {
  const findings: ScanFinding[] = []

  if (result.riskLevel === "none") return findings

  // Main shadow AI finding
  findings.push({
    id: "shadow-ai-risk",
    title: "Shadow AI identificat în organizație",
    detail: `Instrumente AI utilizate fără aprobare sau politică formală: ${result.detectedCategories.join(", ") || "utilizare necontrolată detectată"}.`,
    category: "EU_AI_ACT",
    severity: result.riskLevel === "critical" || result.riskLevel === "high" ? "high" : "medium",
    risk: result.riskLevel === "critical" || result.riskLevel === "high" ? "high" : "low",
    principles: ["accountability", "transparency"],
    createdAtISO: nowISO,
    sourceDocument: "Shadow AI Questionnaire",
    legalReference: "EU AI Act Art. 28 + Art. 49",
    impactSummary: "Utilizarea necontrolată a AI poate duce la scurgeri de date, decizii automate neconforme și amenzi EU AI Act.",
    remediationHint: "Creați un inventar al instrumentelor AI, implementați o politică de utilizare AI și semnați DPA-uri cu furnizorii AI.",
    resolution: {
      problem: "Organizația utilizează instrumente AI fără aprobare formală sau politici clare.",
      impact: "Risc de neconformitate EU AI Act, scurgeri de date sensibile și amenzi GDPR.",
      action: "Inventariați toate instrumentele AI, elaborați o politică de utilizare AI și revizuiți DPA-urile furnizorilor.",
      generatedAsset: "Chestionar Shadow AI completat",
      humanStep: "Aprobați lista instrumentelor permise și comunicați politica angajaților.",
      closureEvidence: "Politică AI aprobată + inventar complet + DPA-uri semnate",
      revalidation: "Reverificați la 6 luni sau la adoptarea de noi instrumente AI",
    },
  })

  // Specific finding for high-risk decisions
  if (result.detectedCategories.includes("Decizii automate cu impact uman")) {
    findings.push({
      id: "shadow-ai-high-risk-decisions",
      title: "Decizii cu impact uman parțial automatizate fără supraveghere",
      detail: "Instrumente AI influențează decizii (HR, credit, acces servicii) fără supraveghere umană documentată.",
      category: "EU_AI_ACT",
      severity: "critical",
      risk: "high",
      principles: ["oversight", "accountability", "fairness"],
      createdAtISO: nowISO,
      sourceDocument: "Shadow AI Questionnaire",
      legalReference: "EU AI Act Annex III — Sisteme AI cu risc ridicat",
      remediationHint: "Identificați sistemele AI implicate în decizii critice și implementați supraveghere umană documentată.",
      resolution: {
        problem: "Decizii cu impact semnificativ asupra persoanelor sunt parțial automatizate de AI fără supraveghere umană clară.",
        impact: "Risc major de neconformitate EU AI Act — sistemele din Anexa III necesită supraveghere umană obligatorie.",
        action: "Identificați toate sistemele AI implicate în decizii critice și documentați mecanismul de supraveghere umană.",
        humanStep: "Desemnați responsabil și documentați procesul de validare umană pentru fiecare sistem.",
        closureEvidence: "Documentație supraveghere umană per sistem AI + training angajați",
        revalidation: "Audit intern trimestrial al deciziilor automatizate",
      },
    })
  }

  // Specific finding for data without DPA
  if (result.detectedCategories.includes("Furnizori AI fără DPA")) {
    findings.push({
      id: "shadow-ai-missing-dpa",
      title: "Date personale transmise la furnizori AI fără DPA",
      detail: "Date despre angajați sau clienți procesate de furnizori AI terți fără acord de procesare date (DPA) semnat.",
      category: "GDPR",
      severity: "critical",
      risk: "high",
      principles: ["privacy_data_governance", "accountability"],
      createdAtISO: nowISO,
      sourceDocument: "Shadow AI Questionnaire",
      legalReference: "GDPR Art. 28 — Operatori și persoane împuternicite",
      remediationHint: "Identificați toți furnizorii AI care procesează date personale și semnați DPA-uri.",
      resolution: {
        problem: "Date personale (angajați/clienți) ajung la furnizori AI fără contract de procesare date.",
        impact: "Încălcare GDPR Art. 28 — amenzi până la 4% din cifra de afaceri globală.",
        action: "Identificați toți furnizorii AI, verificați dacă au DPA disponibil și semnați-l înainte de continuarea utilizării.",
        humanStep: "Contact juridic + negociere DPA cu furnizorii AI principali.",
        closureEvidence: "DPA semnat cu toți furnizorii AI care procesează date personale",
        revalidation: "Verificare anuală la reînnoire contracte",
      },
    })
  }

  return findings
}

// ── Recommendation generation ─────────────────────────────────────────────────

export function buildShadowAiRecommendations(
  answers: ShadowAiAnswer[],
  riskLevel: ShadowAiRiskLevel
): string[] {
  const recs: string[] = []

  const get = (id: string) => answers.find((a) => a.questionId === id)?.value

  if (get("sq-ai-policy") === "no" || get("sq-ai-policy") === "unknown") {
    recs.push("Elaborați o politică de utilizare AI aprobată de management.")
  }
  if (get("sq-ai-inventory") === "no") {
    recs.push("Creați un inventar al tuturor instrumentelor AI utilizate în organizație.")
  }
  if (get("sq-approval-process") === "no" || get("sq-approval-process") === "informal") {
    recs.push("Implementați un proces formal de aprobare pentru noi instrumente AI.")
  }
  if (get("sq-sensitive-data") !== "no") {
    recs.push("Stabiliți reguli clare despre ce date pot fi introduse în instrumente AI externe.")
  }
  if (get("sq-data-processing-third-party") !== "no") {
    recs.push("Verificați și semnați DPA-uri cu toți furnizorii AI care procesează date personale.")
  }
  if (get("sq-high-risk-decisions") === "yes-automated") {
    recs.push("Documentați mecanismul de supraveghere umană pentru toate deciziile AI cu impact uman.")
  }
  if (riskLevel === "critical" || riskLevel === "high") {
    recs.push("Realizați un audit intern urgent al utilizării AI în toate departamentele.")
  }

  return recs
}

export const SHADOW_AI_SECTIONS = [
  "Utilizare generală AI",
  "Instrumente AI utilizate",
  "Politici și guvernanță AI",
  "Impact și risc",
]
