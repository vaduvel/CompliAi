"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCode2,
  FileText,
  type LucideIcon,
  ScanText,
  ShieldAlert,
} from "lucide-react"

import { AIDiscoveryPanel } from "@/components/compliscan/ai-discovery-panel"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import {
  LatestDocumentSection,
  LoadingScreen,
  PageHeader,
  ScanWorkspace,
} from "@/components/compliscan/route-sections"
import { buildScanInsights } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCockpit } from "@/components/compliscan/use-cockpit"
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

export default function ScanariPage() {
  const router = useRouter()
  const cockpit = useCockpit()
  const [sourceType, setSourceType] = useState<"document" | "text" | "manifest" | "yaml">(
    "document"
  )

  if (cockpit.loading || !cockpit.data) return <LoadingScreen />

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scanari"
        description="Alege sursa potrivita: document, text manual, manifest de cod sau compliscan.yaml"
        score={cockpit.data.summary.score}
        riskLabel={cockpit.data.summary.riskLabel}
      />

      <PillarTabs sectionId="scanare" />

      <SourceModeGuide sourceType={sourceType} />

      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <SourceTypeButton
            active={sourceType === "document"}
            icon={FileText}
            title="Document"
            description="PDF, imagine sau document scanat cu OCR si review."
            badge="GDPR / AI Act / e-Factura"
            onClick={() => setSourceType("document")}
          />
          <SourceTypeButton
            active={sourceType === "text"}
            icon={ScanText}
            title="Text manual"
            description="Cand ai deja continutul copiat si vrei analiza directa."
            badge="Rapid review"
            onClick={() => {
              cockpit.setDocumentFile(null)
              setSourceType("text")
            }}
          />
          <SourceTypeButton
            active={sourceType === "manifest"}
            icon={FileCode2}
            title="Repo / manifest"
            description="package.json, requirements.txt, pyproject.toml si lockfiles."
            badge="Auto-discovery"
            onClick={() => setSourceType("manifest")}
          />
          <SourceTypeButton
            active={sourceType === "yaml"}
            icon={ShieldAlert}
            title="compliscan.yaml"
            description="Sursa de adevar declarata pentru provider, model, rezidenta si human oversight."
            badge="Compliance as code"
            onClick={() => setSourceType("yaml")}
          />
        </CardContent>
      </Card>

      <ScanFlowStatusCard
        sourceType={sourceType}
        latestDocumentScan={latestDocumentScan}
        latestManifestScan={latestManifestScan}
        latestYamlScan={latestYamlScan}
      />

      {sourceType === "manifest" || sourceType === "yaml" ? (
        <div className="space-y-6">
          <ScanStageDivider
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
          <ScanStageDivider
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
          <ScanStageDivider
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
          <ScanStageDivider
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
    </div>
  )
}

function ScanFlowStatusCard({
  sourceType,
  latestDocumentScan,
  latestManifestScan,
  latestYamlScan,
}: {
  sourceType: "document" | "text" | "manifest" | "yaml"
  latestDocumentScan: ScanRecord | null
  latestManifestScan: ScanRecord | null
  latestYamlScan: ScanRecord | null
}) {
  const currentSourceLabel =
    sourceType === "document"
      ? "Document cu OCR și review"
      : sourceType === "text"
        ? "Text manual pentru analiză rapidă"
        : sourceType === "manifest"
          ? "Manifest / lockfile pentru autodiscovery"
          : "compliscan.yaml pentru control declarat"

  const latestResult =
    sourceType === "manifest"
      ? latestManifestScan
      : sourceType === "yaml"
        ? latestYamlScan
        : latestDocumentScan

  const resultLabel =
    sourceType === "manifest"
      ? "Ultimul rezultat de repo"
      : sourceType === "yaml"
        ? "Ultimul rezultat YAML"
        : "Ultimul rezultat document"

  return (
    <Card className="border-[var(--color-border)] bg-[linear-gradient(180deg,var(--bg-panel-2),var(--color-surface))]">
      <CardContent className="grid gap-4 p-5 lg:grid-cols-3">
        <FlowStatusItem
          label="Lucrezi acum în"
          value={currentSourceLabel}
          hint="Zona de sus este singurul loc unde pornești scanarea sau validarea."
        />
        <FlowStatusItem
          label={resultLabel}
          value={latestResult?.documentName ?? "încă lipsește"}
          hint={
            latestResult
              ? `Procesat ${formatRelativeRomanian(latestResult.createdAtISO)}`
              : "Rezultatul apare după primul scan pentru acest tip de sursă."
          }
        />
        <FlowStatusItem
          label="Cum citești pagina"
          value="sus lucrezi · jos verifici"
          hint="Păstrăm separat work queue-ul de sumarul ultimului rezultat ca să nu pară două scanări diferite."
        />
      </CardContent>
    </Card>
  )
}

function FlowStatusItem({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-3 text-sm font-semibold text-[var(--color-on-surface)]">{value}</p>
      <p className="mt-2 text-xs leading-6 text-[var(--color-muted)]">{hint}</p>
    </div>
  )
}

function ScanStageDivider({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] px-5 py-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{eyebrow}</p>
      <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-[var(--color-on-surface)]">{title}</p>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-on-surface-muted)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

function SourceTypeButton({
  active,
  icon: Icon,
  title,
  description,
  badge,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  title: string
  description: string
  badge: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
      className={`h-auto items-start justify-start rounded-3xl border px-5 py-4 text-left ${
        active
          ? "border-[var(--color-border-strong)] bg-[linear-gradient(180deg,var(--bg-panel-2),var(--color-surface-variant))] text-[var(--color-on-surface)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface-muted)]"
      }`}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`grid size-8 place-items-center rounded-2xl border ${
                active
                  ? "border-[var(--color-border-strong)] bg-[var(--bg-inset)] text-[var(--color-on-surface)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
              }`}
            >
              <Icon className="size-4" strokeWidth={2.25} />
            </span>
            <span className="text-base font-semibold">{title}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">
            {description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-muted)]">
            {badge}
          </Badge>
          {active && (
            <span className="text-xs font-medium text-[var(--color-primary)]">Selectat</span>
          )}
        </div>
      </div>
    </Button>
  )
}

