"use client"

import Link from "next/link"
import { ArrowRight, Clock3, ShieldAlert, UserRound } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import type { CockpitTask } from "@/components/compliscan/types"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

type NextBestActionProps = {
  task: CockpitTask | null
  additionalTasks?: CockpitTask[]
  onResolve: () => void
  onResolveTask?: (taskId: string) => void
  hasEvidence: boolean
  activeRiskCount: number
}

function priorityClasses(priority: CockpitTask["priority"]) {
  if (priority === "P1") return "border-eos-error-border bg-eos-error-soft text-eos-error"
  if (priority === "P2") return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  return "border-eos-border bg-eos-surface-variant text-eos-text-muted"
}

function severityClasses(severity: CockpitTask["severity"]) {
  if (severity === "critical" || severity === "high") {
    return "border-eos-error-border bg-eos-error-soft text-eos-error"
  }
  if (severity === "medium") {
    return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  }
  return "border-eos-border bg-eos-surface-variant text-eos-text-muted"
}

function severityLabel(severity: CockpitTask["severity"]) {
  if (severity === "critical") return "critic"
  if (severity === "high") return "ridicat"
  if (severity === "medium") return "mediu"
  return "scazut"
}

function normalizeNextStepCopy(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase()
}

function hasDistinctNextStepCopy(primary: string, secondary: string) {
  const normalizedPrimary = normalizeNextStepCopy(primary)
  const normalizedSecondary = normalizeNextStepCopy(secondary)

  if (!normalizedSecondary) return false

  return (
    normalizedPrimary !== normalizedSecondary &&
    !normalizedPrimary.includes(normalizedSecondary) &&
    !normalizedSecondary.includes(normalizedPrimary)
  )
}

function remediationModeLabel(mode: CockpitTask["remediationMode"]) {
  return mode === "rapid" ? "remediere rapidă" : "remediere structurală"
}

export function NextBestAction({
  task,
  additionalTasks = [],
  onResolve,
  onResolveTask,
  hasEvidence,
  activeRiskCount,
}: NextBestActionProps) {
  if (!task) {
    const emptyLabel = !hasEvidence
      ? "Scanează primul document ca să construim evaluarea inițială și să recomandăm primul pas concret."
      : activeRiskCount === 0
        ? "Nu există probleme active. Rulează un scan nou doar când apar schimbări în documente, politici sau fluxuri."
        : "Mai există semnale active. Revizuiește alertele și închide riscul cu cel mai mare impact."

    const ctaHref = !hasEvidence
      ? dashboardRoutes.scan
      : activeRiskCount > 0
        ? dashboardRoutes.drifts
        : null

    return (
      <Card className="border-eos-border bg-eos-surface">
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-lg text-eos-text">Ce faci acum</CardTitle>
            <Badge className="border-eos-border bg-eos-surface-variant text-eos-text-muted">
              {!hasEvidence ? "fără baseline" : activeRiskCount === 0 ? "fără risc activ" : "în așteptare"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <EmptyState
            title={!hasEvidence ? "Pornești din Scanare" : activeRiskCount === 0 ? "Nicio problemă urgentă" : "Niciun pas unic recomandat"}
            label={emptyLabel}
            className="border-eos-border bg-eos-surface-variant py-8"
          />
          {ctaHref && (
            <Button asChild variant="outline" size="sm" className="mt-3 w-full gap-2">
              <Link href={ctaHref}>
                {!hasEvidence ? "Deschide Scanare" : "Deschide Control drift"}
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-eos-border bg-[linear-gradient(135deg,var(--eos-surface-secondary),var(--eos-surface-primary))]">
      <CardHeader className="pb-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg text-eos-text">Ce faci acum</CardTitle>
            <p className="mt-2 text-sm text-eos-text-muted">
              Următorul pas recomandat pentru progresul cu impact real.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={priorityClasses(task.priority)}>{task.priority}</Badge>
            <Badge className={severityClasses(task.severity)}>{severityLabel(task.severity)}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {hasDistinctNextStepCopy(task.summary, task.fixPreview) ? (
          <div className="mb-4 rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-eos-text-muted">
              Pas recomandat
            </p>
            <p className="mt-2 text-sm text-eos-text [overflow-wrap:anywhere]">
              {task.fixPreview}
            </p>
          </div>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)_auto] lg:items-center">
          <div>
            <p className="break-words text-xl font-semibold text-eos-text">{task.title}</p>
            <p className="mt-2 max-w-2xl text-sm text-eos-text-muted [overflow-wrap:anywhere]">
              {task.summary}
            </p>
          </div>

          <div className="grid gap-2 rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted lg:justify-items-start">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-eos-text-muted" strokeWidth={2} />
              <span>{task.effortLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-eos-text-muted" strokeWidth={2} />
              <span>{task.owner}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-eos-text-muted" strokeWidth={2} />
              <span className="[overflow-wrap:anywhere]">{task.lawReference}</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="size-4 text-eos-text-muted" strokeWidth={2} />
              <span>{remediationModeLabel(task.remediationMode)}</span>
            </div>
          </div>

          <Button
            onClick={onResolve}
            size="lg"
            className="w-full gap-2 lg:w-auto"
          >
            Deschide
            <ArrowRight className="size-5" strokeWidth={2} />
          </Button>
        </div>

        {additionalTasks.length > 0 ? (
          <div className="mt-5 border-t border-eos-border-subtle pt-4 space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-eos-text-muted mb-3">
              Urmează
            </p>
            {additionalTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2.5"
              >
                <Badge className={`shrink-0 text-[10px] ${priorityClasses(t.priority)}`}>
                  {t.priority}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm text-eos-text">{t.title}</span>
                <Badge className={`shrink-0 text-[10px] ${severityClasses(t.severity)}`}>
                  {severityLabel(t.severity)}
                </Badge>
                <button
                  onClick={() => onResolveTask?.(t.id)}
                  className="shrink-0 text-xs text-eos-primary hover:underline"
                >
                  Deschide
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
