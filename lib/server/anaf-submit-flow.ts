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
  type AnafStatusResult,
  AnafClientError,
} from "./efactura-anaf-client"
import {
  SPV_STATUS_LABELS,
  type SPVSubmission,
  type SPVSubmissionStatus,
} from "@/lib/fiscal/spv-submission"
import {
  ensureValidToken,
} from "@/lib/anaf-spv-client"
import {
  createPendingAction,
  getPendingAction,
  markExecuted,
  type PendingAction,
} from "./approval-queue"
import { hasSupabaseConfig, supabaseInsert, supabaseSelect, supabaseUpdate } from "./supabase-rest"
import { readStateForOrg, writeStateForOrg } from "./mvp-store"

// ── Types ────────────────────────────────────────────────────────────────────

type SubmissionApprovalPayload = {
  invoiceId?: string
  cif?: string
  xmlLength?: number
  mode?: string
  xmlContent?: string
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
  invoiceId: string
  xmlContent: string
  cif: string
  sourceFindingId?: string
}): Promise<{ submission: SPVSubmission; pendingAction: PendingAction }> {
  const { orgId, userId, invoiceId, xmlContent, cif, sourceFindingId } = params
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
      xmlContent,
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

  // Get XML from durable approval payload first, then memory cache as fallback.
  const proposedData = (action.proposedData ?? null) as SubmissionApprovalPayload | null
  const xmlFromApproval =
    proposedData && typeof proposedData.xmlContent === "string" && proposedData.xmlContent.trim().length > 0
      ? proposedData.xmlContent
      : null
  const xmlContent = xmlFromApproval ?? xmlCache.get(submissionId) ?? null
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

    // Gate D: resolve or reopen the linked finding when ANAF gives a final verdict
    if (changed && (newStatus === "ok" || newStatus === "nok")) {
      const finalSubmission = updated ?? submission
      if (newStatus === "ok") {
        await resolveLinkedFinding(orgId, finalSubmission)
      } else {
        await reopenLinkedFinding(orgId, finalSubmission)
      }
    }

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
  const submissions = hasSupabaseConfig()
    ? (
        await supabaseSelect<SPVSubmissionRow>(
          "spv_submissions",
          `select=*&org_id=eq.${orgId}&order=created_at.desc&limit=${limit}`,
          "public"
        )
      ).map(rowToSubmission)
    : getLocalSubmissions(orgId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit)
        .map(rowToSubmission)

  return Promise.all(submissions.map((submission) => reconcileSubmissionApprovalState(submission)))
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
    return rows[0] ? reconcileSubmissionApprovalState(rowToSubmission(rows[0])) : null
  }

  const row = getLocalSubmissions(orgId).find((r) => r.id === submissionId)
  return row ? reconcileSubmissionApprovalState(rowToSubmission(row)) : null
}

export async function syncSubmissionApprovalDecision(params: {
  orgId: string
  approvalActionId: string
  decision: "approved" | "rejected"
  note?: string
}): Promise<SPVSubmission | null> {
  const submission = await getSubmissionByApprovalActionId(params.orgId, params.approvalActionId)
  if (!submission) return null

  if (params.decision === "approved") {
    await updateSubmissionStatus(params.orgId, submission.id, "approved", {
      error_detail: null,
    })
    return {
      ...submission,
      status: "approved",
      errorDetail: null,
    }
  }

  const errorDetail = params.note?.trim() || "Transmiterea a fost respinsă în coada de aprobare."
  await updateSubmissionStatus(params.orgId, submission.id, "rejected", {
    error_detail: errorDetail,
    resolved_at: new Date().toISOString(),
  })

  return {
    ...submission,
    status: "rejected",
    errorDetail,
    resolvedAtISO: new Date().toISOString(),
  }
}

async function getSubmissionByApprovalActionId(
  orgId: string,
  approvalActionId: string
): Promise<SPVSubmission | null> {
  if (hasSupabaseConfig()) {
    const rows = await supabaseSelect<SPVSubmissionRow>(
      "spv_submissions",
      `select=*&org_id=eq.${orgId}&approval_action_id=eq.${approvalActionId}&limit=1`,
      "public"
    )
    return rows[0] ? rowToSubmission(rows[0]) : null
  }

  const row = getLocalSubmissions(orgId).find((r) => r.approval_action_id === approvalActionId)
  return row ? rowToSubmission(row) : null
}

