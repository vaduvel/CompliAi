/**
 * Approval Queue Engine — central hub for human-in-the-loop actions.
 *
 * Every medium/high/critical action can be routed through here
 * based on the user's autonomy settings.
 *
 * Supabase table: public.pending_actions
 */
import { supabaseInsert, supabaseSelect, supabaseUpdate } from "./supabase-rest"
import { hasSupabaseConfig } from "./supabase-rest"

// Detect network failures pentru fallback la local store.
// Mirror la helper-ul din anaf-submit-flow + supabase-rest.
function isSupabaseUnreachable(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  if (msg.includes("fetch failed")) return true
  if (msg.includes("enotfound")) return true
  if (msg.includes("econnrefused")) return true
  if (msg.includes("network error")) return true
  if (msg.includes("etimedout")) return true
  if (msg.includes("supabase circuit open")) return true
  const cause = (err as { cause?: unknown }).cause
  if (cause && cause !== err) return isSupabaseUnreachable(cause)
  return false
}

// ── Types ────────────────────────────────────────────────────────────────────

export type PendingActionType =
  | "repair_efactura"
  | "generate_document"
  | "resolve_finding"
  | "batch_action"
  | "submit_anaf"
  | "vendor_merge"
  | "auto_remediation"
  | "classify_ai_system"
  | "publish_trust_center"

export type PendingActionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "auto_executed"

export type RiskLevel = "low" | "medium" | "high" | "critical"

export type PendingAction = {
  id: string
  orgId: string
  userId: string | null
  actionType: PendingActionType
  riskLevel: RiskLevel
  status: PendingActionStatus
  originalData: Record<string, unknown> | null
  proposedData: Record<string, unknown> | null
  diffSummary: string | null
  explanation: string | null
  sourceFindingId: string | null
  sourceDocumentId: string | null
  createdAt: string
  expiresAt: string | null
  decidedAt: string | null
  decidedBy: string | null
  decidedByEmail: string | null
  decisionNote: string | null
  executedAt: string | null
  executionResult: Record<string, unknown> | null
  auditTrail: AuditEntry[]
}

export type AuditEntry = {
  action: string
  by: string
  at: string
  detail?: string
}

// ── Row type (Supabase snake_case) ───────────────────────────────────────────

type PendingActionRow = {
  id: string
  org_id: string
  user_id: string | null
  action_type: string
  risk_level: string
  status: string
  original_data: Record<string, unknown> | null
  proposed_data: Record<string, unknown> | null
  diff_summary: string | null
  explanation: string | null
  source_finding_id: string | null
  source_document_id: string | null
  created_at: string
  expires_at: string | null
  decided_at: string | null
  decided_by: string | null
  decided_by_email: string | null
  decision_note: string | null
  executed_at: string | null
  execution_result: Record<string, unknown> | null
  audit_trail: AuditEntry[]
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function rowToAction(row: PendingActionRow): PendingAction {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    actionType: row.action_type as PendingActionType,
    riskLevel: row.risk_level as RiskLevel,
    status: row.status as PendingActionStatus,
    originalData: row.original_data,
    proposedData: row.proposed_data,
    diffSummary: row.diff_summary,
    explanation: row.explanation,
    sourceFindingId: row.source_finding_id,
    sourceDocumentId: row.source_document_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    decidedAt: row.decided_at,
    decidedBy: row.decided_by,
    decidedByEmail: row.decided_by_email,
    decisionNote: row.decision_note,
    executedAt: row.executed_at,
    executionResult: row.execution_result,
    auditTrail: Array.isArray(row.audit_trail) ? row.audit_trail : [],
  }
}

// ── Local fallback (when Supabase is not configured) ─────────────────────────

const localActions = new Map<string, PendingActionRow[]>()

function getLocalActions(orgId: string): PendingActionRow[] {
  if (!localActions.has(orgId)) localActions.set(orgId, [])
  return localActions.get(orgId)!
}

// ── Core functions ───────────────────────────────────────────────────────────

