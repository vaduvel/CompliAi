"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"

import { EmptyState } from "@/components/evidence-os/EmptyState"
import { LifecycleBadge } from "@/components/evidence-os/LifecycleBadge"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { DenseListItem } from "@/components/evidence-os/DenseListItem"
import { ActionCluster } from "@/components/evidence-os/ActionCluster"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { AlertsList, LoadingScreen } from "@/components/compliscan/route-sections"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import {
  formatDriftEscalationDeadline,
  formatDriftEscalationTier,
  formatDriftTypeLabel,
  getDriftPolicyFromRecord,
} from "@/lib/compliance/drift-policy"
import {
  formatDriftLifecycleStatus,
  isDriftSlaBreached,
} from "@/lib/compliance/drift-lifecycle"
import { formatRelativeRomanian } from "@/lib/compliance/engine"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

export default function DriftPage() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [actingDriftId, setActingDriftId] = useState<string | null>(null)
  const [expandedDriftId, setExpandedDriftId] = useState<string | null>(null)
  const openDrifts = cockpit.activeDrifts

  useEffect(() => {
    if (openDrifts.length === 0) {
      setExpandedDriftId(null)
      return
    }

    setExpandedDriftId((current) =>
      current && openDrifts.some((drift) => drift.id === current) ? current : openDrifts[0].id
    )
  }, [openDrifts])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const openTasks = cockpit.tasks.filter((task) => task.status !== "done")
  const breachedDrifts = openDrifts.filter((drift) => isDriftSlaBreached(drift)).length
  const driftTasks = openTasks.filter((task) => task.relatedDriftIds.length > 0)
  const evidenceLedger = cockpit.data.evidenceLedger ?? []
  const ledgerWeakCount = evidenceLedger.filter((entry) => entry.quality?.status === "weak").length
  const ledgerUnratedCount = evidenceLedger.filter((entry) => !entry.quality?.status).length
  const ledgerHint =
    evidenceLedger.length > 0
      ? ledgerWeakCount > 0
        ? `${ledgerWeakCount} dovezi slabe · ${ledgerUnratedCount} neevaluate`
        : ledgerUnratedCount > 0
          ? `${ledgerUnratedCount} neevaluate`
          : "registru curat"
      : "fara registru de dovada inca"
  const summaryItems: SummaryStripItem[] = [
    {
      label: "Drift activ",
      value: `${openDrifts.length}`,
      hint: "schimbari fata de baseline care cer decizie umana",
      tone: openDrifts.length > 0 ? "warning" : "success",
    },
    {
      label: "SLA depasit",
      value: `${breachedDrifts}`,
      hint: breachedDrifts > 0 ? "drift-uri iesite din fereastra de escalare" : "fara escalari depasite acum",
      tone: breachedDrifts > 0 ? "danger" : "success",
    },
    {
      label: "Task-uri din drift",
      value: `${driftTasks.length}`,
      hint: "actiuni generate deja din semnalele de drift",
      tone: driftTasks.length > 0 ? "accent" : "neutral",
    },
    {
      label: "Dovada",
      value: evidenceLedger.length > 0 ? `${evidenceLedger.length}` : "lipsa",
      hint: ledgerHint,
      tone: ledgerWeakCount > 0 ? "warning" : evidenceLedger.length > 0 ? "success" : "neutral",
    },
  ]

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
      <PageIntro
        eyebrow="Control / Drift"
        title="Tratezi schimbarea fata de baseline"
        description="Preiei, escaladezi sau inchizi drift-ul aici. Daca vrei queue-ul canonic sau livrabilul, continui in De rezolvat si Rapoarte."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              decizie umana
            </Badge>
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Snapshot drift
            </p>
            <p className="text-2xl font-semibold text-eos-text">{cockpit.data.summary.score}</p>
            <p className="text-sm text-eos-text-muted">{cockpit.data.summary.riskLabel}</p>
          </div>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={dashboardRoutes.resolve}>
                De rezolvat
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
            <Button asChild>
              <Link href={dashboardRoutes.reports}>
                Rapoarte
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </>
        }
      />

      <PillarTabs sectionId="control" />

      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Drift"
            title="Semnal si actiune"
            description="Cate schimbari sunt active, ce a depasit SLA-ul si ce task-uri au aparut din drift."
            items={summaryItems}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <SectionBoundary
          eyebrow="Flux canonic"
          title="Drift-ul ramane separat de inventar si dovada"
          description="Aici tratezi schimbarea fata de baseline. Pentru queue-ul principal si livrabil continui in De rezolvat si Rapoarte."
        />
        <HandoffCard
          title="Handoff corect intre drift, queue si rapoarte"
          description="Pastrezi drift-ul clar pe schimbare si decizie, iar executia si livrabilul stau in suprafetele canonice."
          destinationLabel="de rezolvat / rapoarte"
          checklist={[
            "nu amesteci inventarul cu drift-ul activ",
            "folosesti De rezolvat pentru executie si Rapoarte pentru output",
          ]}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href={dashboardRoutes.resolve}>Deschide De rezolvat</Link>
              </Button>
              <Button asChild>
                <Link href={dashboardRoutes.reports}>Deschide Rapoarte</Link>
              </Button>
            </>
          }
        />
      </div>

      {openDrifts.length > 0 && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Compliance drift</CardTitle>
            <p className="text-sm text-eos-text-muted">Schimbari detectate fata de snapshot.</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {openDrifts.map((drift) => {
              const guidance = getDriftPolicyFromRecord(drift)
              const breached = isDriftSlaBreached(drift)
              const isActing = actingDriftId === drift.id
              const isExpanded = expandedDriftId === drift.id
              const lifecycleStatus = drift.lifecycleStatus ?? "open"

              return (
                <DenseListItem key={drift.id} active={isExpanded} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDriftId((current) => (current === drift.id ? null : drift.id))
                      }
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-eos-text">
                              {drift.summary}
                            </p>
                            {isExpanded ? (
                              <Badge variant="secondary">
                                detalii deschise
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-eos-text-muted">
                            {formatDriftTypeLabel(drift.type)} · {formatRelativeRomanian(drift.detectedAtISO)}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <SeverityBadge severity={drift.severity} />
                          <LifecycleBadge state={(drift.lifecycleStatus ?? "open") as "open" | "acknowledged" | "in_progress" | "resolved" | "waived"} />
                          {breached && (
                            <Badge variant="destructive">
                              SLA depășit
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                    <Button
                      type="button"
                      onClick={() =>
                        setExpandedDriftId((current) => (current === drift.id ? null : drift.id))
                      }
                      variant="outline"
                      size="sm"
                    >
                      {isExpanded ? "Ascunde" : "Detalii"}
                    </Button>
                  </div>
                  {isExpanded ? (
                    <>
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                            De ce conteaza
                          </p>
                          <p className="mt-2 text-sm font-medium text-eos-text">
                            {guidance.lawReference}
                          </p>
                          <p className="mt-1 text-xs text-eos-text-muted">
                            {guidance.severityReason}
                          </p>
                        </div>
                        <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                            Ce faci acum
                          </p>
                          <p className="mt-2 text-sm font-medium text-eos-text">
                            {guidance.nextAction}
                          </p>
                        </div>
                        <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                            Dovada
                          </p>
                          <p className="mt-2 text-sm font-medium text-eos-text">
                            {guidance.evidenceRequired}
                          </p>
                        </div>
                        <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                            Escalare
                          </p>
                          <p className="mt-2 text-sm font-medium text-eos-text">
                            {drift.escalationOwner || guidance.ownerSuggestion}
                          </p>
                          <p className="mt-1 text-xs text-eos-text-muted">
                            {formatDriftEscalationTier(drift.escalationTier || guidance.escalationTier)} · până la{" "}
                            {formatDriftEscalationDeadline(
                              drift.escalationDueAtISO || guidance.escalationDueAtISO
                            )}
                          </p>
                          <p className="mt-2 text-xs text-eos-text-muted">
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
                      <p className="mt-3 text-xs text-eos-text-muted">
                        {[
                          drift.systemLabel || drift.sourceDocument || "Sursa tehnica fara eticheta",
                          drift.change,
                          formatRelativeRomanian(drift.detectedAtISO),
                        ].filter(Boolean).join(" · ")}
                      </p>
                      <ActionCluster
                        eyebrow="Actiuni"
                        title="Decizie pentru drift"
                        description="Alege pasul urmator pentru acest drift."
                        actions={
                          <>
                            {(lifecycleStatus === "open") && (
                              <Button
                                onClick={() => void handleDriftAction(drift.id, "acknowledge")}
                                disabled={cockpit.busy || isActing}
                                variant="outline"
                                size="sm"
                              >
                                Preia drift
                              </Button>
                            )}
                            {(lifecycleStatus === "open" || lifecycleStatus === "acknowledged") && (
                              <Button
                                onClick={() => void handleDriftAction(drift.id, "start")}
                                disabled={cockpit.busy || isActing}
                                variant="outline"
                                size="sm"
                              >
                                În lucru
                              </Button>
                            )}
                            {drift.open && lifecycleStatus === "in_progress" && (
                              <Button
                                onClick={() => void handleDriftAction(drift.id, "resolve")}
                                disabled={cockpit.busy || isActing}
                                size="sm"
                                className="bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
                              >
                                Rezolvă
                              </Button>
                            )}
                            {drift.open && (
                              <Button
                                onClick={() => void handleDriftAction(drift.id, "waive")}
                                disabled={cockpit.busy || isActing}
                                variant="outline"
                                size="sm"
                                className="border-eos-border bg-eos-surface text-eos-warning hover:bg-eos-warning-soft"
                              >
                                Waive
                              </Button>
                            )}
                            {!drift.open && (
                              <Button
                                onClick={() => void handleDriftAction(drift.id, "reopen")}
                                disabled={cockpit.busy || isActing}
                                variant="outline"
                                size="sm"
                              >
                                Redeschide
                              </Button>
                            )}
                          </>
                        }
                      />
                    </>
                  ) : (
                    <p className="mt-3 text-xs text-eos-text-muted">
                      {formatDriftLifecycleStatus(drift.lifecycleStatus ?? "open")} · owner:{" "}
                      {drift.escalationOwner || guidance.ownerSuggestion} ·{" "}
                      {formatDriftEscalationDeadline(
                        drift.escalationDueAtISO || guidance.escalationDueAtISO
                      )}
                    </p>
                  )}
                </DenseListItem>
              )
            })}
          </CardContent>
        </Card>
      )}

      {openTasks.length === 0 && openDrifts.length === 0 ? (
        <EmptyState
          title="Fără drift deschis"
          label="Momentan nu există semnale de drift sau acțiuni care să ceară atenție imediată."
        />
      ) : openTasks.length > 0 ? (
        <AlertsList tasks={openTasks} />
      ) : null}
    </div>
  )
}
