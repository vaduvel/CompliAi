"use client"

import { Badge } from "@/components/evidence-os/Badge"
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

const filterGroups: Array<{ label: string; values: FilterValue[] }> = [
  { label: "Status", values: ["ALL", "DONE"] },
  { label: "Tip remediere", values: ["RAPID", "STRUCTURAL"] },
  { label: "Prioritate", values: ["P1", "P2", "P3"] },
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
  const openCount = tasks.filter((task) => task.status !== "done").length
  const openPriorityOneCount = tasks.filter(
    (task) => task.status !== "done" && task.priority === "P1"
  ).length
  const missingEvidenceCount = tasks.filter(
    (task) => task.status !== "done" && !task.attachedEvidence
  ).length

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="gap-4 border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-lg text-[var(--color-on-surface)]">Board de remediere</CardTitle>
              <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                {visibleTasks.length} vizibile
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                {openCount} deschise
              </Badge>
              {openPriorityOneCount > 0 ? (
                <Badge className="border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]">
                  {openPriorityOneCount} P1
                </Badge>
              ) : null}
              {missingEvidenceCount > 0 ? (
                <Badge className="border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]">
                  {missingEvidenceCount} fara dovada
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 xl:min-w-[42rem]">
            {filterGroups.map((group) => (
              <FilterCluster
                key={group.label}
                label={group.label}
                activeFilter={activeFilter}
                values={group.values}
                onFilterChange={onFilterChange}
              />
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {visibleTasks.length === 0 && (
          <EmptyState
            title="Nu exista task-uri pentru filtrul curent"
            label="Schimba filtrul sau ruleaza un scan nou pentru remedieri relevante."
            className="border-[var(--color-border)] bg-[var(--color-surface-variant)]"
          />
        )}

        {activeFilter === "ALL" && rapidTasks.length > 0 && (
          <TaskGroup
            title="Remedieri rapide"
            description="Task-uri pe care le poti inchide rapid daca dovada e pregatita."
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
            description="Task-uri care cer coordonare, schimbare persistenta sau dovada mai riguroasa."
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

function FilterCluster({
  label,
  values,
  activeFilter,
  onFilterChange,
}: {
  label: string
  values: FilterValue[]
  activeFilter: FilterValue
  onFilterChange: (value: FilterValue) => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const filter = filters.find((item) => item.value === value)
          if (!filter) return null

          return (
            <Button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              variant="outline"
              className={`h-8 rounded-xl px-3 text-xs ${
                activeFilter === filter.value
                  ? "border-[var(--border-subtle)] bg-[var(--bg-active)] text-[var(--text-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface-muted)]"
              }`}
            >
              {filter.label}
            </Button>
          )
        })}
      </div>
    </div>
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
    <div className="space-y-3">
      <div className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={toneClass}>{title}</Badge>
          <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
            {tasks.length} task-uri
          </Badge>
        </div>
        <p className="text-xs leading-5 text-[var(--color-on-surface-muted)] sm:max-w-xl sm:text-right">
          {description}
        </p>
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
