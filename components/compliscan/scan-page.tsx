"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { AlertTriangle, ArrowRight, Bot, ChevronRight } from "lucide-react"

import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { ScanFlowOverviewCard } from "@/components/evidence-os/ScanFlowOverviewCard"
import {
  ScanSourceTypeSelector,
  type ScanSourceType,
} from "@/components/evidence-os/ScanSourceTypeSelector"
import { SectionDividerCard } from "@/components/evidence-os/SectionDividerCard"
import { LoadingScreen, ScanWorkspace } from "@/components/compliscan/route-sections"
import { SiteScanCard } from "@/components/compliscan/site-scan-card"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { useAgentFlow } from "@/components/compliscan/use-agent-flow"
import { dashboardScanResultsRoute } from "@/lib/compliscan/dashboard-routes"
import type { SourceEnvelope } from "@/lib/compliance/agent-os"
import { isFindingResolvedLike } from "@/lib/compliscan/finding-cockpit"

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


export function ScanPageSurface() {
  const runtime = useDashboardRuntime()
  const router = useRouter()
  const searchParams = useSearchParams()
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const agentFlow = useAgentFlow()
  const [sourceType, setSourceType] = useState<ScanSourceType>("document")
  const siteScanIntent = searchParams.get("action") === "site"
  const siteScanFindingId = searchParams.get("findingId")
  const siteScanFindingTitle = searchParams.get("findingTitle")

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
  const latestDocumentFindings = latestDocumentScan
    ? cockpit.data.state.findings.filter(
        (finding) =>
          finding.scanId === latestDocumentScan.id ||
          finding.sourceDocument === latestDocumentScan.documentName
      )
    : []

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
  const isSolo = runtime?.userMode === "solo"
  const activeFindingsCount = cockpit.data.state.findings.filter(
    (finding) => !isFindingResolvedLike(finding.findingStatus)
  ).length

  const criticalOrHighFindings = latestDocumentFindings.filter(
    (f) => f.severity === "critical" || f.severity === "high"
  )

  return (
    <div className="space-y-8">
      {latestDocumentFindings.length > 0 ? (
        <div className="flex items-center gap-3 rounded-eos-lg border-2 border-eos-primary/25 bg-gradient-to-r from-eos-primary/[0.06] via-transparent to-transparent px-5 py-4">
          <AlertTriangle className="size-5 shrink-0 text-eos-primary" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-eos-text">
              {latestDocumentFindings.length} findings din ultima scanare
            </p>
            <p className="mt-0.5 text-xs text-eos-text-muted">
              {criticalOrHighFindings.length > 0
                ? `${criticalOrHighFindings.length} critice/ridicate necesită atenție imediată. `
                : ""}
              Rezolvarea se face prin cockpitul fiecărui finding.
            </p>
          </div>
          <Link
            href="/dashboard/resolve"
            className="flex shrink-0 items-center gap-1.5 rounded-eos-md bg-eos-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-eos-primary/90"
          >
            Mergi la De rezolvat
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      ) : null}
      <PageIntro
        eyebrow="Intake"
        title="Alimentezi Compli cu surse noi"
        description={
          isSolo
            ? "Încarci un document, text sau manifest — Compli extrage, analizează și generează findings. Rezolvarea continuă în De rezolvat."
            : "Alegi sursa și rulezi analiza. Finding-urile noi apar în De rezolvat, unde le confirmi și le rezolvi prin cockpit."
        }
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
            {agentFlow.agentModeActive ? (
              <Badge variant="warning" className="normal-case tracking-normal">
                mod agent activ
              </Badge>
            ) : null}
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {activeFindingsCount > 0 ? (
              <Button asChild>
                <Link href="/dashboard/resolve" className="gap-2">
                  Mergi la De rezolvat
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : null}
            <Button
              variant={agentFlow.agentModeActive ? "default" : "outline"}
              className="gap-2"
              onClick={() => agentFlow.setAgentModeActive(!agentFlow.agentModeActive)}
            >
              <Bot className="size-4" />
              {agentFlow.agentModeActive ? "Iesi din Mod Agent" : "Mod Agent"}
            </Button>
          </div>
        }
      />

      {!agentFlow.agentModeActive && activeFindingsCount > 0 ? (
        <div className="flex items-center gap-3 rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-4">
          <AlertTriangle className="size-5 shrink-0 text-eos-warning" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-eos-text">
              Scanarea alimentează cockpitul, nu îl dublează
            </p>
            <p className="mt-0.5 text-xs text-eos-text-muted">
              {activeFindingsCount} finding-uri sunt deschise în workspace. După analiză, rezolvarea continuă în De rezolvat, unde fiecare caz are propriul cockpit.
            </p>
          </div>
          <Link
            href="/dashboard/resolve"
            className="flex shrink-0 items-center gap-1.5 rounded-eos-md border border-eos-border px-4 py-2 text-sm font-medium text-eos-text transition hover:bg-eos-surface-variant"
          >
            Deschide cockpiturile
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      ) : null}

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
          <ScanSourceTypeSelector
            value={sourceType}
            onValueChange={(nextSourceType) => {
              if (nextSourceType === "text") {
                cockpitActions.setDocumentFile(null)
              }
              setSourceType(nextSourceType)
            }}
          />

          {siteScanIntent ? (
            <div className="space-y-6">
              <SectionDividerCard
                eyebrow="Re-scan website"
                title="Reverifici bannerul, trackerele și politicile site-ului"
                description={
                  siteScanFindingTitle
                    ? `Ai venit aici din finding-ul „${siteScanFindingTitle}". Rulezi site scan, apoi revii în cockpit cu rezultatul deja pregătit ca urmă de recheck.`
                    : "Rulezi site scan, apoi revii în cockpit cu rezultatul pregătit ca urmă de recheck."
                }
              />
              <SiteScanCard
                existingScan={cockpit.data.state.siteScan ?? null}
                defaultUrl={cockpit.data.state.orgProfile?.website ?? undefined}
                findingId={siteScanFindingId ?? undefined}
                findingTitle={siteScanFindingTitle ?? undefined}
              />
            </div>
          ) : sourceType === "manifest" || sourceType === "yaml" ? (
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

          <div className="flex justify-end border-t border-eos-border-subtle pt-3">
            <Link
              href="/dashboard/scan/history"
              className="inline-flex items-center gap-1 text-xs text-eos-text-muted hover:text-eos-text"
            >
              Istoricul scanărilor
              <ArrowRight className="size-3" strokeWidth={2} />
            </Link>
          </div>
        </>
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
