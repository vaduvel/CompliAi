"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskCard } from "@/components/compliscan/task-card"
import type { CockpitTask, TaskPriority } from "@/components/compliscan/types"
import type { TaskEvidenceKind } from "@/lib/compliance/types"

type FilterValue = "ALL" | TaskPriority | "DONE" | "RAPID" | "STRUCTURAL"

type RemediationBoardProps = {
  tasks: CockpitTask[]
  activeFilter: FilterValue
  highlightedTaskId?: string | null
  onFilterChange: (value: FilterValue) => void
  onMarkDone: (id: string) => void
  onAttachEvidence: (id: string, file: File, kind: TaskEvidenceKind) => void | Promise<void>
  onExport: (id: string) => void
}

const filters: FilterValue[] = ["ALL", "RAPID", "STRUCTURAL", "P1", "P2", "P3", "DONE"]

export function RemediationBoard({
  tasks,
  activeFilter,
  highlightedTaskId,
  onFilterChange,
  onMarkDone,
  onAttachEvidence,
  onExport,
}: RemediationBoardProps) {
  const visibleTasks = tasks.filter((task) => {
    if (activeFilter === "ALL") return task.status !== "done"
    if (activeFilter === "RAPID") return task.remediationMode === "rapid" && task.status !== "done"
    if (activeFilter === "STRUCTURAL") {
      return task.remediationMode === "structural" && task.status !== "done"
    }
    if (activeFilter === "DONE") return task.status === "done"
    return task.priority === activeFilter && task.status !== "done"
  })
  const rapidTasks = visibleTasks.filter((task) => task.remediationMode === "rapid")
  const structuralTasks = visibleTasks.filter((task) => task.remediationMode === "structural")
  const openRapidCount = tasks.filter(
    (task) => task.remediationMode === "rapid" && task.status !== "done"
  ).length
  const openStructuralCount = tasks.filter(
    (task) => task.remediationMode === "structural" && task.status !== "done"
  ).length

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle className="text-lg text-[var(--color-on-surface)]">Remediere</CardTitle>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Task-uri actionabile separate intre inchideri rapide si schimbari structurale. Acesta este workflow-ul principal.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--color-info)] bg-[var(--color-info-muted)] px-3 py-1 text-[var(--color-info)]">
              {openRapidCount} remedieri rapide deschise
            </span>
            <span className="rounded-full border border-[var(--color-warning)] bg-[var(--color-warning-muted)] px-3 py-1 text-[var(--color-warning)]">
              {openStructuralCount} remedieri structurale deschise
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter}
              onClick={() => onFilterChange(filter)}
              variant="outline"
              className={`h-9 rounded-xl border-[var(--color-border)] px-4 ${
                activeFilter === filter
                  ? "border-[var(--border-subtle)] bg-[var(--bg-active)] text-[var(--text-primary)]"
                  : "bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
              }`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {visibleTasks.length === 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 text-sm text-[var(--color-on-surface-muted)]">
            Nu exista task-uri pentru filtrul curent.
          </div>
        )}

        {activeFilter === "ALL" && rapidTasks.length > 0 && (
          <TaskGroup
            title="Remedieri rapide"
            description="Schimbari mici de text, setare sau dovada pe care le poti valida imediat prin rescan."
            tone="info"
            tasks={rapidTasks}
            highlightedTaskId={highlightedTaskId}
            onMarkDone={onMarkDone}
            onAttachEvidence={onAttachEvidence}
            onExport={onExport}
          />
        )}

        {activeFilter === "ALL" && structuralTasks.length > 0 && (
          <TaskGroup
            title="Remedieri structurale"
            description="Schimbari de proces, control operational sau configurare persistenta care cer coordonare mai larga."
            tone="warning"
            tasks={structuralTasks}
            highlightedTaskId={highlightedTaskId}
            onMarkDone={onMarkDone}
            onAttachEvidence={onAttachEvidence}
            onExport={onExport}
          />
        )}

        {activeFilter !== "ALL" &&
          visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              highlighted={highlightedTaskId === task.id}
              onMarkDone={onMarkDone}
              onAttachEvidence={onAttachEvidence}
              onExport={onExport}
            />
          ))}
      </CardContent>
    </Card>
  )
}

function TaskGroup({
  title,
  description,
  tone,
  tasks,
  highlightedTaskId,
  onMarkDone,
  onAttachEvidence,
  onExport,
}: {
  title: string
  description: string
  tone: "info" | "warning"
  tasks: CockpitTask[]
  highlightedTaskId?: string | null
  onMarkDone: (id: string) => void
  onAttachEvidence: (id: string, file: File, kind: TaskEvidenceKind) => void | Promise<void>
  onExport: (id: string) => void
}) {
  const toneClass =
    tone === "info"
      ? "border-[var(--color-info)] bg-[var(--color-info-muted)] text-[var(--color-info)]"
      : "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}>
            {title}
          </span>
          <p className="text-sm text-[var(--color-on-surface-muted)]">{description}</p>
        </div>
      </div>

      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          highlighted={highlightedTaskId === task.id}
          onMarkDone={onMarkDone}
          onAttachEvidence={onAttachEvidence}
          onExport={onExport}
        />
      ))}
    </div>
  )
}
