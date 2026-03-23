"use client"

import { useEffect, useMemo, useState } from "react"
import { ClipboardList, Flag } from "lucide-react"

import { PortfolioOrgActionButton } from "@/components/compliscan/portfolio-org-action-button"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/evidence-os/Badge"
import { Card } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import type { PortfolioTaskRow } from "@/lib/server/portfolio"

const priorityVariant = {
  P1: "destructive",
  P2: "warning",
  P3: "outline",
} as const

export function PortfolioTasksPage() {
  const [tasks, setTasks] = useState<PortfolioTaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const p1Count = useMemo(() => tasks.filter((task) => task.priority === "P1").length, [tasks])

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Portofoliu"
        title="Remediere cross-client"
        description="Queue unic de taskuri active din toate firmele, ordonat pentru triere rapidă."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {tasks.length} taskuri deschise
            </Badge>
            {p1Count > 0 ? (
              <Badge variant="destructive" dot className="normal-case tracking-normal">
                {p1Count} P1
              </Badge>
            ) : null}
          </>
        }
      />

      <Card className="overflow-hidden border-eos-border bg-eos-surface">
        {tasks.length === 0 ? (
          <EmptyState
            title="Nu există taskuri active"
            label="Nu sunt taskuri deschise la nivel de portofoliu."
            icon={ClipboardList}
            className="px-5 py-10"
          />
        ) : (
          <div className="divide-y divide-eos-border-subtle">
            {tasks.map((task) => (
              <div key={`${task.orgId}-${task.taskId}`} className="flex flex-wrap items-start gap-3 px-5 py-4">
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
                    {task.updatedAtISO ? <span>• Actualizat: {new Date(task.updatedAtISO).toLocaleDateString("ro-RO")}</span> : null}
                  </div>
                </div>
                <PortfolioOrgActionButton
                  orgId={task.orgId}
                  destination="/dashboard/resolve"
                  label="Deschide remedierea"
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <div className="flex items-center gap-2 text-eos-text">
          <Flag className="size-4" strokeWidth={1.8} />
          <span className="font-medium">Taskuri reale, nu maintenance generic</span>
        </div>
        <p className="mt-1">
          În portofoliu sunt listate doar taskurile active care merită atenție. Taskul generic de maintenance pentru firme “verzi” nu este afișat aici.
        </p>
      </div>
    </div>
  )
}

