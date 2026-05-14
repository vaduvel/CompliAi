"use client"

// FC-7 (2026-05-14) — Master Exception Queue Card.
//
// Doc 09 cap 9.2: "Un singur queue de excepții. Nu 14 ecrane care strigă
// separat." Acest component afișează TOATE excepțiile (cross-correlation
// + filings + audit risk) într-o singură listă sortată după priorityScore,
// cu filtre rapide (severitate, owner, categorie).

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  ListTodo,
  Loader2,
  RefreshCw,
  TrendingDown,
  User,
  Users,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

// ── Types (mirror lib/compliance/master-exception-queue.ts) ─────────────────

type Severity = "critic" | "important" | "atentie" | "info"
type Category =
  | "cross-correlation"
  | "filing-overdue"
  | "filing-missing"
  | "audit-risk"
  | "missing-evidence"
  | "anaf-notification"
type Status = "open" | "in-progress" | "blocked" | "snoozed" | "resolved"
type Owner = "cabinet" | "client" | "ambii" | "system"

type ExceptionItem = {
  id: string
  category: Category
  severity: Severity
  status: Status
  title: string
  detail: string
  impactRON: number
  deadline: string | null
  daysUntilDeadline: number | null
  owner: Owner
  clientOrgId: string | null
  sourceDocs: string[]
  missingDocs: string[]
  nextAction: string
  recurrenceCount: number
  period: string | null
  legalReference: string
  priorityScore: number
  sourceId?: string
}

type Queue = {
  generatedAtISO: string
  items: ExceptionItem[]
  summary: {
    total: number
    byStatus: Record<Status, number>
    bySeverity: Record<Severity, number>
    byOwner: Record<Owner, number>
    byCategory: Record<Category, number>
    totalImpactRON: number
    overdueCount: number
    dueIn7DaysCount: number
  }
  topRecommendation: string
}

// ── Config ──────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; tone: string; icon: typeof AlertCircle }
> = {
  critic: {
    label: "CRITIC",
    tone: "border-eos-error/40 bg-eos-error-soft text-eos-error",
    icon: Zap,
  },
  important: {
    label: "IMPORTANT",
    tone: "border-eos-warning/40 bg-eos-warning-soft text-eos-warning",
    icon: AlertCircle,
  },
  atentie: {
    label: "ATENȚIE",
    tone: "border-eos-warning/30 bg-eos-warning-soft/50 text-eos-warning",
    icon: AlertTriangle,
  },
  info: {
    label: "INFO",
    tone: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
    icon: Info,
  },
}

const CATEGORY_LABELS: Record<Category, string> = {
  "cross-correlation": "Cross-correlation",
  "filing-overdue": "Filing întârziat",
  "filing-missing": "Filing nedepus",
  "audit-risk": "Audit risk",
  "missing-evidence": "Dovadă lipsă",
  "anaf-notification": "Notificare ANAF",
}

const OWNER_LABELS: Record<Owner, string> = {
  cabinet: "Cabinet",
  client: "Client",
  ambii: "Ambii",
  system: "System",
}

function fmtRON(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return n.toLocaleString("ro-RO", { maximumFractionDigits: 0 })
}

// ── Component ────────────────────────────────────────────────────────────────

