"use client"

import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LatestDocumentSection, LoadingScreen, PageHeader, RecentScansCard } from "@/components/compliscan/route-sections"
import { buildScanInsights, useCockpit } from "@/components/compliscan/use-cockpit"

export default function DocumentePage() {
  const cockpit = useCockpit()

  if (cockpit.loading || !cockpit.data) return <LoadingScreen />

  const latestDocumentScan =
    cockpit.data.state.scans.find((scan) => scan.sourceKind === "document") ?? null
  const latestDocumentText =
    latestDocumentScan?.contentExtracted || latestDocumentScan?.contentPreview || ""
  const latestDocumentFindings = latestDocumentScan
    ? cockpit.data.state.findings.filter(
        (finding) =>
          finding.scanId === latestDocumentScan.id ||
          finding.sourceDocument === latestDocumentScan.documentName
      )
    : []
  const latestScanTasks = latestDocumentScan
    ? cockpit.tasks.filter((task) => task.sourceDocument === latestDocumentScan.documentName)
    : []
  const latestDocumentInsights = buildScanInsights(latestDocumentText)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documente"
        description="Analize si rezultate pentru documentele scanate"
        score={cockpit.data.summary.score}
        riskLabel={cockpit.data.summary.riskLabel}
      />

      <PillarTabs sectionId="scanare" />

      <LatestDocumentSection
        latestScan={latestDocumentScan}
        latestScanText={latestDocumentText}
        latestScanFindings={latestDocumentFindings}
        latestScanInsights={latestDocumentInsights}
        latestScanTasks={latestScanTasks}
      />

      <RecentScansCard scans={cockpit.data.state.scans} tasks={cockpit.tasks} />
    </div>
  )
}
