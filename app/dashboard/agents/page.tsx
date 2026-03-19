"use client"

import { useEffect, useState, useCallback } from "react"
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
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
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

function statusVariant(status: string): "success" | "destructive" | "warning" | "secondary" | "outline" {
  switch (status) {
    case "completed": return "success"
    case "failed": return "destructive"
    case "running": return "warning"
    case "awaiting_approval": return "warning"
    default: return "secondary"
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
  return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function agentIcon(type: AgentType) {
  switch (type) {
    case "compliance_monitor": return ShieldCheck
    case "fiscal_sensor": return Zap
    case "document": return Activity
    case "vendor_risk": return AlertTriangle
    case "regulatory_radar": return Bot
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-eos-surface-variant">
              <Icon className="size-5 text-eos-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{agent.label}</CardTitle>
              <p className="mt-0.5 text-xs text-eos-text-muted">{agent.description}</p>
            </div>
          </div>
          {agent.implemented ? (
            <Badge variant="success" className="shrink-0">Activ</Badge>
          ) : (
            <Badge variant="outline" className="shrink-0">Planificat</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {lastRun ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-eos-text-muted">Ultimul run:</span>
              <span className="text-eos-text">{formatDate(lastRun.startedAtISO)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-eos-text-muted">Status:</span>
              <Badge variant={statusVariant(lastRun.status)}>{STATUS_LABELS[lastRun.status] ?? lastRun.status}</Badge>
            </div>
            {lastRun.metrics && (
              <div className="grid grid-cols-2 gap-2 rounded-md bg-eos-surface-variant p-2 text-xs">
                <div>
                  <span className="text-eos-text-muted">Scanate:</span>{" "}
                  <span className="font-medium">{lastRun.metrics.itemsScanned}</span>
                </div>
                <div>
                  <span className="text-eos-text-muted">Probleme:</span>{" "}
                  <span className="font-medium">{lastRun.metrics.issuesFound}</span>
                </div>
                <div>
                  <span className="text-eos-text-muted">Auto:</span>{" "}
                  <span className="font-medium">{lastRun.metrics.actionsAutoApplied}</span>
                </div>
                <div>
                  <span className="text-eos-text-muted">Aprobare:</span>{" "}
                  <span className="font-medium">{lastRun.metrics.actionsPendingApproval}</span>
                </div>
              </div>
            )}
            {lastRun.confidence !== undefined && (
              <div className="flex items-center gap-2 text-xs text-eos-text-muted">
                <span>Confidență:</span>
                <div className="h-1.5 flex-1 rounded-full bg-eos-surface-variant">
                  <div
                    className="h-full rounded-full bg-eos-primary transition-all"
                    style={{ width: `${Math.round(lastRun.confidence * 100)}%` }}
                  />
                </div>
                <span className="font-medium text-eos-text">{Math.round(lastRun.confidence * 100)}%</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-eos-text-tertiary">Niciun run înregistrat.</p>
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
          <span className="text-sm font-medium text-eos-text">
            {AGENT_LABELS[run.agentType]}
          </span>
          <Badge variant={statusVariant(run.status)} className="text-[10px]">
            {STATUS_LABELS[run.status] ?? run.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-eos-text-muted">
          {run.metrics && (
            <span>{run.metrics.issuesFound} probleme</span>
          )}
          <span>{formatDate(run.startedAtISO)}</span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-eos-border-subtle bg-eos-surface-variant/30 px-4 py-3">
          {/* Reasoning */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-eos-text-muted">Raționament</p>
            <p className="mt-1 text-sm text-eos-text">{run.reasoning}</p>
          </div>

          {/* Actions */}
          {run.actions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-eos-text-muted">
                Acțiuni ({run.actions.length})
              </p>
              <ul className="mt-1 space-y-1.5">
                {run.actions.map((action, i) => (
                  <ActionItem key={i} action={action} />
                ))}
              </ul>
            </div>
          )}

          {/* Error */}
          {run.error && (
            <div className="flex items-start gap-2 rounded-md bg-eos-error-soft p-2">
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentDashboardPage() {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [recentRuns, setRecentRuns] = useState<AgentOutput[]>([])
  const [loading, setLoading] = useState(true)
  const [runningAgent, setRunningAgent] = useState<AgentType | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/agents")
      if (!res.ok) throw new Error("Failed to load agents")
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
        <Loader2 className="size-8 animate-spin text-eos-text-muted" />
      </div>
    )
  }

  const totalIssues = recentRuns.reduce((s, r) => s + (r.metrics?.issuesFound ?? 0), 0)
  const totalActions = recentRuns.reduce((s, r) => s + r.actions.length, 0)
  const activeAgents = agents.filter((a) => a.implemented).length
  const lastRunDate = recentRuns.length > 0 ? formatDate(recentRuns[0].startedAtISO) : "—"

  return (
    <div className="space-y-6">
      <PageIntro
        title="Agenți Compliance"
        description="Motor agentic V6 — monitorizare automată, detecție, clasificare și escalare inteligentă."
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-eos-primary">{activeAgents}</p>
            <p className="mt-1 text-xs text-eos-text-muted">Agenți activi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-eos-text">{recentRuns.length}</p>
            <p className="mt-1 text-xs text-eos-text-muted">Run-uri recente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-eos-warning">{totalIssues}</p>
            <p className="mt-1 text-xs text-eos-text-muted">Probleme detectate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-eos-success">{totalActions}</p>
            <p className="mt-1 text-xs text-eos-text-muted">Acțiuni executate</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent cards */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-eos-text">Agenți disponibili</h2>
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

      {/* Recent run history */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-eos-text">Istoric rulări</h2>
        {recentRuns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="mb-3 size-10 text-eos-text-tertiary" />
              <p className="text-sm font-medium text-eos-text-muted">Niciun run înregistrat</p>
              <p className="mt-1 text-xs text-eos-text-tertiary">
                Execută un agent manual sau așteaptă cron-ul zilnic.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
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
