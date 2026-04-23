"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight } from "lucide-react"

import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { ErrorScreen } from "@/components/compliscan/route-sections"
import { Skeleton, SkeletonCard } from "@/components/evidence-os/Skeleton"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
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
      <Skeleton className="h-20 w-full rounded-eos-xl" />
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
  const dominantExecutionSignal =
    tasksMissingEvidence.length > 0
      ? `${tasksMissingEvidence.length} task-uri fără dovadă`
      : ledgerWeakCount > 0
        ? `${ledgerWeakCount} dovezi slabe`
        : openPriorityOneTasks.length > 0
          ? `${openPriorityOneTasks.length} urgente P1`
          : `${openTasks.length} task-uri active`
  const items: SummaryStripItem[] = [
    {
      label: "Task-uri deschise",
      value: `${openTasks.length}`,
      hint: "execuție activă în board",
      tone: openTasks.length > 0 ? "warning" : "success",
    },
    {
      label: "P1 deschise",
      value: `${openPriorityOneTasks.length}`,
      hint: openPriorityOneTasks.length > 0 ? "intri mai întâi în urgențe" : "nu ai urgențe acum",
      tone: openPriorityOneTasks.length > 0 ? "danger" : "success",
    },
    {
      label: "Fără dovadă",
      value: `${tasksMissingEvidence.length}`,
      hint:
        tasksMissingEvidence.length > 0
          ? "task-uri care țin auditul blocat"
          : `${evidenceAttached.length} au dovadă atașată`,
      tone: tasksMissingEvidence.length > 0 ? "warning" : "accent",
    },
  ]

  if (evidenceLedger.length > 0) {
    items.push({
      label: "Calitate dovada",
      value: ledgerWeakCount > 0 ? `${ledgerWeakCount} slabe` : `${ledgerReadyCount} verificate`,
      hint:
        ledgerWeakCount > 0
          ? "înlocuiești dovezile slabe înainte de audit"
          : ledgerUnratedCount > 0
            ? `${ledgerUnratedCount} neevaluate încă`
            : "registru curat",
      tone: ledgerWeakCount > 0 ? "warning" : ledgerUnratedCount > 0 ? "accent" : "success",
    })
  }

  const allTasksDone = cockpit.tasks.length > 0 && openTasks.length === 0
  const shouldShowHandoff = showHandoff || allTasksDone

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Dovada / Remediere"
        title="Execuți, atașezi dovada și validezi"
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              executie
            </Badge>
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Blocaj curent
            </p>
            <p className="text-2xl font-semibold text-eos-text">{dominantExecutionSignal}</p>
            <p className="text-sm text-eos-text-muted">
              {tasksMissingEvidence.length > 0
                ? "Atașezi dovada înainte să închizi task-ul."
                : ledgerWeakCount > 0
                  ? "Înlocuiești dovezile slabe ca să nu blocheze auditul."
                  : openPriorityOneTasks.length > 0
                    ? "Intri în urgențele P1 înaintea restului."
                    : "Poți lucra direct din board fără blocaje majore."}
            </p>
          </div>
        }
      />

      <PillarTabs sectionId="dovada" />

      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Snapshot de execuție"
            title="Ce închizi acum"
            items={items}
          />
        </CardContent>
      </Card>

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
