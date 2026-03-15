"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight } from "lucide-react"

import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import type { TaskPriority } from "@/components/compliscan/types"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"

type TaskFilter = "ALL" | TaskPriority | "DONE" | "RAPID" | "STRUCTURAL"

export default function RemediationPage() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL")

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const openTasks = cockpit.tasks.filter((task) => task.status !== "done")
  const evidenceAttached = cockpit.tasks.filter((task) => Boolean(task.attachedEvidence))
  const openPriorityOneTasks = openTasks.filter((task) => task.priority === "P1")
  const tasksMissingEvidence = openTasks.filter((task) => !task.attachedEvidence)
  const items: SummaryStripItem[] = [
    {
      label: "Task-uri deschise",
      value: `${openTasks.length}`,
      hint: "executie activa in board",
      tone: openTasks.length > 0 ? "warning" : "success",
    },
    {
      label: "P1 deschise",
      value: `${openPriorityOneTasks.length}`,
      hint: openPriorityOneTasks.length > 0 ? "intri mai intai in urgente" : "nu ai urgente acum",
      tone: openPriorityOneTasks.length > 0 ? "danger" : "success",
    },
    {
      label: "Fara dovada",
      value: `${tasksMissingEvidence.length}`,
      hint:
        tasksMissingEvidence.length > 0
          ? "task-uri care tin auditul blocat"
          : `${evidenceAttached.length} au dovada atasata`,
      tone: tasksMissingEvidence.length > 0 ? "warning" : "accent",
    },
  ]

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Dovada / Remediere"
        title="Executi, atasezi dovada si validezi"
        description="Aici inchizi taskul corect. Vault si Audit si export raman pasi de verificare separati."
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
              Snapshot dovada
            </p>
            <p className="text-2xl font-semibold text-eos-text">{cockpit.data.summary.score}</p>
            <p className="text-sm text-eos-text-muted">{cockpit.data.summary.riskLabel}</p>
          </div>
        }
      />

      <PillarTabs sectionId="dovada" />

      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Snapshot de executie"
            title="Ce inchizi acum"
            items={items}
          />
        </CardContent>
      </Card>

      <RemediationBoard
        tasks={cockpit.tasks}
        activeFilter={taskFilter}
        onFilterChange={setTaskFilter}
        onMarkDone={cockpitActions.handleMarkDone}
        onAttachEvidence={cockpitActions.attachEvidence}
        onExport={cockpitActions.handleTaskExport}
      />

      <div className="grid gap-4">
        <HandoffCard
          title="Cand termini board-ul, mergi in paginile read-only"
          description="Remedierea ramane pagina de actiune. Vault si Audit si export te ajuta sa verifici ce este audit-ready, fara sa concureze cu executia."
          destinationLabel="vault / audit pack"
          checklist={[
            "inchizi task-ul si atasezi dovada aici",
            "verifici ledger-ul separat in Auditor Vault",
            "pregatesti livrabilul final in Audit si export",
          ]}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard/rapoarte/auditor-vault">
                  Auditor Vault
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/rapoarte">
                  Audit si export
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </Link>
              </Button>
            </>
          }
        />
      </div>
    </div>
  )
}