export async function createPendingAction(params: {
  orgId: string
  userId?: string | null
  actionType: PendingActionType
  riskLevel: RiskLevel
  originalData?: Record<string, unknown>
  proposedData?: Record<string, unknown>
  diffSummary?: string
  explanation?: string
  sourceFindingId?: string
  sourceDocumentId?: string
  expiresInHours?: number
}): Promise<PendingAction> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const expiresAt = params.expiresInHours
    ? new Date(Date.now() + params.expiresInHours * 3600_000).toISOString()
    : null

  const row: PendingActionRow = {
    id,
    org_id: params.orgId,
    user_id: params.userId ?? null,
    action_type: params.actionType,
    risk_level: params.riskLevel,
    status: "pending",
    original_data: params.originalData ?? null,
    proposed_data: params.proposedData ?? null,
    diff_summary: params.diffSummary ?? null,
    explanation: params.explanation ?? null,
    source_finding_id: params.sourceFindingId ?? null,
    source_document_id: params.sourceDocumentId ?? null,
    created_at: now,
    expires_at: expiresAt,
    decided_at: null,
    decided_by: null,
    decided_by_email: null,
    decision_note: null,
    executed_at: null,
    execution_result: null,
    audit_trail: [{ action: "created", by: "system", at: now }],
  }

  if (hasSupabaseConfig()) {
    try {
      await supabaseInsert("pending_actions", [row], "public")
    } catch (err) {
      if (!isSupabaseUnreachable(err)) throw err
      getLocalActions(params.orgId).push(row)
    }
  } else {
    getLocalActions(params.orgId).push(row)
  }

  return rowToAction(row)
}

export async function listPendingActions(
  orgId: string,
  filters?: {
    status?: PendingActionStatus[]
    actionType?: PendingActionType[]
    riskLevel?: RiskLevel[]
    limit?: number
  }
): Promise<PendingAction[]> {
  const listLocal = () => {
    let actions = getLocalActions(orgId)
    if (filters?.status?.length) {
      actions = actions.filter((a) => filters.status!.includes(a.status as PendingActionStatus))
    }
    if (filters?.actionType?.length) {
      actions = actions.filter((a) => filters.actionType!.includes(a.action_type as PendingActionType))
    }
    if (filters?.riskLevel?.length) {
      actions = actions.filter((a) => filters.riskLevel!.includes(a.risk_level as RiskLevel))
    }
    return actions
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, filters?.limit ?? 100)
      .map(rowToAction)
  }
  if (hasSupabaseConfig()) {
    try {
      let query = `select=*&org_id=eq.${orgId}&order=created_at.desc`
      if (filters?.status?.length) {
        query += `&status=in.(${filters.status.join(",")})`
      }
      if (filters?.actionType?.length) {
        query += `&action_type=in.(${filters.actionType.join(",")})`
      }
      if (filters?.riskLevel?.length) {
        query += `&risk_level=in.(${filters.riskLevel.join(",")})`
      }
      query += `&limit=${filters?.limit ?? 100}`

      const rows = await supabaseSelect<PendingActionRow>("pending_actions", query, "public")
      return rows.map(rowToAction)
    } catch (err) {
      if (!isSupabaseUnreachable(err)) throw err
      return listLocal()
    }
  }

  // Local fallback (no Supabase config)
  return listLocal()
}

export async function getPendingAction(
  orgId: string,
  actionId: string
): Promise<PendingAction | null> {
  const fromLocal = () => {
    const row = getLocalActions(orgId).find((a) => a.id === actionId)
    return row ? rowToAction(row) : null
  }
  if (hasSupabaseConfig()) {
    try {
      const rows = await supabaseSelect<PendingActionRow>(
        "pending_actions",
        `select=*&org_id=eq.${orgId}&id=eq.${actionId}&limit=1`,
        "public"
      )
      return rows[0] ? rowToAction(rows[0]) : null
    } catch (err) {
      if (!isSupabaseUnreachable(err)) throw err
      return fromLocal()
    }
  }
  return fromLocal()
}

export async function decidePendingAction(params: {
  orgId: string
  actionId: string
  decision: "approved" | "rejected"
  decidedByEmail: string
  note?: string
}): Promise<PendingAction | null> {
  const now = new Date().toISOString()

  const decideLocal = () => {
    const row = getLocalActions(params.orgId).find((a) => a.id === params.actionId)
    if (!row || row.status !== "pending") return null

    row.status = params.decision
    row.decided_at = now
    row.decided_by_email = params.decidedByEmail
    row.decision_note = params.note ?? null
    row.audit_trail = [
      ...(Array.isArray(row.audit_trail) ? row.audit_trail : []),
      { action: params.decision, by: params.decidedByEmail, at: now, detail: params.note },
    ]
    return rowToAction(row)
  }

  if (hasSupabaseConfig()) {
    try {
      // Read current to append audit trail
      const current = await getPendingAction(params.orgId, params.actionId)
      if (!current || current.status !== "pending") return null

      const updatedTrail: AuditEntry[] = [
        ...current.auditTrail,
        {
          action: params.decision,
          by: params.decidedByEmail,
          at: now,
          detail: params.note,
        },
      ]

      await supabaseUpdate(
        "pending_actions",
        `org_id=eq.${params.orgId}&id=eq.${params.actionId}`,
        {
          status: params.decision,
          decided_at: now,
          decided_by_email: params.decidedByEmail,
          decision_note: params.note ?? null,
          audit_trail: updatedTrail,
        },
        "public"
      )

      return getPendingAction(params.orgId, params.actionId)
    } catch (err) {
      if (!isSupabaseUnreachable(err)) throw err
      return decideLocal()
    }
  }

  // Local fallback (no Supabase config)
  return decideLocal()
}

