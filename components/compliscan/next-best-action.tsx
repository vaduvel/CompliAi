"use client"

import { ArrowRight, Clock3, ShieldAlert, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function NextBestAction({
  task,
  onResolve,
  hasEvidence,
  activeRiskCount,
}: NextBestActionProps) {
  if (!task) {
    return (
      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg text-[var(--color-on-surface)]">Ce faci acum</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            {!hasEvidence
              ? "Nu exista inca un baseline. Scaneaza primul document ca sa construim o evaluare reala."
              : activeRiskCount === 0
                ? "Nu exista probleme active. Scanarile anterioare raman salvate ca istoric si dovada. Rulezi un scan nou doar cand se schimba documentele, politicile sau fluxurile."
                : "Mai exista semnale active in istoric. Revizuieste documentele scanate si alertele deschise."}
          </p>
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
              Urmatoarea actiune recomandata de AI pentru ziua de azi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={priorityClasses(task.priority)}>{task.priority}</Badge>
            <Badge className={severityClasses(task.severity)}>{task.severity}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_auto] lg:items-center">
          <div>
            <p className="text-xl font-semibold text-[var(--color-on-surface)]">{task.title}</p>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-on-surface-muted)]">
              {task.summary}
            </p>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
              {task.fixPreview}
            </p>
          </div>

          <div className="grid gap-2 text-sm text-[var(--color-muted)]">
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
              <span>{task.lawReference}</span>
            </div>
          </div>

          <Button
            onClick={onResolve}
            className="h-11 rounded-xl bg-[var(--color-primary)] px-5 font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            Rezolva acum
            <ArrowRight className="size-4" strokeWidth={2.25} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
