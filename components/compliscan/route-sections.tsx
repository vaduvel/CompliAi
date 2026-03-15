"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  GitBranch,
  CheckCircle2,
  FileText,
  Layers,
  ListChecks,
  Loader2,
  ShieldPlus,
  Upload,
} from "lucide-react"

import { FindingVerdictMeta } from "@/components/compliscan/finding-verdict-meta"
import { NextBestAction } from "@/components/compliscan/next-best-action"
import { RiskHeader } from "@/components/compliscan/risk-header"
import { TextExtractDrawer } from "@/components/compliscan/text-extract-drawer"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { Separator } from "@/components/evidence-os/Separator"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import type { CockpitTask } from "@/components/compliscan/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  formatDriftEscalationDeadline,
  formatDriftEscalationTier,
  formatDriftTypeLabel,
  getDriftPolicyFromRecord,
} from "@/lib/compliance/drift-policy"
import {
  formatDriftLifecycleStatus,
  isDriftSlaBreached,
} from "@/lib/compliance/drift-lifecycle"
import type {
  ComplianceDriftRecord,
  ComplianceEvent,
  ScanFinding,
  ScanRecord,
  WorkspaceContext,
} from "@/lib/compliance/types"
import { formatRelativeRomanian } from "@/lib/compliance/engine"

export function LoadingScreen({ variant = "page" }: { variant?: "page" | "section" }) {
  const containerClass =
    variant === "page"
      ? "grid min-h-screen place-items-center bg-[var(--color-bg)] text-[var(--color-on-surface)]"
      : "grid min-h-[40vh] place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface)]"

  return (
    <div className={containerClass}>
      <Loader2 className="size-6 animate-spin" />
    </div>
  )
}

export function DashboardTop({
  score,
  riskLabel,
  lastScanLabel,
  activeRiskCount,
  hasEvidence,
  onScan,
  onSandbox: _onSandbox,
  error,
  workspace,
}: {
  score: number
  riskLabel: string
  lastScanLabel: string
  activeRiskCount: number
  hasEvidence: boolean
  onScan: () => void
  onSandbox?: () => void
  error?: string | null
  workspace?: WorkspaceContext
}) {
  void _onSandbox

  return (
    <section className="space-y-4">
      <RiskHeader
        score={score}
        riskLabel={riskLabel}
        lastScanLabel={lastScanLabel}
        activeRiskCount={activeRiskCount}
        hasEvidence={hasEvidence}
        onScan={onScan}
        workspace={workspace}
      />

      {error && (
        <Alert className="border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]">
          <AlertTriangle className="size-4" />
          <AlertTitle>Eroare</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </section>
  )
}

export function OverviewPageSections({
  summary,
  lastScanLabel,
  nextBestAction,
  onResolveNow,
  onScan,
  onSandbox,
  state,
  activeDrifts,
  openAlerts,
  scans,
  tasks,
  workspace,
  events,
}: {
  summary: { score: number; riskLabel: string }
  lastScanLabel: string
  nextBestAction: CockpitTask | null
  onResolveNow: () => void
  onScan: () => void
  onSandbox: () => void
  state: {
    gdprProgress: number
    highRisk: number
    lowRisk: number
    efacturaConnected: boolean
    efacturaSignalsCount: number
    efacturaSyncedAtISO: string
    aiSystems: { riskLevel: string }[]
    driftRecords: { open: boolean }[]
    validatedBaselineSnapshotId?: string
  }
  activeDrifts: ComplianceDriftRecord[]
  openAlerts: { message: string }[]
  scans: ScanRecord[]
  tasks: CockpitTask[]
  workspace?: WorkspaceContext
  events: ComplianceEvent[]
}) {
  const activeRiskCount = state.highRisk + state.lowRisk
  const hasEvidence = scans.length > 0
  const openDriftCount = state.driftRecords.filter((record) => record.open).length
  const latestDocumentScan = scans.find((scan) => scan.sourceKind === "document") ?? null
  const latestManifestScan = scans.find((scan) => scan.sourceKind === "manifest") ?? null
  const activeTaskCount = tasks.filter((task) => task.status !== "done").length
  const evidenceAttachedCount = tasks.filter((task) => Boolean(task.attachedEvidence)).length

  return (
    <div className="space-y-8">
      <DashboardTop
        score={summary.score}
        riskLabel={summary.riskLabel}
        lastScanLabel={lastScanLabel}
        activeRiskCount={activeRiskCount}
        hasEvidence={hasEvidence}
        onScan={onScan}
        onSandbox={onSandbox}
        workspace={workspace}
      />

      <OverviewSummaryStrip
        score={summary.score}
        riskLabel={summary.riskLabel}
        lastScanLabel={lastScanLabel}
        activeTaskCount={activeTaskCount}
        openDriftCount={openDriftCount}
        scanCount={scans.length}
        evidenceAttachedCount={evidenceAttachedCount}
        hasValidatedBaseline={Boolean(state.validatedBaselineSnapshotId)}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
        <NextBestAction
          task={nextBestAction}
          onResolve={onResolveNow}
          hasEvidence={hasEvidence}
          activeRiskCount={activeRiskCount}
        />
        <DriftCommandCenter
          activeDrifts={activeDrifts}
          hasValidatedBaseline={Boolean(state.validatedBaselineSnapshotId)}
          latestDocumentScan={latestDocumentScan}
          latestManifestScan={latestManifestScan}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
        <DashboardGuideCard
          activeRiskCount={activeRiskCount}
          openAlertsCount={openAlerts.length}
          hasValidatedBaseline={Boolean(state.validatedBaselineSnapshotId)}
          latestDocumentScan={latestDocumentScan}
        />
        <SnapshotStatusCard
          latestDocumentScan={latestDocumentScan}
          latestManifestScan={latestManifestScan}
          events={events}
          hasValidatedBaseline={Boolean(state.validatedBaselineSnapshotId)}
          openDriftCount={openDriftCount}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <RecentActivityCard events={events} />
        <RecentScansCard scans={scans.slice(0, 4)} tasks={tasks} />
      </section>
    </div>
  )
}

function OverviewSummaryStrip({
  score,
  riskLabel,
  lastScanLabel,
  activeTaskCount,
  openDriftCount,
  scanCount,
  evidenceAttachedCount,
  hasValidatedBaseline,
}: {
  score: number
  riskLabel: string
  lastScanLabel: string
  activeTaskCount: number
  openDriftCount: number
  scanCount: number
  evidenceAttachedCount: number
  hasValidatedBaseline: boolean
}) {
  const items: SummaryStripItem[] = [
    {
      label: "Readiness",
      value: `${score}`,
      hint: riskLabel,
      tone: "accent",
    },
    {
      label: "Urmatoarele actiuni",
      value: `${activeTaskCount}`,
      hint: activeTaskCount > 0 ? "mergi direct in Remediere" : "nu exista lucru urgent acum",
      tone: activeTaskCount > 0 ? "warning" : "success",
    },
    {
      label: "Drift deschis",
      value: `${openDriftCount}`,
      hint:
        openDriftCount > 0 ? "urmareste doar semnalele reale" : "control stabil in acest moment",
      tone: openDriftCount > 0 ? "danger" : "success",
    },
    {
      label: "Baseline",
      value: hasValidatedBaseline ? "gata" : "in curs",
      hint: hasValidatedBaseline
        ? `ultimul control: ${lastScanLabel}`
        : scanCount > 0 || evidenceAttachedCount > 0
          ? "valideaza baseline-ul in Control"
          : "incepi din Scanare si Control",
      tone: hasValidatedBaseline ? "success" : "neutral",
    },
  ]

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardContent className="px-5 py-5">
        <SummaryStrip
          eyebrow="Stare curenta"
          title="Ce cere actiune acum"
          items={items}
        />
      </CardContent>
    </Card>
  )
}

function driftSeverityClasses(severity: ComplianceDriftRecord["severity"]) {
  if (severity === "critical" || severity === "high") {
    return "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
  }

  if (severity === "medium") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }

  return "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
}

