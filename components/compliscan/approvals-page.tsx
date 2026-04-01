"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import type {
  PendingAction,
  PendingActionStatus,
  RiskLevel,
} from "@/lib/server/approval-queue"
import { ACTION_TYPE_LABELS, RISK_LEVEL_LABELS } from "@/lib/server/approval-queue"

// ── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "pending" | "approved" | "rejected" | "all"
type ApprovalCounts = { pending: number; approved: number; rejected: number; expired: number }

// ── Helpers ──────────────────────────────────────────────────────────────────

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return "azi"
  if (days === 1) return "ieri"
  if (days < 30) return `${days}z`
  return `${Math.floor(days / 30)}l`
}

function riskColor(risk: RiskLevel): string {
  switch (risk) {
    case "critical":
      return "text-eos-error"
    case "high":
      return "text-eos-error"
    case "medium":
      return "text-eos-warning"
    case "low":
      return "text-eos-text-tertiary"
  }
}

function riskBorderColor(risk: RiskLevel): string {
  switch (risk) {
    case "critical":
    case "high":
      return "border-l-eos-error"
    case "medium":
      return "border-l-eos-warning"
    case "low":
      return "border-l-eos-border-subtle"
  }
}

function statusBadge(status: PendingActionStatus) {
  switch (status) {
    case "pending":
      return { label: "Așteaptă", cls: "bg-eos-warning/10 text-eos-warning" }
    case "approved":
      return { label: "Aprobat", cls: "bg-eos-success/10 text-eos-success" }
    case "rejected":
      return { label: "Respins", cls: "bg-eos-error/10 text-eos-error" }
    case "expired":
      return { label: "Expirat", cls: "bg-eos-surface-active text-eos-text-tertiary" }
    case "auto_executed":
      return { label: "Auto-executat", cls: "bg-eos-primary/10 text-eos-primary" }
  }
}

// ── Data hook ────────────────────────────────────────────────────────────────

