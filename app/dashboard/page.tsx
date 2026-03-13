"use client"

import { useRouter } from "next/navigation"

import {
  LoadingScreen,
  OverviewPageSections,
} from "@/components/compliscan/route-sections"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { useCockpit } from "@/components/compliscan/use-cockpit"

export default function DashboardPage() {
  const router = useRouter()
  const cockpit = useCockpit()

  if (cockpit.loading || !cockpit.data) return <LoadingScreen />

  return (
    <div className="space-y-8">
      <PillarTabs sectionId="control" />
      <OverviewPageSections
        summary={cockpit.data.summary}
        lastScanLabel={cockpit.lastScanLabel}
        workspace={cockpit.data.workspace}
        nextBestAction={cockpit.nextBestAction}
        onResolveNow={() => router.push("/dashboard/checklists")}
        onScan={() => router.push("/dashboard/scanari")}
        onSandbox={cockpit.handleSandbox}
        onGeneratePdf={() => void cockpit.handleGenerateReport()}
        onExportChecklist={() => void cockpit.handleChecklistExport()}
        onShare={() => void cockpit.handleShareWithAccountant()}
        onSyncNow={() => void cockpit.handleSyncNow()}
        busy={cockpit.busy}
        state={cockpit.data.state}
        activeDrifts={cockpit.activeDrifts}
        openAlerts={cockpit.openAlerts}
        gdprQuickFixes={cockpit.gdprQuickFixes}
        validatedInvoicesToday={cockpit.validatedInvoicesToday}
        efacturaErrorsToday={cockpit.efacturaErrorsToday}
        scans={cockpit.data.state.scans}
        tasks={cockpit.tasks}
        events={cockpit.recentEvents}
      />
    </div>
  )
}
