"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Bot, ChevronRight } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { DenseListItem } from "@/components/evidence-os/DenseListItem"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { ScanFlowOverviewCard } from "@/components/evidence-os/ScanFlowOverviewCard"
import {
  ScanSourceTypeSelector,
  type ScanSourceType,
} from "@/components/evidence-os/ScanSourceTypeSelector"
import { SectionDividerCard } from "@/components/evidence-os/SectionDividerCard"
import { LoadingScreen, ScanWorkspace } from "@/components/compliscan/route-sections"
import { buildScanInsights, useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { useAgentFlow } from "@/components/compliscan/use-agent-flow"
import { dashboardScanResultsRoute } from "@/lib/compliscan/dashboard-routes"
import type { SourceEnvelope } from "@/lib/compliance/agent-os"

const AgentWorkspace = dynamic(
  () => import("@/components/compliscan/agent-workspace").then((mod) => mod.AgentWorkspace),
  {
    ssr: false,
    loading: () => (
      <SectionLoadingCard
        title="Agent workspace in incarcare"
        detail="Panoul agentilor se incarca in fundal."
      />
    ),
  }
)

const AIDiscoveryPanel = dynamic(
  () => import("@/components/compliscan/ai-discovery-panel").then((mod) => mod.AIDiscoveryPanel),
  {
    ssr: false,
    loading: () => (
      <SectionLoadingCard
        title="Autodiscovery in incarcare"
        detail="Panoul de detectie automata se incarca in fundal."
      />
    ),
  }
)

const ScanVerdictsTab = dynamic(
  () =>
    import("@/components/compliscan/scanari/scan-verdicts-tab").then(
      (mod) => mod.ScanVerdictsTab
    ),
  {
    loading: () => (
      <SectionLoadingCard
        title="Rezultat curent in incarcare"
        detail="Ultimul rezultat confirmat se pregateste separat de fluxul activ."
      />
    ),
  }
)

const ScanHistoryTabLazy = dynamic(
  () =>
    import("@/components/compliscan/scanari/scan-history-tab").then((mod) => mod.ScanHistoryTab),
  {
    loading: () => (
      <SectionLoadingCard
        title="Istoric in incarcare"
        detail="Lista surselor recente se incarca separat de fluxul curent."
      />
    ),
  }
)

type ScanViewMode = "flow" | "verdicts" | "history"

export function ScanPageSurface() {
  const router = useRouter()
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const agentFlow = useAgentFlow()
  const [sourceType, setSourceType] = useState<ScanSourceType>("document")
  const [viewMode, setViewMode] = useState<ScanViewMode>("flow")

  useEffect(() => {
    if (agentFlow.agentModeActive) {
      setViewMode("flow")
    }
  }, [agentFlow.agentModeActive])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const yamlFilePattern = /compliscan\.(yaml|yml)$/i
  const manifestPanelSystems = cockpit.data.state.detectedAISystems.filter(
    (system) => !yamlFilePattern.test(system.sourceDocument || "")
  )
  const yamlPanelSystems = cockpit.data.state.detectedAISystems.filter(
    (system) =>
      yamlFilePattern.test(system.sourceDocument || "") ||
      system.frameworks.includes("compliscan-yaml")
  )

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
  const latestDocumentTasks = latestDocumentScan
    ? cockpit.tasks.filter((task) => task.sourceDocument === latestDocumentScan.documentName)
    : []
  const latestDocumentInsights = buildScanInsights(latestDocumentText)

  const latestManifestScan =
    cockpit.data.state.scans.find((scan) => scan.sourceKind === "manifest") ?? null
  const latestManifestSystems = latestManifestScan
    ? cockpit.data.state.detectedAISystems.filter(
        (system) =>
          system.sourceScanId === latestManifestScan.id ||
          system.sourceDocument === latestManifestScan.documentName
      )
    : []
  const latestManifestSystemNames = new Set(latestManifestSystems.map((system) => system.name))
  const manifestPanelSystemNames = new Set(manifestPanelSystems.map((system) => system.name))
  const latestManifestDrifts = latestManifestScan
    ? cockpit.activeDrifts.filter(
        (drift) =>
          drift.sourceDocument === latestManifestScan.documentName ||
          (drift.systemLabel ? latestManifestSystemNames.has(drift.systemLabel) : false)
      )
    : []
  const latestYamlScan = cockpit.data.state.scans.find((scan) => scan.sourceKind === "yaml") ?? null
  const latestYamlSystems = latestYamlScan
    ? cockpit.data.state.detectedAISystems.filter(
        (system) =>
          system.sourceScanId === latestYamlScan.id || system.sourceDocument === latestYamlScan.documentName
      )
    : []
  const latestYamlFindings = latestYamlScan
    ? cockpit.data.state.findings.filter(
        (finding) =>
          finding.scanId === latestYamlScan.id || finding.sourceDocument === latestYamlScan.documentName
      )
    : []
  const latestYamlSystemNames = new Set(latestYamlSystems.map((system) => system.name))
  const yamlPanelSystemNames = new Set(yamlPanelSystems.map((system) => system.name))
  const latestYamlDrifts = latestYamlScan
    ? cockpit.activeDrifts.filter(
        (drift) =>
          drift.sourceDocument === latestYamlScan.documentName ||
          (drift.systemLabel ? latestYamlSystemNames.has(drift.systemLabel) : false)
      )
    : []
  const manifestPanelDrifts = cockpit.activeDrifts.filter(
    (drift) =>
      !yamlFilePattern.test(drift.sourceDocument || "") &&
      (!drift.systemLabel || manifestPanelSystemNames.has(drift.systemLabel))
  )
  const yamlPanelDrifts = cockpit.activeDrifts.filter(
    (drift) =>
      yamlFilePattern.test(drift.sourceDocument || "") ||
      (drift.systemLabel ? yamlPanelSystemNames.has(drift.systemLabel) : false)
  )
  const currentEnvelope: SourceEnvelope = {
    sourceId: `temp-${Date.now()}`,
    sourceType:
      sourceType === "yaml"
        ? "yaml"
        : sourceType === "manifest"
          ? "manifest"
          : sourceType === "text"
            ? "text"
            : "document",
    sourceName: cockpit.documentName || (sourceType === "yaml" ? "compliscan.yaml" : "New Source"),
    orgId: cockpit.data.workspace.orgId,
    rawText: cockpit.documentContent || undefined,
    sourceSignals: [],
    extractedAtISO: new Date().toISOString(),
  }

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Scanare"
        title="Pornesti analiza din sursa potrivita"
        description="Aici alegi sursa si rulezi analiza. Rezultatul curent ramane doar pentru citire, iar istoricul complet sta separat in Istoric. Dupa scanare continui in De rezolvat sau Rapoarte."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {sourceType === "document"
                ? "document"
                : sourceType === "text"
                  ? "text manual"
                  : sourceType === "manifest"
                    ? "manifest / repo"
                    : "compliscan.yaml"}
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              {viewMode === "flow"
                ? "flux activ"
                : viewMode === "verdicts"
                  ? "rezultat curent"
                  : "istoric recent"}
            </Badge>
            {agentFlow.agentModeActive ? (
              <Badge variant="warning" className="normal-case tracking-normal">
                mod agent activ
              </Badge>
            ) : null}
          </>
        }
        actions={
          <Button
            variant={agentFlow.agentModeActive ? "default" : "outline"}
            className="gap-2"
            onClick={() => agentFlow.setAgentModeActive(!agentFlow.agentModeActive)}
          >
            <Bot className="size-4" />
            {agentFlow.agentModeActive ? "Iesi din Mod Agent" : "Mod Agent"}
          </Button>
        }
      />

      <ScanViewTabs
        active={viewMode}
        onChange={setViewMode}
        locked={agentFlow.agentModeActive}
      />

      {agentFlow.agentModeActive ? (
        <AgentWorkspace
          sourceEnvelope={currentEnvelope}
          bundle={agentFlow.bundle}
          loading={agentFlow.loading}
          onRunAgents={() => agentFlow.runAgents(currentEnvelope)}
          onCommit={async (finalBundle) => {
            if (!finalBundle) return
            const success = await agentFlow.commitBundle(finalBundle)
            if (success) {
              agentFlow.setAgentModeActive(false)
              await cockpitActions.reloadDashboard()
            }
          }}
          onCancel={() => agentFlow.setAgentModeActive(false)}
        />
      ) : (
        <>
          {viewMode !== "history" && (
            <ScanSourceTypeSelector
              value={sourceType}
              onValueChange={(nextSourceType) => {
                if (nextSourceType === "text") {
                  cockpitActions.setDocumentFile(null)
                }
                setSourceType(nextSourceType)
              }}
            />
          )}

          {viewMode === "flow" && (
            <>
              {sourceType === "manifest" || sourceType === "yaml" ? (
                <div className="space-y-6">
                  <SectionDividerCard
                    eyebrow="Flux activ"
                    title={
                      sourceType === "yaml"
                        ? "Validezi configuratia declarata"
                        : "Lucrezi pe candidate detectate automat"
                    }
                    description={
                      sourceType === "yaml"
                        ? "Aici verifici compliscan.yaml, corectezi detectia si decizi ce intra in inventarul oficial."
                        : "Aici transformi manifestele de cod in candidate curate, apoi confirmi doar sistemele bune in inventar."
                    }
                  />
                  <AIDiscoveryPanel
                    key={sourceType}
                    mode={sourceType === "yaml" ? "yaml" : "manifest"}
                    systems={sourceType === "yaml" ? yamlPanelSystems : manifestPanelSystems}
                    drifts={sourceType === "yaml" ? yamlPanelDrifts : manifestPanelDrifts}
                    busy={cockpit.busy}
                    onDiscover={cockpitActions.discoverAISystemsFromManifest}
                    onUpdateStatus={cockpitActions.updateDetectedAISystem}
                    onEdit={cockpitActions.editDetectedAISystem}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <SectionDividerCard
                    eyebrow="Flux activ"
                    title={
                      sourceType === "text"
                        ? "Pregatesti analiza din text manual"
                        : "Incarci documentul si revizuiesti OCR-ul"
                    }
                    description={
                      sourceType === "text"
                        ? "Aici lipesti textul, ii dai un nume clar si trimiti analiza direct in verdict si task-uri."
                        : "Aici incarci fisierul, extragi textul si faci review inainte sa generezi verdictul final."
                    }
                  />
                  <ScanWorkspace
                    sourceMode={sourceType === "text" ? "text" : "document"}
                    documentName={cockpit.documentName}
                    documentContent={cockpit.documentContent}
                    documentFile={cockpit.documentFile}
                    pendingScanId={cockpit.pendingScanId}
                    pendingExtractedText={cockpit.pendingExtractedText}
                    scanInfo={cockpit.scanInfo}
                    scanning={cockpit.scanning}
                    scannedDocuments={cockpit.data.state.scannedDocuments}
                    setDocumentName={cockpitActions.setDocumentName}
                    setDocumentContent={cockpitActions.setDocumentContent}
                    setDocumentFile={cockpitActions.setDocumentFile}
                    setPendingExtractedText={cockpitActions.setPendingExtractedText}
                    onExtract={() => {
                      void cockpitActions.handleExtractScan()
                    }}
                    onAnalyze={async () => {
                      const scanId = await cockpitActions.handleAnalyzePendingScan()
                      if (scanId) router.push(dashboardScanResultsRoute(scanId))
                    }}
                  />
                </div>
              )}
            </>
          )}

          {viewMode === "verdicts" && (
            <ScanVerdictsTab
              sourceType={sourceType}
              latestManifestScan={latestManifestScan}
              latestManifestSystems={latestManifestSystems}
              latestManifestDrifts={latestManifestDrifts}
              latestYamlScan={latestYamlScan}
              latestYamlSystems={latestYamlSystems}
              latestYamlFindings={latestYamlFindings}
              latestYamlDrifts={latestYamlDrifts}
              latestDocumentScan={latestDocumentScan}
              latestDocumentText={latestDocumentText}
              latestDocumentFindings={latestDocumentFindings}
              latestDocumentInsights={latestDocumentInsights}
              latestDocumentTasks={latestDocumentTasks}
            />
          )}

          {viewMode === "history" && (
            <ScanHistoryTabLazy scans={cockpit.data.state.scans} tasks={cockpit.tasks} />
          )}

          {viewMode === "flow" && (
            <details className="group" open={cockpit.data.state.scans.length === 0 || undefined}>
              <summary className="flex cursor-pointer items-center gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-5 py-4 text-sm font-medium text-eos-text hover:bg-eos-surface-variant [&::-webkit-details-marker]:hidden">
                <ChevronRight className="size-4 shrink-0 text-eos-text-muted transition-transform group-open:rotate-90" strokeWidth={2} />
                Detalii context scanare
              </summary>
              <div className="mt-4">
                <ScanFlowOverviewCard
                  sourceType={sourceType}
                  latestDocumentScan={latestDocumentScan}
                  latestManifestScan={latestManifestScan}
                  latestYamlScan={latestYamlScan}
                />
              </div>
            </details>
          )}
        </>
      )}
    </div>
  )
}

