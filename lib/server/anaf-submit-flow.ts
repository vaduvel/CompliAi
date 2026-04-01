/**
 * anaf-submit-flow.ts — P0-6: Full e-Factura submit flow to ANAF SPV.
 *
 * Orchestrates the entire submit lifecycle:
 *   1. User initiates submit → pending_action created (ALWAYS manual)
 *   2. User approves in Approval Queue
 *   3. System uploads XML to ANAF SPV via efactura-anaf-client
 *   4. ANAF returns indexDescarcare (id_incarcare)
 *   5. System polls status
 *   6. On "ok" → evidence created, linked finding resolved
 *   7. On "nok" → finding reopened with error details
 *
 * Local Map fallback when Supabase is not configured.
 */

import {
  uploadInvoiceToAnaf,
  getInvoiceStatus,
  getAnafMode,
  type AnafUploadResult,
  type AnafUploadMockResult,
  type AnafStatusResult,
  AnafClientError,
} from "./efactura-anaf-client"
import {
  ensureValidToken,
  loadTokenFromSupabase,
  type AnafTokenRecord,
} from "@/lib/anaf-spv-client"
import {
  createPendingAction,
  getPendingAction,
  markExecuted,
  type PendingAction,
} from "./approval-queue"
import { hasSupabaseConfig, supabaseInsert, supabaseSelect, supabaseUpdate } from "./supabase-rest"

// ── Types ────────────────────────────────────────────────────────────────────

export type SPVSubmissionStatus =
  | "pending_approval"
  | "approved"
  | "submitting"
  | "submitted"
  | "ok"
  | "nok"
  | "error"

