"use client"

import Link from "next/link"
import { useState } from "react"
import { Badge } from "@/components/evidence-os/Badge"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/evidence-os/Dialog"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { TaskCard } from "@/components/compliscan/task-card"
import type { CockpitTask, TaskPriority } from "@/components/compliscan/types"
import type { ScanFinding, TaskEvidenceKind } from "@/lib/compliance/types"
import {
  getFindingNarrative,
  getFindingStatusPresentation,
} from "@/lib/compliscan/finding-cockpit"
import { dashboardFindingRoute } from "@/lib/compliscan/dashboard-routes"

type FilterValue = "ALL" | TaskPriority | "DONE" | "RAPID" | "STRUCTURAL" | "L1" | "L2" | "L3"

type RemediationBoardProps = {
  tasks: CockpitTask[]
  findings?: ScanFinding[]
  activeFilter: FilterValue
  highlightedTaskId?: string | null
  onFilterChange: (value: FilterValue) => void
  onMarkDone: (id: string) => void
  onBulkMarkDone?: (ids: string[]) => void
  onAttachEvidence: (id: string, file: File, kind: TaskEvidenceKind) => void | Promise<void>
  onExport: (id: string) => void
}

const filters: Array<{ value: FilterValue; label: string }> = [
  { value: "ALL", label: "Toate deschise" },
  { value: "RAPID", label: "Câștiguri rapide" },
  { value: "STRUCTURAL", label: "Structurale" },
  { value: "P1", label: "P1 · Urgente" },
  { value: "P2", label: "P2 · Importante" },
  { value: "P3", label: "P3 · Optionale" },
  { value: "L1", label: "Validat automat" },
  { value: "L2", label: "Confirmat intern" },
  { value: "L3", label: "Validat de expert" },
  { value: "DONE", label: "Închise" },
]

const filterGroups: Array<{ label: string; values: FilterValue[] }> = [
  { label: "Status", values: ["ALL", "DONE"] },
  { label: "Tip remediere", values: ["RAPID", "STRUCTURAL"] },
  { label: "Prioritate", values: ["P1", "P2", "P3"] },
  { label: "Nivel validare", values: ["L1", "L2", "L3"] },
]

