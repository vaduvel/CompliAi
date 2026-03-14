"use client"

import { useState } from "react"

import { EmptyState } from "@/components/evidence-os/EmptyState"
import { LifecycleBadge } from "@/components/evidence-os/LifecycleBadge"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { AlertsList, LoadingScreen, PageHeader } from "@/components/compliscan/route-sections"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import {
  formatDriftEscalationDeadline,
  formatDriftEscalationTier,
  formatDriftTypeLabel,
  getDriftPolicyFromRecord,
} from "@/lib/compliance/drift-policy"
import {
  isDriftSlaBreached,
} from "@/lib/compliance/drift-lifecycle"

export default function AlertePage() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [actingDriftId, setActingDriftId] = useState<string | null>(null)

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const openTasks = cockpit.tasks.filter((task) => task.status !== "done")
  const openDrifts = cockpit.activeDrifts
  const breachedDrifts = openDrifts.filter((drift) => isDriftSlaBreached(drift)).length

  async function handleDriftAction(
    driftId: string,
    action: "acknowledge" | "start" | "resolve" | "waive" | "reopen"
  ) {
    const note =
      action === "waive"
        ? window.prompt(
            "Adaugă un motiv scurt pentru waive. Lasă gol dacă vrei doar justificarea standard."
          ) ?? undefined
        : undefined

    setActingDriftId(driftId)
    try {
      await cockpitActions.updateDriftLifecycle({
        driftId,
        action,
        note,
      })
    } finally {
      setActingDriftId(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Alerte"
        description="Task-uri deschise care necesita atentie"
        score={cockpit.data.summary.score}
        riskLabel={cockpit.data.summary.riskLabel}
      />

      <PillarTabs sectionId="control" />

      {openDrifts.length > 0 && (
        <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Compliance drift</CardTitle>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              Schimbari detectate fata de snapshot-ul anterior validat intern.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <DriftStatusTile
                label="Drift activ"
                value={openDrifts.length}
                detail="Schimbări care încă cer decizie sau remediere."
              />
              <DriftStatusTile
                label="SLA depășit"
                value={breachedDrifts}
                detail="Drift-uri care au trecut de termenul din matricea de escaladare."
                tone={
                  breachedDrifts > 0
                    ? "text-[var(--color-error)]"
                    : "text-[var(--status-success-text)]"
                }
              />
              <DriftStatusTile
                label="Task-uri deschise"
                value={openTasks.filter((task) => task.relatedDriftIds.length > 0).length}
                detail="Remedieri deja generate din drift și încă neînchise."
              />
            </div>

            {openDrifts.map((drift) => {
              const guidance = getDriftPolicyFromRecord(drift)
              const breached = isDriftSlaBreached(drift)
              const isActing = actingDriftId === drift.id

              return (
                <div
                  key={drift.id}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--color-on-surface)]">
                        {drift.summary}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                        {formatDriftTypeLabel(drift.type)} · {drift.change}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                        {guidance.impactSummary}
                      </p>
                    </div>
                    <SeverityBadge severity={drift.severity} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <LifecycleBadge state={(drift.lifecycleStatus ?? "open") as "open" | "acknowledged" | "in_progress" | "resolved" | "waived"} />
                    {breached && (
                      <Badge variant="destructive">
                        SLA depășit
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                        De ce conteaza
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                        {guidance.lawReference}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {guidance.severityReason}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                        Ce faci acum
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                        {guidance.nextAction}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                        Dovada
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                        {guidance.evidenceRequired}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                        Escalare
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                        {drift.escalationOwner || guidance.ownerSuggestion}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {formatDriftEscalationTier(drift.escalationTier || guidance.escalationTier)} · până la{" "}
                        {formatDriftEscalationDeadline(
                          drift.escalationDueAtISO || guidance.escalationDueAtISO
                        )}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {[
                          drift.blocksAudit ? "blochează auditul" : null,
                          drift.blocksBaseline ? "blochează baseline-ul" : null,
                          drift.requiresHumanApproval ? "cere aprobare umană" : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "review operațional recomandat"}
                      </p>
                    </div>
                  </div>
                  {(drift.systemLabel || drift.sourceDocument) && (
                    <p className="mt-3 text-xs text-[var(--color-muted)]">
                      {[drift.systemLabel, drift.sourceDocument].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(drift.lifecycleStatus === "open" || !drift.lifecycleStatus) && (
                      <Button
                        onClick={() => void handleDriftAction(drift.id, "acknowledge")}
                        disabled={cockpit.busy || isActing}
                        variant="outline"
                        className="h-10 rounded-xl"
                      >
                        Preia drift-ul
                      </Button>
                    )}
                    {(drift.lifecycleStatus === "open" ||
                      drift.lifecycleStatus === "acknowledged") && (
                      <Button
                        onClick={() => void handleDriftAction(drift.id, "start")}
                        disabled={cockpit.busy || isActing}
                        variant="outline"
                        className="h-10 rounded-xl"
                      >
                        Marchează în lucru
                      </Button>
                    )}
                    {drift.open && (
                      <>
                        <Button
                          onClick={() => void handleDriftAction(drift.id, "resolve")}
                          disabled={cockpit.busy || isActing}
                          className="h-10 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                        >
                          Marchează rezolvat
                        </Button>
                        <Button
                          onClick={() => void handleDriftAction(drift.id, "waive")}
                          disabled={cockpit.busy || isActing}
                          variant="outline"
                          className="h-10 rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-warning)] hover:bg-[var(--color-warning-muted)]"
                        >
                          Waive cu justificare
                        </Button>
                      </>
                    )}
                    {!drift.open && (
                      <Button
                        onClick={() => void handleDriftAction(drift.id, "reopen")}
                        disabled={cockpit.busy || isActing}
                        variant="outline"
                        className="h-10 rounded-xl"
                      >
                        Redeschide
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {openTasks.length === 0 && openDrifts.length === 0 ? (
        <EmptyState
          title="Fara alerte deschise"
          label="Momentan nu exista alerte care sa ceara actiune imediata."
        />
      ) : openTasks.length > 0 ? (
        <AlertsList tasks={openTasks} />
      ) : null}
    </div>
  )
}

function DriftStatusTile({
  label,
  value,
  detail,
  tone = "text-[var(--color-on-surface)]",
}: {
  label: string
  value: number
  detail: string
  tone?: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">{detail}</p>
    </div>
  )
}
