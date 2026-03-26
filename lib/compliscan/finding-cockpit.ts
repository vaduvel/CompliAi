import type { ScanFinding } from "@/lib/compliance/types"

export type FindingDocumentFlowState =
  | "not_required"
  | "draft_missing"
  | "draft_ready"
  | "attached_as_evidence"

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary" | "outline"

export const FINDING_DOCUMENT_LABELS: Record<string, string> = {
  "privacy-policy": "Politică de confidențialitate",
  "cookie-policy": "Politică de cookies",
  "dpa": "DPA (Acord de prelucrare date)",
  "retention-policy": "Politică și matrice de retenție",
  "ai-governance": "Politică de utilizare AI",
  "nis2-incident-response": "Plan de răspuns NIS2",
}

export function getSuggestedDocumentLabel(documentType?: string | null) {
  if (!documentType) return null
  return FINDING_DOCUMENT_LABELS[documentType] ?? documentType
}

export function isFindingResolvedLike(status?: ScanFinding["findingStatus"]) {
  return status === "resolved" || status === "under_monitoring"
}

export function isFindingActive(
  findingOrStatus?: ScanFinding | ScanFinding["findingStatus"]
) {
  const status =
    typeof findingOrStatus === "object" ? findingOrStatus?.findingStatus : findingOrStatus

  return status !== "dismissed" && !isFindingResolvedLike(status)
}

export function getFindingStatusPresentation(status?: ScanFinding["findingStatus"]): {
  label: string
  variant: BadgeVariant
} {
  if (status === "under_monitoring") {
    return { label: "Monitorizat", variant: "success" }
  }
  if (status === "resolved") {
    return { label: "Rezolvat", variant: "success" }
  }
  if (status === "dismissed") {
    return { label: "Respins", variant: "secondary" }
  }
  if (status === "confirmed") {
    return { label: "Confirmat", variant: "default" }
  }
  return { label: "Deschis", variant: "warning" }
}

export function getFindingDocumentFlowPresentation(
  state: FindingDocumentFlowState = "not_required"
): {
  label: string
  variant: BadgeVariant
  summary: string
} {
  if (state === "attached_as_evidence") {
    return {
      label: "dovadă atașată",
      variant: "success",
      summary: "Draftul a fost aprobat și legat de finding ca dovadă verificabilă.",
    }
  }

  if (state === "draft_ready") {
    return {
      label: "draft gata de review",
      variant: "default",
      summary: "Există deja un draft. Mai rămân review-ul explicit și atașarea ca dovadă.",
    }
  }

  if (state === "draft_missing") {
    return {
      label: "draft necesar",
      variant: "warning",
      summary: "Flow-ul documentar nu este complet până când draftul este generat și verificat.",
    }
  }

  return {
    label: "fără draft obligatoriu",
    variant: "secondary",
    summary: "Pentru acest finding poți închide cazul cu dovada operațională potrivită.",
  }
}

export function getFindingAgeLabel(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return "azi"
  if (days === 1) return "ieri"
  if (days < 30) return `acum ${days} zile`
  return `acum ${Math.floor(days / 30)} luni`
}

export function getFindingNarrative(finding: ScanFinding) {
  const suggestedDocumentLabel = getSuggestedDocumentLabel(finding.suggestedDocumentType)

  return {
    problem: finding.resolution?.problem ?? finding.detail,
    impact:
      finding.resolution?.impact ??
      finding.impactSummary ??
      "Riscul rămâne deschis până când măsura este aplicată și rezultatul este salvat la dosar.",
    action:
      finding.resolution?.action ??
      finding.remediationHint ??
      "Pornești remedierea, confirmi explicit rezultatul și atașezi dovada corectă.",
    generatedAsset:
      finding.resolution?.generatedAsset ??
      (suggestedDocumentLabel
        ? `Compli poate pregăti ${suggestedDocumentLabel} direct din flow-ul finding-ului.`
        : null),
    humanStep:
      finding.resolution?.humanStep ??
      finding.readyText ??
      "Confirmi că măsura reflectă realitatea firmei înainte de închidere.",
    evidence:
      finding.resolution?.closureEvidence ??
      finding.evidenceRequired ??
      (suggestedDocumentLabel
        ? "Draftul verificat și aprobat se atașează ca dovadă pentru închiderea finding-ului."
        : "Atașezi dovada operațională care confirmă că măsura a fost aplicată."),
    revalidation: finding.resolution?.revalidation ?? finding.rescanHint ?? null,
    suggestedDocumentLabel,
  }
}