function ScanViewTabs({
  active,
  onChange,
  locked,
}: {
  active: ScanViewMode
  onChange: (next: ScanViewMode) => void
  locked: boolean
}) {
  const tabs: Array<{
    id: ScanViewMode
    title: string
    description: string
    badge?: string
  }> = [
    {
      id: "flow",
      title: "Flux scanare",
      description: "Aici adaugi sursa, extragi, revizuiesti si pornesti analiza.",
      badge: "executie",
    },
    {
      id: "verdicts",
      title: "Rezultat curent",
      description: "Aici citesti ultimul rezultat confirmat, fara sa amesteci fluxul activ.",
      badge: "doar citire",
    },
    {
      id: "history",
      title: "Istoric documente",
      description: "Aici vezi sursele recente si sari la rezultatul relevant.",
      badge: "lookup",
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-3">
        {tabs.map((tab) => {
          const isActive = active === tab.id
          const disabled = locked && tab.id !== "flow"

          return (
            <DenseListItem key={tab.id} active={isActive} className={disabled ? "opacity-60" : ""}>
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                disabled={disabled}
                className={`w-full p-4 text-left transition ${
                  isActive ? "" : "hover:bg-eos-secondary-hover"
                } ${disabled ? "cursor-not-allowed" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-eos-text">{tab.title}</p>
                    <p className="mt-1 text-sm leading-6 text-eos-text-muted">
                      {tab.description}
                    </p>
                  </div>
                  {tab.badge ? (
                    <Badge variant="secondary" className="normal-case tracking-normal">
                      {tab.badge}
                    </Badge>
                  ) : null}
                </div>
              </button>
            </DenseListItem>
          )
        })}
      </div>
      {locked && (
        <Badge variant="secondary" className="normal-case tracking-normal">
          Mod Agent activ: rezultatul curent si istoricul raman blocate pana iesi din workspace-ul agentului.
        </Badge>
      )}
    </div>
  )
}

function SectionLoadingCard({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="border-eos-border bg-eos-bg-inset">
      <CardHeader className="border-b border-eos-border pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 text-sm text-eos-text-muted">{detail}</CardContent>
    </Card>
  )
}