function useApprovals() {
  const [actions, setActions] = useState<PendingAction[]>([])
  const [counts, setCounts] = useState<ApprovalCounts>({ pending: 0, approved: 0, rejected: 0, expired: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActions = useCallback(async (status?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (status && status !== "all") params.set("status", status)
      params.set("limit", "100")

      const res = await fetch(`/api/approvals?${params.toString()}`)
      if (!res.ok) throw new Error("Eroare la încărcarea aprobărilor.")
      const data = await res.json()
      setActions(data.actions ?? [])
      setCounts(data.counts ?? { pending: 0, approved: 0, rejected: 0, expired: 0 })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActions()
  }, [fetchActions])

  return { actions, counts, loading, error, refetch: fetchActions }
}

// ── Decision handler ─────────────────────────────────────────────────────────

async function decideAction(
  actionId: string,
  decision: "approved" | "rejected",
  note?: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/approvals/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Action Row ───────────────────────────────────────────────────────────────

function ActionRow({
  action,
  onSelect,
}: {
  action: PendingAction
  onSelect: (action: PendingAction) => void
}) {
  const badge = statusBadge(action.status)
  const borderCls = riskBorderColor(action.riskLevel)

  return (
    <button
      type="button"
      onClick={() => onSelect(action)}
      className={`group flex w-full items-center gap-3 overflow-hidden rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant border-l-[3px] py-3.5 pl-4 pr-4 text-left transition-all hover:bg-eos-surface-active ${borderCls}`}
    >
      <div className="min-w-0 flex-1">
        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-eos-text">
          {ACTION_TYPE_LABELS[action.actionType] ?? action.actionType}
        </p>
        <p className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-eos-text-tertiary">
          {action.explanation ?? action.diffSummary ?? "Fără descriere"}
        </p>
      </div>
      <span className={`hidden shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold sm:inline-flex ${badge.cls}`}>
        {badge.label}
      </span>
      <span className={`shrink-0 text-[11px] font-semibold ${riskColor(action.riskLevel)}`}>
        {RISK_LEVEL_LABELS[action.riskLevel]}
      </span>
      <span className="shrink-0 text-[10px] tabular-nums text-eos-text-tertiary">
        {ageLabel(action.createdAt)}
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-eos-text-tertiary transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
    </button>
  )
}

// ── Action Detail Panel ──────────────────────────────────────────────────────

function ActionDetailPanel({
  action,
  onClose,
  onDecided,
}: {
  action: PendingAction
  onClose: () => void
  onDecided: () => void
}) {
  const [note, setNote] = useState("")
  const [deciding, setDeciding] = useState(false)
  const badge = statusBadge(action.status)
  const isPending = action.status === "pending"

  async function handleDecision(decision: "approved" | "rejected") {
    setDeciding(true)
    const ok = await decideAction(action.id, decision, note || undefined)
    setDeciding(false)
    if (ok) {
      toast.success(
        decision === "approved" ? "Aprobare salvată." : "Acțiunea a fost respinsă.",
        {
          description:
            action.actionType === "submit_anaf" && decision === "approved"
              ? "Transmiterea fiscală poate continua din tabul Fiscal."
              : undefined,
        }
      )
      onDecided()
      return
    }

    toast.error("Nu am putut salva decizia.")
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-eos-xl border border-eos-border bg-eos-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-eos-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-eos-text">
            {ACTION_TYPE_LABELS[action.actionType] ?? action.actionType}
          </p>
          <p className="mt-0.5 text-xs text-eos-text-tertiary">
            Creat {ageLabel(action.createdAt)} &middot;{" "}
            <span className={riskColor(action.riskLevel)}>
              {RISK_LEVEL_LABELS[action.riskLevel]}
            </span>
          </p>
        </div>
        <span className={`mr-3 rounded px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-eos-md p-1.5 text-eos-text-tertiary transition-colors hover:bg-eos-surface-active hover:text-eos-text"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Explanation */}
        {action.explanation && (
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
              Explicație
            </p>
            <p className="text-sm text-eos-text">{action.explanation}</p>
          </div>
        )}

        {/* Diff summary */}
        {action.diffSummary && (
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
              Rezumat modificări
            </p>
            <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-4 py-3">
              <p className="whitespace-pre-wrap text-xs font-mono text-eos-text-muted">
                {action.diffSummary}
              </p>
            </div>
          </div>
        )}

        {/* Proposed data */}
        {action.proposedData && Object.keys(action.proposedData).length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
              Date propuse
            </p>
            <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-4 py-3">
              <pre className="whitespace-pre-wrap text-xs font-mono text-eos-text-muted">
                {JSON.stringify(action.proposedData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Audit trail */}
        {action.auditTrail.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
              Istoric
            </p>
            <div className="space-y-1.5">
              {action.auditTrail.map((entry, i) => (
                <div key={i} className="flex items-baseline gap-2 text-xs text-eos-text-tertiary">
                  <span className="shrink-0 tabular-nums">
                    {new Date(entry.at).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="font-medium text-eos-text-muted">{entry.action}</span>
                  {entry.detail && <span className="text-eos-text-tertiary">— {entry.detail}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decision note (if already decided) */}
        {action.decisionNote && (
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
              Notă decizie
            </p>
            <p className="text-sm text-eos-text">{action.decisionNote}</p>
          </div>
        )}
      </div>

      {/* Footer — decision buttons (only for pending) */}
      {isPending && (
        <div className="border-t border-eos-border px-5 py-4 space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notă opțională (de ce aprobi/respingi)..."
            rows={2}
            className="w-full rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-3 py-2 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-primary"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={deciding}
              onClick={() => handleDecision("approved")}
              className="flex flex-1 items-center justify-center gap-2 rounded-eos-lg bg-eos-success px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {deciding ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <CheckCircle className="h-4 w-4" strokeWidth={2} />
              )}
              Aprobă
            </button>
            <button
              type="button"
              disabled={deciding}
              onClick={() => handleDecision("rejected")}
              className="flex flex-1 items-center justify-center gap-2 rounded-eos-lg border border-eos-error/30 bg-eos-error/5 px-4 py-2.5 text-sm font-semibold text-eos-error transition-opacity hover:bg-eos-error/10 disabled:opacity-50"
            >
              {deciding ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <XCircle className="h-4 w-4" strokeWidth={2} />
              )}
              Respinge
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page Surface ────────────────────────────────────────────────────────

export function ApprovalsPageSurface() {
  const { actions, counts, loading, error, refetch } = useApprovals()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<PendingAction | null>(null)

  const filtered = useMemo(() => {
    let list = actions
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter)
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (a) =>
          (ACTION_TYPE_LABELS[a.actionType] ?? a.actionType).toLowerCase().includes(q) ||
          (a.explanation ?? "").toLowerCase().includes(q) ||
          (a.diffSummary ?? "").toLowerCase().includes(q)
      )
    }
    return list
  }, [actions, statusFilter, query])

  function handleDecided() {
    setSelected(null)
    refetch(statusFilter !== "all" ? statusFilter : undefined)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-eos-text-tertiary" strokeWidth={2} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-eos-lg border border-eos-error/20 bg-eos-error/5 px-5 py-10 text-center">
        <ShieldAlert className="mx-auto mb-2 h-6 w-6 text-eos-error" strokeWidth={2} />
        <p className="text-sm text-eos-error">{error}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-xs font-medium text-eos-primary hover:underline"
        >
          Reîncearcă
        </button>
      </div>
    )
  }

  const statusTabs: Array<{ id: StatusFilter; label: string; count: number }> = [
    { id: "pending", label: "Așteaptă", count: counts.pending },
    { id: "approved", label: "Aprobate", count: counts.approved },
    { id: "rejected", label: "Respinse", count: counts.rejected },
    { id: "all", label: "Toate", count: counts.pending + counts.approved + counts.rejected + counts.expired },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 pb-12 pt-6 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-eos-text">Coadă de aprobări</h1>
        <p className="mt-0.5 text-sm text-eos-text-tertiary">
          Acțiunile care necesită aprobarea ta înainte de executare.
        </p>
      </div>

      {/* Content — split layout on desktop when detail is open */}
      <div className={`flex gap-4 ${selected ? "flex-col lg:flex-row" : ""}`}>
        {/* List panel */}
        <div className={`${selected ? "w-full lg:w-1/2" : "w-full"} space-y-3`}>
          {/* Filter bar */}
          <div className="overflow-hidden rounded-eos-xl border border-eos-border bg-eos-surface-variant">
            {/* Search */}
            <label className="flex items-center gap-2 border-b border-eos-border-subtle px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Caută după tip, explicație..."
                className="w-full bg-transparent text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary"
              />
              {filtered.length < actions.length && (
                <span className="shrink-0 text-[10px] tabular-nums text-eos-text-tertiary">
                  {filtered.length} din {actions.length}
                </span>
              )}
            </label>

            {/* Status tabs */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3">
              <Filter className="h-3.5 w-3.5 text-eos-text-tertiary" strokeWidth={2} />
              {statusTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id)
                    setSelected(null)
                  }}
                  className={[
                    "rounded px-3 py-1.5 text-xs font-medium transition-all",
                    statusFilter === tab.id
                      ? "bg-eos-primary/10 text-eos-primary"
                      : "text-eos-text-tertiary hover:text-eos-text-muted",
                  ].join(" ")}
                >
                  {tab.label}{" "}
                  <span className="ml-1 tabular-nums opacity-70">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-5 py-10 text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-eos-text-tertiary" strokeWidth={1.5} />
              <p className="text-sm text-eos-text-tertiary">
                {counts.pending === 0 && statusFilter === "pending"
                  ? "Nu există acțiuni în așteptare. Totul este la zi."
                  : "Nu există acțiuni pentru filtrul curent."}
              </p>
            </div>
          ) : (
            <div className="space-y-2" aria-live="polite">
              {filtered.map((a) => (
                <ActionRow key={a.id} action={a} onSelect={setSelected} />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-full lg:w-1/2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)]">
            <ActionDetailPanel
              action={selected}
              onClose={() => setSelected(null)}
              onDecided={handleDecided}
            />
          </div>
        )}
      </div>
    </div>
  )
}