export function getFindingAutoAction(finding: ScanFinding): {
  label: string
  href: string
  type: "document" | "scan" | "assessment"
} | null {
  if (finding.id === "dsar-no-procedure") {
    return {
      label: "Creează procedura DSAR",
      href: "/dashboard/dsar",
      type: "assessment",
    }
  }

  if (finding.id === "saft-d406-registration") {
    return {
      label: "Verifică statusul D406",
      href: "/dashboard/fiscal",
      type: "assessment",
    }
  }

  if (finding.id.startsWith("saft-")) {
    return {
      label: "Vezi dashboard fiscal",
      href: "/dashboard/fiscal",
      type: "assessment",
    }
  }

  if (finding.id === "nis2-finding-eligibility") {
    return {
      label: "Revizuiește eligibilitatea NIS2",
      href: "/dashboard/nis2/eligibility",
      type: "assessment",
    }
  }

  if (finding.id.startsWith("nis2-finding-")) {
    return {
      label: "Actualizează evaluarea NIS2",
      href: "/dashboard/nis2",
      type: "assessment",
    }
  }

  if (
    finding.id.startsWith("site-") ||
    finding.sourceDocument?.toLowerCase().includes("scan")
  ) {
    return {
      label: "Re-scanează sursa",
      href: "/dashboard/scan",
      type: "scan",
    }
  }

  if (finding.suggestedDocumentType && getSuggestedDocumentLabel(finding.suggestedDocumentType)) {
    return {
      label: `Generează ${getSuggestedDocumentLabel(finding.suggestedDocumentType)}`,
      href: `/dashboard/resolve/${finding.id}?generator=1`,
      type: "document",
    }
  }

  return null
}

export type FindingProgressStep = {
  id: string
  label: string
  hint: string
  state: "done" | "active" | "upcoming"
}

type LinkedGeneratedDocumentMeta = {
  approvalStatus?: "draft" | "approved_as_evidence"
}

export function getFindingProgressSteps(
  finding: ScanFinding,
  documentFlowState: FindingDocumentFlowState = "not_required",
  linkedGeneratedDocument?: LinkedGeneratedDocumentMeta | null
): FindingProgressStep[] {
  const status = finding.findingStatus ?? "open"
  const requiresDocument = Boolean(finding.suggestedDocumentType)
  const narrative = getFindingNarrative(finding)
  const step2Label = requiresDocument ? "Generezi draftul" : "Pregătești dovada"
  const step2Hint = requiresDocument
    ? narrative.generatedAsset ?? "Compli pregătește draftul necesar pentru finding."
    : "Pregătești artefactul sau dovada operațională potrivită."
  const step3Label = requiresDocument ? "Confirmi și atașezi" : "Confirmi și închizi"
  const step3Hint = requiresDocument
    ? "Review explicit, checklist și legare la dosar."
    : "Confirmi măsura și atașezi dovada potrivită."
  const step4Label = finding.rescanHint || finding.resolution?.revalidation ? "Re-scan / revalidare" : "Verificare"
  const step4Hint =
    finding.resolution?.revalidation ??
    finding.rescanHint ??
    "Confirmăm că rezultatul rămâne valid și auditabil."
  const step5Hint = requiresDocument
    ? "Documentul și dovada intră sub watch pentru drift, review și schimbări noi."
    : "Cazul rămâne sub watch pentru drift, expirări sau schimbări noi."

  let activeIndex = 0

  if (status === "dismissed") {
    activeIndex = 0
  } else if (isFindingResolvedLike(status)) {
    activeIndex = 4
  } else if (documentFlowState === "draft_ready" || linkedGeneratedDocument?.approvalStatus === "draft") {
    activeIndex = 2
  } else if (status === "confirmed" || documentFlowState === "draft_missing") {
    activeIndex = 1
  }

  const steps: Array<Omit<FindingProgressStep, "state">> = [
    {
      id: "detected",
      label: "Detectat",
      hint: "Problema este confirmată și gata de lucru.",
    },
    {
      id: "prepared",
      label: step2Label,
      hint: step2Hint,
    },
    {
      id: "attached",
      label: step3Label,
      hint: step3Hint,
    },
    {
      id: "verified",
      label: step4Label,
      hint: step4Hint,
    },
    {
      id: "monitored",
      label: "Monitorizat",
      hint: step5Hint,
    },
  ]

  return steps.map((step, index) => ({
    ...step,
    state:
      index < activeIndex
        ? "done"
        : index === activeIndex
          ? "active"
          : "upcoming",
  }))
}

export function getFindingMonitoringSignals(
  finding: ScanFinding,
  linkedGeneratedDocument?: {
    nextReviewDateISO?: string
    expiresAtISO?: string
  } | null
) {
  const signals: string[] = []

  if (linkedGeneratedDocument?.nextReviewDateISO) {
    signals.push(
      `Reverificare recomandată la ${new Date(linkedGeneratedDocument.nextReviewDateISO).toLocaleDateString("ro-RO")}`
    )
  }

  if (linkedGeneratedDocument?.expiresAtISO) {
    signals.push(
      `Documentul expiră la ${new Date(linkedGeneratedDocument.expiresAtISO).toLocaleDateString("ro-RO")}`
    )
  }

  if (finding.resolution?.revalidation) {
    signals.push(finding.resolution.revalidation)
  }

  if (finding.rescanHint) {
    signals.push(finding.rescanHint)
  }

  if (finding.sourceDocument?.toLowerCase().includes("scan") || finding.id.startsWith("site-")) {
    signals.push("Se redeschide dacă sursa scanată sau website-ul se schimbă semnificativ.")
  }

  if (finding.suggestedDocumentType) {
    signals.push("Se redeschide dacă draftul aprobat nu mai bate cu baseline-ul sau cu politicile actuale.")
  }

  if (finding.legalReference) {
    signals.push("Rămâne sub watch pentru modificări legislative și semnale relevante din domeniul aferent.")
  }

  return Array.from(new Set(signals)).slice(0, 4)
}
