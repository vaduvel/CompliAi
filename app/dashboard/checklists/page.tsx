"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight } from "lucide-react"

import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen, PageHeader } from "@/components/compliscan/route-sections"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import type { TaskPriority } from "@/components/compliscan/types"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"

type TaskFilter = "ALL" | TaskPriority | "DONE" | "RAPID" | "STRUCTURAL"

export default function RemediationPage() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL")

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Remediere"
        description="Task-uri actionabile cu dovada, text gata de folosit si validare prin rescan"
        score={cockpit.data.summary.score}
        riskLabel={cockpit.data.summary.riskLabel}
      />

      <PillarTabs sectionId="dovada" />

      <Card className="border-[var(--color-border)] bg-[linear-gradient(180deg,var(--bg-panel-2),var(--color-surface))]">
        <CardHeader className="border-b border-[var(--color-border)] pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">Aici se face executia</CardTitle>
              <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                `Remediere` este locul unde inchizi task-uri, atasezi dovada si rulezi rescan. `Audit si export` ramane pentru livrabil, iar `Auditor Vault` pentru verificarea audit-ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="h-10 rounded-xl">
                <Link href="/dashboard/rapoarte/auditor-vault">
                  Auditor Vault
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 rounded-xl">
                <Link href="/dashboard/rapoarte">
                  Audit si export
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <FlowHint
            title="1. Lucrezi pe task"
            detail="Prioritizezi, completezi si inchizi actiunile reale care reduc riscul."
          />
          <FlowHint
            title="2. Atasezi dovada"
            detail="Pastrezi fisierul, captura sau extrasul care sustine remedierea."
          />
          <FlowHint
            title="3. Verifici audit-ready"
            detail="Dupa executie, sari in Auditor Vault sau Audit si export pentru verificare si livrabil."
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
    </div>
  )
}

function FlowHint({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
      <p className="text-sm font-medium text-[var(--color-on-surface)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">{detail}</p>
    </div>
  )
}