export function RemediationBoard({
  tasks,
  findings = [],
  activeFilter,
  highlightedTaskId,
  onFilterChange,
  onMarkDone,
  onBulkMarkDone,
  onAttachEvidence,
  onExport,
}: RemediationBoardProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const findingById = new Map(findings.map((finding) => [finding.id, finding]))

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll(ids: string[]) {
    setSelectedIds(new Set(ids))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  const visibleTasks = tasks.filter((task) => {
    if (activeFilter === "ALL") return task.status !== "done"
    if (activeFilter === "RAPID") return task.remediationMode === "rapid" && task.status !== "done"
    if (activeFilter === "STRUCTURAL") {
      return task.remediationMode === "structural" && task.status !== "done"
    }
    if (activeFilter === "DONE") return task.status === "done"
    if (activeFilter === "L1") return task.validationLevel === 1 && task.status !== "done"
    if (activeFilter === "L2") return task.validationLevel === 2 && task.status !== "done"
    if (activeFilter === "L3") return task.validationLevel === 3 && task.status !== "done"
    return task.priority === activeFilter && task.status !== "done"
  })
  const evidenceBlockedTasks = visibleTasks.filter(
    (task) => task.status !== "done" && !task.attachedEvidence
  )
  const urgentTasks = visibleTasks.filter(
    (task) => task.status !== "done" && task.priority === "P1" && task.attachedEvidence
  )
  const groupedTaskIds = new Set([...evidenceBlockedTasks, ...urgentTasks].map((task) => task.id))
  const rapidTasks = visibleTasks.filter(
    (task) => task.remediationMode === "rapid" && !groupedTaskIds.has(task.id)
  )
  const structuralTasks = visibleTasks.filter(
    (task) => task.remediationMode === "structural" && !groupedTaskIds.has(task.id)
  )
  const openCount = tasks.filter((task) => task.status !== "done").length
  const activeFilterLabel = filters.find((filter) => filter.value === activeFilter)?.label ?? "Deschise"

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="gap-3 border-b border-eos-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-sm font-semibold text-eos-text uppercase tracking-[0.12em]">
                Task-uri de suport
              </CardTitle>
              <Badge className="border-eos-border bg-eos-bg-inset text-eos-text-muted">
                {openCount} deschise
              </Badge>
            </div>
            <p className="text-xs text-eos-text-muted">
              Sub-pași din findings. Rezolvarea merge prin cockpitul fiecărui caz.
            </p>
          </div>

          {openCount > 0 && (
            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-2.5">
              <div className="space-y-2">
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
          )}
        </div>
      </CardHeader>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between border-b border-eos-primary/20 bg-eos-primary/5 px-6 py-3">
          <span className="text-sm text-eos-text">{selectedIds.size} task-uri selectate</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={clearSelection}>Anulează</Button>
            {onBulkMarkDone && (
              <Button size="sm" onClick={() => setShowBulkConfirm(true)}>
                Marchează rezolvate ({selectedIds.size})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bulk mark-done confirmation dialog */}
      <Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Marchezi {selectedIds.size} task-uri ca rezolvate?</DialogTitle>
            <DialogDescription>
              Această acțiune este ireversibilă. Task-urile vor fi marcate ca done și scoase din board.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkConfirm(false)}>
              Anulează
            </Button>
            <Button
              onClick={() => {
                onBulkMarkDone?.(Array.from(selectedIds))
                clearSelection()
                setShowBulkConfirm(false)
              }}
            >
              Confirmă ({selectedIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardContent className="space-y-4 pt-6">
        {/* Select all */}
        {visibleTasks.filter((t) => t.status !== "done").length > 1 && onBulkMarkDone && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs text-eos-primary hover:underline"
              onClick={() => selectAll(visibleTasks.filter((t) => t.status !== "done").map((t) => t.id))}
            >
              Selectează toate ({visibleTasks.filter((t) => t.status !== "done").length})
            </button>
            {selectedIds.size > 0 && (
              <button type="button" className="text-xs text-eos-text-muted hover:underline" onClick={clearSelection}>
                · Deselectează
              </button>
            )}
          </div>
        )}

        {visibleTasks.length === 0 && activeFilter === "ALL" && (
          <EmptyState
            title="Niciun finding activ"
            label="Pornește o scanare sau completează evaluarea NIS2 pentru a genera probleme de remediat."
            className="border-eos-border bg-eos-surface-variant"
          />
        )}
        {visibleTasks.length === 0 && activeFilter !== "ALL" && (
          <EmptyState
            title="Niciun task pentru filtrul curent"
            label="Schimbă filtrul sau pornește un scan nou pentru remedieri relevante."
            className="border-eos-border bg-eos-surface-variant"
          />
        )}

        {activeFilter === "ALL" && evidenceBlockedTasks.length > 0 && (
          <TaskGroup
            title="Blocaje de audit"
            description="Task-uri fara dovada atasata. Le rezolvi primele ca sa nu blocheze inchiderea si exportul."
            tone="danger"
            tasks={evidenceBlockedTasks}
            findingById={findingById}
            highlightedTaskId={highlightedTaskId}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onMarkDone={onMarkDone}
            onAttachEvidence={onAttachEvidence}
            onExport={onExport}
          />
        )}

        {activeFilter === "ALL" && urgentTasks.length > 0 && (
          <TaskGroup
            title="Urgente P1"
            description="Task-uri cu prioritate maxima care au deja context suficient ca sa fie inchise imediat."
            tone="warning"
            tasks={urgentTasks}
            findingById={findingById}
            highlightedTaskId={highlightedTaskId}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onMarkDone={onMarkDone}
            onAttachEvidence={onAttachEvidence}
            onExport={onExport}
          />
        )}

        {activeFilter === "ALL" && rapidTasks.length > 0 && (
          <TaskGroup
            title="Remedieri rapide"
            description="Task-uri pe care le poti inchide rapid daca dovada e pregatita."
            tone="info"
            tasks={rapidTasks}
            findingById={findingById}
            highlightedTaskId={highlightedTaskId}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
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
            findingById={findingById}
            highlightedTaskId={highlightedTaskId}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onMarkDone={onMarkDone}
            onAttachEvidence={onAttachEvidence}
            onExport={onExport}
          />
        )}

        {activeFilter !== "ALL" &&
          visibleTasks.map((task) => (
            <div key={task.id} className="flex items-start gap-2">
              {onBulkMarkDone && task.status !== "done" && (
                <input
                  type="checkbox"
                  className="mt-4 size-4 rounded border-eos-border accent-eos-primary shrink-0"
                  checked={selectedIds.has(task.id)}
                  onChange={() => toggleSelect(task.id)}
                />
              )}
              <div className="min-w-0 flex-1">
                <RelatedFindingAnchor
                  task={task}
                  finding={getPrimaryRelatedFinding(task, findingById)}
                />
                <TaskCard
                  task={task}
                  highlighted={highlightedTaskId === task.id}
                  onMarkDone={onMarkDone}
                  onAttachEvidence={onAttachEvidence}
                  onExport={onExport}
                />
              </div>
            </div>
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
    <div className="flex flex-col gap-2 rounded-eos-md border border-eos-border bg-eos-surface-variant p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-eos-text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const filter = filters.find((item) => item.value === value)
          if (!filter) return null

          return (
            <Button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              size="sm"
              variant="outline"
              className={`${
                activeFilter === filter.value
                  ? "border-eos-border-subtle bg-eos-surface-active text-eos-text"
                  : "border-eos-border bg-eos-surface text-eos-text-muted"
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
  findingById,
  highlightedTaskId,
  selectedIds,
  onToggleSelect,
  onMarkDone,
  onAttachEvidence,
  onExport,
}: {
  title: string
  description: string
  tone: "info" | "warning" | "danger"
  tasks: CockpitTask[]
  findingById: Map<string, ScanFinding>
  highlightedTaskId?: string | null
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onMarkDone: (id: string) => void
  onAttachEvidence: (id: string, file: File, kind: TaskEvidenceKind) => void | Promise<void>
  onExport: (id: string) => void
}) {
  const toneClass =
    tone === "info"
      ? "border-eos-border bg-eos-primary-soft text-eos-info"
      : tone === "danger"
        ? "border-eos-error-border bg-eos-error-soft text-eos-error"
        : "border-eos-warning-border bg-eos-warning-soft text-eos-warning"

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 border-b border-eos-border pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={toneClass}>{title}</Badge>
          <Badge className="border-eos-border bg-eos-bg-inset text-eos-text-muted">
            {tasks.length} task-uri
          </Badge>
        </div>
        <p className="text-xs leading-5 text-eos-text-muted sm:max-w-xl sm:text-right">
          {description}
        </p>
      </div>

      {tasks.map((task) => (
        <div key={task.id} className="flex items-start gap-2">
          {onToggleSelect && task.status !== "done" && (
            <input
              type="checkbox"
              className="mt-4 size-4 rounded border-eos-border accent-eos-primary shrink-0"
              checked={selectedIds?.has(task.id) ?? false}
              onChange={() => onToggleSelect(task.id)}
            />
          )}
          <div className="min-w-0 flex-1">
            <RelatedFindingAnchor
              task={task}
              finding={getPrimaryRelatedFinding(task, findingById)}
            />
            <TaskCard
              task={task}
              highlighted={highlightedTaskId === task.id}
              onMarkDone={onMarkDone}
              onAttachEvidence={onAttachEvidence}
              onExport={onExport}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function getPrimaryRelatedFinding(task: CockpitTask, findingById: Map<string, ScanFinding>) {
  for (const findingId of task.relatedFindingIds) {
    const finding = findingById.get(findingId)
    if (finding) return finding
  }

  return null
}

function RelatedFindingAnchor({
  task,
  finding,
}: {
  task: CockpitTask
  finding: ScanFinding | null
}) {
  if (!finding) return null

  const status = getFindingStatusPresentation(finding.findingStatus)
  const narrative = getFindingNarrative(finding)
  const cockpitHref = dashboardFindingRoute(
    finding.id,
    finding.suggestedDocumentType ? { generator: "1" } : undefined
  )

  return (
    <div className="mb-3 rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant px-4 py-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
              Caz asociat
            </p>
            <SeverityBadge severity={finding.severity as "critical" | "high" | "medium" | "low"} />
            <Badge variant={status.variant} className="normal-case tracking-normal">
              {status.label}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-eos-text">{finding.title}</p>
            <p className="mt-1 text-xs leading-5 text-eos-text-muted">
              {narrative.action}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <Link
            href={cockpitHref}
            className="inline-flex items-center gap-2 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-xs font-medium text-eos-text transition-colors hover:bg-eos-bg-inset"
          >
            {finding.suggestedDocumentType ? "Intră și generează" : "Intră în cockpit"}
          </Link>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-eos-text-muted">
        Task-ul <span className="font-medium text-eos-text">{task.title}</span> rămâne sub acest finding și merge în aceeași urmă de dovadă, aprobare și monitorizare.
      </p>
    </div>
  )
}
