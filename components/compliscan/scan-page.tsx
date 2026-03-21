"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { ArrowRight, Bot } from "lucide-react"

import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { DenseListItem } from "@/components/evidence-os/DenseListItem"
import { GuideCard } from "@/components/evidence-os/GuideCard"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { ScanFlowOverviewCard } from "@/components/evidence-os/ScanFlowOverviewCard"
import {
  ScanSourceTypeSelector,
  type ScanSourceType,
} from "@/components/evidence-os/ScanSourceTypeSelector"
import { SectionDividerCard } from "@/components/evidence-os/SectionDividerCard"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { LoadingScreen, ScanWorkspace } from "@/components/compliscan/route-sections"
import { buildScanInsights, useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { useAgentFlow } from "@/components/compliscan/use-agent-flow"
import { dashboardRoutes, dashboardScanResultsRoute } from "@/lib/compliscan/dashboard-routes"
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
        title="Verdicts in incarcare"
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
  const [showDetails, setShowDetails] = useState(false)

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
  const shouldShowDetails = showDetails || cockpit.data.state.scans.length === 0

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
        description="Aici alegi sursa si rulezi analiza. Verdicts ramane read-only, iar istoricul complet sta separat in Istoric. Dupa scanare continui in De rezolvat sau Rapoarte."
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
                  ? "verdict read-only"
                  : "istoric recent"}
            </Badge>
            {agentFlow.agentModeActive ? (
              <Badge variant="warning" className="normal-case tracking-normal">
                mod agent activ
              </Badge>
            ) : null}
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Snapshot curent
            </p>
            <p className="text-2xl font-semibold text-eos-text">{cockpit.data.summary.score}</p>
            <p className="text-sm text-eos-text-muted">{cockpit.data.summary.riskLabel}</p>
          </div>
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

      <PillarTabs sectionId="scanare" />

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

          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div>
                <p className="text-sm font-semibold text-eos-text">Detalii de context</p>
                <p className="text-xs text-eos-text-muted">
                  Handoff-ul si ghidajul complet apar doar la cerere.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowDetails((current) => !current)}>
                {showDetails ? "Ascunde detaliile" : "Arata detaliile"}
              </Button>
            </CardContent>
          </Card>

          {shouldShowDetails ? (
            <div className="space-y-6">
              {viewMode === "flow" ? (
                <ScanFlowOverviewCard
                  sourceType={sourceType}
                  latestDocumentScan={latestDocumentScan}
                  latestManifestScan={latestManifestScan}
                  latestYamlScan={latestYamlScan}
                />
              ) : null}

              <ScanWorkflowGuideCard
                sourceType={sourceType}
                viewMode={viewMode}
                agentModeActive={agentFlow.agentModeActive}
              />
            </div>
          ) : null}
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
      title: "Verdicts",
      description: "Aici citesti ultimul rezultat confirmat, fara sa amesteci fluxul activ.",
      badge: "read-only",
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
          Mod Agent activ: verdicts si istoric raman blocate pana iesi din workspace-ul agentului.
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

function ScanWorkflowGuideCard({
  sourceType,
  viewMode,
  agentModeActive,
}: {
  sourceType: ScanSourceType
  viewMode: ScanViewMode
  agentModeActive: boolean
}) {
  const executionLabel =
    viewMode === "flow"
      ? sourceType === "manifest"
        ? "Autodiscovery si curatare de candidate"
        : sourceType === "yaml"
          ? "Validare config declarata"
          : sourceType === "text"
            ? "Analiza directa din text manual"
            : "OCR, review si analiza document"
      : viewMode === "verdicts"
        ? "Explici ultimul rezultat confirmat"
        : "Cauti sursa deja analizata"

  const nextStep =
    viewMode === "history"
      ? {
          title: "Continui in Istoric",
          description: "Acolo gasesti arhiva completa, nu doar cele mai recente surse.",
          href: dashboardRoutes.documents,
          cta: "Deschide Istoric",
        }
      : sourceType === "manifest" || sourceType === "yaml"
        ? {
            title: "Dupa scanare continui in De rezolvat",
            description: "Confirmi ce a iesit din sursa tehnica si tratezi actiunile in queue-ul canonic.",
            href: dashboardRoutes.resolve,
            cta: "Mergi la De rezolvat",
          }
        : {
            title: "Dupa scanare continui in De rezolvat",
            description: "Rezultatul documentului se transforma in task-uri, dovezi si pasii urmatori in queue-ul canonic.",
            href: dashboardRoutes.resolve,
            cta: "Mergi la De rezolvat",
          }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <SectionBoundary
        eyebrow="Context curent"
        title={
          viewMode === "flow"
            ? "Lucrezi in fluxul activ"
            : viewMode === "verdicts"
              ? "Citesti ultimul verdict confirmat"
              : "Cauti rapid sursa relevanta"
        }
        description={executionLabel}
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {agentModeActive ? "validare umana obligatorie" : "flux operator"}
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              handoff spre De rezolvat
            </Badge>
          </>
        }
        support={
          <div className="grid gap-3 md:grid-cols-2">
            <GuideCard
              title="Rolul paginii"
              detail={
                agentModeActive
                  ? "Workspace-ul agentului propune, dar omul valideaza."
                  : "Scanare este poarta de intrare pentru surse, nu locul final pentru rezolvare sau dovezi."
              }
            />
            <GuideCard
              title="Regula de citire"
              detail="Sus executi. Mai jos explici sau verifici. Dupa aceea continui in pagina dedicata."
            />
          </div>
        }
      />

      <HandoffCard
        title={nextStep.title}
        description={nextStep.description}
        destinationLabel={
          viewMode === "history"
            ? "istoric complet"
            : sourceType === "manifest" || sourceType === "yaml"
              ? "de rezolvat"
              : "de rezolvat si rapoarte"
        }
        checklist={
          viewMode === "history"
            ? [
                "verifici sursa recenta potrivita",
                "sari in Istoric pentru lista completa",
                "revii in flux doar daca ai o sursa noua",
              ]
            : sourceType === "manifest" || sourceType === "yaml"
              ? [
                  "confirmi ce intra real in inventar",
                  "verifici baseline-ul si drift-ul",
                  "nu inchizi auditul direct din Scanare",
                ]
              : [
                  "citesti verdictul pentru sursa curenta",
                  "deschizi task-urile derivate in De rezolvat",
                  "atasezi dovezi si livrezi separat",
                ]
        }
        actions={
          <Button asChild variant="outline">
            <Link href={nextStep.href}>
              {nextStep.cta}
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </Button>
        }
      />
    </div>
  )
}
