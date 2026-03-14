"use client"

import { useState } from "react"

import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen, PageHeader } from "@/components/compliscan/route-sections"
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
