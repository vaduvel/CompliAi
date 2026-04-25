"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle,
  ChevronRight,
  Clock,
  Loader2,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import {
  V3FilterBar,
  V3KpiStrip,
  V3PageHero,
  V3RiskPill,
  type V3FilterTab,
  type V3KpiItem,
  type V3SeverityTone,
} from "@/components/compliscan/v3"
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

function riskTone(risk: RiskLevel): V3SeverityTone {
  switch (risk) {
    case "critical":
      return "critical"
    case "high":
      return "high"
    case "medium":
      return "medium"
    case "low":
      return "low"
  }
}

function statusToneAndLabel(status: PendingActionStatus) {
  switch (status) {
    case "pending":
      return { label: "Așteaptă", tone: "high" as V3SeverityTone }
    case "approved":
      return { label: "Aprobat", tone: "ok" as V3SeverityTone }
    case "rejected":
      return { label: "Respins", tone: "critical" as V3SeverityTone }
    case "expired":
      return { label: "Expirat", tone: "low" as V3SeverityTone }
    case "auto_executed":
      return { label: "Auto-executat", tone: "info" as V3SeverityTone }
  }
}

function buildApprovalContinuation(action: PendingAction) {
  if (action.actionType !== "submit_anaf") {
    return null
  }

  const fiscalHref = action.sourceFindingId
    ? `/dashboard/fiscal?tab=transmitere&findingId=${encodeURIComponent(action.sourceFindingId)}`
    : "/dashboard/fiscal?tab=transmitere"

  return {
    fiscalHref,
    findingHref: action.sourceFindingId
      ? `/dashboard/resolve/${encodeURIComponent(action.sourceFindingId)}`
      : null,
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

// ── V3 Action Row (severity bar 3px + badges + meta + chevron) ───────────────

function ActionRow({
  action,
  onSelect,
  selected,
}: {
  action: PendingAction
  onSelect: (action: PendingAction) => void
  selected: boolean
}) {
  const status = statusToneAndLabel(action.status)
  const tone: V3SeverityTone = riskTone(action.riskLevel)

  const severityBar: Record<V3SeverityTone, string> = {
    critical: "bg-eos-error",
    high: "bg-eos-warning",
    medium: "bg-eos-primary/70",
    low: "bg-eos-border-strong",
    info: "bg-eos-primary",
    ok: "bg-eos-success",
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(action)}
      className={[
        "group relative flex w-full items-stretch overflow-hidden rounded-eos-lg border bg-eos-surface text-left transition-all duration-150",
        selected
          ? "border-eos-primary/35 bg-eos-primary/[0.04]"
          : "border-eos-border hover:border-eos-border-strong hover:bg-white/[0.02]",
      ].join(" ")}
    >
      <span
        className={["absolute left-0 top-0 bottom-0 w-[3px]", severityBar[tone]].join(" ")}
        aria-hidden
      />
      <div className="flex w-full items-center gap-3 py-3 pl-5 pr-3 md:gap-4 md:pr-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <V3RiskPill tone={status.tone}>{status.label}</V3RiskPill>
            <V3RiskPill tone={tone}>{RISK_LEVEL_LABELS[action.riskLevel]}</V3RiskPill>
          </div>
          <p className="text-[13.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text">
            {ACTION_TYPE_LABELS[action.actionType] ?? action.actionType}
          </p>
          <p className="line-clamp-2 text-[12px] leading-[1.5] text-eos-text-muted">
            {action.explanation ?? action.diffSummary ?? "Fără descriere"}
          </p>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
            creat {ageLabel(action.createdAt)}
          </p>
        </div>
        <ChevronRight
          className="size-4 shrink-0 text-eos-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-eos-text"
          strokeWidth={2}
        />
      </div>
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
  const status = statusToneAndLabel(action.status)
  const isPending = action.status === "pending"
  const continuation = buildApprovalContinuation(action)

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
              ? action.sourceFindingId
                ? "Transmiterea fiscală poate continua din tabul Fiscal și rămâne legată de cazul curent."
                : "Transmiterea fiscală poate continua din tabul Fiscal."
              : undefined,
        }
      )
      onDecided()
      return
    }

    toast.error("Nu am putut salva decizia.")
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 border-b border-eos-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <V3RiskPill tone={status.tone}>{status.label}</V3RiskPill>
            <V3RiskPill tone={riskTone(action.riskLevel)}>
              {RISK_LEVEL_LABELS[action.riskLevel]}
            </V3RiskPill>
          </div>
          <p
            data-display-text="true"
            className="font-display text-[15px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
          >
            {ACTION_TYPE_LABELS[action.actionType] ?? action.actionType}
          </p>
          <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
            creat · {ageLabel(action.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Închide panel"
          className="rounded-eos-sm border border-eos-border bg-transparent p-1.5 text-eos-text-tertiary transition-colors hover:border-eos-border-strong hover:text-eos-text"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {/* Explanation */}
        {action.explanation && (
          <section>
            <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Explicație
            </p>
            <p className="text-[13.5px] leading-[1.6] text-eos-text">{action.explanation}</p>
          </section>
        )}

        {/* Diff summary */}
        {action.diffSummary && (
          <section>
            <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Rezumat modificări
            </p>
            <div className="rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 py-3">
              <p className="whitespace-pre-wrap font-mono text-[11.5px] leading-[1.55] text-eos-text-muted">
                {action.diffSummary}
              </p>
            </div>
          </section>
        )}

        {/* Proposed data */}
        {action.proposedData && Object.keys(action.proposedData).length > 0 && (
          <section>
            <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Date propuse
            </p>
            <div className="rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 py-3">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-[1.55] text-eos-text-muted">
                {JSON.stringify(action.proposedData, null, 2)}
              </pre>
            </div>
          </section>
        )}

        {/* Continuation card (cobalt soft) */}
        {continuation && (
          <section className="rounded-eos-lg border border-eos-primary/25 bg-eos-primary/[0.06] px-4 py-3.5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
              Continuarea nu se pierde
            </p>
            <p className="mt-2 text-[13px] leading-[1.55] text-eos-text">
              După decizie, execuția merge mai departe din tabul Fiscal. Dacă există un caz
              legat, te poți întoarce direct în cockpit-ul lui.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={continuation.fiscalHref}
                className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-1.5 text-[12px] font-medium text-eos-text transition-colors hover:border-eos-border-strong"
              >
                <ChevronRight className="size-3.5" strokeWidth={2} />
                Continuă în Fiscal
              </a>
              {continuation.findingHref && (
                <a
                  href={continuation.findingHref}
                  className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-1.5 text-[12px] font-medium text-eos-text transition-colors hover:border-eos-border-strong"
                >
                  <ChevronRight className="size-3.5" strokeWidth={2} />
                  Deschide cazul fiscal
                </a>
              )}
            </div>
          </section>
        )}

        {/* Audit trail */}
        {action.auditTrail.length > 0 && (
          <section>
            <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Istoric
            </p>
            <div className="space-y-1.5">
              {action.auditTrail.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-2 font-mono text-[11px] leading-[1.5] text-eos-text-muted"
                >
                  <span className="shrink-0 tabular-nums text-eos-text-tertiary">
                    {new Date(entry.at).toLocaleDateString("ro-RO", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-semibold text-eos-text-muted">{entry.action}</span>
                  {entry.detail && (
                    <span className="text-eos-text-tertiary">— {entry.detail}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Decision note (if already decided) */}
        {action.decisionNote && (
          <section>
            <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Notă decizie
            </p>
            <p className="text-[13px] leading-[1.6] text-eos-text">{action.decisionNote}</p>
          </section>
        )}
      </div>

      {/* ── Footer — decision buttons ── */}
      {isPending && (
        <div className="space-y-3 border-t border-eos-border px-5 py-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notă opțională (de ce aprobi/respingi)..."
            rows={2}
            className="w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 text-[13px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-primary/50"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={deciding}
              onClick={() => handleDecision("approved")}
              className="flex flex-1 items-center justify-center gap-2 rounded-eos-sm bg-eos-success px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(52,211,153,0.45)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {deciding ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              ) : (
                <CheckCircle className="size-4" strokeWidth={2} />
              )}
              Aprobă
            </button>
            <button
              type="button"
              disabled={deciding}
              onClick={() => handleDecision("rejected")}
              className="flex flex-1 items-center justify-center gap-2 rounded-eos-sm border border-eos-error/35 bg-eos-error-soft px-4 py-2.5 text-[13px] font-semibold text-eos-error transition-colors hover:bg-eos-error/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deciding ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              ) : (
                <XCircle className="size-4" strokeWidth={2} />
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

  // ── KPI strip ────────────────────────────────────────────────────────────
  const kpiItems: V3KpiItem[] = [
    {
      id: "pending",
      label: "Așteaptă decizie",
      value: counts.pending,
      stripe: counts.pending > 0 ? "warning" : undefined,
      valueTone: counts.pending > 0 ? "warning" : "neutral",
      detail:
        counts.pending === 0
          ? "totul la zi"
          : counts.pending === 1
            ? "1 acțiune deschisă"
            : `${counts.pending} acțiuni`,
    },
    {
      id: "approved",
      label: "Aprobate",
      value: counts.approved,
      stripe: counts.approved > 0 ? "success" : undefined,
      valueTone: counts.approved > 0 ? "success" : "neutral",
      detail: "decizii pozitive",
    },
    {
      id: "rejected",
      label: "Respinse",
      value: counts.rejected,
      stripe: counts.rejected > 0 ? "critical" : undefined,
      valueTone: counts.rejected > 0 ? "critical" : "neutral",
      detail: "blocate de aprobator",
    },
    {
      id: "expired",
      label: "Expirate",
      value: counts.expired,
      stripe: counts.expired > 0 ? "warning" : undefined,
      valueTone: counts.expired > 0 ? "warning" : "neutral",
      detail: "necesitate reluare",
    },
  ]

  // ── Status tabs ──────────────────────────────────────────────────────────
  const statusTabs: V3FilterTab<StatusFilter>[] = [
    { id: "pending", label: "Așteaptă", count: counts.pending },
    { id: "approved", label: "Aprobate", count: counts.approved },
    { id: "rejected", label: "Respinse", count: counts.rejected },
    {
      id: "all",
      label: "Toate",
      count: counts.pending + counts.approved + counts.rejected + counts.expired,
    },
  ]

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-12">
      {/* ── V3 hero ── */}
      <V3PageHero
        breadcrumbs={[{ label: "Firma mea" }, { label: "Aprobări", current: true }]}
        eyebrowBadges={
          counts.pending > 0 ? <V3RiskPill tone="high">{counts.pending} în așteptare</V3RiskPill> : null
        }
        title="Coadă de aprobări"
        description="Acțiunile care necesită aprobarea ta înainte de executare. Aprobă sau respinge cu notă opțională."
      />

      {/* ── KPI strip ── */}
      <V3KpiStrip items={kpiItems} />

      {/* ── Filter bar ── */}
      <V3FilterBar
        tabs={statusTabs}
        activeTab={statusFilter}
        onTabChange={(id) => {
          setStatusFilter(id)
          setSelected(null)
        }}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Caută după tip, explicație..."
      />

      {/* ── Loading state ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-eos-text-tertiary" strokeWidth={2} />
        </div>
      )}

      {/* ── Error state ── */}
      {error && !loading && (
        <div className="rounded-eos-lg border border-eos-error/30 bg-eos-error-soft px-5 py-10 text-center">
          <ShieldAlert className="mx-auto mb-3 size-6 text-eos-error" strokeWidth={2} />
          <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-eos-error">{error}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-eos-primary transition-colors hover:text-eos-primary/80"
          >
            → Reîncearcă
          </button>
        </div>
      )}

      {/* ── Content split ── */}
      {!loading && !error && (
        <div className={`flex gap-4 ${selected ? "flex-col lg:flex-row" : ""}`}>
          {/* List panel */}
          <div className={`${selected ? "w-full lg:w-1/2" : "w-full"} space-y-2`}>
            {filtered.length === 0 ? (
              <div className="rounded-eos-lg border border-dashed border-eos-border-subtle bg-white/[0.02] px-5 py-12 text-center">
                <Clock
                  className="mx-auto mb-3 size-7 text-eos-text-tertiary"
                  strokeWidth={1.5}
                />
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Niciun rezultat
                </p>
                <p className="mt-2 text-[13px] leading-[1.55] text-eos-text-muted">
                  {counts.pending === 0 && statusFilter === "pending"
                    ? "Nu există acțiuni în așteptare. Totul este la zi."
                    : "Nu există acțiuni pentru filtrul curent."}
                </p>
              </div>
            ) : (
              <div className="space-y-2" aria-live="polite">
                {filtered.map((a) => (
                  <ActionRow
                    key={a.id}
                    action={a}
                    onSelect={setSelected}
                    selected={selected?.id === a.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-full lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:w-1/2">
              <ActionDetailPanel
                action={selected}
                onClose={() => setSelected(null)}
                onDecided={handleDecided}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
