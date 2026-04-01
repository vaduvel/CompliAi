export type ProcurementQuestion = {
  id: string
  question: string
  answer: "yes" | "no" | "partial" | "n/a"
  evidence?: string
  source: "auto" | "manual"
}

export type ProcurementQuestionnaireInput = {
  gdpr: {
    hasRopa: boolean
    hasPrivacyPolicy: boolean
    hasDpa: boolean
    gdprProgress: number
    openFindings: number
    evidenceItems: Array<{ title: string }>
  }
  nis2: {
    applicable: boolean
    dnscRegistered: boolean
    assessmentScore: number | null
    maturityScore: number | null
    openIncidents: number
    vendorsCount: number
  }
  security: {
    aiSystemsCount: number
    highRiskAiCount: number
    vendorReviewsTotal: number
    vendorReviewsOpen: number
    vendorReviewsCritical: number
  }
}

function evidenceLabel(
  items: Array<{ title: string }>,
  fallback: string
) {
  return items.slice(0, 2).map((item) => item.title).join(", ") || fallback
}

export function buildProcurementQuestionnaire(
  input: ProcurementQuestionnaireInput
): ProcurementQuestion[] {
  const gdprEvidence = evidenceLabel(input.gdpr.evidenceItems, "Dosar GDPR aprobat")

  return [
    {
      id: "gdpr-program",
      question: "Există un program GDPR activ și documentat?",
      answer:
        input.gdpr.gdprProgress >= 80 && input.gdpr.openFindings === 0
          ? "yes"
          : input.gdpr.gdprProgress >= 45
            ? "partial"
            : "no",
      evidence: gdprEvidence,
      source: "auto",
    },
    {
      id: "dpa-available",
      question: "Este disponibil un DPA pentru relațiile de procesare date?",
      answer: input.gdpr.hasDpa ? "yes" : "no",
      evidence: input.gdpr.hasDpa ? gdprEvidence : "Lipsește document DPA validat",
      source: "auto",
    },
    {
      id: "ropa-available",
      question: "Există un registru RoPA / registru de prelucrări?",
      answer: input.gdpr.hasRopa ? "yes" : "no",
      evidence: input.gdpr.hasRopa ? gdprEvidence : "Nu există RoPA aprobată în Dosar",
      source: "auto",
    },
    {
      id: "privacy-policy",
      question: "Politica de confidențialitate este disponibilă și actualizată?",
      answer: input.gdpr.hasPrivacyPolicy ? "yes" : "no",
      evidence: input.gdpr.hasPrivacyPolicy ? gdprEvidence : "Politica de confidențialitate nu este aprobată",
      source: "auto",
    },
    {
      id: "nis2-scope",
      question: "Organizația intră sau poate intra în scop NIS2?",
      answer: input.nis2.applicable ? "yes" : "n/a",
      evidence: input.nis2.applicable ? "Semnale NIS2 active în workspace" : "NIS2 nu este aplicabilă acum",
      source: "auto",
    },
    {
      id: "dnsc-registration",
      question: "Înregistrarea DNSC este confirmată?",
      answer: input.nis2.applicable ? (input.nis2.dnscRegistered ? "yes" : "partial") : "n/a",
      evidence: input.nis2.applicable
        ? input.nis2.dnscRegistered
          ? "Status DNSC confirmat"
          : "Înregistrare DNSC încă neconfirmată"
        : "În afara scopului NIS2",
      source: "auto",
    },
    {
      id: "nis2-incidents",
      question: "Există incidente NIS2 deschise în acest moment?",
      answer: input.nis2.applicable ? (input.nis2.openIncidents > 0 ? "yes" : "no") : "n/a",
      evidence: input.nis2.applicable
        ? input.nis2.openIncidents > 0
          ? `${input.nis2.openIncidents} incident(e) deschis(e)`
          : "Niciun incident NIS2 deschis"
        : "În afara scopului NIS2",
      source: "auto",
    },
    {
      id: "vendor-review-program",
      question: "Există un program activ de vendor review / third-party review?",
      answer:
        input.security.vendorReviewsTotal === 0
          ? "no"
          : input.security.vendorReviewsOpen === 0
            ? "yes"
            : "partial",
      evidence:
        input.security.vendorReviewsTotal === 0
          ? "Nu există review-uri vendor în registru"
          : `${input.security.vendorReviewsTotal} review-uri vendor, ${input.security.vendorReviewsOpen} deschise`,
      source: "auto",
    },
    {
      id: "vendor-critical-gaps",
      question: "Există gap-uri critice deschise în lanțul de furnizori?",
      answer: input.security.vendorReviewsCritical > 0 ? "yes" : "no",
      evidence:
        input.security.vendorReviewsCritical > 0
          ? `${input.security.vendorReviewsCritical} review-uri critice deschise`
          : "Nu există review-uri vendor critice deschise",
      source: "auto",
    },
    {
      id: "ai-risk-control",
      question: "Sistemele AI cu risc ridicat sunt identificate și urmărite?",
      answer:
        input.security.aiSystemsCount === 0
          ? "n/a"
          : input.security.highRiskAiCount === 0
            ? "yes"
            : "partial",
      evidence:
        input.security.aiSystemsCount === 0
          ? "Nu există sisteme AI în inventar"
          : `${input.security.aiSystemsCount} sisteme AI inventariate, ${input.security.highRiskAiCount} high-risk`,
      source: "auto",
    },
  ]
}
