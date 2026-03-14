"use client"

import { ArrowRight, Clock3, ShieldAlert, UserRound } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import type { CockpitTask } from "@/components/compliscan/types"

type NextBestActionProps = {
  task: CockpitTask | null
  onResolve: () => void
  hasEvidence: boolean
  activeRiskCount: number
}

function priorityClasses(priority: CockpitTask["priority"]) {
  if (priority === "P1") return "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
  if (priority === "P2") return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  return "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
}

function severityClasses(severity: CockpitTask["severity"]) {
  if (severity === "critical" || severity === "high") {
    return "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
  }
  if (severity === "medium") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }
  return "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
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
  return mode === "rapid" ? "remediere rapida" : "remediere structurala"
}

export function NextBestAction({
  task,
  onResolve,
  hasEvidence,
  activeRiskCount,
}: NextBestActionProps) {
  if (!task) {
    const emptyLabel = !hasEvidence
      ? "Scaneaza primul document ca sa construim evaluarea initiala si sa putem recomanda urmatorul pas."
      : activeRiskCount === 0
        ? "Nu exista probleme active. Rulezi un scan nou doar cand se schimba documentele, politicile sau fluxurile."
        : "Mai exista semnale active. Revizuieste alertele si inchide urmatorul risc cu impact real."

    return (
      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-lg text-[var(--color-on-surface)]">Ce faci acum</CardTitle>
            <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]">
              {!hasEvidence ? "fara baseline" : activeRiskCount === 0 ? "fara risc activ" : "in asteptare"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <EmptyState
            title={!hasEvidence ? "Incepi din Scanari" : activeRiskCount === 0 ? "Nu exista lucru urgent" : "Nu exista pas recomandat unic"}
            label={emptyLabel}
            className="border-[var(--color-border)] bg-[var(--color-surface-variant)] py-8"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[var(--color-border)] bg-[linear-gradient(135deg,var(--bg-panel-2),var(--card-bg))]">
      <CardHeader className="pb-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg text-[var(--color-on-surface)]">Ce faci acum</CardTitle>
            <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
              Urmatorul pas recomandat pentru progresul cu impact real.
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
          <div className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Pas recomandat
            </p>
            <p className="mt-2 text-sm text-[var(--color-on-surface)] [overflow-wrap:anywhere]">
              {task.fixPreview}
            </p>
          </div>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)_auto] lg:items-center">
          <div>
            <p className="break-words text-xl font-semibold text-[var(--color-on-surface)]">{task.title}</p>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-on-surface-muted)] [overflow-wrap:anywhere]">
              {task.summary}
            </p>
          </div>

          <div className="grid gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--color-muted)] lg:justify-items-start">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-[var(--icon-secondary)]" strokeWidth={2.25} />
              <span>{task.effortLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-[var(--icon-secondary)]" strokeWidth={2.25} />
              <span>{task.owner}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-[var(--icon-secondary)]" strokeWidth={2.25} />
              <span className="[overflow-wrap:anywhere]">{task.lawReference}</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="size-4 text-[var(--icon-secondary)]" strokeWidth={2.25} />
              <span>{remediationModeLabel(task.remediationMode)}</span>
            </div>
          </div>

          <Button
            onClick={onResolve}
            className="h-11 w-full rounded-xl bg-[var(--color-primary)] px-5 font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] lg:w-auto"
          >
            Deschide taskul
            <ArrowRight className="size-4" strokeWidth={2.25} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
