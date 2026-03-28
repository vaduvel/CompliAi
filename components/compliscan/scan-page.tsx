"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { AlertTriangle, ArrowRight, Bot, ChevronRight } from "lucide-react"

import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { ScanFlowOverviewCard } from "@/components/evidence-os/ScanFlowOverviewCard"
import {
  ScanSourceTypeSelector,
  type ScanSourceType,
} from "@/components/evidence-os/ScanSourceTypeSelector"
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
        title="Agent workspace în încărcare"
        detail="Panoul agenților se încarcă în fundal."
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
        title="Autodiscovery în încărcare"
        detail="Panoul de detecție automată se încarcă în fundal."
      />
    ),
  }
)

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-eos-text-tertiary">{eyebrow}</p>
      <p className="mt-1 text-sm font-semibold text-eos-text-muted">{title}</p>
      {description && <p className="mt-0.5 text-xs text-eos-text-tertiary">{description}</p>}
    </div>
  )
}

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
    <div className="space-y-6">

      {/* Last scan alert */}
      {latestDocumentFindings.length > 0 && (
        <div className="flex items-center gap-3 rounded-eos-xl border border-eos-border bg-eos-primary-soft px-5 py-4">
          <AlertTriangle className="size-5 shrink-0 text-eos-primary" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-eos-text">
              {latestDocumentFindings.length} findings din ultima scanare
            </p>
            <p className="mt-0.5 text-xs text-eos-text-tertiary">
              {criticalOrHighFindings.length > 0
                ? `${criticalOrHighFindings.length} critice/ridicate necesită atenție imediată. `
                : ""}
              Rezolvarea se face prin cockpitul fiecărui finding.
            </p>
          </div>
          <Link
            href="/dashboard/resolve"
            className="flex shrink-0 items-center gap-1.5 rounded-eos-lg bg-eos-primary px-4 py-2 text-sm font-semibold text-eos-text transition hover:bg-eos-primary"
          >
            Mergi la De rezolvat
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-eos-text-tertiary">Scanează</p>
        <h1 className="mt-1.5 text-2xl font-bold text-eos-text">Alimentezi Compli cu surse noi</h1>
        <p className="mt-1 text-sm text-eos-text-tertiary">
          {isSolo
            ? "Încarci un document, text sau manifest — Compli extrage, analizează și generează findings. Rezolvarea continuă în De rezolvat."
            : "Alegi sursa și rulezi analiza. Finding-urile noi apar în De rezolvat, unde le confirmi și le rezolvi prin cockpit."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-eos-border bg-eos-surface-active px-3 py-1 text-xs font-medium text-eos-text-tertiary">
            {sourceType === "document"
              ? "document"
              : sourceType === "text"
                ? "text manual"
                : sourceType === "manifest"
                  ? "manifest / repo"
                  : "compliscan.yaml"}
          </span>
          {agentFlow.agentModeActive && (
            <span className="rounded-full bg-eos-warning-soft px-3 py-1 text-xs font-semibold text-eos-warning">
              mod agent activ
            </span>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            {activeFindingsCount > 0 && (
              <Link
                href="/dashboard/resolve"
                className="inline-flex items-center gap-1.5 rounded-eos-lg bg-eos-primary px-4 py-2 text-sm font-semibold text-eos-text shadow-lg shadow-eos-primary/20/20 transition hover:bg-eos-primary"
              >
                Mergi la De rezolvat
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            )}
            <button
              type="button"
              onClick={() => agentFlow.setAgentModeActive(!agentFlow.agentModeActive)}
              className={[
                "inline-flex items-center gap-1.5 rounded-eos-lg border px-4 py-2 text-sm font-medium transition",
                agentFlow.agentModeActive
                  ? "border-eos-warning-border bg-eos-warning-soft text-eos-warning hover:bg-eos-warning/20"
                  : "border-eos-border bg-eos-surface-active text-eos-text-muted hover:text-eos-text-muted",
              ].join(" ")}
            >
              <Bot className="size-4" strokeWidth={2} />
              {agentFlow.agentModeActive ? "Ieși din Mod Agent" : "Mod Agent"}
            </button>
          </div>
        </div>
      </div>

      {/* Active findings nudge */}
      {!agentFlow.agentModeActive && activeFindingsCount > 0 && latestDocumentFindings.length === 0 && (
        <div className="flex items-center gap-3 rounded-eos-xl border border-eos-border-subtle bg-eos-surface-variant px-5 py-4">
          <AlertTriangle className="size-5 shrink-0 text-eos-warning/70" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-eos-text-muted">
              Scanarea alimentează cockpitul, nu îl dublează
            </p>
            <p className="mt-0.5 text-xs text-eos-text-tertiary">
              {activeFindingsCount} finding-uri sunt deschise în workspace. După analiză, rezolvarea continuă în De rezolvat, unde fiecare caz are propriul cockpit.
            </p>
          </div>
          <Link
            href="/dashboard/resolve"
            className="flex shrink-0 items-center gap-1.5 rounded-eos-lg border border-eos-border bg-eos-surface-active px-4 py-2 text-sm font-medium text-eos-text-muted transition hover:text-eos-text-muted"
          >
            Deschide cockpiturile
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      )}

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
            <div className="space-y-4">
              <SectionHeader
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
            <div className="space-y-4">
              <SectionHeader
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
            <div className="space-y-4">
              <SectionHeader
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
            <summary className="flex cursor-pointer items-center gap-2 rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-5 py-3.5 text-sm font-medium text-eos-text-muted transition hover:bg-eos-surface-active [&::-webkit-details-marker]:hidden">
              <ChevronRight className="size-4 shrink-0 text-eos-text-tertiary transition-transform group-open:rotate-90" strokeWidth={2} />
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
              className="inline-flex items-center gap-1 text-xs text-eos-text-tertiary hover:text-eos-text-muted"
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
    <div className="rounded-eos-xl border border-eos-border-subtle bg-eos-surface-variant p-5">
      <p className="text-sm font-semibold text-eos-text-muted">{title}</p>
      <p className="mt-1 text-xs text-eos-text-tertiary">{detail}</p>
    </div>
  )
}
