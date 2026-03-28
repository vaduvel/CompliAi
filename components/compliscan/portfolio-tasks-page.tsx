"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckSquare, ClipboardList, Flag, Layers, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { PortfolioOrgActionButton } from "@/components/compliscan/portfolio-org-action-button"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import type { PortfolioTaskRow } from "@/lib/server/portfolio"

const priorityVariant = {
  P1: "destructive",
  P2: "warning",
  P3: "outline",
} as const

type GroupBy = "none" | "orgName" | "severity" | "priority"
type FilterSeverity = "all" | "critical" | "high" | "medium" | "low"
type FilterPriority = "all" | "P1" | "P2" | "P3"

function groupTasks(tasks: PortfolioTaskRow[], groupBy: GroupBy): Record<string, PortfolioTaskRow[]> {
  if (groupBy === "none") return { "Toate taskurile": tasks }

  const groups: Record<string, PortfolioTaskRow[]> = {}
  for (const task of tasks) {
    const key =
      groupBy === "orgName" ? task.orgName
        : groupBy === "severity" ? task.severity
        : task.priority
    if (!groups[key]) groups[key] = []
    groups[key].push(task)
  }
  return groups
}

// ── Batch Action Modal ───────────────────────────────────────────────────────

function BatchActionModal({
  selectedTasks,
  allTasks,
  onClose,
}: {
  selectedTasks: Set<string>
  allTasks: PortfolioTaskRow[]
  onClose: () => void
}) {
  const [generating, setGenerating] = useState(false)
  const tasks = allTasks.filter((t) => selectedTasks.has(`${t.orgId}-${t.taskId}`))

  // Group by org for preview
  const byOrg = new Map<string, PortfolioTaskRow[]>()
  for (const task of tasks) {
    const existing = byOrg.get(task.orgId) ?? []
    existing.push(task)
    byOrg.set(task.orgId, existing)
  }

  async function handleBatchDraft() {
    setGenerating(true)
    try {
      const orgIds = Array.from(byOrg.keys())
      const response = await fetch("/api/portfolio/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_drafts", orgIds }),
      })

      if (!response.ok) throw new Error("Eroare la acțiunea în bloc")
      const data = (await response.json()) as { message: string; count: number }
      toast.success(data.message)
      onClose()
    } catch {
      toast.error("Eroare la generarea batch.")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-eos-xl border border-eos-border bg-eos-surface shadow-2xl">
        <div className="border-b border-eos-border-subtle px-6 py-4">
          <h2 className="text-base font-semibold text-eos-text">
            Batch acțiuni — {tasks.length} taskuri selectate
          </h2>
          <p className="mt-1 text-xs text-eos-text-muted">
            Generează draft-uri pentru {byOrg.size} firme. Confirmare individuală per firmă.
          </p>
        </div>

        <div className="max-h-[400px] divide-y divide-eos-border-subtle overflow-y-auto px-6">
          {Array.from(byOrg.entries()).map(([orgId, orgTasks]) => (
            <div key={orgId} className="py-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                  {orgTasks[0].orgName}
                </Badge>
                <span className="text-xs text-eos-text-muted">
                  {orgTasks.length} task{orgTasks.length > 1 ? "uri" : ""}
                </span>
              </div>
              <ul className="mt-1.5 space-y-1 pl-2">
                {orgTasks.map((task) => (
                  <li key={task.taskId} className="flex items-start gap-2 text-xs text-eos-text-muted">
                    <Badge
                      variant={priorityVariant[task.priority]}
                      className="mt-0.5 shrink-0 text-[9px] normal-case tracking-normal"
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-eos-text">{task.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-eos-border-subtle px-6 py-4">
          <p className="text-[10px] text-eos-text-muted">
            Draft-urile necesită confirmare individuală per firmă.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onClose}>
              Anulează
            </Button>
            <Button
              size="sm"
              onClick={() => void handleBatchDraft()}
              disabled={generating}
              className="gap-1.5"
            >
              {generating ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Sparkles className="size-3.5" strokeWidth={2} />
              )}
              {generating ? "Se generează..." : `Generează ${byOrg.size} draft-uri`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function PortfolioTasksPage() {
  const [tasks, setTasks] = useState<PortfolioTaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>("orgName")
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>("all")
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showBatch, setShowBatch] = useState(false)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/portfolio/tasks", { cache: "no-store" })
        if (!response.ok) throw new Error("Nu am putut încărca taskurile din portofoliu.")
        const data = (await response.json()) as { tasks: PortfolioTaskRow[] }
        setTasks(data.tasks)
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Eroare necunoscută.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filteredTasks = useMemo(() => {
    let list = tasks
    if (filterSeverity !== "all") list = list.filter((t) => t.severity === filterSeverity)
    if (filterPriority !== "all") list = list.filter((t) => t.priority === filterPriority)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.orgName.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.owner.toLowerCase().includes(q)
      )
    }
    return list
  }, [tasks, filterSeverity, filterPriority, search])

  const grouped = useMemo(() => groupTasks(filteredTasks, groupBy), [filteredTasks, groupBy])

  const p1Count = useMemo(() => tasks.filter((t) => t.priority === "P1").length, [tasks])

  function toggleTask(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />

  // Count unique orgs
  const uniqueOrgs = new Set(tasks.map((t) => t.orgName)).size

  return (
    <div className="space-y-6">
      {showBatch && (
        <BatchActionModal
          selectedTasks={selected}
          allTasks={filteredTasks}
          onClose={() => setShowBatch(false)}
        />
      )}

      <PageIntro
        eyebrow="Portofoliu"
        title="De rezolvat — cross-client"
        description="Toate taskurile active din portofoliu, grupate și filtrabile. Selectează și acționează în lot."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {tasks.length} taskuri din {uniqueOrgs} firme
            </Badge>
            {p1Count > 0 ? (
              <Badge variant="destructive" dot className="normal-case tracking-normal">
                {p1Count} P1
              </Badge>
            ) : null}
          </>
        }
        actions={
          selected.size > 0 ? (
            <Button
              size="sm"
              onClick={() => setShowBatch(true)}
              className="gap-1.5"
            >
              <CheckSquare className="size-3.5" strokeWidth={2} />
              Acțiuni lot ({selected.size})
            </Button>
          ) : undefined
        }
      />

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută firmă, task, owner..."
            className="w-full rounded-eos-md border border-eos-border bg-eos-surface py-2 pl-3 pr-3 text-sm text-eos-text placeholder:text-eos-text-muted focus:border-eos-primary focus:outline-none"
          />
        </div>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
          className="rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text focus:outline-none"
        >
          <option value="all">Toate severitățile</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
          className="rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text focus:outline-none"
        >
          <option value="all">Toate prioritățile</option>
          <option value="P1">P1 — Urgent</option>
          <option value="P2">P2 — Important</option>
          <option value="P3">P3 — Standard</option>
        </select>

        <div className="flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface px-1 py-1">
          <Layers className="ml-2 size-3.5 text-eos-text-muted" strokeWidth={2} />
          {(["none", "orgName", "severity", "priority"] as GroupBy[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupBy(g)}
              className={`rounded-eos-sm px-2.5 py-1 text-[11px] font-medium transition ${
                groupBy === g
                  ? "bg-eos-primary text-white"
                  : "text-eos-text-muted hover:text-eos-text"
              }`}
            >
              {g === "none" ? "Flat" : g === "orgName" ? "Firmă" : g === "severity" ? "Severitate" : "Prioritate"}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <Card className="border-eos-border bg-eos-surface">
          <EmptyState
            title="Nu sunt taskuri"
            label={tasks.length > 0 ? "Niciun task nu corespunde filtrelor." : "Nu există taskuri active."}
            icon={ClipboardList}
            className="px-5 py-10"
          />
        </Card>
      ) : (
        Object.entries(grouped).map(([groupLabel, groupTasks]) => (
          <div key={groupLabel}>
            {groupBy !== "none" && (
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-eos-text">{groupLabel}</h3>
                <Badge variant="secondary" className="text-[10px] normal-case tracking-normal">
                  {groupTasks.length}
                </Badge>
              </div>
            )}
            <Card className="divide-y divide-eos-border-subtle overflow-hidden border-eos-border bg-eos-surface">
              {groupTasks.map((task) => {
                const key = `${task.orgId}-${task.taskId}`
                const isSelected = selected.has(key)
                return (
                  <div
                    key={key}
                    className={`flex flex-wrap items-start gap-3 px-5 py-4 ${
                      isSelected ? "bg-eos-primary-soft/30" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(key)}
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition ${
                        isSelected
                          ? "border-eos-primary bg-eos-primary text-white"
                          : "border-eos-border bg-eos-bg-inset"
                      }`}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={priorityVariant[task.priority]}
                          className="text-[10px] normal-case tracking-normal"
                        >
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                          {task.orgName}
                        </Badge>
                        <span className="text-xs text-eos-text-muted">Owner: {task.owner}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-eos-text">{task.title}</p>
                      <p className="mt-1 text-xs leading-5 text-eos-text-muted">{task.evidence}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-eos-text-muted">
                        <span>Severitate: {task.severity}</span>
                        {task.dueDate ? <span>• Scadență: {task.dueDate}</span> : null}
                        {task.updatedAtISO ? (
                          <span>
                            • Actualizat: {new Date(task.updatedAtISO).toLocaleDateString("ro-RO")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <PortfolioOrgActionButton
                      orgId={task.orgId}
                      destination="/dashboard/resolve"
                      label="Deschide"
                    />
                  </div>
                )
              })}
            </Card>
          </div>
        ))
      )}

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <div className="flex items-center gap-2 text-eos-text">
          <Flag className="size-4" strokeWidth={1.8} />
          <span className="font-medium">Queue unificat cross-client</span>
        </div>
        <p className="mt-1">
          Selectează taskuri din firme diferite și generează draft-uri în lot. Confirmare individuală per firmă — nu se aplică nimic automat.
        </p>
      </div>
    </div>
  )
}