// ── Internal helpers ────────────────────────────────────────────────────────

async function reconcileSubmissionApprovalState(submission: SPVSubmission): Promise<SPVSubmission> {
  if (submission.status !== "pending_approval") return submission

  const action = await getPendingAction(submission.orgId, submission.approvalActionId)
  if (!action) return submission

  if (action.status === "approved") {
    await updateSubmissionStatus(submission.orgId, submission.id, "approved", {
      error_detail: null,
    })
    return {
      ...submission,
      status: "approved",
      errorDetail: null,
    }
  }

  if (action.status === "rejected") {
    const errorDetail = action.decisionNote?.trim() || "Transmiterea a fost respinsă în coada de aprobare."
    await updateSubmissionStatus(submission.orgId, submission.id, "rejected", {
      error_detail: errorDetail,
      resolved_at: action.decidedAt ?? new Date().toISOString(),
    })
    return {
      ...submission,
      status: "rejected",
      errorDetail,
      resolvedAtISO: action.decidedAt ?? submission.resolvedAtISO,
    }
  }

  return submission
}

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

// ── Finding resolution after ANAF verdict ────────────────────────────────────

async function resolveLinkedFinding(orgId: string, submission: SPVSubmission): Promise<void> {
  if (!submission.sourceFindingId) return
  try {
    const state = await readStateForOrg(orgId)
    if (!state) return
    const idx = state.findings.findIndex((f) => f.id === submission.sourceFindingId)
    if (idx === -1) return
    const now = new Date().toISOString()
    const finding = state.findings[idx]
    const updatedFindings = [...state.findings]
    updatedFindings[idx] = {
      ...finding,
      findingStatus: "under_monitoring",
      findingStatusUpdatedAtISO: now,
      nextMonitoringDateISO: new Date(Date.now() + 90 * 86_400_000).toISOString(),
      resolution: {
        problem: finding.resolution?.problem ?? finding.detail,
        impact: finding.resolution?.impact ?? "Factură transmisă și acceptată la ANAF.",
        action: finding.resolution?.action ?? "E-Factura a fost transmisă în SPV.",
        closureEvidence: `Factură acceptată ANAF. Index încărcare: ${submission.indexDescarcare ?? "N/A"}. Transmis: ${submission.submittedAtISO ?? now}.`,
        humanStep: "Factură aprobată și transmisă la ANAF prin fluxul complet de aprobare.",
        revalidation: "Reverificare trimestrială a statusului în SPV.",
        reviewedAtISO: now,
      },
    }
    await writeStateForOrg(orgId, { ...state, findings: updatedFindings })
  } catch {
    // Don't fail status check if finding update fails
  }
}

async function reopenLinkedFinding(orgId: string, submission: SPVSubmission): Promise<void> {
  if (!submission.sourceFindingId) return
  try {
    const state = await readStateForOrg(orgId)
    if (!state) return
    const idx = state.findings.findIndex((f) => f.id === submission.sourceFindingId)
    if (idx === -1) return
    const now = new Date().toISOString()
    const finding = state.findings[idx]
    const updatedFindings = [...state.findings]
    updatedFindings[idx] = {
      ...finding,
      findingStatus: "open",
      findingStatusUpdatedAtISO: now,
      reopenedFromISO: finding.findingStatusUpdatedAtISO ?? now,
      resolution: {
        ...finding.resolution,
        problem: finding.resolution?.problem ?? finding.detail,
        impact: finding.resolution?.impact ?? "Factura a fost respinsă de ANAF și trebuie corectată.",
        action: finding.resolution?.action ?? "Corectează factura și retransmite.",
        closureEvidence: `Factură respinsă ANAF. Eroare: ${submission.anafMessage ?? submission.errorDetail ?? "Necunoscută"}. Corectează și retransmite.`,
        reviewedAtISO: now,
      },
    }
    await writeStateForOrg(orgId, { ...state, findings: updatedFindings })
  } catch {
    // Don't fail status check if finding update fails
  }
}

export { SPV_STATUS_LABELS }
