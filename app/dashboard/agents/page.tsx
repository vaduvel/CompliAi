"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Bot,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Play,
  ShieldCheck,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { V3KpiStrip, type V3KpiItem } from "@/components/compliscan/v3/kpi-strip"
import {
  AGENT_LABELS,
  AGENT_DESCRIPTIONS,
  type AgentType,
  type AgentOutput,
  type AgentAction,
} from "@/lib/compliance/agentic-engine"

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentInfo = {
  type: AgentType
  label: string
  description: string
  implemented: boolean
  lastRun: AgentOutput | null
}

type AgentsResponse = {
  agents: AgentInfo[]
  recentRuns: AgentOutput[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusVariant(
  status: string,
): "success" | "destructive" | "warning" | "secondary" | "outline" {
  switch (status) {
    case "completed":
      return "success"
    case "failed":
      return "destructive"
    case "running":
      return "warning"
    case "awaiting_approval":
      return "warning"
    default:
      return "secondary"
  }
}

const STATUS_LABELS: Record<string, string> = {
  completed: "Completat",
  failed: "Eșuat",
  running: "Rulează",
  awaiting_approval: "Aprobare",
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  finding_created: "Finding creat",
  finding_updated: "Finding actualizat",
  notification_sent: "Notificare trimisă",
  document_drafted: "Document propus",
  vendor_rescored: "Vendor re-scarat",
  escalation_raised: "Escalare",
  score_updated: "Scor actualizat",
  review_triggered: "Review declanșat",
  alert_created: "Alertă creată",
  digest_generated: "Digest generat",
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function agentIcon(type: AgentType) {
  switch (type) {
    case "compliance_monitor":
      return ShieldCheck
    case "fiscal_sensor":
      return Zap
    case "document":
      return Activity
    case "vendor_risk":
      return AlertTriangle
    case "regulatory_radar":
      return Bot
  }
}

// ── Components ────────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  onRun,
  running,
}: {
  agent: AgentInfo
  onRun: (type: AgentType) => void
  running: boolean
}) {
  const Icon = agentIcon(agent.type)
  const lastRun = agent.lastRun

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-eos-md bg-eos-surface-variant">
              <Icon className="size-4 text-eos-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-eos-text">{agent.label}</CardTitle>
              <p className="mt-0.5 font-mono text-[10px] text-eos-text-muted">{agent.description}</p>
            </div>
          </div>
          {agent.implemented ? (
            <Badge variant="success" className="shrink-0">
              Activ
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0">
              Planificat
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {lastRun ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-eos-text-muted">Ultimul run:</span>
              <span className="font-mono text-eos-text">{formatDate(lastRun.startedAtISO)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-eos-text-muted">Status:</span>
              <Badge variant={statusVariant(lastRun.status)}>
                {STATUS_LABELS[lastRun.status] ?? lastRun.status}
              </Badge>
            </div>
            {lastRun.metrics && (
              <div className="grid grid-cols-2 gap-2 rounded-eos-md bg-eos-surface-variant p-2">
                <div className="text-xs">
                  <span className="text-eos-text-muted">Scanate: </span>
                  <span className="font-medium tabular-nums text-eos-text">
                    {lastRun.metrics.itemsScanned}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-eos-text-muted">Probleme: </span>
                  <span className="font-medium tabular-nums text-eos-text">
                    {lastRun.metrics.issuesFound}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-eos-text-muted">Auto: </span>
                  <span className="font-medium tabular-nums text-eos-text">
                    {lastRun.metrics.actionsAutoApplied}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-eos-text-muted">Aprobare: </span>
                  <span className="font-medium tabular-nums text-eos-text">
                    {lastRun.metrics.actionsPendingApproval}
                  </span>
                </div>
              </div>
            )}
            {lastRun.confidence !== undefined && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-eos-text-muted">Confidență</span>
                <div className="h-1 flex-1 rounded-full bg-eos-surface-variant">
                  <div
                    className="h-full rounded-full bg-eos-primary transition-all"
                    style={{ width: `${Math.round(lastRun.confidence * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] font-medium tabular-nums text-eos-text">
                  {Math.round(lastRun.confidence * 100)}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-eos-text-tertiary">Niciun run înregistrat.</p>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            variant={agent.implemented ? "default" : "outline"}
            disabled={!agent.implemented || running}
            onClick={() => onRun(agent.type)}
          >
            {running ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Play className="mr-1.5 size-3.5" />
            )}
            {running ? "Rulează…" : "Execută manual"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RunHistoryItem({ run }: { run: AgentOutput }) {
  const [expanded, setExpanded] = useState(false)
  const Chevron = expanded ? ChevronDown : ChevronRight

  return (
    <div className="border-b border-eos-border-subtle last:border-0">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-eos-surface-variant/50"
        onClick={() => setExpanded(!expanded)}
      >
        <Chevron className="size-4 shrink-0 text-eos-text-muted" />
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium text-eos-text">{AGENT_LABELS[run.agentType]}</span>
          <Badge variant={statusVariant(run.status)} className="text-[10px]">
            {STATUS_LABELS[run.status] ?? run.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10.5px] text-eos-text-muted">
          {run.metrics && <span>{run.metrics.issuesFound} probleme</span>}
          <span>{formatDate(run.startedAtISO)}</span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-eos-border-subtle bg-eos-surface-variant/30 px-4 py-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Raționament
            </p>
            <p className="mt-1 text-sm text-eos-text">{run.reasoning}</p>
          </div>

          {run.actions.length > 0 && (
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Acțiuni ({run.actions.length})
              </p>
              <ul className="mt-1 space-y-1.5">
                {run.actions.map((action, i) => (
                  <ActionItem key={i} action={action} />
                ))}
              </ul>
            </div>
          )}

          {run.error && (
            <div className="flex items-start gap-2 rounded-eos-md bg-eos-error-soft p-2">
              <XCircle className="mt-0.5 size-4 shrink-0 text-eos-error" />
              <p className="text-sm text-eos-error">{run.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ActionItem({ action }: { action: AgentAction }) {
  const isAuto = action.autoApplied

  return (
    <li className="flex items-start gap-2 text-sm">
      {isAuto ? (
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-eos-success" />
      ) : (
        <Clock className="mt-0.5 size-3.5 shrink-0 text-eos-warning" />
      )}
      <div className="flex-1">
        <span className="font-medium text-eos-text-muted">
          {ACTION_TYPE_LABELS[action.type] ?? action.type}
        </span>
        <span className="text-eos-text"> — {action.description}</span>
      </div>
      <Badge variant={isAuto ? "secondary" : "warning"} className="shrink-0 text-[10px]">
        L{action.approvalLevel}
      </Badge>
    </li>
  )
}

// ── L2 Pending Actions ────────────────────────────────────────────────────────

function l2ActionHref(action: AgentAction): string {
  switch (action.type) {
    case "document_drafted":
      return "/dashboard/generator"
    case "escalation_raised":
      return "/dashboard/resolve"
    case "finding_created":
      return "/dashboard/resolve"
    case "vendor_rescored":
      return "/dashboard/vendor-review"
    case "review_triggered":
      return "/dashboard/vendor-review"
    default:
      return "/dashboard/resolve"
  }
}

type PendingL2Action = AgentAction & { agentType: AgentType; runId: string }

function PendingActionsSection({ runs }: { runs: AgentOutput[] }) {
  const router = useRouter()

  const pendingActions: PendingL2Action[] = runs.flatMap((run) =>
    run.actions
      .filter((a) => !a.autoApplied && a.approvalLevel >= 2)
      .map((a) => ({ ...a, agentType: run.agentType, runId: run.runId })),
  )

  if (pendingActions.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Acțiuni în așteptare
        </p>
        <Badge variant="warning">{pendingActions.length}</Badge>
      </div>
      <Card className="border-eos-warning/30 bg-eos-warning-soft/10">
        <CardContent className="p-0">
          {pendingActions.map((action, i) => (
            <div
              key={`${action.runId}-${i}`}
              className="flex items-start gap-3 border-b border-eos-border-subtle p-4 last:border-0"
            >
              <Clock className="mt-0.5 size-4 shrink-0 text-eos-warning" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-medium text-eos-text-muted">
                    {AGENT_LABELS[action.agentType]}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {ACTION_TYPE_LABELS[action.type] ?? action.type}
                  </Badge>
                  <Badge variant="warning" className="text-[10px]">
                    Nivel {action.approvalLevel} — necesită aprobare
                  </Badge>
                </div>
                <p className="text-sm text-eos-text">{action.description}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => router.push(l2ActionHref(action))}
              >
                Deschide
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentDashboardPage() {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [recentRuns, setRecentRuns] = useState<AgentOutput[]>([])
  const [loading, setLoading] = useState(true)
  const [runningAgent, setRunningAgent] = useState<AgentType | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/agents")
      if (!res.ok) throw new Error("Eroare la încărcarea agenților")
      const data = (await res.json()) as AgentsResponse
      setAgents(data.agents)
      setRecentRuns(data.recentRuns)
    } catch {
      toast.error("Nu am putut încărca datele agenților.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleRun = async (agentType: AgentType) => {
    setRunningAgent(agentType)
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentType }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Eroare la execuție")
      }
      const data = (await res.json()) as { output: AgentOutput }
      toast.success(
        `${AGENT_LABELS[agentType]} — ${data.output.metrics?.issuesFound ?? 0} probleme detectate`,
      )
      void fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la execuția agentului.")
    } finally {
      setRunningAgent(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-eos-text-tertiary" />
      </div>
    )
  }

  const totalIssues = recentRuns.reduce((s, r) => s + (r.metrics?.issuesFound ?? 0), 0)
  const totalActions = recentRuns.reduce((s, r) => s + r.actions.length, 0)
  const activeAgents = agents.filter((a) => a.implemented).length
  const lastRunDate = recentRuns.length > 0 ? formatDate(recentRuns[0].startedAtISO) : "—"

  const kpiItems: V3KpiItem[] = [
    {
      id: "active",
      label: "Agenți activi",
      value: activeAgents,
      valueTone: "info",
      detail: `din ${agents.length} total`,
    },
    {
      id: "runs",
      label: "Run-uri recente",
      value: recentRuns.length,
      valueTone: "neutral",
      detail: lastRunDate !== "—" ? `Ultimul: ${lastRunDate}` : "Niciun run",
    },
    {
      id: "issues",
      label: "Probleme detectate",
      value: totalIssues,
      valueTone: totalIssues > 0 ? "warning" : "neutral",
      detail: "cumulat toate run-urile",
    },
    {
      id: "actions",
      label: "Acțiuni executate",
      value: totalActions,
      valueTone: "success",
      detail: "auto + cu aprobare",
    },
  ]

  return (
    <div className="space-y-6">
      <V3PageHero
        breadcrumbs={[{ label: "Dashboard" }, { label: "Agenți", current: true }]}
        title="Agenți Compliance"
        description="Motor agentic V6 — monitorizare automată, detecție, clasificare și escalare inteligentă."
      />

      <V3KpiStrip items={kpiItems} />

      <PendingActionsSection runs={recentRuns} />

      <section>
        <p className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Agenți disponibili
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.type}
              agent={agent}
              onRun={handleRun}
              running={runningAgent === agent.type}
            />
          ))}
        </div>
      </section>

      <section>
        <p className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Istoric rulări
        </p>
        {recentRuns.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-eos-lg border border-eos-border bg-eos-surface py-12 text-center">
            <Activity className="size-9 text-eos-text-tertiary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-eos-text-muted">Niciun run înregistrat</p>
              <p className="mt-0.5 text-xs text-eos-text-tertiary">
                Execută un agent manual sau așteaptă cron-ul zilnic.
              </p>
            </div>
          </div>
        ) : (
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="p-0">
              {recentRuns.map((run) => (
                <RunHistoryItem key={run.runId} run={run} />
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
