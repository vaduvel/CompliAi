"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
  ArrowRight,
  CheckCircle2,
  Bot,
  Clock3,
  ShieldAlert,
} from "lucide-react"

import { FindingVerdictMeta } from "@/components/compliscan/finding-verdict-meta"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { ScanFlowOverviewCard } from "@/components/evidence-os/ScanFlowOverviewCard"
import { ScanSourceTypeSelector, type ScanSourceType } from "@/components/evidence-os/ScanSourceTypeSelector"
import { SectionDividerCard } from "@/components/evidence-os/SectionDividerCard"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SourceModeGuideCard } from "@/components/evidence-os/SourceModeGuideCard"
import {
  LatestDocumentSection,
  LoadingScreen,
  RecentScansCard,
  ScanWorkspace,
} from "@/components/compliscan/route-sections"
import { buildScanInsights, useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { useAgentFlow } from "@/components/compliscan/use-agent-flow"
import { formatPurposeLabel } from "@/lib/compliance/ai-inventory"
import type { ComplianceSeverity } from "@/lib/compliance/constitution"
import { formatDriftTypeLabel, getDriftPolicyFromRecord } from "@/lib/compliance/drift-policy"
import { formatRelativeRomanian } from "@/lib/compliance/engine"
import type {
  ComplianceDriftRecord,
  DetectedAISystemRecord,
  ScanFinding,
  ScanRecord,
} from "@/lib/compliance/types"
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

type ScanViewMode = "flow" | "verdicts" | "history"

export default function ScanariPage() {
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

  // Construim plicul pentru agenti pe baza starii curente din UI
  const currentEnvelope: SourceEnvelope = {
    sourceId: `temp-${Date.now()}`,
    sourceType: sourceType === "yaml" ? "yaml" : sourceType === "manifest" ? "manifest" : sourceType === "text" ? "text" : "document",
    sourceName: cockpit.documentName || (sourceType === "yaml" ? "compliscan.yaml" : "New Source"),
    orgId: cockpit.data.workspace.orgId,
    rawText: cockpit.documentContent || undefined,
    sourceSignals: [], // Vor fi populate de backend la extractie
    extractedAtISO: new Date().toISOString()
  }

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Scanare"
        title="Pornesti fluxul de analiza din sursa potrivita"
        description="Aici adaugi sursa si rulezi analiza. Verdicts ramane read-only, iar istoricul complet sta separat in Documente."
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

      <ScanWorkflowGuideCard
        sourceType={sourceType}
        viewMode={viewMode}
        agentModeActive={agentFlow.agentModeActive}
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
            <>
              <SourceModeGuideCard sourceType={sourceType} />

              <ScanSourceTypeSelector
                value={sourceType}
                onValueChange={(nextSourceType) => {
                  if (nextSourceType === "text") {
                    cockpitActions.setDocumentFile(null)
                  }
                  setSourceType(nextSourceType)
                }}
              />
            </>
          )}

          {viewMode === "flow" && (
            <>
              <ScanFlowOverviewCard
                sourceType={sourceType}
                latestDocumentScan={latestDocumentScan}
                latestManifestScan={latestManifestScan}
                latestYamlScan={latestYamlScan}
              />

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
                      const success = await cockpitActions.handleAnalyzePendingScan()
                      if (success) router.push("/dashboard/documente")
                    }}
                  />
                </div>
              )}
            </>
          )}

          {viewMode === "verdicts" && (
            <div className="space-y-6">
              <SectionDividerCard
                eyebrow="Verdicts"
                title="Ultimul rezultat confirmat"
                description="Zona aceasta este read-only: te ajuta sa explici verdictul, finding-urile si drift-ul fara sa amesteci fluxul activ."
              />
              {sourceType === "manifest" ? (
                <LatestManifestSection
                  latestManifestScan={latestManifestScan}
                  systems={latestManifestSystems}
                  drifts={latestManifestDrifts}
                />
              ) : sourceType === "yaml" ? (
                <LatestYamlSection
                  latestYamlScan={latestYamlScan}
                  systems={latestYamlSystems}
                  findings={latestYamlFindings}
                  drifts={latestYamlDrifts}
                />
              ) : (
                <LatestDocumentSection
                  latestScan={latestDocumentScan}
                  latestScanText={latestDocumentText}
                  latestScanFindings={latestDocumentFindings}
                  latestScanInsights={latestDocumentInsights}
                  latestScanTasks={latestDocumentTasks}
                />
              )}
            </div>
          )}

          {viewMode === "history" && (
            <div className="space-y-6">
              <SectionDividerCard
                eyebrow="Istoric"
                title="Istoric documente"
                description="Vezi toate scanarile recente intr-o singura lista si sari direct la rezultatul relevant."
              />
              <RecentScansCard scans={cockpit.data.state.scans} tasks={cockpit.tasks} />
              <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-on-surface)]">
                      Istoricul complet ramane in Documente
                    </p>
                    <p className="text-xs text-[var(--color-on-surface-muted)]">
                      Acolo gasesti toate scanarile, nu doar cele recente.
                    </p>
                  </div>
                  <Button asChild variant="outline" className="h-9 rounded-xl">
                    <Link href="/dashboard/documente">
                      Mergi la Documente
                      <ArrowRight className="size-4" strokeWidth={2.25} />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function findingSeverityClasses(
  severity: ComplianceSeverity
): "destructive" | "warning" | "success" {
  if (severity === "critical" || severity === "high") return "destructive"
  if (severity === "medium") return "warning"
  return "success"
}

