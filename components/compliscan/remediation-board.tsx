"use client"

import { EmptyState } from "@/components/evidence-os/EmptyState"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
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

const filters: Array<{ value: FilterValue; label: string }> = [
  { value: "ALL", label: "Deschise" },
  { value: "RAPID", label: "Rapide" },
  { value: "STRUCTURAL", label: "Structurale" },
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "P3", label: "P3" },
  { value: "DONE", label: "Inchise" },
]

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
            Task-uri actionabile, separate intre inchideri rapide si schimbari structurale.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--color-info)] bg-[var(--color-info-muted)] px-3 py-1 text-[var(--color-info)]">
              {openRapidCount} rapide deschise
            </span>
            <span className="rounded-full border border-[var(--color-warning)] bg-[var(--color-warning-muted)] px-3 py-1 text-[var(--color-warning)]">
              {openStructuralCount} structurale deschise
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              variant="outline"
              className={`h-9 rounded-xl border-[var(--color-border)] px-3.5 text-xs sm:px-4 sm:text-sm ${
                activeFilter === filter.value
                  ? "border-[var(--border-subtle)] bg-[var(--bg-active)] text-[var(--text-primary)]"
                  : "bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
              }`}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {visibleTasks.length === 0 && (
          <EmptyState
            title="Nu exista task-uri pentru filtrul curent"
            label="Schimba filtrul sau ruleaza un nou scan pentru a genera remedieri relevante."
            className="border-[var(--color-border)] bg-[var(--color-surface-variant)]"
          />
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}>
            {title}
          </span>
          <p className="text-sm leading-6 text-[var(--color-on-surface-muted)]">{description}</p>
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
