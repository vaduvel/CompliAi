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
      label: "Validare",
      value: "umana",
      hint: "drift-ul cere decizie si explicatie umana, nu inchidere automata",
      tone: "warning",
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
        title="Aici tratezi schimbarea fata de baseline, nu inventarul si nu exportul"
        description="Drift-ul ramane workspace-ul in care explici schimbarea, o preiei, o escalezi sau o inchizi. Inventarul si baseline-ul raman in Control, iar executia si dovada raman in Dovada."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              drift workspace
            </Badge>
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
              <Link href="/dashboard/sisteme">
                Control
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/checklists">
                Dovada
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </Button>
          </>
        }
      />

      <PillarTabs sectionId="control" />

      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Drift"
            title="Semnal, escalare si actiune"
            description="Vezi rapid cate schimbari sunt active, ce a depasit SLA-ul si cate task-uri au fost deja deschise din drift."
            items={summaryItems}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <SectionBoundary
          eyebrow="Flux canonic"
          title="Drift-ul ramane separat de inventar, baseline si dovada"
          description="Aici tratezi schimbarea fata de baseline si alegi daca o preiei, o remediezi sau o explici. Daca trebuie sa inchizi munca reala sau sa atasezi dovada, continui in Dovada."
          support={
            <div className="grid gap-4 md:grid-cols-3">
              <DriftFlowHint
                title="1. Vezi schimbarea"
                detail="Identifici ce s-a schimbat fata de baseline si de ce conteaza."
              />
              <DriftFlowHint
                title="2. Iei decizia"
                detail="Preiei, escaladezi, rezolvi sau waive-uiesti cu justificare."
              />
              <DriftFlowHint
                title="3. Continui corect"
                detail="Pentru executie si dovada revii in Dovada, nu transformi pagina de drift in remediation board."
              />
            </div>
          }
        />
        <HandoffCard
          title="Drift-ul nu inlocuieste restul pilonului de Control"
          description="Inventarul si baseline-ul raman in Control, iar remedierea ramane in Dovada. Pagina asta trebuie sa ramana clara pe schimbare, escalare si decizie."
          destinationLabel="control / dovada"
          checklist={[
            "nu amesteci inventarul cu drift-ul activ",
            "nu tratezi exportul ca rezolvare de drift",
            "folosesti Dovada pentru executie si dovada propriu-zisa",
          ]}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard/sisteme">Deschide Control</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/checklists">Deschide Dovada</Link>
              </Button>
            </>
          }
        />
      </div>

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
              const isExpanded = expandedDriftId === drift.id

              return (
                <div
                  key={drift.id}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5"
                >
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
                            <p className="text-base font-semibold text-[var(--color-on-surface)]">
                              {drift.summary}
                            </p>
                            {isExpanded ? (
                              <Badge variant="secondary">
                                detalii deschise
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                            {formatDriftTypeLabel(drift.type)} · {drift.change}
                          </p>
                          <p className="mt-2 text-xs text-[var(--color-muted)]">
                            {[
                              drift.systemLabel || drift.sourceDocument || "Sursa tehnica fara eticheta",
                              formatRelativeRomanian(drift.detectedAtISO),
                            ].join(" · ")}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-[var(--color-on-surface-muted)] line-clamp-2">
                            {guidance.impactSummary}
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
                      className="h-10 rounded-xl"
                    >
                      {isExpanded ? "Restrange" : "Detalii"}
                    </Button>
                  </div>
                  {isExpanded ? (
                    <>
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
                    </>
                  ) : (
                    <p className="mt-3 text-xs text-[var(--color-muted)]">
                      {formatDriftLifecycleStatus(drift.lifecycleStatus ?? "open")} · owner:{" "}
                      {drift.escalationOwner || guidance.ownerSuggestion} ·{" "}
                      {formatDriftEscalationDeadline(
                        drift.escalationDueAtISO || guidance.escalationDueAtISO
                      )}
                    </p>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {openTasks.length === 0 && openDrifts.length === 0 ? (
        <EmptyState
          title="Fara drift deschis"
          label="Momentan nu exista semnale de drift sau actiuni care sa ceara atentie imediata."
        />
      ) : openTasks.length > 0 ? (
        <AlertsList tasks={openTasks} />
      ) : null}
    </div>
  )
}

function DriftFlowHint({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
      <p className="text-sm font-medium text-[var(--color-on-surface)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">{detail}</p>
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