export function MasterExceptionQueueCard() {
  const [queue, setQueue] = useState<Queue | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all")
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all")
  const [filterOwner, setFilterOwner] = useState<Owner | "all">("all")

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/exception-queue", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Eroare încărcare queue.")
        return
      }
      setQueue(data.queue as Queue)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!queue) return []
    return queue.items.filter((i) => {
      if (filterSeverity !== "all" && i.severity !== filterSeverity) return false
      if (filterCategory !== "all" && i.category !== filterCategory) return false
      if (filterOwner !== "all" && i.owner !== filterOwner) return false
      return true
    })
  }, [queue, filterSeverity, filterCategory, filterOwner])

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ListTodo className="size-4 text-eos-primary" strokeWidth={2} />
            <h2
              data-display-text="true"
              className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Probleme prioritare
            </h2>
          </div>
          <p className="mt-1 max-w-3xl text-[12.5px] text-eos-text-muted">
            Toate excepțiile (diferențe declarații, depuneri întârziate, risc audit)
            ordonate după prioritate: severitate × termen × impact lei × repetitivitate.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2 text-[12px] font-medium text-eos-text hover:border-eos-primary disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <RefreshCw className="size-3.5" strokeWidth={2} />
          )}
          Reîmprospătează
        </button>
      </header>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-[12px] text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          Încarc queue...
        </div>
      ) : !queue ? null : queue.items.length === 0 ? (
        <div className="mt-5 rounded-eos-md border border-eos-success/40 bg-eos-success-soft px-4 py-4 text-eos-success">
          <CheckCircle2 className="-mt-0.5 mr-1 inline size-4" strokeWidth={2.5} />
          <strong>Niciun excepție activă!</strong> {queue.topRecommendation}
        </div>
      ) : (
        <>
          {/* Top recommendation */}
          <div className="mt-4 rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
              💡 Recomandare prioritate
            </p>
            <p className="mt-1 text-[12.5px] text-eos-text">{queue.topRecommendation}</p>
          </div>

          {/* Summary tiles */}
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
                Total
              </p>
              <p
                data-display-text="true"
                className="mt-0.5 font-display text-[18px] font-bold text-eos-text"
              >
                {queue.summary.total}
              </p>
            </div>
            <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-eos-error">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
                Critice
              </p>
              <p data-display-text="true" className="mt-0.5 font-display text-[18px] font-bold">
                {queue.summary.bySeverity.critic}
              </p>
            </div>
            <div className="rounded-eos-sm border border-eos-warning/40 bg-eos-warning-soft px-3 py-2 text-eos-warning">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
                Importante
              </p>
              <p data-display-text="true" className="mt-0.5 font-display text-[18px] font-bold">
                {queue.summary.bySeverity.important}
              </p>
            </div>
            <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft/50 px-3 py-2 text-eos-error">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
                Overdue
              </p>
              <p data-display-text="true" className="mt-0.5 font-display text-[18px] font-bold">
                {queue.summary.overdueCount}
              </p>
            </div>
            <div className="rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft/30 px-3 py-2 text-eos-warning">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
                În 7 zile
              </p>
              <p data-display-text="true" className="mt-0.5 font-display text-[18px] font-bold">
                {queue.summary.dueIn7DaysCount}
              </p>
            </div>
            <div className="rounded-eos-sm border border-eos-warning/40 bg-eos-warning-soft px-3 py-2 text-eos-warning">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
                Impact total
              </p>
              <p data-display-text="true" className="mt-0.5 font-display text-[15px] font-bold">
                {fmtRON(queue.summary.totalImpactRON)} RON
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
              Filtru
            </span>
            <FilterChip
              active={filterSeverity === "all"}
              onClick={() => setFilterSeverity("all")}
              label={`Toate (${queue.summary.total})`}
            />
            {(["critic", "important", "atentie", "info"] as Severity[]).map((s) => {
              const count = queue.summary.bySeverity[s]
              if (count === 0) return null
              return (
                <FilterChip
                  key={s}
                  active={filterSeverity === s}
                  onClick={() => setFilterSeverity(s)}
                  label={`${SEVERITY_CONFIG[s].label} (${count})`}
                />
              )
            })}
            <span className="mx-1 text-eos-text-tertiary">·</span>
            {(["all", "cabinet", "client", "ambii"] as const).map((o) => {
              const count =
                o === "all" ? queue.summary.total : queue.summary.byOwner[o] ?? 0
              if (o !== "all" && count === 0) return null
              return (
                <FilterChip
                  key={o}
                  active={filterOwner === o}
                  onClick={() => setFilterOwner(o)}
                  label={`${o === "all" ? "Toți owners" : OWNER_LABELS[o]} (${count})`}
                />
              )
            })}
          </div>

          {/* Items list */}
          <div className="mt-4 space-y-2">
            {filtered.length === 0 ? (
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated px-4 py-3 text-[12px] text-eos-text-muted">
                Niciun rezultat pentru filtrul curent.
              </div>
            ) : (
              filtered.map((item, idx) => {
                const sevCfg = SEVERITY_CONFIG[item.severity]
                const SevIcon = sevCfg.icon
                return (
                  <div
                    key={item.id}
                    className="rounded-eos-md border border-eos-border bg-eos-surface p-3 transition hover:border-eos-primary/30"
                  >
                    <div className="flex items-start gap-3">
                      {/* Priority rank */}
                      <div className="flex shrink-0 flex-col items-center gap-1">
                        <div className="flex size-7 items-center justify-center rounded-full bg-eos-primary/10 font-display text-[13px] font-bold text-eos-primary">
                          #{idx + 1}
                        </div>
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-eos-sm border px-1 py-0 font-mono text-[8.5px] font-bold uppercase ${sevCfg.tone}`}
                        >
                          <SevIcon className="size-2.5" strokeWidth={2.5} />
                          {sevCfg.label}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p
                          data-display-text="true"
                          className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
                        >
                          {item.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="font-mono uppercase tracking-[0.1em] text-eos-text-tertiary">
                            {CATEGORY_LABELS[item.category]}
                          </span>
                          {item.period && (
                            <span className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0 font-mono text-eos-text-muted">
                              {item.period}
                            </span>
                          )}
                          <span className="text-eos-text-tertiary">·</span>
                          <span className="flex items-center gap-0.5 text-eos-text-muted">
                            <User className="size-2.5" strokeWidth={2.5} />
                            {OWNER_LABELS[item.owner]}
                          </span>
                          {item.recurrenceCount >= 2 && (
                            <span className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-1.5 py-0 font-mono text-eos-error">
                              repetat {item.recurrenceCount}×
                            </span>
                          )}
                          {item.daysUntilDeadline !== null && (
                            <span
                              className={`flex items-center gap-0.5 rounded-eos-sm border px-1.5 py-0 font-mono ${
                                item.daysUntilDeadline < 0
                                  ? "border-eos-error/40 bg-eos-error-soft text-eos-error"
                                  : item.daysUntilDeadline <= 3
                                    ? "border-eos-warning/40 bg-eos-warning-soft text-eos-warning"
                                    : "border-eos-border bg-eos-surface-elevated text-eos-text-muted"
                              }`}
                            >
                              <Clock className="size-2.5" strokeWidth={2.5} />
                              {item.daysUntilDeadline < 0
                                ? `${-item.daysUntilDeadline}z OVERDUE`
                                : `în ${item.daysUntilDeadline}z`}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[11.5px] leading-[1.45] text-eos-text-muted">
                          {item.detail}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10.5px]">
                          {item.impactRON > 0 && (
                            <div className="flex items-center gap-1 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-2 py-0.5 text-eos-warning">
                              <TrendingDown className="size-3" strokeWidth={2.5} />
                              <strong>{fmtRON(item.impactRON)} RON</strong>
                              <span className="opacity-70">impact</span>
                            </div>
                          )}
                          {item.missingDocs.length > 0 && (
                            <div className="flex items-center gap-1 text-eos-text-muted">
                              <FileText className="size-3" strokeWidth={2} />
                              {item.missingDocs.length} doc lipsă
                            </div>
                          )}
                          <div className="text-eos-text-tertiary">
                            Score: <strong>{item.priorityScore}</strong>
                          </div>
                        </div>

                        {/* Next action */}
                        <div className="mt-2 flex items-start gap-1.5 rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-2 py-1.5 text-eos-primary">
                          <ArrowRight className="mt-0.5 size-3 shrink-0" strokeWidth={2.5} />
                          <p className="text-[10.5px] font-medium">{item.nextAction}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <p className="mt-3 text-[10.5px] text-eos-text-tertiary">
            Queue generat {new Date(queue.generatedAtISO).toLocaleString("ro-RO")}.{" "}
            {filtered.length} din {queue.summary.total} excepții afișate.
          </p>
        </>
      )}
    </section>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-eos-sm border px-2 py-0.5 text-[10.5px] font-medium ${
        active
          ? "border-eos-primary bg-eos-primary text-white"
          : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-border-strong"
      }`}
    >
      {label}
    </button>
  )
}