export async function markExecuted(
  orgId: string,
  actionId: string,
  result?: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString()
  const markLocal = () => {
    const row = getLocalActions(orgId).find((a) => a.id === actionId)
    if (row) {
      row.executed_at = now
      row.execution_result = result ?? null
    }
  }

  if (hasSupabaseConfig()) {
    try {
      const current = await getPendingAction(orgId, actionId)
      const trail: AuditEntry[] = [
        ...(current?.auditTrail ?? []),
        { action: "executed", by: "system", at: now },
      ]

      await supabaseUpdate(
        "pending_actions",
        `org_id=eq.${orgId}&id=eq.${actionId}`,
        {
          executed_at: now,
          execution_result: result ?? null,
          audit_trail: trail,
        },
        "public"
      )
    } catch (err) {
      if (!isSupabaseUnreachable(err)) throw err
      markLocal()
    }
  } else {
    markLocal()
  }
}

/**
 * Mark an action as auto_executed (semi-auto: elapsed 24h without rejection).
 * Distinct from markExecuted (user-initiated) — used only by the semi-auto sweeper.
 */
export async function markAutoExecuted(
  orgId: string,
  actionId: string,
  result?: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString()
  const markLocal = () => {
    const row = getLocalActions(orgId).find((a) => a.id === actionId)
    if (row) {
      row.status = "auto_executed"
      row.executed_at = now
      row.execution_result = result ?? null
    }
  }

  if (hasSupabaseConfig()) {
    try {
      const current = await getPendingAction(orgId, actionId)
      const trail: AuditEntry[] = [
        ...(current?.auditTrail ?? []),
        { action: "auto_executed", by: "system", at: now, detail: "Semi-auto: 24h window elapsed without rejection" },
      ]
      await supabaseUpdate(
        "pending_actions",
        `org_id=eq.${orgId}&id=eq.${actionId}`,
        {
          status: "auto_executed",
          executed_at: now,
          execution_result: result ?? null,
          audit_trail: trail,
        },
        "public"
      )
    } catch (err) {
      if (!isSupabaseUnreachable(err)) throw err
      markLocal()
    }
  } else {
    markLocal()
  }
}

export async function expireOldActions(orgId?: string): Promise<number> {
  const now = new Date().toISOString()

  if (hasSupabaseConfig()) {
    // Find expired pending actions
    let query = `select=id,org_id&status=eq.pending&expires_at=lt.${now}`
    if (orgId) query += `&org_id=eq.${orgId}`
    query += `&limit=100`

    const rows = await supabaseSelect<{ id: string; org_id: string }>(
      "pending_actions",
      query,
      "public"
    )

    for (const row of rows) {
      await supabaseUpdate(
        "pending_actions",
        `id=eq.${row.id}`,
        { status: "expired", audit_trail: [{ action: "expired", by: "system", at: now }] },
        "public"
      )
    }

    return rows.length
  }

  // Local fallback
  let count = 0
  const orgs = orgId ? [orgId] : Array.from(localActions.keys())
  for (const oid of orgs) {
    for (const row of getLocalActions(oid)) {
      if (row.status === "pending" && row.expires_at && row.expires_at < now) {
        row.status = "expired"
        count++
      }
    }
  }
  return count
}

// ── Counts helper ────────────────────────────────────────────────────────────

export async function getApprovalCounts(orgId: string): Promise<{
  pending: number
  approved: number
  rejected: number
  expired: number
}> {
  const all = await listPendingActions(orgId, { limit: 500 })
  return {
    pending: all.filter((a) => a.status === "pending").length,
    approved: all.filter((a) => a.status === "approved").length,
    rejected: all.filter((a) => a.status === "rejected").length,
    expired: all.filter((a) => a.status === "expired").length,
  }
}

// ── Action type labels (Romanian) ────────────────────────────────────────────

export const ACTION_TYPE_LABELS: Record<PendingActionType, string> = {
  repair_efactura: "Reparare e-Factură",
  generate_document: "Generare document",
  resolve_finding: "Rezolvare finding",
  batch_action: "Acțiune batch",
  submit_anaf: "Transmitere ANAF SPV",
  vendor_merge: "Unificare vendori",
  auto_remediation: "Auto-remediere",
  classify_ai_system: "Clasificare sistem AI",
  publish_trust_center: "Publicare Trust Center",
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Scăzut",
  medium: "Mediu",
  high: "Ridicat",
  critical: "Critic",
}
