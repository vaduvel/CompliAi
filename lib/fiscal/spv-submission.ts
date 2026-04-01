export type SPVSubmissionStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "submitting"
  | "submitted"
  | "ok"
  | "nok"
  | "error"

export type SPVSubmission = {
  id: string
  orgId: string
  invoiceId: string
  xmlSnippet: string
  cif: string
  approvalActionId: string
  status: SPVSubmissionStatus
  indexDescarcare: string | null
  anafStatus: string | null
  anafMessage: string | null
  downloadId: string | null
  createdAtISO: string
  submittedAtISO: string | null
  resolvedAtISO: string | null
  sourceFindingId: string | null
  errorDetail: string | null
}

export const SPV_STATUS_LABELS: Record<SPVSubmissionStatus, string> = {
  pending_approval: "Așteaptă aprobare",
  approved: "Aprobat",
  rejected: "Respins la aprobare",
  submitting: "Se transmite…",
  submitted: "Transmis — în prelucrare",
  ok: "Acceptat ANAF",
  nok: "Respins ANAF",
  error: "Eroare",
}
