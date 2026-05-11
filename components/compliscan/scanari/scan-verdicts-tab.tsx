"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, CheckCircle2, ChevronRight, Clock3, ShieldAlert } from "lucide-react"

import { FindingVerdictMeta } from "@/components/compliscan/finding-verdict-meta"
import { LatestDocumentSection } from "@/components/compliscan/route-sections"
import type { CockpitTask, ScanInsight } from "@/components/compliscan/types"
import { Badge } from "@/components/evidence-os/Badge"
import { ActionCluster } from "@/components/evidence-os/ActionCluster"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { DenseListItem } from "@/components/evidence-os/DenseListItem"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { SectionDividerCard } from "@/components/evidence-os/SectionDividerCard"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
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
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
      <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">{label}</p>
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
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-eos-text">{drift.summary}</p>
          <p className="mt-2 text-xs text-eos-text-muted">
            {formatDriftTypeLabel(drift.type)}
            {drift.systemLabel ? ` · ${drift.systemLabel}` : ""}
          </p>
          <p className="mt-3 text-sm leading-6 text-eos-text-muted">
            {guidance.impactSummary}
          </p>
        </div>
        <Badge variant={driftSeverityVariant(drift.severity)}>{drift.severity}</Badge>
      </div>
      <div className={`mt-4 grid gap-3 ${compact ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-3">
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
            De ce conteaza
          </p>
          <p className="mt-2 text-sm font-medium text-eos-text">
            {guidance.lawReference}
          </p>
          <p className="mt-1 text-xs text-eos-text-muted">{guidance.severityReason}</p>
        </div>
        <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-3">
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
            Ce faci acum
          </p>
          <p className="mt-2 text-sm font-medium text-eos-text">
            {guidance.nextAction}
          </p>
        </div>
        {!compact && (
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-3">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
              Dovada
            </p>
            <p className="mt-2 text-sm font-medium text-eos-text">
              {guidance.evidenceRequired}
            </p>
          </div>
        )}
      </div>
    </div>
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
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-[28px] leading-tight">Ultimul compliscan.yaml validat</CardTitle>
            <p className="mt-2 text-sm text-eos-text-muted">
              Vezi exact ce configuratie declarata a intrat in control, ce articole atinge si unde exista drift fata de baseline.
            </p>
          </div>
          <Button asChild variant="outline" size="default" className="gap-2">
            <Link href={dashboardRoutes.auditorVault}>
              Mergi la Auditor Vault
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {!latestYamlScan && (
          <EmptyState
            title="Niciun compliscan.yaml validat"
            label="Alege modul dedicat, valideaza configul si aici vei vedea ce a intrat in controlul operational."
            className="items-start rounded-eos-md border-eos-border bg-eos-surface-variant px-5 py-5 text-left"
          />
        )}

        {latestYamlScan && (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
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
                    tone="text-eos-text"
                  />
                  <ManifestMetric
                    label="Findings"
                    value={String(findings.length)}
                    tone={findings.length > 0 ? "text-eos-warning" : "text-eos-success"}
                  />
                  <ManifestMetric
                    label="Drift activ"
                    value={String(drifts.length)}
                    tone={drifts.length > 0 ? "text-eos-error" : "text-eos-success"}
                  />
                </div>
                <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
                    Preview config
                  </p>
                  <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-eos-text-muted">
                    {latestYamlScan.contentPreview}
                  </p>
                </div>
              </div>

              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
                <p className="text-sm font-medium text-eos-text">Ce controlezi acum</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                    <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
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
                        <span className="text-sm text-eos-text-muted">
                          Inca nu exista articole mapate pentru configul curent.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                    <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
                      Ce urmeaza
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-eos-text-muted">
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-primary" />
                        Confirmi ca providerul, modelul si riscul declarat corespund implementarii reale.
                      </li>
                      <li className="flex gap-2">
                        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-eos-warning" />
                        Atasezi dovada pentru findings-urile noi si actualizezi baseline-ul dupa review uman.
                      </li>
                      <li className="flex gap-2">
                        <Clock3 className="mt-0.5 size-4 shrink-0 text-eos-info" />
                        Revii in Auditor Vault pentru exportul de audit si controlul drift-ului.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
                <p className="text-sm font-medium text-eos-text">Findings generate din YAML</p>
                <div className="mt-4 space-y-3">
                  {findings.length === 0 && (
                    <EmptyState
                      title="Fara findings suplimentare"
                      label="Configul validat nu a generat findings noi in aceasta rulare."
                      className="rounded-eos-md border-eos-border-subtle bg-eos-bg-inset px-4 py-6"
                    />
                  )}
                  {findings.map((finding) => (
                    <DenseListItem
                      key={finding.id}
                      className={`bg-eos-bg-inset border-l-4 ${
                        finding.severity === "critical" || finding.severity === "high"
                          ? "border-l-eos-error"
                          : finding.severity === "medium"
                            ? "border-l-eos-warning"
                            : "border-l-eos-success"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-eos-text">
                              {finding.title}
                            </p>
                            <p className="mt-1 text-sm text-eos-text-muted">
                              {finding.detail}
                            </p>
                            <FindingVerdictMeta finding={finding} className="mt-3" />
                            <Link
                              href={`/dashboard/findings/${finding.id}`}
                              className="mt-3 inline-flex items-center gap-1 text-xs text-eos-primary hover:underline"
                            >
                              Detalii finding
                              <ChevronRight className="size-3" strokeWidth={2} />
                            </Link>
                          </div>
                          <Badge variant={findingSeverityClasses(finding.severity)}>
                            {finding.severity}
                          </Badge>
                        </div>
                      </div>
                    </DenseListItem>
                  ))}
                </div>
              </div>

              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
                <p className="text-sm font-medium text-eos-text">Drift pentru config</p>
                <div className="mt-4 space-y-3">
                  {drifts.length === 0 && (
                    <EmptyState
                      title="Fara drift activ"
                      label="Nu exista drift activ fata de baseline pentru acest YAML."
                      className="rounded-eos-md border-eos-border-subtle bg-eos-bg-inset px-4 py-6"
                    />
                  )}
                  {drifts.map((drift) => (
                    <DenseListItem key={drift.id} className="bg-eos-bg-inset">
                      <ScanDriftCard drift={drift} compact />
                    </DenseListItem>
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
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-[28px] leading-tight">Ultimul manifest procesat</CardTitle>
            <p className="mt-2 text-sm text-eos-text-muted">
              Rezultatul este legat explicit de manifestul pe care l-ai încărcat, nu de un document generic.
            </p>
          </div>
          <Button asChild variant="outline" size="default" className="gap-2">
            <Link href={dashboardRoutes.resolve}>
              Mergi la De rezolvat
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {!latestManifestScan && (
          <EmptyState
            title="Niciun manifest procesat"
            label="Alege `Repo / manifest`, ruleaza autodiscovery si aici vei vedea exact ce a iesit pentru sursa respectiva."
            className="items-start rounded-eos-md border-eos-border bg-eos-surface-variant px-5 py-5 text-left"
          />
        )}

        {latestManifestScan && (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
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
                    tone="text-eos-text"
                  />
                  <ManifestMetric
                    label="Provideri"
                    value={providers.length > 0 ? providers.join(", ") : "Necunoscut"}
                    tone="text-eos-info"
                  />
                  <ManifestMetric
                    label="Drift activ"
                    value={String(drifts.length)}
                    tone={
                      drifts.length > 0
                        ? "text-eos-warning"
                        : "text-eos-success"
                    }
                  />
                </div>
                <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
                    Preview sursa
                  </p>
                  <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-eos-text-muted">
                    {latestManifestScan.contentPreview}
                  </p>
                </div>
              </div>

              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
                <p className="text-sm font-medium text-eos-text">
                  Rezumat tehnic detectat
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                    <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
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
                        <span className="text-sm text-eos-text-muted">
                          Niciun framework AI clar.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                    <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
                      Ce faci acum
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-eos-text-muted">
                      <li className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-primary" />
                        Revizuiești sistemele propuse și corectezi scopul înainte de confirmare.
                      </li>
                      <li className="flex gap-2">
                        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-eos-warning" />
                        Confirmi doar ce intră real în inventarul AI.
                      </li>
                      <li className="flex gap-2">
                        <Clock3 className="mt-0.5 size-4 shrink-0 text-eos-info" />
                        Fixezi baseline-ul în `Setări` când snapshot-ul este validat uman.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
              <p className="text-sm font-medium text-eos-text">
                Rezultatul pentru acest manifest
              </p>
              <div className="mt-4 space-y-3">
                {systems.length === 0 && (
                  <EmptyState
                    title="Fara sisteme propuse"
                    label="Nu avem inca sisteme propuse pentru manifestul curent."
                    className="rounded-eos-md border-eos-border-subtle bg-eos-bg-inset px-4 py-6"
                  />
                )}
                {systems.map((system) => (
                  <DenseListItem key={system.id} className="bg-eos-bg-inset">
                    <div className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-eos-text">
                            {system.name}
                          </p>
                          <p className="mt-1 text-sm text-eos-text-muted">
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
                  </DenseListItem>
                ))}
              </div>
            </div>

            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
              <p className="text-sm font-medium text-eos-text">
                Drift legat de acest manifest
              </p>
              <div className="mt-4 space-y-3">
                {drifts.length === 0 && (
                  <EmptyState
                    title="Fara drift activ"
                    label="Nu exista drift activ pentru aceasta sursa."
                    className="rounded-eos-md border-eos-border-subtle bg-eos-bg-inset px-4 py-6"
                  />
                )}
                {drifts.map((drift) => (
                  <DenseListItem key={drift.id} className="bg-eos-bg-inset">
                    <ScanDriftCard drift={drift} />
                  </DenseListItem>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function ScanVerdictsTab({
  sourceType,
  latestManifestScan,
  latestManifestSystems,
  latestManifestDrifts,
  latestYamlScan,
  latestYamlSystems,
  latestYamlFindings,
  latestYamlDrifts,
  latestDocumentScan,
  latestDocumentText,
  latestDocumentFindings,
  latestDocumentInsights,
  latestDocumentTasks,
}: {
  sourceType: "document" | "text" | "manifest" | "yaml"
  latestManifestScan: ScanRecord | null
  latestManifestSystems: DetectedAISystemRecord[]
  latestManifestDrifts: ComplianceDriftRecord[]
  latestYamlScan: ScanRecord | null
  latestYamlSystems: DetectedAISystemRecord[]
  latestYamlFindings: ScanFinding[]
  latestYamlDrifts: ComplianceDriftRecord[]
  latestDocumentScan: ScanRecord | null
  latestDocumentText: string
  latestDocumentFindings: ScanFinding[]
  latestDocumentInsights: ScanInsight[]
  latestDocumentTasks: CockpitTask[]
}) {
  const [showDetails, setShowDetails] = useState(false)

  const hasData =
    Boolean(latestManifestScan) ||
    Boolean(latestYamlScan) ||
    Boolean(latestDocumentScan)
  const shouldShowDetails = showDetails || !hasData

  return (
    <div className="space-y-6">
      <SectionDividerCard
        eyebrow="Rezultat curent"
        title="Ultimul rezultat confirmat"
        description="Zona aceasta este doar pentru citire: te ajuta sa explici verdictul, finding-urile si drift-ul fara sa amesteci fluxul activ."
      />

      <ActionCluster
        eyebrow="Detalii"
        title="Detalii verdict"
        description="Contextul complet apare doar la cerere."
        actions={
          <Button variant="outline" onClick={() => setShowDetails((current) => !current)}>
            {showDetails ? "Ascunde detaliile" : "Arata detaliile"}
          </Button>
        }
      />

      {shouldShowDetails ? (
        <>
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
        </>
      ) : null}
    </div>
  )
}