function driftSeverityVariant(
  severity: ComplianceDriftRecord["severity"]
): "destructive" | "warning" | "outline" {
  if (severity === "critical" || severity === "high") return "destructive"
  if (severity === "medium") return "warning"
  return "outline"
}

function systemRiskVariant(
  riskLevel: DetectedAISystemRecord["riskLevel"]
): "destructive" | "warning" | "success" {
  if (riskLevel === "high") return "destructive"
  if (riskLevel === "limited") return "warning"
  return "success"
}

function LatestYamlSection({
  latestYamlScan,
  systems,
  findings,
  drifts,
}: {
  latestYamlScan: ScanRecord | null
  systems: DetectedAISystemRecord[]
  findings: ScanFinding[]
  drifts: ComplianceDriftRecord[]
}) {
  const legalArticles = [
    ...new Set(
      findings.flatMap((finding) =>
        (finding.legalMappings ?? []).map((item) => `${item.regulation} ${item.article}`)
      )
    ),
  ]

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-[28px] leading-tight">Ultimul compliscan.yaml validat</CardTitle>
            <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
              Vezi exact ce configuratie declarata a intrat in control, ce articole atinge si unde exista drift fata de baseline.
            </p>
          </div>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <Link href="/dashboard/rapoarte/auditor-vault">
              Mergi la Auditor Vault
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {!latestYamlScan && (
          <EmptyState
            title="Niciun compliscan.yaml validat"
            label="Alege modul dedicat, valideaza configul si aici vei vedea ce a intrat in controlul operational."
            className="items-start rounded-2xl border-eos-border bg-eos-surface-variant px-5 py-5 text-left"
          />
        )}

        {latestYamlScan && (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                    {latestYamlScan.documentName}
                  </Badge>
                  <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                    {formatRelativeRomanian(latestYamlScan.createdAtISO)}
                  </Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <ManifestMetric
                    label="Sisteme declarate"
                    value={String(systems.length)}
                    tone="text-[var(--color-on-surface)]"
                  />
                  <ManifestMetric
                    label="Findings"
                    value={String(findings.length)}
                    tone={findings.length > 0 ? "text-[var(--color-warning)]" : "text-[var(--status-success-text)]"}
                  />
                  <ManifestMetric
                    label="Drift activ"
                    value={String(drifts.length)}
                    tone={drifts.length > 0 ? "text-[var(--color-error)]" : "text-[var(--status-success-text)]"}
                  />
                </div>
                <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    Preview config
                  </p>
                  <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-[var(--color-on-surface-muted)]">
                    {latestYamlScan.contentPreview}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                <p className="text-sm font-medium text-[var(--color-on-surface)]">Ce controlezi acum</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                      Articole mapate
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {legalArticles.length > 0 ? (
                        legalArticles.map((item) => (
                          <Badge key={item} variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                            {item}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-[var(--color-on-surface-muted)]">
                          Inca nu exista articole mapate pentru configul curent.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                      Ce urmeaza
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--color-on-surface-muted)]">
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
                        Confirmi ca providerul, modelul si riscul declarat corespund implementarii reale.
                      </li>
                      <li className="flex gap-2">
                        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[var(--color-warning)]" />
                        Atasezi dovada pentru findings-urile noi si actualizezi baseline-ul dupa review uman.
                      </li>
                      <li className="flex gap-2">
                        <Clock3 className="mt-0.5 size-4 shrink-0 text-[var(--color-info)]" />
                        Revii in Auditor Vault pentru exportul de audit si controlul drift-ului.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                <p className="text-sm font-medium text-[var(--color-on-surface)]">Findings generate din YAML</p>
                <div className="mt-4 space-y-3">
                  {findings.length === 0 && (
                    <EmptyState
                      title="Fara findings suplimentare"
                      label="Configul validat nu a generat findings noi in aceasta rulare."
                      className="rounded-2xl border-eos-border-subtle bg-eos-bg-inset px-4 py-6"
                    />
                  )}
                  {findings.map((finding) => (
                    <div
                      key={finding.id}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                            {finding.title}
                          </p>
                          <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                            {finding.detail}
                          </p>
                          <FindingVerdictMeta finding={finding} className="mt-3" />
                        </div>
                        <Badge variant={findingSeverityClasses(finding.severity)}>
                          {finding.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                <p className="text-sm font-medium text-[var(--color-on-surface)]">Drift pentru config</p>
                <div className="mt-4 space-y-3">
                  {drifts.length === 0 && (
                    <EmptyState
                      title="Fara drift activ"
                      label="Nu exista drift activ fata de baseline pentru acest YAML."
                      className="rounded-2xl border-eos-border-subtle bg-eos-bg-inset px-4 py-6"
                    />
                  )}
                  {drifts.map((drift) => (
                    <ScanDriftCard key={drift.id} drift={drift} compact />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function LatestManifestSection({
  latestManifestScan,
  systems,
  drifts,
}: {
  latestManifestScan: ScanRecord | null
  systems: DetectedAISystemRecord[]
  drifts: ComplianceDriftRecord[]
}) {
  const providers = [...new Set(systems.map((system) => system.vendor))]
  const frameworks = [...new Set(systems.flatMap((system) => system.frameworks))].slice(0, 6)

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-[28px] leading-tight">Ultimul manifest procesat</CardTitle>
            <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
              Rezultatul este legat explicit de manifestul pe care l-ai încărcat, nu de un document generic.
            </p>
          </div>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <Link href="/dashboard/sisteme">
              Mergi la inventar
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {!latestManifestScan && (
          <EmptyState
            title="Niciun manifest procesat"
            label="Alege `Repo / manifest`, ruleaza autodiscovery si aici vei vedea exact ce a iesit pentru sursa respectiva."
            className="items-start rounded-2xl border-eos-border bg-eos-surface-variant px-5 py-5 text-left"
          />
        )}

        {latestManifestScan && (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                    {latestManifestScan.documentName}
                  </Badge>
                  <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                    {formatRelativeRomanian(latestManifestScan.createdAtISO)}
                  </Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <ManifestMetric
                    label="Sisteme propuse"
                    value={String(systems.length)}
                    tone="text-[var(--color-on-surface)]"
                  />
                  <ManifestMetric
                    label="Provideri"
                    value={providers.length > 0 ? providers.join(", ") : "Necunoscut"}
                    tone="text-[var(--color-info)]"
                  />
                  <ManifestMetric
                    label="Drift activ"
                    value={String(drifts.length)}
                    tone={
                      drifts.length > 0
                        ? "text-[var(--color-warning)]"
                        : "text-[var(--status-success-text)]"
                    }
                  />
                </div>
                <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    Preview sursa
                  </p>
                  <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-[var(--color-on-surface-muted)]">
                    {latestManifestScan.contentPreview}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                <p className="text-sm font-medium text-[var(--color-on-surface)]">
                  Rezumat tehnic detectat
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                      Framework-uri
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {frameworks.length > 0 ? (
                        frameworks.map((framework) => (
                          <Badge key={framework} variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                            {framework}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-[var(--color-on-surface-muted)]">
                          Niciun framework AI clar.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                      Ce faci acum
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--color-on-surface-muted)]">
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
                        Revizuiești sistemele propuse și corectezi scopul înainte de confirmare.
                      </li>
                      <li className="flex gap-2">
                        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[var(--color-warning)]" />
                        Confirmi doar ce intră real în inventarul AI.
                      </li>
                      <li className="flex gap-2">
                        <Clock3 className="mt-0.5 size-4 shrink-0 text-[var(--color-info)]" />
                        Fixezi baseline-ul în `Setări` când snapshot-ul este validat uman.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
              <p className="text-sm font-medium text-[var(--color-on-surface)]">
                Rezultatul pentru acest manifest
              </p>
              <div className="mt-4 space-y-3">
                {systems.length === 0 && (
                  <EmptyState
                    title="Fara sisteme propuse"
                    label="Nu avem inca sisteme propuse pentru manifestul curent."
                    className="rounded-2xl border-eos-border-subtle bg-eos-bg-inset px-4 py-6"
                  />
                )}
                {systems.map((system) => (
                  <div
                    key={system.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                          {system.name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                          {system.vendor} · {formatPurposeLabel(system.purpose)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                          {system.confidence}
                        </Badge>
                        <Badge variant={systemRiskVariant(system.riskLevel)}>
                          {system.riskLevel}
                        </Badge>
                        <Badge variant="secondary" className="normal-case tracking-normal">
                          {system.detectionStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
              <p className="text-sm font-medium text-[var(--color-on-surface)]">
                Drift legat de acest manifest
              </p>
              <div className="mt-4 space-y-3">
                {drifts.length === 0 && (
                  <EmptyState
                    title="Fara drift activ"
                    label="Nu exista drift activ pentru aceasta sursa."
                    className="rounded-2xl border-eos-border-subtle bg-eos-bg-inset px-4 py-6"
                  />
                )}
                {drifts.map((drift) => (
                  <ScanDriftCard key={drift.id} drift={drift} />
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ManifestMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

function ScanDriftCard({
  drift,
  compact = false,
}: {
  drift: ComplianceDriftRecord
  compact?: boolean
}) {
  const guidance = getDriftPolicyFromRecord(drift)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-on-surface)]">{drift.summary}</p>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {formatDriftTypeLabel(drift.type)}
            {drift.systemLabel ? ` · ${drift.systemLabel}` : ""}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-on-surface-muted)]">
            {guidance.impactSummary}
          </p>
        </div>
        <Badge variant={driftSeverityVariant(drift.severity)}>{drift.severity}</Badge>
      </div>
      <div className={`mt-4 grid gap-3 ${compact ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-3">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
            De ce conteaza
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
            {guidance.lawReference}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{guidance.severityReason}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-3">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Ce faci acum
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
            {guidance.nextAction}
          </p>
        </div>
        {!compact && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Dovada
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
              {guidance.evidenceRequired}
            </p>
          </div>
        )}
      </div>
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
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              disabled={disabled}
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-[var(--border-subtle)] bg-[var(--bg-active)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-on-surface)]">{tab.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                    {tab.description}
                  </p>
                </div>
                {tab.badge ? (
                  <Badge variant="outline" className="rounded-full px-2.5 py-1 normal-case tracking-normal">
                    {tab.badge}
                  </Badge>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
      {locked && (
        <Badge variant="outline" className="rounded-xl px-3 py-2 text-xs">
          Mod Agent activ: verdicts si istoric raman blocate pana iesi din workspace-ul agentului.
        </Badge>
      )}
    </div>
  )
}

function SectionLoadingCard({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--bg-inset)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 text-sm text-[var(--color-on-surface-muted)]">
        {detail}
      </CardContent>
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
          title: "Continui in Documente",
          description: "Acolo gasesti istoricul complet, nu doar cele mai recente surse.",
          href: "/dashboard/documente",
          cta: "Deschide Documente",
        }
      : sourceType === "manifest" || sourceType === "yaml"
        ? {
            title: "Dupa scanare continui in Control",
            description: "Confirmi sistemele, baseline-ul si drift-ul pe ce a iesit din sursa tehnica.",
            href: "/dashboard/sisteme",
            cta: "Mergi la Control",
          }
        : {
            title: "Dupa scanare continui in Dovada",
            description: "Rezultatul documentului se transforma in task-uri, dovezi si livrabil separat.",
            href: "/dashboard/checklists",
            cta: "Mergi la Dovada",
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
              {sourceType === "manifest" || sourceType === "yaml" ? "handoff spre Control" : "handoff spre Dovada"}
            </Badge>
          </>
        }
        support={
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Rolul paginii</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                {agentModeActive
                  ? "Workspace-ul agentului propune, dar omul valideaza."
                  : "Scanare este poarta de intrare pentru surse, nu locul final pentru control sau audit."}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Regula de citire</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                Sus executi. Mai jos explici sau verifici. Dupa aceea continui in pagina dedicata.
              </p>
            </div>
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
              ? "control operational"
              : "executie si dovada"
        }
        checklist={
          viewMode === "history"
            ? [
                "verifici sursa recenta potrivita",
                "sari in Documente pentru lista completa",
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
                  "deschizi task-urile derivate in Dovada",
                  "atasezi dovezi si livrezi separat",
                ]
        }
        actions={
          <Button asChild variant="outline">
            <Link href={nextStep.href}>
              {nextStep.cta}
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </Link>
          </Button>
        }
      />
    </div>
  )
}
