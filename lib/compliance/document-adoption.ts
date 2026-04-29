import type { GeneratedDocumentKind } from "@/lib/compliance/types"

// Sprint 1.2 — Issue 3 DPO: adăugat "rejected" pentru flow respingere magic link.
// Adoption status diferit de adoptionStatus în lifecycle normal:
// - reviewed_internally → sent_for_signature → signed → active = happy path
// - rejected = patron a respins prin magic link cu motivare scrisă (NU intră în lifecycle)
export type DocumentAdoptionStatus =
  | "reviewed_internally"
  | "sent_for_signature"
  | "signed"
  | "active"
  | "rejected"

export const DOCUMENT_ADOPTION_LABELS: Record<DocumentAdoptionStatus, string> = {
  reviewed_internally: "revizuit intern",
  sent_for_signature: "trimis la semnare",
  signed: "semnat",
  active: "pus în uz",
  rejected: "respins de client",
}

export function supportsDocumentAdoption(documentType?: GeneratedDocumentKind | null) {
  return documentType === "dpa" || documentType === "contract-template" || documentType === "dsar-response"
}

export function getDocumentAdoptionProgress(status?: DocumentAdoptionStatus) {
  const steps: DocumentAdoptionStatus[] = [
    "reviewed_internally",
    "sent_for_signature",
    "signed",
    "active",
  ]
  const activeIndex = status ? steps.indexOf(status) : -1

  return steps.map((step, index) => ({
    id: step,
    label: DOCUMENT_ADOPTION_LABELS[step],
    state:
      activeIndex === -1
        ? index === 0
          ? "active"
          : "upcoming"
        : index < activeIndex
          ? "done"
          : index === activeIndex
            ? "active"
            : "upcoming",
  }))
}

export function getDocumentAdoptionHint(status?: DocumentAdoptionStatus) {
  switch (status) {
    case "reviewed_internally":
      return "Documentul este pregătit intern, dar încă nu a plecat către cealaltă parte sau către echipa care îl pune în uz."
    case "sent_for_signature":
      return "Documentul a plecat la semnare sau la aprobare externă. Următorul pas este să păstrezi urma de răspuns și statusul final."
    case "signed":
      return "Documentul este semnat sau acceptat bilateral. Mai rămâne doar să confirmi că a intrat efectiv în uz."
    case "active":
      return "Documentul este adoptat și poate rămâne în Dosar cu urmă clară pentru audit și reverificare."
    case "rejected":
      return "Documentul a fost respins de client cu motivare scrisă. Verifică motivul în comentariul atașat și pregătește o versiune nouă dacă este necesar."
    default:
      return "După ce documentul intră în Dosar, urmărești separat dacă a fost revizuit, trimis, semnat și pus efectiv în uz."
  }
}

export function getDocumentAdoptionFeedback(status: DocumentAdoptionStatus) {
  switch (status) {
    case "reviewed_internally":
      return "Am salvat că documentul a fost revizuit intern și este pregătit pentru pasul următor."
    case "sent_for_signature":
      return "Am salvat că documentul a fost trimis la semnare sau la aprobare externă."
    case "signed":
      return "Am salvat că documentul este semnat sau acceptat bilateral."
    case "active":
      return "Am salvat că documentul este deja pus în uz și rămâne urmă clară în Dosar."
    case "rejected":
      return "Am salvat respingerea clientului împreună cu motivarea scrisă. Documentul rămâne în Dosar ca dovadă a feedback-ului."
  }
}
