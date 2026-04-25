"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight } from "lucide-react"

import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { ErrorScreen } from "@/components/compliscan/route-sections"
import { Skeleton, SkeletonCard } from "@/components/evidence-os/Skeleton"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { V3KpiStrip, type V3KpiItem } from "@/components/compliscan/v3/kpi-strip"
import type { TaskPriority } from "@/components/compliscan/types"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"

type TaskFilter = "ALL" | TaskPriority | "DONE" | "RAPID" | "STRUCTURAL" | "L1" | "L2" | "L3"

export default function RemediationPage() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL")
  const [showHandoff, setShowHandoff] = useState(false)

  if (cockpit.error && !cockpit.loading) return <ErrorScreen message={cockpit.error} variant="section" />
  if (cockpit.loading || !cockpit.data) return (
    <div className="space-y-8">
      <Skeleton className="h-20 w-full rounded-eos-lg" />
      <Skeleton className="h-12 w-full rounded-eos-lg" />
      <div className="grid gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )

  const openTasks = cockpit.tasks.filter((task) => task.status !== "done")
  const evidenceAttached = cockpit.tasks.filter((task) => Boolean(task.attachedEvidence))
  const openPriorityOneTasks = openTasks.filter((task) => task.priority === "P1")
  const tasksMissingEvidence = openTasks.filter((task) => !task.attachedEvidence)
  const evidenceLedger = cockpit.data.evidenceLedger ?? []
  const ledgerReadyCount = evidenceLedger.filter((entry) => entry.quality?.status === "sufficient").length
  const ledgerWeakCount = evidenceLedger.filter((entry) => entry.quality?.status === "weak").length
  const ledgerUnratedCount = Math.max(
    0,
    evidenceLedger.length - ledgerReadyCount - ledgerWeakCount
  )
  const kpiItems: V3KpiItem[] = [
    {
      id: "open-tasks",
      label: "Task-uri deschise",
      value: openTasks.length,
      detail: "execuție activă în board",
      stripe: openTasks.length > 0 ? "warning" : "success",
      valueTone: openTasks.length > 0 ? "warning" : "success",
    },
    {
      id: "p1-open",
      label: "P1 deschise",
      value: openPriorityOneTasks.length,
      detail: openPriorityOneTasks.length > 0 ? "intri mai întâi în urgențe" : "nu ai urgențe acum",
      stripe: openPriorityOneTasks.length > 0 ? "critical" : "success",
      valueTone: openPriorityOneTasks.length > 0 ? "critical" : "success",
    },
    {
      id: "no-evidence",
      label: "Fără dovadă",
      value: tasksMissingEvidence.length,
      detail:
        tasksMissingEvidence.length > 0
          ? "task-uri care țin auditul blocat"
          : `${evidenceAttached.length} au dovadă atașată`,
      stripe: tasksMissingEvidence.length > 0 ? "warning" : "info",
      valueTone: tasksMissingEvidence.length > 0 ? "warning" : "info",
    },
    ...(evidenceLedger.length > 0
      ? [
          {
            id: "evidence-quality",
            label: "Calitate dovada",
            value: ledgerWeakCount > 0 ? `${ledgerWeakCount} slabe` : `${ledgerReadyCount} verificate`,
            detail:
              ledgerWeakCount > 0
                ? "înlocuiești dovezile slabe înainte de audit"
                : ledgerUnratedCount > 0
                  ? `${ledgerUnratedCount} neevaluate încă`
                  : "registru curat",
            stripe: (ledgerWeakCount > 0 ? "warning" : ledgerUnratedCount > 0 ? "info" : "success") as V3KpiItem["stripe"],
            valueTone: (ledgerWeakCount > 0 ? "warning" : ledgerUnratedCount > 0 ? "info" : "success") as V3KpiItem["valueTone"],
          } satisfies V3KpiItem,
        ]
      : []),
  ]

  const allTasksDone = cockpit.tasks.length > 0 && openTasks.length === 0
  const shouldShowHandoff = showHandoff || allTasksDone

  return (
    <div className="space-y-8">
      <V3PageHero
        breadcrumbs={[
          { label: "Dashboard" },
          { label: "Checklists", current: true },
        ]}
        title="Execuți, atașezi dovada și validezi"
        description={
          tasksMissingEvidence.length > 0
            ? "Atașezi dovada înainte să închizi task-ul."
            : ledgerWeakCount > 0
              ? "Înlocuiești dovezile slabe ca să nu blocheze auditul."
              : openPriorityOneTasks.length > 0
                ? "Intri în urgențele P1 înaintea restului."
                : "Poți lucra direct din board fără blocaje majore."
        }
      />

      <PillarTabs sectionId="dovada" />

      <V3KpiStrip items={kpiItems} />

      {cockpit.tasks.length === 0 ? (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="flex flex-col gap-4 px-5 py-8 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-eos-text">Niciun task generat inca</p>
              <p className="mt-1 text-xs text-eos-text-muted">
                Task-urile apar dupa primul scan. Scaneaza un document sau manifeste de configurare ca sa construim planul de remediere.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
              <Link href="/dashboard/scan">
                Deschide Scanarea
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <RemediationBoard
          tasks={cockpit.tasks}
          activeFilter={taskFilter}
          onFilterChange={setTaskFilter}
          onMarkDone={cockpitActions.handleMarkDone}
          onBulkMarkDone={cockpitActions.handleBulkMarkDone}
          onAttachEvidence={cockpitActions.attachEvidence}
          onExport={cockpitActions.handleTaskExport}
        />
      )}

      <div className="grid gap-4">
        {openTasks.length > 0 ? (
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div>
                <p className="text-sm font-semibold text-eos-text">Verificare si livrabil</p>
                <p className="text-xs text-eos-text-muted">
                  Vault si Audit si export raman dupa executie, ca sa nu concureze cu board-ul.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowHandoff((current) => !current)}>
                {showHandoff ? "Ascunde pasii de verificare" : "Arata pasii de verificare"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {shouldShowHandoff ? (
          <HandoffCard
            title="Ai terminat board-ul — mergi în paginile de consultare"
            description="Remedierea rămâne pagina de acțiune. Vault și Audit și export te ajută să verifici ce este audit-ready, fără să concureze cu execuția."
            destinationLabel="vault / audit pack"
            checklist={[
              "închizi task-ul și atașezi dovada aici",
              "verifici ledger-ul separat în Auditor Vault",
              "pregătești livrabilul final în Audit și export",
            ]}
            actions={
              <>
                <Button asChild variant="outline">
                <Link href="/dashboard/dosar">
                  Deschide Dosar
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/reports/audit-log">
                  Vezi jurnal audit
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
                </Button>
              </>
            }
          />
        ) : null}
      </div>
    </div>
  )
}
