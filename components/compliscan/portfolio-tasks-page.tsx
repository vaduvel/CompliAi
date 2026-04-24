"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckSquare, ClipboardList, Flag, Layers, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { PortfolioOrgActionButton } from "@/components/compliscan/portfolio-org-action-button"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import { V3FilterBar, V3FrameworkTag, V3KpiStrip, V3PageHero, V3RiskPill, type V3SeverityTone } from "@/components/compliscan/v3"
import { Button } from "@/components/evidence-os/Button"
import type { PortfolioTaskRow } from "@/lib/server/portfolio"

const priorityTone: Record<PortfolioTaskRow["priority"], V3SeverityTone> = {
  P1: "critical",
  P2: "high",
  P3: "medium",
}

const severityTone: Record<PortfolioTaskRow["severity"], V3SeverityTone> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
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
      <div className="w-full max-w-lg overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface shadow-2xl">
        <div className="border-b border-eos-border-subtle px-6 py-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Acțiune în lot
          </p>
          <h2 data-display-text="true" className="mt-1 font-display text-[16px] font-semibold tracking-[-0.015em] text-eos-text">
            Batch acțiuni — {tasks.length} taskuri selectate
          </h2>
          <p className="mt-1 text-[12px] text-eos-text-muted">
            Generează draft-uri pentru {byOrg.size} firme. Confirmare individuală per firmă.
          </p>
        </div>

        <div className="max-h-[400px] divide-y divide-eos-border-subtle overflow-y-auto px-6">
          {Array.from(byOrg.entries()).map(([orgId, orgTasks]) => (
            <div key={orgId} className="py-3">
              <div className="flex items-center gap-2">
                <V3FrameworkTag label={orgTasks[0].orgName} />
                <span className="text-xs text-eos-text-muted">
                  {orgTasks.length} task{orgTasks.length > 1 ? "uri" : ""}
                </span>
              </div>
              <ul className="mt-1.5 space-y-1 pl-2">
                {orgTasks.map((task) => (
                  <li key={task.taskId} className="flex items-start gap-2 text-xs text-eos-text-muted">
                    <V3RiskPill tone={priorityTone[task.priority]} className="mt-0.5 shrink-0">
                      {task.priority}
                    </V3RiskPill>
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
  const dueCount = useMemo(() => tasks.filter((t) => t.dueDate).length, [tasks])
  const selectedCount = selected.size
  const highSeverityCount = useMemo(
    () => tasks.filter((t) => t.severity === "critical" || t.severity === "high").length,
    [tasks]
  )

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
  const activeFilter = filterPriority !== "all" ? filterPriority : filterSeverity !== "all" ? filterSeverity : "all"

  return (
    <div className="space-y-6">
      {showBatch && (
        <BatchActionModal
          selectedTasks={selected}
          allTasks={filteredTasks}
          onClose={() => setShowBatch(false)}
        />
      )}

      <V3PageHero
        breadcrumbs={[{ label: "Portofoliu" }, { label: "Remediere clienți", current: true }]}
        title="De rezolvat — cross-client"
        description={
          <>
            Toate taskurile active din portofoliu, grupate și filtrabile. Selectează și acționează în lot, dar confirmarea rămâne individuală per firmă.
          </>
        }
        eyebrowBadges={
          <div className="flex flex-wrap items-center gap-2">
            <V3FrameworkTag label="taskuri" count={tasks.length} />
            <V3FrameworkTag label="firme" count={uniqueOrgs} />
            {p1Count > 0 ? <V3RiskPill tone="critical">{p1Count} P1</V3RiskPill> : null}
          </div>
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

      <V3KpiStrip
        items={[
          {
            id: "tasks",
            label: "Taskuri active",
            value: tasks.length,
            detail: `${uniqueOrgs} firme afectate`,
            stripe: tasks.length > 0 ? "info" : undefined,
          },
          {
            id: "priority",
            label: "Prioritate P1",
            value: p1Count,
            detail: p1Count > 0 ? "necesită decizie rapidă" : "fără P1 acum",
            stripe: p1Count > 0 ? "critical" : undefined,
            valueTone: p1Count > 0 ? "critical" : "neutral",
          },
          {
            id: "risk",
            label: "Severitate ridicată",
            value: highSeverityCount,
            detail: "critical + high",
            stripe: highSeverityCount > 0 ? "warning" : undefined,
            valueTone: highSeverityCount > 0 ? "warning" : "neutral",
          },
          {
            id: "due",
            label: "Cu scadență",
            value: dueCount,
            detail: "au termen explicit",
          },
          {
            id: "selected",
            label: "Selectate",
            value: selectedCount,
            detail: selectedCount > 0 ? "pregătite pentru lot" : "niciun batch activ",
            valueTone: selectedCount > 0 ? "info" : "neutral",
          },
        ]}
      />

      <V3FilterBar
        tabs={[
          { id: "all", label: "Toate", count: tasks.length },
          { id: "P1", label: "P1", count: p1Count },
          { id: "critical", label: "Critice", count: tasks.filter((t) => t.severity === "critical").length },
          { id: "high", label: "Ridicate", count: tasks.filter((t) => t.severity === "high").length },
        ]}
        activeTab={activeFilter}
        onTabChange={(id) => {
          if (id === "P1") {
            setFilterPriority("P1")
            setFilterSeverity("all")
          } else if (id === "critical" || id === "high") {
            setFilterSeverity(id)
            setFilterPriority("all")
          } else {
            setFilterSeverity("all")
            setFilterPriority("all")
          }
        }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Caută firmă, task, owner..."
        rightSlot={
          <>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
              className="h-[30px] rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] text-eos-text-muted focus:outline-none"
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
              className="h-[30px] rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] text-eos-text-muted focus:outline-none"
        >
          <option value="all">Toate prioritățile</option>
          <option value="P1">P1 — Urgent</option>
          <option value="P2">P2 — Important</option>
          <option value="P3">P3 — Standard</option>
        </select>

            <div className="flex h-[30px] items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-1">
          <Layers className="ml-2 size-3.5 text-eos-text-muted" strokeWidth={2} />
          {(["none", "orgName", "severity", "priority"] as GroupBy[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupBy(g)}
              className={`rounded-eos-sm px-2.5 py-1 text-[11px] font-medium transition ${
                groupBy === g
                      ? "bg-white/[0.06] text-eos-text"
                  : "text-eos-text-muted hover:text-eos-text"
              }`}
            >
              {g === "none" ? "Flat" : g === "orgName" ? "Firmă" : g === "severity" ? "Severitate" : "Prioritate"}
            </button>
          ))}
        </div>
          </>
        }
      />

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <section className="rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-10 text-center">
          <ClipboardList className="mx-auto mb-3 size-6 text-eos-text-tertiary" strokeWidth={1.6} />
          <h3 data-display-text="true" className="font-display text-[16px] font-semibold text-eos-text">
            Nu sunt taskuri
          </h3>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-eos-text-muted">
            {tasks.length > 0 ? "Niciun task nu corespunde filtrelor." : "Nu există taskuri active."}
          </p>
        </section>
      ) : (
        Object.entries(grouped).map(([groupLabel, groupTasks]) => (
          <div key={groupLabel}>
            {groupBy !== "none" && (
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  {groupLabel}
                </h3>
                <V3FrameworkTag label="taskuri" count={groupTasks.length} />
              </div>
            )}
            <div className="space-y-2">
              {groupTasks.map((task) => {
                const key = `${task.orgId}-${task.taskId}`
                const isSelected = selected.has(key)
                return (
                  <article
                    key={key}
                    className={`group relative flex flex-wrap items-center gap-3 overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-4 transition-all duration-150 hover:border-eos-border-strong hover:bg-white/[0.02] ${
                      isSelected ? "border-eos-primary/40 bg-eos-primary-soft/20" : ""
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                        severityTone[task.severity] === "critical"
                          ? "bg-eos-error"
                          : severityTone[task.severity] === "high"
                            ? "bg-eos-warning"
                            : severityTone[task.severity] === "medium"
                              ? "bg-eos-primary/70"
                              : "bg-eos-border-strong"
                      }`}
                      aria-hidden
                    />
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
                        <V3RiskPill tone={priorityTone[task.priority]}>
                          {task.priority}
                        </V3RiskPill>
                        <V3FrameworkTag label={task.orgName} />
                        <span className="font-mono text-[11px] text-eos-text-muted">Owner: {task.owner}</span>
                      </div>
                      <p className="mt-2 text-[13.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text">{task.title}</p>
                      <p className="mt-1 text-[12px] leading-5 text-eos-text-muted">{task.evidence}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-eos-text-muted">
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
                  </article>
                )
              })}
            </div>
          </div>
        ))
      )}

      <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <div className="flex items-center gap-2 text-eos-text">
          <Flag className="size-4" strokeWidth={1.8} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">Queue unificat cross-client</span>
        </div>
        <p className="mt-1">
          Selectează taskuri din firme diferite și generează draft-uri în lot. Confirmare individuală per firmă — nu se aplică nimic automat.
        </p>
      </div>
    </div>
  )
}