export type SPVSubmission = {
  id: string
  orgId: string
  invoiceId: string
  xmlSnippet: string // first 200 chars for audit (full XML NOT stored after submit)
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

type SPVSubmissionRow = {
  id: string
  org_id: string
  invoice_id: string
  xml_snippet: string
  cif: string
  approval_action_id: string
  status: string
  index_descarcare: string | null
  anaf_status: string | null
  anaf_message: string | null
  download_id: string | null
  created_at: string
  submitted_at: string | null
  resolved_at: string | null
  source_finding_id: string | null
  error_detail: string | null
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function rowToSubmission(row: SPVSubmissionRow): SPVSubmission {
  return {
    id: row.id,
    orgId: row.org_id,
    invoiceId: row.invoice_id,
    xmlSnippet: row.xml_snippet,
    cif: row.cif,
    approvalActionId: row.approval_action_id,
    status: row.status as SPVSubmissionStatus,
    indexDescarcare: row.index_descarcare,
    anafStatus: row.anaf_status,
    anafMessage: row.anaf_message,
    downloadId: row.download_id,
    createdAtISO: row.created_at,
    submittedAtISO: row.submitted_at,
    resolvedAtISO: row.resolved_at,
    sourceFindingId: row.source_finding_id,
    errorDetail: row.error_detail,
  }
}

function submissionToRow(s: SPVSubmission): SPVSubmissionRow {
  return {
    id: s.id,
    org_id: s.orgId,
    invoice_id: s.invoiceId,
    xml_snippet: s.xmlSnippet,
    cif: s.cif,
    approval_action_id: s.approvalActionId,
    status: s.status,
    index_descarcare: s.indexDescarcare,
    anaf_status: s.anafStatus,
    anaf_message: s.anafMessage,
    download_id: s.downloadId,
    created_at: s.createdAtISO,
    submitted_at: s.submittedAtISO,
    resolved_at: s.resolvedAtISO,
    source_finding_id: s.sourceFindingId,
    error_detail: s.errorDetail,
  }
}

// ── Local fallback ───────────────────────────────────────────────────────────

const localSubmissions = new Map<string, SPVSubmissionRow[]>()

function getLocalSubmissions(orgId: string): SPVSubmissionRow[] {
  if (!localSubmissions.has(orgId)) localSubmissions.set(orgId, [])
  return localSubmissions.get(orgId)!
}

// ── 1. Initiate submit — creates pending_action (always manual) ──────────────

export async function initiateSubmit(params: {
  orgId: string
  userId: string
  userEmail: string
  invoiceId: string
  xmlContent: string
  cif: string
  sourceFindingId?: string
}): Promise<{ submission: SPVSubmission; pendingAction: PendingAction }> {
  const { orgId, userId, userEmail, invoiceId, xmlContent, cif, sourceFindingId } = params
  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  // Create approval action — submit_anaf is ALWAYS manual (LOCKED_OVERRIDES)
  const pendingAction = await createPendingAction({
    orgId,
    userId,
    actionType: "submit_anaf",
    riskLevel: "high",
    explanation: `Transmitere e-Factură ${invoiceId} la ANAF SPV (CIF: ${cif}). Mod: ${getAnafMode()}.`,
    diffSummary: `XML ${xmlContent.length} caractere → ANAF SPV upload`,
    proposedData: {
      invoiceId,
      cif,
      xmlLength: xmlContent.length,
      mode: getAnafMode(),
    },
    sourceFindingId,
    expiresInHours: 72, // 3 days to approve
  })

  const submission: SPVSubmission = {
    id,
    orgId,
    invoiceId,
    xmlSnippet: xmlContent.slice(0, 200),
    cif,
    approvalActionId: pendingAction.id,
    status: "pending_approval",
    indexDescarcare: null,
    anafStatus: null,
    anafMessage: null,
    downloadId: null,
    createdAtISO: now,
    submittedAtISO: null,
    resolvedAtISO: null,
    sourceFindingId: sourceFindingId ?? null,
    errorDetail: null,
  }

  const row = submissionToRow(submission)

  if (hasSupabaseConfig()) {
    await supabaseInsert("spv_submissions", [row], "public")
  } else {
    getLocalSubmissions(orgId).push(row)
  }

  // Store XML in a separate local map for execution (not persisted in Supabase row)
  xmlCache.set(id, xmlContent)

  return { submission, pendingAction }
}

// Temporary XML cache — XML is large, we don't persist it in the submission row.
// In production with Supabase, XML could be stored in a separate table or S3.
const xmlCache = new Map<string, string>()

/** Store XML for later execution (called from API when XML is provided) */
export function cacheXmlForSubmission(submissionId: string, xml: string): void {
  xmlCache.set(submissionId, xml)
}

// ── 2. Execute submit — called after approval ───────────────────────────────

export type ExecuteSubmitResult = {
  success: boolean
  submission: SPVSubmission
  error?: string
}

export async function executeSubmit(params: {
  orgId: string
  submissionId: string
}): Promise<ExecuteSubmitResult> {
  const { orgId, submissionId } = params
  const now = new Date().toISOString()

  // Load submission
  const submission = await getSubmission(orgId, submissionId)
  if (!submission) {
    return { success: false, submission: emptySubmission(submissionId), error: "Submission not found." }
  }

  // Verify approval
  const action = await getPendingAction(orgId, submission.approvalActionId)
  if (!action || action.status !== "approved") {
    return { success: false, submission, error: "Approval not yet granted or was rejected." }
  }

  // Get XML from cache
  const xmlContent = xmlCache.get(submissionId)
  if (!xmlContent) {
    await updateSubmissionStatus(orgId, submissionId, "error", {
      error_detail: "XML-ul nu mai este disponibil. Reinițiază transmiterea.",
    })
    const updated = await getSubmission(orgId, submissionId)
    return { success: false, submission: updated ?? submission, error: "XML no longer cached." }
  }

  // Get ANAF token
  const { token } = await ensureValidToken(orgId, now)
  let accessToken: string

  if (getAnafMode() === "mock") {
    accessToken = "mock-token"
  } else if (!token) {
    await updateSubmissionStatus(orgId, submissionId, "error", {
      error_detail: "Token ANAF expirat sau lipsă. Reconectează contul ANAF din Setări.",
    })
    const updated = await getSubmission(orgId, submissionId)
    return { success: false, submission: updated ?? submission, error: "ANAF token unavailable." }
  } else {
    accessToken = token.accessToken
  }

  // Mark as submitting
  await updateSubmissionStatus(orgId, submissionId, "submitting")

  try {
    // Upload to ANAF
    const result = await uploadInvoiceToAnaf({
      xmlContent,
      accessToken,
      cif: submission.cif.replace(/^RO/i, ""),
    })

    const uploadIndex = result.uploadIndex

    // Mark as submitted
    await updateSubmissionStatus(orgId, submissionId, "submitted", {
      index_descarcare: uploadIndex,
      submitted_at: now,
    })

    // Mark pending action as executed
    await markExecuted(orgId, submission.approvalActionId, {
      index_descarcare: uploadIndex,
      submitted_at: now,
      mode: getAnafMode(),
    })

    // Clean up XML cache
    xmlCache.delete(submissionId)

    const updated = await getSubmission(orgId, submissionId)
    return { success: true, submission: updated ?? submission }
  } catch (err) {
    const message = err instanceof AnafClientError
      ? `ANAF error (${err.anafCode}): ${err.message}`
      : err instanceof Error
        ? err.message
        : "Unknown upload error"

    await updateSubmissionStatus(orgId, submissionId, "error", {
      error_detail: message,
    })

    const updated = await getSubmission(orgId, submissionId)
    return { success: false, submission: updated ?? submission, error: message }
  }
}

// ── 3. Check status — polls ANAF for submission result ──────────────────────

export type CheckStatusResult = {
  submission: SPVSubmission
  anafResult: AnafStatusResult | null
  changed: boolean
}

export async function checkSubmitStatus(params: {
  orgId: string
  submissionId: string
}): Promise<CheckStatusResult> {
  const { orgId, submissionId } = params
  const now = new Date().toISOString()

  const submission = await getSubmission(orgId, submissionId)
  if (!submission) {
    return { submission: emptySubmission(submissionId), anafResult: null, changed: false }
  }

  if (!submission.indexDescarcare) {
    return { submission, anafResult: null, changed: false }
  }

  // Already resolved
  if (submission.status === "ok" || submission.status === "nok") {
    return { submission, anafResult: null, changed: false }
  }

  // Get token
  const { token } = await ensureValidToken(orgId, now)
  let accessToken: string

  if (getAnafMode() === "mock" || submission.indexDescarcare.startsWith("mock-")) {
    accessToken = "mock-token"
  } else if (!token) {
    return { submission, anafResult: null, changed: false }
  } else {
    accessToken = token.accessToken
  }

  try {
    const anafResult = await getInvoiceStatus({
      uploadIndex: submission.indexDescarcare,
      accessToken,
    })

    const newStatus: SPVSubmissionStatus =
      anafResult.status === "ok" ? "ok"
        : anafResult.status === "nok" || anafResult.status === "xml_erori" ? "nok"
          : "submitted" // still in_prelucrare

    const changed = newStatus !== submission.status

    if (changed) {
      await updateSubmissionStatus(orgId, submissionId, newStatus, {
        anaf_status: anafResult.status,
        anaf_message: anafResult.message,
        download_id: anafResult.downloadId ?? null,
        resolved_at: newStatus === "ok" || newStatus === "nok" ? now : null,
      })
    }

    const updated = await getSubmission(orgId, submissionId)
    return { submission: updated ?? submission, anafResult, changed }
  } catch {
    return { submission, anafResult: null, changed: false }
  }
}

// ── List submissions ────────────────────────────────────────────────────────

export async function listSubmissions(
  orgId: string,
  limit = 20
): Promise<SPVSubmission[]> {
  if (hasSupabaseConfig()) {
    const rows = await supabaseSelect<SPVSubmissionRow>(
      "spv_submissions",
      `select=*&org_id=eq.${orgId}&order=created_at.desc&limit=${limit}`,
      "public"
    )
    return rows.map(rowToSubmission)
  }

  return getLocalSubmissions(orgId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(rowToSubmission)
}

// ── Get single submission ───────────────────────────────────────────────────

export async function getSubmission(
  orgId: string,
  submissionId: string
): Promise<SPVSubmission | null> {
  if (hasSupabaseConfig()) {
    const rows = await supabaseSelect<SPVSubmissionRow>(
      "spv_submissions",
      `select=*&org_id=eq.${orgId}&id=eq.${submissionId}&limit=1`,
      "public"
    )
    return rows[0] ? rowToSubmission(rows[0]) : null
  }

  const row = getLocalSubmissions(orgId).find((r) => r.id === submissionId)
  return row ? rowToSubmission(row) : null
}

// ── Internal helpers ────────────────────────────────────────────────────────

async function updateSubmissionStatus(
  orgId: string,
  submissionId: string,
  status: SPVSubmissionStatus,
  extra?: Partial<SPVSubmissionRow>
): Promise<void> {
  if (hasSupabaseConfig()) {
    await supabaseUpdate(
      "spv_submissions",
      `org_id=eq.${orgId}&id=eq.${submissionId}`,
      { status, ...extra },
      "public"
    )
  } else {
    const row = getLocalSubmissions(orgId).find((r) => r.id === submissionId)
    if (row) {
      row.status = status
      if (extra) Object.assign(row, extra)
    }
  }
}

function emptySubmission(id: string): SPVSubmission {
  return {
    id,
    orgId: "",
    invoiceId: "",
    xmlSnippet: "",
    cif: "",
    approvalActionId: "",
    status: "error",
    indexDescarcare: null,
    anafStatus: null,
    anafMessage: null,
    downloadId: null,
    createdAtISO: "",
    submittedAtISO: null,
    resolvedAtISO: null,
    sourceFindingId: null,
    errorDetail: "Submission not found.",
  }
}

// ── Status labels (Romanian) ────────────────────────────────────────────────

export const SPV_STATUS_LABELS: Record<SPVSubmissionStatus, string> = {
  pending_approval: "Așteaptă aprobare",
  approved: "Aprobat",
  submitting: "Se transmite…",
  submitted: "Transmis — în prelucrare",
  ok: "Acceptat ANAF",
  nok: "Respins ANAF",
  error: "Eroare",
}