function findingSeverityClasses(severity: ComplianceSeverity) {
  if (severity === "critical" || severity === "high") {
    return "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
  }

  if (severity === "medium") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }

  return "border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] text-[var(--color-success)]"
}

function SourceModeGuide({
  sourceType,
}: {
  sourceType: "document" | "text" | "manifest" | "yaml"
}) {
  const content = {
    document: {
      title: "Flux pentru documente scanate",
      description:
        "Incarci PDF sau imagine, extragem textul, il revizuiesti si apoi rulezi analiza finala pe continutul curatat.",
      steps: [
        "Alegi fisierul si ii confirmi numele.",
        "Verifici textul extras daca OCR-ul a corectat ceva prost.",
        "Pornesti analiza si mergi direct la rezultatul documentului.",
      ],
    },
    text: {
      title: "Flux pentru text manual",
      description:
        "Cand ai deja politica, contractul sau ToS-ul copiat, sari peste OCR si pregatesti analiza direct pe textul introdus.",
      steps: [
        "Dai un nume clar analizei.",
        "Lipesti continutul relevant in zona de text.",
        "Pregatesti analiza si confirmi rezultatul ca pe un document normal.",
      ],
    },
    manifest: {
      title: "Flux pentru autodiscovery din cod",
      description:
        "Incarci manifestul, detectam provideri si framework-uri AI, apoi confirmi uman ce sisteme intra in inventarul oficial.",
      steps: [
        "Alegi `package.json`, `requirements.txt` sau lockfile-ul relevant.",
        "Rulezi autodiscovery si revizuiesti sistemele propuse.",
        "Editezi, confirmi si folosesti drift-ul fata de baseline-ul validat.",
      ],
    },
    yaml: {
      title: "Flux pentru compliscan.yaml",
      description:
        "Incarci configuratia declarata a sistemului AI, verificam providerul, modelul, datele, human oversight si drift-ul fata de baseline.",
      steps: [
        "Adaugi fisierul `compliscan.yaml` sau lipesti continutul direct.",
        "Validam configuratia si generam findings cu mapare legala si dovezi necesare.",
        "Folosesti rezultatul ca sursa de adevar pentru control, audit si drift detection.",
      ],
    },
  }[sourceType]

  return (
    <Card className="border-[var(--color-border)] bg-[linear-gradient(180deg,var(--bg-panel-2),var(--color-surface))]">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Mod activ
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-on-surface)]">
            {content.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-muted)]">
            {content.description}
          </p>
        </div>
        <div className="grid gap-3">
          {content.steps.map((step, index) => (
            <div
              key={`${sourceType}-${index}`}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Pas {index + 1}
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface)]">{step}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
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
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 text-sm text-[var(--color-on-surface-muted)]">
            Inca nu ai procesat niciun `compliscan.yaml`. Alege modul dedicat, valideaza configul si aici vei vedea ce a intrat in controlul operational.
          </div>
        )}

        {latestYamlScan && (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
                    {latestYamlScan.documentName}
                  </Badge>
                  <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
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
                          <Badge
                            key={item}
                            className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]"
                          >
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
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4 text-sm text-[var(--status-success-text)]">
                      Configul nu a generat findings suplimentare.
                    </div>
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
                        </div>
                        <Badge
                          className={findingSeverityClasses(finding.severity)}
                        >
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
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4 text-sm text-[var(--status-success-text)]">
                      Nu exista drift activ fata de baseline pentru acest YAML.
                    </div>
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
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 text-sm text-[var(--color-on-surface-muted)]">
            Inca nu ai procesat niciun manifest. Alege `Repo / manifest`, ruleaza autodiscovery si aici vei vedea exact ce a iesit pentru sursa respectiva.
          </div>
        )}

        {latestManifestScan && (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
                    {latestManifestScan.documentName}
                  </Badge>
                  <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
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
                          <Badge
                            key={framework}
                            className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]"
                          >
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
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4 text-sm text-[var(--color-on-surface-muted)]">
                    Nu avem încă sisteme propuse pentru manifestul curent.
                  </div>
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
                        <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
                          {system.confidence}
                        </Badge>
                        <Badge
                          className={
                            system.riskLevel === "high"
                              ? "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
                              : system.riskLevel === "limited"
                                ? "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
                                : "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
                          }
                        >
                          {system.riskLevel}
                        </Badge>
                        <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-muted)]">
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
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4 text-sm text-[var(--status-success-text)]">
                    Nu există drift activ pentru această sursă.
                  </div>
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
        <Badge className={driftSeverityBadgeClass(drift.severity)}>{drift.severity}</Badge>
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

function driftSeverityBadgeClass(severity: ComplianceDriftRecord["severity"]) {
  if (severity === "critical" || severity === "high") {
    return "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
  }
  if (severity === "medium") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }
  return "border-[var(--color-border)] bg-transparent text-[var(--color-muted)]"
}
