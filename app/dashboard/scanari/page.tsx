"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  CheckCircle2,
  Bot,
  Clock3,
  ShieldAlert,
} from "lucide-react"

import { AIDiscoveryPanel } from "@/components/compliscan/ai-discovery-panel"
import { FindingVerdictMeta } from "@/components/compliscan/finding-verdict-meta"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { ScanFlowOverviewCard } from "@/components/evidence-os/ScanFlowOverviewCard"
import { ScanSourceTypeSelector, type ScanSourceType } from "@/components/evidence-os/ScanSourceTypeSelector"
import { SectionDividerCard } from "@/components/evidence-os/SectionDividerCard"
import { SourceModeGuideCard } from "@/components/evidence-os/SourceModeGuideCard"
import {
  LatestDocumentSection,
  LoadingScreen,
  PageHeader,
  ScanWorkspace,
} from "@/components/compliscan/route-sections"
import { buildScanInsights } from "@/components/compliscan/use-cockpit"
import { useCockpit } from "@/components/compliscan/use-cockpit"
import { useAgentFlow } from "@/components/compliscan/use-agent-flow"
import { AgentWorkspace } from "@/components/compliscan/agent-workspace"
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

export default function ScanariPage() {
  const router = useRouter()
  const cockpit = useCockpit()
  const agentFlow = useAgentFlow()
  const [sourceType, setSourceType] = useState<ScanSourceType>("document")

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
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <PageHeader
          title="Scanari"
          description="Alege sursa potrivita: document, text manual, manifest de cod sau compliscan.yaml"
          score={cockpit.data.summary.score}
          riskLabel={cockpit.data.summary.riskLabel}
        />
        <Button 
          variant={agentFlow.agentModeActive ? "default" : "outline"}
          className="shrink-0 gap-2"
          onClick={() => agentFlow.setAgentModeActive(!agentFlow.agentModeActive)}
        >
          <Bot className="size-4" />
          {agentFlow.agentModeActive ? "Iesi din Mod Agent" : "Mod Agent"}
        </Button>
      </div>

      <PillarTabs sectionId="scanare" />

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
              router.refresh()
            }
          }}
          onCancel={() => agentFlow.setAgentModeActive(false)}
        />
      ) : (
        <>
      <SourceModeGuideCard sourceType={sourceType} />

      <ScanSourceTypeSelector
        value={sourceType}
        onValueChange={(nextSourceType) => {
          if (nextSourceType === "text") {
            cockpit.setDocumentFile(null)
          }
          setSourceType(nextSourceType)
        }}
      />

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
            onDiscover={cockpit.discoverAISystemsFromManifest}
            onUpdateStatus={cockpit.updateDetectedAISystem}
            onEdit={cockpit.editDetectedAISystem}
          />
          <SectionDividerCard
            eyebrow="Ultimul rezultat"
            title={
              sourceType === "yaml"
                ? "Vezi ultimul config validat si drift-ul lui"
                : "Vezi ultimul manifest procesat si ce a iesit din el"
            }
            description={
              sourceType === "yaml"
                ? "Zona de mai jos este read-only: te ajuta sa verifici ultimul rezultat, nu sa lucrezi pe candidate."
                : "Zona de mai jos este sumarul ultimului scan de repo. Nu dubleaza work queue-ul, doar iti arata rezultatul ramas in urma."
            }
          />
          {sourceType === "manifest" ? (
            <LatestManifestSection
              latestManifestScan={latestManifestScan}
              systems={latestManifestSystems}
              drifts={latestManifestDrifts}
            />
          ) : (
            <LatestYamlSection
              latestYamlScan={latestYamlScan}
              systems={latestYamlSystems}
              findings={latestYamlFindings}
              drifts={latestYamlDrifts}
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <SectionDividerCard
            eyebrow="Flux activ"
            title={
              sourceType === "text"
                ? "Pregătești analiza din text manual"
                : "Încarci documentul și revizuiești OCR-ul"
            }
            description={
              sourceType === "text"
                ? "Aici lipești textul, îi dai un nume clar și trimiți analiza direct în verdict și task-uri."
                : "Aici încarci fișierul, extragi textul și faci review înainte să generezi verdictul final."
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
            setDocumentName={cockpit.setDocumentName}
            setDocumentContent={cockpit.setDocumentContent}
            setDocumentFile={cockpit.setDocumentFile}
            setPendingExtractedText={cockpit.setPendingExtractedText}
            onExtract={() => {
              void cockpit.handleExtractScan()
            }}
            onAnalyze={async () => {
              const success = await cockpit.handleAnalyzePendingScan()
              if (success) router.push("/dashboard/documente")
            }}
          />
          <SectionDividerCard
            eyebrow="Ultimul rezultat"
            title="Vezi clar ultimul document analizat"
            description="Zona de mai jos este rezultatul scanului precedent: de ce a ieșit verdictul și ce task-uri a deschis. Nu este formularul de lucru curent."
          />
        </div>
      )}

      {(sourceType === "document" || sourceType === "text") && (
        <LatestDocumentSection
          latestScan={latestDocumentScan}
          latestScanText={latestDocumentText}
          latestScanFindings={latestDocumentFindings}
          latestScanInsights={latestDocumentInsights}
          latestScanTasks={latestDocumentTasks}
        />
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
