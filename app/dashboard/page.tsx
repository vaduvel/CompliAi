"use client"

import { useRouter } from "next/navigation"

import {
  LoadingScreen,
  OverviewPageSections,
} from "@/components/compliscan/route-sections"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"

export default function DashboardPage() {
  const router = useRouter()
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  return (
    <div className="space-y-8">
      <OverviewPageSections
        summary={cockpit.data.summary}
        lastScanLabel={cockpit.lastScanLabel}
        workspace={cockpit.data.workspace}
        nextBestAction={cockpit.nextBestAction}
        onResolveNow={() => router.push("/dashboard/checklists")}
        onScan={() => router.push("/dashboard/scanari")}
        onSandbox={cockpitActions.handleSandbox}
        state={cockpit.data.state}
        activeDrifts={cockpit.activeDrifts}
        openAlerts={cockpit.openAlerts}
        scans={cockpit.data.state.scans}
        tasks={cockpit.tasks}
        events={cockpit.recentEvents}
      />
    </div>
  )
}