function driftSeverityLabel(severity: ComplianceDriftRecord["severity"]) {
  if (severity === "critical") return "critic"
  if (severity === "high") return "ridicat"
  if (severity === "medium") return "mediu"
  return "scazut"
}

export function DriftCommandCenter({
  activeDrifts,
  hasValidatedBaseline,
  latestDocumentScan,
  latestManifestScan,
}: {
  activeDrifts: ComplianceDriftRecord[]
  hasValidatedBaseline: boolean
  latestDocumentScan: ScanRecord | null
  latestManifestScan: ScanRecord | null
}) {
  const [selectedDriftId, setSelectedDriftId] = useState<string | null>(activeDrifts[0]?.id ?? null)
  const primaryDrift = activeDrifts[0] ?? null
  const breachedCount = activeDrifts.filter((drift) => isDriftSlaBreached(drift)).length
  const latestSource = latestManifestScan ?? latestDocumentScan
  const selectedDrift =
    activeDrifts.find((drift) => drift.id === selectedDriftId) ?? primaryDrift
  const selectedGuidance = selectedDrift ? getDriftPolicyFromRecord(selectedDrift) : null
  const selectedBreached = selectedDrift ? isDriftSlaBreached(selectedDrift) : false

  useEffect(() => {
    if (activeDrifts.length === 0) {
      setSelectedDriftId(null)
      return
    }

    setSelectedDriftId((current) =>
      current && activeDrifts.some((drift) => drift.id === current) ? current : activeDrifts[0].id
    )
  }, [activeDrifts])

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Control drift</CardTitle>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-on-surface-muted)]">
              Vezi rapid schimbarea principala, impactul ei si urmatorul pas clar.
            </p>
          </div>
          <Badge className={activeDrifts.length > 0 ? driftSeverityClasses(primaryDrift?.severity ?? "medium") : "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"}>
            {activeDrifts.length > 0 ? `${activeDrifts.length} drift activ` : "control stabil"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {selectedDrift ? (
          <>
            <div className="space-y-3">
              {activeDrifts.map((drift) => {
                const guidance = getDriftPolicyFromRecord(drift)
                const breached = isDriftSlaBreached(drift)
                const isSelected = drift.id === selectedDrift.id

                return (
                  <button
                    key={drift.id}
                    type="button"
                    onClick={() => setSelectedDriftId(drift.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[var(--border-subtle)] bg-[var(--bg-active)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-variant)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                            {drift.summary}
                          </p>
                          {isSelected ? (
                            <Badge className="border-[var(--border-subtle)] bg-[var(--bg-inset)] text-[var(--text-primary)]">
                              selectat
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {[
                            formatDriftTypeLabel(drift.type),
                            drift.systemLabel || drift.sourceDocument || "Sursa tehnica fara eticheta",
                            formatRelativeRomanian(drift.detectedAtISO),
                          ].join(" · ")}
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)] line-clamp-2">
                          {guidance.nextAction}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Badge className={driftSeverityClasses(drift.severity)}>
                          {driftSeverityLabel(drift.severity)}
                        </Badge>
                        <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                          {formatDriftLifecycleStatus(drift.lifecycleStatus ?? "open")}
                        </Badge>
                        {breached ? (
                          <Badge className="border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]">
                            SLA depășit
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Impact principal</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                  {selectedGuidance?.lawReference || "revizie legala / operationala"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                  {selectedDrift.severityReason}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Pasul urmator</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                  {selectedGuidance?.nextAction || "Revizuiesti drift-ul si inchizi task-ul derivat"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                  {selectedGuidance?.evidenceRequired || "Atasezi dovada si rulezi rescan"}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Escalare si baseline</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                  {hasValidatedBaseline ? "Baseline validat" : "Baseline inca nevalidat"}
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  <span className="font-medium text-[var(--color-on-surface)]">Owner:</span>{" "}
                  {selectedDrift.escalationOwner || selectedGuidance?.ownerSuggestion || "in curs de confirmare"}
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  <span className="font-medium text-[var(--color-on-surface)]">Escalare:</span>{" "}
                  {formatDriftEscalationTier(
                    selectedDrift.escalationTier || selectedGuidance?.escalationTier || "watch"
                  )}{" "}
                  ·{" "}
                  {formatDriftEscalationDeadline(
                    selectedDrift.escalationDueAtISO || selectedGuidance?.escalationDueAtISO
                  )}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                  <span className="font-medium text-[var(--color-on-surface)]">Impact operational:</span>{" "}
                  {[
                    selectedDrift.blocksAudit ? "blocheaza auditul" : null,
                    selectedDrift.blocksBaseline ? "blocheaza baseline-ul" : null,
                    selectedDrift.requiresHumanApproval ? "cere aprobare umana" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "nu blocheaza auditul daca review-ul este documentat"}
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  <span className="font-medium text-[var(--color-on-surface)]">Sursa reper:</span>{" "}
                  {latestSource ? sourceLabel(latestSource) : "Porneste un scan nou din Scanare."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/alerte"
                className="inline-flex h-10 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-hover)]"
              >
                Vezi drifturile
              </Link>
              <Link
                href="/dashboard/checklists"
                className="inline-flex h-10 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-hover)]"
              >
                Deschide remedierea
              </Link>
              <Link
                href="/dashboard/sisteme"
                className="inline-flex h-10 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-hover)]"
              >
                Vezi controlul
              </Link>
              {selectedBreached ? (
                <Badge className="h-10 rounded-xl border-[var(--color-error)] bg-[var(--color-error-muted)] px-4 text-[var(--color-error)]">
                  Driftul selectat a depasit SLA-ul
                </Badge>
              ) : null}
              {breachedCount > 1 ? (
                <Badge className="h-10 rounded-xl border-[var(--color-warning)] bg-[var(--color-warning-muted)] px-4 text-[var(--color-warning)]">
                  {breachedCount} drift-uri depasesc SLA-ul
                </Badge>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
              <p className="text-lg font-semibold text-[var(--color-on-surface)]">
                Nu există drift deschis acum
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                {hasValidatedBaseline
                  ? "Controlul este stabil. Rescanezi doar cand apare o schimbare reala."
                  : "Confirma mai intai baseline-ul, apoi urmareste drift-ul pe schimbari reale."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/sisteme"
                className="inline-flex h-10 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-hover)]"
              >
                {hasValidatedBaseline ? "Verifică controlul" : "Validează baseline-ul"}
              </Link>
              <Link
                href="/dashboard/scanari"
                className="inline-flex h-10 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-hover)]"
              >
                Rulează un scan nou
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function sourceLabel(scan: ScanRecord | null) {
  if (!scan) return "Fara sursa"
  if (scan.sourceKind === "manifest") return "Repo / manifest"
  if (scan.sourceKind === "yaml") return "compliscan.yaml"
  return "Document"
}

function sourceHref(scan: ScanRecord) {
  if (scan.sourceKind === "manifest" || scan.sourceKind === "yaml") return "/dashboard/sisteme"
  return "/dashboard/documente"
}

function sourceActionLabel(scan: ScanRecord) {
  if (scan.sourceKind === "manifest") return "Vezi detectiile"
  if (scan.sourceKind === "yaml") return "Vezi controlul"
  return "Vezi rezultatul"
}

function formatScanMoment(scan: ScanRecord | null) {
  if (!scan) return "inca lipseste"
  return new Date(scan.createdAtISO).toLocaleString("ro-RO")
}

export function DashboardGuideCard({
  activeRiskCount,
  openAlertsCount,
  hasValidatedBaseline,
  latestDocumentScan,
}: {
  activeRiskCount: number
  openAlertsCount: number
  hasValidatedBaseline: boolean
  latestDocumentScan: ScanRecord | null
}) {
  const currentStepId = !latestDocumentScan
    ? "step-scan"
    : !hasValidatedBaseline
      ? "step-confirm"
      : activeRiskCount > 0 || openAlertsCount > 0
        ? "step-close"
        : "step-confirm"

  const guideSteps = [
    {
      id: "step-scan",
      title: "Scanare",
      description: "Adaugi sursa.",
      href: "/dashboard/scanari",
      icon: FileText,
      meta: latestDocumentScan
        ? `Ultimul document: ${latestDocumentScan.documentName}`
        : "Inca lipseste sursa initiala",
    },
    {
      id: "step-confirm",
      title: "Control",
      description: "Confirmi baseline.",
      href: "/dashboard/sisteme",
      icon: GitBranch,
      meta: hasValidatedBaseline
        ? "Baseline validat"
        : "Baseline nevalidat",
    },
    {
      id: "step-close",
      title: "Dovada",
      description: "Inchizi remedierea.",
      href: "/dashboard/checklists",
      icon: ListChecks,
      meta:
        activeRiskCount > 0
          ? `${activeRiskCount} riscuri active cer inchidere`
          : "Dovada este gata de verificare",
    },
  ].sort((left, right) => {
    if (left.id === currentStepId) return -1
    if (right.id === currentStepId) return 1
    return 0
  })

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Unde continui</CardTitle>
          </div>
          <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]">
            {openAlertsCount > 0 ? `${openAlertsCount} drifturi cer review` : "fara blocaj urgent"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-5 md:grid-cols-3">
        {guideSteps.map((step) => {
          const Icon = step.icon
          const isCurrentStep = step.id === currentStepId
          return (
            <Link
              key={step.id}
              href={step.href}
              className={`group rounded-2xl border p-4 transition ${
                isCurrentStep
                  ? "border-[var(--border-subtle)] bg-[var(--bg-active)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-variant)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-[var(--color-bg)] text-[var(--color-on-surface-muted)]">
                  <Icon className="size-4" strokeWidth={2.25} />
                </div>
                <div className="flex items-center gap-2">
                  {isCurrentStep ? (
                    <Badge className="border-[var(--border-subtle)] bg-[var(--bg-inset)] text-[var(--text-primary)]">
                      acum
                    </Badge>
                  ) : null}
                  <ArrowRight className="size-4 text-[var(--color-muted)] transition group-hover:text-[var(--color-primary)]" strokeWidth={2.25} />
                </div>
              </div>
              <p className="mt-3 text-base font-semibold text-[var(--color-on-surface)]">{step.title}</p>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">{step.description}</p>
              <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">{step.meta}</p>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function SnapshotStatusCard({
  latestDocumentScan,
  latestManifestScan,
  events,
  hasValidatedBaseline,
  openDriftCount,
}: {
  latestDocumentScan: ScanRecord | null
  latestManifestScan: ScanRecord | null
  events: ComplianceEvent[]
  hasValidatedBaseline: boolean
  openDriftCount: number
}) {
  const latestEvent = events[0] ?? null
  const primaryAction = !latestDocumentScan
    ? { href: "/dashboard/scanari", label: "Porneste scanarea" }
    : !hasValidatedBaseline
      ? { href: "/dashboard/sisteme", label: "Confirma baseline-ul" }
      : openDriftCount > 0
        ? { href: "/dashboard/checklists", label: "Inchide remedierea" }
        : { href: "/dashboard/sisteme", label: "Verifica controlul" }
  const secondaryAction = openDriftCount > 0
    ? { href: "/dashboard/alerte", label: "Vezi drifturile" }
    : latestManifestScan
      ? { href: "/dashboard/sisteme", label: "Vezi sistemele" }
      : latestDocumentScan
        ? { href: "/dashboard/documente", label: "Vezi istoricul" }
        : null

  const statusItems = [
    {
      id: "status-document",
      label: "Document",
      value: latestDocumentScan ? latestDocumentScan.documentName : "inca lipseste",
      meta: latestDocumentScan ? formatScanMoment(latestDocumentScan) : "mergi la Scanari",
    },
    {
      id: "status-manifest",
      label: "Repo",
      value: latestManifestScan ? latestManifestScan.documentName : "inca lipseste",
      meta: latestManifestScan ? formatScanMoment(latestManifestScan) : "detecteaza un manifest",
    },
    {
      id: "status-baseline",
      label: "Baseline",
      value: hasValidatedBaseline ? "validat" : "nevalidat",
      meta: hasValidatedBaseline ? "comparatiile folosesc snapshot-ul curent" : "valideaza in Sisteme sau Setari",
    },
  ]

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Stare curenta</CardTitle>
          </div>
          <Badge
            className={
              openDriftCount > 0
                ? "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
                : "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
            }
          >
            {openDriftCount > 0 ? `${openDriftCount} drift deschis` : "fara drift deschis"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {statusItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">{item.label}</p>
              <p className="mt-2 break-words text-sm font-semibold text-[var(--color-on-surface)]">{item.value}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{item.meta}</p>
            </div>
          ))}
        </div>

        {latestEvent ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Ultimul semnal</p>
            <p className="mt-2 break-words text-sm font-semibold text-[var(--color-on-surface)]">
              {latestEvent.message}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
              {latestEvent.entityType} · {formatRelativeRomanian(latestEvent.createdAtISO)}
            </p>
          </div>
        ) : (
          <EmptyState
            title="Nu exista evenimente in jurnal"
            label="Activitatea va aparea aici dupa primul scan sau dupa prima schimbare confirmata."
            className="border-[var(--color-border)] bg-[var(--color-surface-variant)] py-8"
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={primaryAction.href}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-hover)]"
          >
            {primaryAction.label}
          </Link>
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-hover)]"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function ModulesGrid({
  state,
  aiHighRisk,
  aiLowRisk,
  gdprQuickFixes,
  validatedInvoicesToday,
  efacturaErrorsToday,
  busy,
  onSyncNow,
  onSandbox,
}: {
  state: {
    highRisk: number
    lowRisk: number
    gdprProgress: number
    efacturaConnected: boolean
    efacturaSignalsCount: number
    efacturaSyncedAtISO: string
    driftRecords: { open: boolean }[]
    validatedBaselineSnapshotId?: string
  }
  aiHighRisk: number
  aiLowRisk: number
  gdprQuickFixes: { id: string }[]
  validatedInvoicesToday: number
  efacturaErrorsToday: number
  busy: boolean
  onSyncNow: () => void
  onSandbox: () => void
}) {
  const efacturaProgress = state.efacturaConnected ? 74 : state.efacturaSignalsCount > 0 ? 28 : 12

  return (
    <section className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg">EU AI Act</CardTitle>
            <Layers className="size-5 text-[var(--icon-secondary)]" strokeWidth={2.25} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2 text-sm">
            <p className="text-[var(--color-on-surface-muted)]">
              {aiHighRisk > 0
                ? `${aiHighRisk} sisteme high-risk cer review prioritar.`
                : "Inventarul nu are sisteme high-risk deschise."}
            </p>
            <div className="flex items-center justify-between text-[var(--color-muted)]">
              <span>High-risk (inventar)</span>
              <span className="font-semibold text-[var(--color-error)]">{aiHighRisk}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--color-muted)]">
              <span>Low-risk (inventar)</span>
              <span className="font-semibold text-[var(--color-success)]">{aiLowRisk}</span>
            </div>
          </div>
          <Link
            href="/dashboard/sisteme"
            className="flex h-10 w-full items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
          >
            Vezi inventarul
          </Link>
        </CardContent>
      </Card>

      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg">e-Factura</CardTitle>
            <FileText className="size-5 text-[var(--color-warning)]" strokeWidth={2.25} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div>
            {state.efacturaConnected ? (
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Azi: {validatedInvoicesToday} facturi validate si {efacturaErrorsToday} erori.
              </p>
            ) : state.efacturaSignalsCount > 0 ? (
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Semnale detectate in {state.efacturaSignalsCount} documente, dar integrarea nu este conectata.
              </p>
            ) : (
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Integrarea nu este conectata. Poti porni un sync local cand esti pregatit.
              </p>
            )}
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Ultima sincronizare: {formatRelativeRomanian(state.efacturaSyncedAtISO)}
            </p>
          </div>
          <Progress
            value={efacturaProgress}
            className="bg-[var(--color-surface-variant)] [&_[data-slot=progress-indicator]]:bg-[var(--color-info)]"
          />
          <Button
            onClick={onSyncNow}
            disabled={busy}
            className="h-10 w-full rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            {state.efacturaConnected ? "Trimite la ANAF" : "Porneste sync local"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg">GDPR quick fixes</CardTitle>
            <CheckCircle2 className="size-5 text-[var(--color-success)]" strokeWidth={2.25} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="flex items-end gap-3">
            <span className="text-4xl font-semibold">{state.gdprProgress}%</span>
            <span className="pb-1 text-sm text-[var(--color-success)]">conform</span>
          </div>
          <Progress
            value={state.gdprProgress}
            className="bg-[var(--color-surface-variant)] [&_[data-slot=progress-indicator]]:bg-[var(--color-success)]"
          />
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 py-3">
            <p className="text-sm font-medium text-[var(--color-on-surface)]">
              {gdprQuickFixes.length > 0
                ? `${gdprQuickFixes.length} quick fix${gdprQuickFixes.length !== 1 ? "-uri" : ""} deschise`
                : "Fara quick fix-uri deschise"}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
              {gdprQuickFixes.length > 0
                ? "Inchizi rapid remedierea scurta, fara sa pierzi contextul de control."
                : "Nu exista blocaje rapide care sa ceara interventie imediata."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg">Sandbox</CardTitle>
            <ShieldPlus className="size-5 text-[var(--icon-secondary)]" strokeWidth={2.25} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            Testeaza o schimbare de politica, banner sau flux AI inainte de rollout.
          </p>
          <Button
            onClick={onSandbox}
            variant="outline"
            className="h-10 w-full rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
          >
            Deschide Sandbox
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}

export function ScanWorkspace({
  sourceMode = "document",
  documentName,
  documentContent,
  documentFile,
  pendingScanId,
  pendingExtractedText,
  scanInfo,
  scanning,
  scannedDocuments,
  setDocumentName,
  setDocumentContent,
  setDocumentFile,
  setPendingExtractedText,
  onExtract,
  onAnalyze,
}: {
  sourceMode?: "document" | "text"
  documentName: string
  documentContent: string
  documentFile: File | null
  pendingScanId: string | null
  pendingExtractedText: string
  scanInfo: string | null
  scanning: boolean
  scannedDocuments: number
  setDocumentName: (value: string) => void
  setDocumentContent: (value: string) => void
  setDocumentFile: (file: File | null) => void
  setPendingExtractedText: (value: string) => void
  onExtract: () => void
  onAnalyze: () => void
}) {
  const canStartScan =
    Boolean(documentName.trim()) &&
    (sourceMode === "text" ? Boolean(documentContent.trim()) : Boolean(documentFile) || Boolean(documentContent.trim()))
  const canAnalyze = Boolean(pendingScanId) && Boolean(pendingExtractedText.trim())
  const isTextMode = sourceMode === "text"

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-[28px] leading-tight">Flux scanare</CardTitle>
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          {isTextMode
            ? "Lipeste textul integral sau un extras relevant. Analiza detecteaza probleme GDPR, EU AI Act si e-Factura fara sa mai incarci un fisier."
            : "Incarca un document PDF, imagine sau completeaza textul daca OCR-ul are nevoie de clarificari. Analiza detecteaza probleme GDPR, EU AI Act si e-Factura."}
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
              <p className="text-sm font-medium text-[var(--color-on-surface)]">
                {isTextMode ? "Pasul 1: denumeste analiza" : "Pasul 1: alege sursa"}
              </p>
              <div className="mt-4">
                {isTextMode ? (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-on-surface-muted)]">
                    Foloseste acest mod cand ai deja textul copiat din politica, contract, ToS sau procedura interna si nu vrei OCR.
                  </div>
                ) : (
                  <label className="ring-focus flex min-h-[112px] cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)] px-5 text-center text-sm text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-hover)]">
                    <span>
                      <Upload className="mx-auto mb-3 size-5 text-[var(--color-primary)]" strokeWidth={2.25} />
                      {documentFile
                        ? `Fisier selectat: ${documentFile.name}`
                        : "Click aici pentru a incarca PDF / PNG / JPG"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        setDocumentFile(file)
                        if (file && !documentName.trim()) setDocumentName(file.name)
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
              <p className="text-sm font-medium text-[var(--color-on-surface)]">Pasul 2: context si scope</p>
              <div className="mt-4 grid gap-4">
                <input
                  value={documentName}
                  onChange={(event) => setDocumentName(event.target.value)}
                  placeholder="Nume document"
                  className="ring-focus h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
                />
                <textarea
                  value={documentContent}
                  onChange={(event) => setDocumentContent(event.target.value)}
                  rows={7}
                  placeholder={
                    isTextMode
                      ? "Lipeste aici textul pe care vrei sa-l analizam."
                      : "Paste text manual daca nu ai fisier. Daca ai PDF, lasa aici gol."
                  }
                  className="ring-focus rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
              <p className="text-sm font-medium text-[var(--color-on-surface)]">Pasul 3: extrage si revizuieste</p>
              <div className="mt-4 space-y-3 text-sm text-[var(--color-on-surface-muted)]">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">Document</p>
                  <p className="mt-2 text-sm text-[var(--color-on-surface)]">
                    {documentName || "Inca nu ai setat numele documentului."}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">Sursa</p>
                  <p className="mt-2">
                    {isTextMode
                      ? documentContent.trim()
                        ? "Text manual"
                        : "Nicio sursa"
                      : documentFile
                        ? documentFile.name
                        : documentContent.trim()
                          ? "Text manual"
                          : "Nicio sursa"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">Scope implicit</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">GDPR</Badge>
                    <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">EU AI Act</Badge>
                    <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">e-Factura</Badge>
                  </div>
                </div>
                {pendingScanId && (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                      Text extras pentru review
                    </p>
                    <textarea
                      value={pendingExtractedText}
                      onChange={(event) => setPendingExtractedText(event.target.value)}
                      rows={8}
                      className="ring-focus mt-3 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 py-3 text-sm text-[var(--color-on-surface)] outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3">
                {canAnalyze ? (
                  <>
                    <Button
                      onClick={onAnalyze}
                      disabled={scanning}
                      className="h-12 w-full rounded-xl bg-[var(--color-primary)] text-base font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Analiza in curs...
                        </>
                      ) : (
                        "Analizeaza textul revizuit"
                      )}
                    </Button>
                    <button
                      onClick={onExtract}
                      disabled={!canStartScan || scanning}
                      className="text-sm text-[var(--color-muted)] underline-offset-2 hover:text-[var(--color-on-surface)] hover:underline disabled:opacity-40"
                    >
                      Extrage din nou textul
                    </button>
                  </>
                ) : (
                  <Button
                    onClick={onExtract}
                    disabled={!canStartScan || scanning}
                    className="h-12 w-full rounded-xl bg-[var(--color-primary)] text-base font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {isTextMode ? "Pregatire in curs..." : "Extragere in curs..."}
                      </>
                    ) : (
                      isTextMode ? "Pregateste analiza" : "Extrage textul"
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-on-surface-muted)]">
              <p className="font-medium text-[var(--color-on-surface)]">Status flux</p>
              <p className="mt-2">
                {scanInfo || "In asteptare. Incarca sursa si porneste fluxul."}
              </p>
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                Total documente scanate: {scannedDocuments}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function LatestDocumentSection({
  latestScan,
  latestScanText,
  latestScanFindings,
  latestScanInsights,
  latestScanTasks,
}: {
  latestScan: ScanRecord | null
  latestScanText: string
  latestScanFindings: ScanFinding[]
  latestScanInsights: { id: string; label: string; value: string }[]
  latestScanTasks: CockpitTask[]
}) {
  const [openText, setOpenText] = useState(false)

  return (
    <>
      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader className="border-b border-[var(--color-border)] pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-[28px] leading-tight">Ultimul document analizat</CardTitle>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                Rezultatul este legat explicit de documentul tocmai scanat.
              </p>
            </div>
            {latestScan && (
              <Button
                onClick={() => setOpenText(true)}
                variant="outline"
                className="h-10 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
              >
                Vezi text extras
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {!latestScan && (
            <EmptyState
              title="Niciun document scanat"
              label="Porneste un flux nou din Scanari si aici vei vedea ultimul document analizat."
              className="items-start rounded-2xl border-eos-border bg-eos-surface-variant px-5 py-5 text-left"
            />
          )}

          {latestScan && (
            <>
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                      {latestScan.documentName}
                    </Badge>
                    <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                      Scanat la {new Date(latestScan.createdAtISO).toLocaleString("ro-RO")}
                    </Badge>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {latestScanInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
                      >
                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                          {insight.label}
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-on-surface)]">{insight.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">
                    De ce a fost detectat
                  </p>
                  <div className="mt-4 space-y-3">
                    {latestScanFindings.length === 0 && (
                      <EmptyState
                        title="Fara provenance disponibila"
                        label="Pentru acest document nu exista inca provenance disponibila."
                        className="rounded-2xl border-eos-border-subtle bg-eos-bg-inset px-4 py-6"
                      />
                    )}
                    {latestScanFindings.slice(0, 3).map((finding) => (
                      <div
                        key={finding.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                            {finding.provenance?.ruleId || "fara regula"}
                          </Badge>
                          {finding.provenance?.matchedKeyword && (
                            <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                              keyword: {finding.provenance.matchedKeyword}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-[var(--color-on-surface)]">
                          {finding.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                          {finding.provenance?.excerpt || finding.detail}
                        </p>
                        <FindingVerdictMeta finding={finding} className="mt-3" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                <p className="text-sm font-medium text-[var(--color-on-surface)]">
                  Rezultatul pentru acest document
                </p>
                <div className="mt-4 space-y-3">
                  {latestScanTasks.length === 0 && (
                    <EmptyState
                      title="Fara task-uri derivate"
                      label="Nu exista task-uri derivate direct din acest document."
                      className="rounded-2xl border-eos-border-subtle bg-eos-bg-inset px-4 py-6"
                    />
                  )}
                  {latestScanTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                          {task.title}
                          </p>
                          <span className="text-xs text-[var(--color-muted)]">{task.priority}</span>
                        </div>
                      <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">{task.summary}</p>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">{task.triggerLabel}</p>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {task.effortLabel} · {task.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-[var(--color-border)]" />
            </>
          )}
        </CardContent>
      </Card>

      <TextExtractDrawer
        open={openText}
        onOpenChange={setOpenText}
        title={latestScan?.documentName ?? "Ultimul document"}
        text={latestScanText}
      />
    </>
  )
}

export function RecentScansCard({
  scans,
  tasks,
}: {
  scans: ScanRecord[]
  tasks: CockpitTask[]
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="text-xl">Surse recente analizate</CardTitle>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              Documentele si manifestele raman separate ca sa vezi rapid ce ai scanat si unde continui.
            </p>
          </div>
          <Link
            href="/dashboard/scanari"
            className="text-sm font-medium text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
          >
            Mergi la Scanari
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {scans.length === 0 && (
          <EmptyState
            title="Nu exista surse scanate inca"
            label="Mergi la Scanari pentru a adauga primul document sau primul manifest."
            className="border-[var(--color-border)] bg-[var(--color-surface-variant)] py-8"
            actions={
              <Link
                href="/dashboard/scanari"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-hover)]"
              >
                Deschide Scanari
              </Link>
            }
          />
        )}
        {scans.map((scan) => {
          const scanTasks = tasks.filter((task) => task.sourceDocument === scan.documentName)
          const openTasks = scanTasks.filter((t) => t.status !== "done")
          const p1Count = scanTasks.filter((task) => task.priority === "P1").length
          const hasIssues = scanTasks.length > 0
          const needsReview = scan.analysisStatus !== "completed" || scan.reviewRequired
          const isManifest = scan.sourceKind === "manifest"
          const isYaml = scan.sourceKind === "yaml"
          const targetHref = sourceHref(scan)

          return (
            <Link
              key={scan.id}
              href={targetHref}
              className="group flex flex-col gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 transition hover:border-[var(--border-strong)] hover:bg-[var(--color-surface-hover)] md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-bg)] text-[var(--color-on-surface-muted)]">
                  <FileText className="size-5" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="break-words text-base font-semibold text-[var(--color-on-surface)] md:truncate">
                    {scan.documentName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge className="border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-on-surface-muted)]">
                      {sourceLabel(scan)}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                    Scanat pe {new Date(scan.createdAtISO).toLocaleString("ro-RO")}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:shrink-0 md:justify-end">
                <Badge
                  className={
                    needsReview
                      ? "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
                      : isManifest
                      ? "border-[var(--color-info)] bg-[var(--color-info-muted)] text-[var(--color-info)]"
                      : isYaml
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
                      : hasIssues
                      ? "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
                      : "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
                  }
                >
                  {needsReview
                    ? "Analiza in asteptare"
                    : isManifest
                      ? "Manifest procesat"
                    : isYaml
                      ? "Config YAML procesat"
                    : hasIssues
                      ? `${openTasks.length} task${openTasks.length !== 1 ? "-uri" : ""} deschise`
                      : "Fara probleme"}
                </Badge>
                {p1Count > 0 && (
                  <Badge className="border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]">
                    {p1Count} P1
                  </Badge>
                )}
                <span className="text-sm text-[var(--color-muted)]">
                  {sourceActionLabel(scan)}
                </span>
                <ArrowRight className="size-4 text-[var(--color-muted)] transition group-hover:text-[var(--color-primary)]" strokeWidth={2.25} />
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function RecentActivityCard({ events }: { events: ComplianceEvent[] }) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Activitate recenta</CardTitle>
            <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
              Ultimele actiuni confirmate, fara zgomotul din istoricul complet.
            </p>
          </div>
          <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]">
            {events.length > 0 ? `${Math.min(events.length, 5)} recente` : "fara activitate"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-2">
        {events.length === 0 && (
          <EmptyState
            title="Inca nu exista activitate"
            label="Primele schimbari confirmate si actiuni de operator vor aparea aici."
            className="border-[var(--color-border)] bg-[var(--color-surface-variant)] py-8"
          />
        )}
        {events.slice(0, 5).map((eventItem) => (
          <div
            key={eventItem.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-3"
          >
            <p className="break-words text-sm font-medium text-[var(--color-on-surface)]">{eventItem.message}</p>
            {eventItem.actorLabel && (
              <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                Actor: {eventItem.actorRole ? `${eventItem.actorLabel} (${eventItem.actorRole})` : eventItem.actorLabel}
              </p>
            )}
            <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
              {eventItem.type} · {formatRelativeRomanian(eventItem.createdAtISO)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function AlertsList({ tasks }: { tasks: CockpitTask[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          {tasks.length} actiuni deschise generate din drift
        </p>
        <Link
          href="/dashboard/rapoarte"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          Rezolva in Remediere →
        </Link>
      </div>
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-[var(--color-on-surface)]">{task.title}</p>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">{task.summary}</p>
              <p className="mt-2 text-xs text-[var(--color-muted)]">{task.triggerLabel}</p>
            </div>
            <Badge className="border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]">
              {task.priority}
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            {task.source} · {task.lawReference}
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/rapoarte"
              className="inline-flex h-9 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
            >
              Vezi task si dovezi →
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyStateCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardContent className="p-8">
        <p className="text-lg font-semibold text-[var(--color-on-surface)]">{title}</p>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">{description}</p>
      </CardContent>
    </Card>
  )
}
