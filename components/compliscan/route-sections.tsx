"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Bell,
  CheckCircle2,
  FileText,
  Layers,
  ListChecks,
  Loader2,
  ShieldPlus,
  Upload,
} from "lucide-react"

import { ExportCenter } from "@/components/compliscan/export-center"
import { FindingVerdictMeta } from "@/components/compliscan/finding-verdict-meta"
import { NextBestAction } from "@/components/compliscan/next-best-action"
import { RiskHeader } from "@/components/compliscan/risk-header"
import { TextExtractDrawer } from "@/components/compliscan/text-extract-drawer"
import type { CockpitTask } from "@/components/compliscan/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
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

export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--color-bg)] text-[var(--color-on-surface)]">
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
    <section className="space-y-6">
      <RiskHeader
        score={score}
        riskLabel={riskLabel}
        lastScanLabel={lastScanLabel}
        activeRiskCount={activeRiskCount}
        hasEvidence={hasEvidence}
        onScan={onScan}
        workspace={workspace}
      />

      <Alert className="border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface)]">
        <Bell className="size-4 text-[var(--color-warning)]" />
        <AlertTitle>Disclaimer legal</AlertTitle>
        <AlertDescription className="text-[var(--color-on-surface-muted)]">
          Acesta este un asistent AI. Scorurile si recomandarile sunt sugestii. Nu inlocuieste sfatul unui avocat sau contabil. Verifica uman inainte de orice raport oficial.
        </AlertDescription>
      </Alert>

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

export function PageHeader({
  title,
  description,
  score,
  riskLabel,
}: {
  title: string
  description?: string
  score?: number
  riskLabel?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-on-surface)]">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
        )}
      </div>
      {score !== undefined && riskLabel && (
        <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 py-2">
          <span className="text-lg font-semibold text-[var(--color-on-surface)]">{score}</span>
          <span className="text-sm text-[var(--color-muted)]">· {riskLabel}</span>
        </div>
      )}
    </div>
  )
}

export function OverviewPageSections({
  summary,
  lastScanLabel,
  nextBestAction,
  onResolveNow,
  onScan,
  onSandbox,
  onGeneratePdf,
  onExportChecklist,
  onShare,
  onSyncNow,
  busy,
  state,
  activeDrifts,
  openAlerts,
  gdprQuickFixes,
  validatedInvoicesToday,
  efacturaErrorsToday,
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
  onGeneratePdf: () => void
  onExportChecklist: () => void
  onShare: () => void
  onSyncNow: () => void
  busy: boolean
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
  gdprQuickFixes: { id: string }[]
  validatedInvoicesToday: number
  efacturaErrorsToday: number
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
  const efacturaOverviewProgress = state.efacturaConnected
    ? 74
    : state.efacturaSignalsCount > 0
      ? 28
      : 12
  const aiHighRisk = state.aiSystems.filter((s) => s.riskLevel === "high").length
  const aiLowRisk = state.aiSystems.filter((s) => s.riskLevel !== "high").length

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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <DriftCommandCenter
          activeDrifts={activeDrifts}
          hasValidatedBaseline={Boolean(state.validatedBaselineSnapshotId)}
          latestDocumentScan={latestDocumentScan}
          latestManifestScan={latestManifestScan}
        />
        <NextBestAction
          task={nextBestAction}
          onResolve={onResolveNow}
          hasEvidence={hasEvidence}
          activeRiskCount={activeRiskCount}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <DashboardGuideCard
          activeRiskCount={activeRiskCount}
          openAlertsCount={openAlerts.length}
          hasEvidence={hasEvidence}
          hasValidatedBaseline={Boolean(state.validatedBaselineSnapshotId)}
          latestDocumentScan={latestDocumentScan}
          latestManifestScan={latestManifestScan}
        />
        <SnapshotStatusCard
          latestDocumentScan={latestDocumentScan}
          latestManifestScan={latestManifestScan}
          events={events}
          hasValidatedBaseline={Boolean(state.validatedBaselineSnapshotId)}
          openDriftCount={openDriftCount}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.82fr)] 2xl:grid-cols-[minmax(0,1.72fr)_minmax(360px,0.76fr)]">
        <div className="space-y-6">
          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Rezumat operare</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-[var(--color-on-surface-muted)]">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <span>Probleme active</span>
                  <span>{activeRiskCount}</span>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  {activeRiskCount === 0
                    ? "Istoricul ramane salvat, dar nu exista risc deschis."
                    : "Numarul de semnale active ramase dupa task-urile inchise."}
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span>GDPR</span>
                  <span>{state.gdprProgress}%</span>
                </div>
                <Progress value={state.gdprProgress} className="bg-[var(--color-surface-variant)] [&_[data-slot=progress-indicator]]:bg-[var(--color-success)]" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span>EU AI Act</span>
                  <span>{Math.min(100, state.highRisk * 18 + state.lowRisk * 8)}%</span>
                </div>
                <Progress value={Math.min(100, state.highRisk * 18 + state.lowRisk * 8)} className="bg-[var(--color-surface-variant)] [&_[data-slot=progress-indicator]]:bg-[var(--color-warning)]" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span>e-Factura</span>
                  <span>{efacturaOverviewProgress}%</span>
                </div>
                <Progress value={efacturaOverviewProgress} className="bg-[var(--color-surface-variant)] [&_[data-slot=progress-indicator]]:bg-[var(--color-info)]" />
              </div>
            </CardContent>
          </Card>

          <ModulesGrid
            state={state}
            aiHighRisk={aiHighRisk}
            aiLowRisk={aiLowRisk}
            gdprQuickFixes={gdprQuickFixes}
            validatedInvoicesToday={validatedInvoicesToday}
            efacturaErrorsToday={efacturaErrorsToday}
            busy={busy}
            onSyncNow={onSyncNow}
            onSandbox={onSandbox}
          />

          <RecentScansCard scans={scans.slice(0, 4)} tasks={tasks} />
        </div>

        <div className="space-y-6">
          <ExportCenter
            onGeneratePdf={onGeneratePdf}
            onExportChecklist={onExportChecklist}
            onShare={onShare}
          />

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader className="pb-2">
            <CardTitle className="text-lg">Alerte active</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
              {openAlerts.slice(0, 4).map((alert, index) => (
                <div
                  key={`${alert.message}-${index}`}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--color-on-surface-muted)]"
                >
                  {alert.message}
                </div>
              ))}
              {openAlerts.length === 0 && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--color-on-surface-muted)]">
                  Nu exista alerte deschise.
                </div>
              )}
              <Link
                href="/dashboard/alerte"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
              >
                Vezi toate alertele
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </CardContent>
          </Card>

          <RecentActivityCard events={events} />
        </div>
      </div>
    </div>
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
  const primaryDrift = activeDrifts[0] ?? null
  const breachedCount = activeDrifts.filter((drift) => isDriftSlaBreached(drift)).length
  const latestSource = latestManifestScan ?? latestDocumentScan
  const primaryGuidance = primaryDrift ? getDriftPolicyFromRecord(primaryDrift) : null
  const primaryBreached = primaryDrift ? isDriftSlaBreached(primaryDrift) : false

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Control drift</CardTitle>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-on-surface-muted)]">
              Aici vezi imediat ce s-a schimbat fata de baseline si daca exista deja un task de remediere care cere atentie azi.
            </p>
          </div>
          <Badge className={activeDrifts.length > 0 ? driftSeverityClasses(primaryDrift?.severity ?? "medium") : "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"}>
            {activeDrifts.length > 0 ? `${activeDrifts.length} drift activ` : "control stabil"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {primaryDrift ? (
          <>
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    {formatDriftTypeLabel(primaryDrift.type)}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--color-on-surface)]">
                    {primaryDrift.summary}
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                    {[primaryDrift.systemLabel, primaryDrift.sourceDocument].filter(Boolean).join(" · ") || "Sursa tehnica fara eticheta"} ·{" "}
                    {formatRelativeRomanian(primaryDrift.detectedAtISO)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                    {primaryGuidance?.impactSummary}
                  </p>
                </div>
                <Badge className={driftSeverityClasses(primaryDrift.severity)}>
                  {primaryDrift.severity}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                  {formatDriftLifecycleStatus(primaryDrift.lifecycleStatus ?? "open")}
                </Badge>
                {primaryBreached && (
                  <Badge className="border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]">
                    SLA depășit
                  </Badge>
                )}
                {breachedCount > 1 && (
                  <Badge className="border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]">
                    {breachedCount} drift-uri depășesc SLA-ul
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Baseline</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                  {hasValidatedBaseline ? "validat" : "inca nevalidat"}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {hasValidatedBaseline
                    ? "Drift-ul este comparat cu snapshot-ul aprobat."
                    : "Valideaza un baseline ca sa compari schimbarile cu un punct curat."}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">De ce conteaza</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                  {primaryGuidance?.lawReference || "revizie legala / operationala"}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {primaryDrift.severityReason}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Ce faci acum</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                  {primaryGuidance?.nextAction || "Revizuiești drift-ul și închizi task-ul derivat"}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  CompliScan a transformat schimbarea într-un task operațional, nu într-un semnal vag.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Dovada de pastrat</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                  {primaryGuidance?.evidenceRequired || "Atașezi dovada și rulezi rescan"}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {latestSource ? sourceLabel(latestSource) : "Porneste un scan nou din Scanare."}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Escalare</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                  {primaryDrift.escalationOwner || primaryGuidance?.ownerSuggestion || "owner in curs de confirmare"}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {formatDriftEscalationTier(
                    primaryDrift.escalationTier || primaryGuidance?.escalationTier || "watch"
                  )} · pana la{" "}
                  {formatDriftEscalationDeadline(
                    primaryDrift.escalationDueAtISO || primaryGuidance?.escalationDueAtISO
                  )}
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {[
                    primaryDrift.blocksAudit ? "blocheaza auditul" : null,
                    primaryDrift.blocksBaseline ? "blocheaza baseline-ul" : null,
                    primaryDrift.requiresHumanApproval ? "cere aprobare umana" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "nu blocheaza auditul daca review-ul e documentat"}
                </p>
                {primaryDrift.acknowledgedBy && (
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Preluat de {primaryDrift.acknowledgedBy} ·{" "}
                    {formatRelativeRomanian(
                      primaryDrift.lastStatusUpdatedAtISO || primaryDrift.acknowledgedAtISO || primaryDrift.detectedAtISO
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/alerte"
                className="inline-flex h-10 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-hover)]"
              >
                Vezi drift-ul
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
                Revizuiește controlul
              </Link>
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
                  ? "Baseline-ul validat ține controlul stabil. Rulezi un scan nou când se schimbă documentele, providerul, modelul sau compliscan.yaml."
                  : "Încă nu ai un baseline validat. Următorul pas bun este să confirmi starea curentă din Control ca să poți detecta drift curat."}
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
  hasEvidence,
  hasValidatedBaseline,
  latestDocumentScan,
  latestManifestScan,
}: {
  activeRiskCount: number
  openAlertsCount: number
  hasEvidence: boolean
  hasValidatedBaseline: boolean
  latestDocumentScan: ScanRecord | null
  latestManifestScan: ScanRecord | null
}) {
  const guideSteps = [
    {
      id: "step-scan",
      title: "1. Colectezi sursa corecta",
      description:
        "Scanezi documente, text manual sau manifest de cod. Dashboard-ul doar iti spune unde esti, nu inlocuieste fluxul de analiza.",
      href: "/dashboard/scanari",
      icon: FileText,
      meta: latestDocumentScan
        ? `Ultimul document: ${latestDocumentScan.documentName}`
        : "Inca nu exista documente analizate",
    },
    {
      id: "step-confirm",
      title: "2. Confirmi inventarul si baseline-ul",
      description:
        "Sistemele AI detectate automat trec prin review uman. Dupa confirmare setezi baseline-ul folosit pentru drift.",
      href: "/dashboard/sisteme",
      icon: GitBranch,
      meta: hasValidatedBaseline
        ? "Baseline validat si gata pentru comparatii"
        : "Baseline inca nevalidat",
    },
    {
      id: "step-close",
      title: "3. Inchizi task-uri si exporti dovada",
      description:
        "Planul de remediere si exporturile finale stau in paginile dedicate, nu aici in overview.",
      href: "/dashboard/rapoarte",
      icon: ListChecks,
      meta:
        activeRiskCount > 0
          ? `${activeRiskCount} riscuri active de inchis`
          : "Niciun risc activ in acest moment",
    },
  ]

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Cum folosesti dashboard-ul</CardTitle>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-on-surface-muted)]">
              Pagina asta iti arata rapid starea workspace-ului, ce faci acum si unde continui. Analiza efectiva se ruleaza in paginile dedicate.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]">
              {hasEvidence ? "workspace activ" : "onboarding"}
            </Badge>
            <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]">
              {openAlertsCount} alerte deschise
            </Badge>
            {latestManifestScan && (
              <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]">
                ultim manifest procesat
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
        {guideSteps.map((step) => {
          const Icon = step.icon
          return (
            <Link
              key={step.id}
              href={step.href}
              className="group rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-[var(--color-bg)] text-[var(--color-on-surface-muted)]">
                  <Icon className="size-5" strokeWidth={2.25} />
                </div>
                <ArrowRight className="size-4 text-[var(--color-muted)] transition group-hover:text-[var(--color-primary)]" strokeWidth={2.25} />
              </div>
              <p className="mt-4 text-base font-semibold text-[var(--color-on-surface)]">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">{step.description}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">{step.meta}</p>
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

  const statusItems = [
    {
      id: "status-document",
      label: "Ultima sursa document",
      value: latestDocumentScan ? latestDocumentScan.documentName : "inca lipseste",
      meta: latestDocumentScan ? formatScanMoment(latestDocumentScan) : "mergi la Scanari",
    },
    {
      id: "status-manifest",
      label: "Ultima sursa repo",
      value: latestManifestScan ? latestManifestScan.documentName : "inca lipseste",
      meta: latestManifestScan ? formatScanMoment(latestManifestScan) : "detecteaza un manifest",
    },
    {
      id: "status-baseline",
      label: "Baseline pentru drift",
      value: hasValidatedBaseline ? "validat" : "nevalidat",
      meta: hasValidatedBaseline ? "comparatiile folosesc snapshot-ul curent" : "valideaza in Sisteme sau Setari",
    },
  ]

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Snapshot si schimbari recente</CardTitle>
            <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
              Vezi rapid daca ai suficienta dovada, daca baseline-ul este validat si daca exista drift care cere atentie.
            </p>
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
      <CardContent className="space-y-4 pt-6">
        {statusItems.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">{item.label}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">{item.value}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{item.meta}</p>
          </div>
        ))}

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Ultimul eveniment</p>
          <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
            {latestEvent?.message || "Nu exista evenimente in jurnal"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {latestEvent
              ? `${latestEvent.entityType} · ${formatRelativeRomanian(latestEvent.createdAtISO)}`
              : "Activitatea va aparea aici dupa primul scan"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/scanari"
            className="inline-flex h-10 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-hover)]"
          >
            Continua in Scanari
          </Link>
          <Link
            href="/dashboard/rapoarte"
            className="inline-flex h-10 items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-hover)]"
          >
            Vezi snapshot-ul complet
          </Link>
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
              {aiHighRisk > 0 ? `${aiHighRisk} sisteme high-risk in inventar` : "Niciun sistem high-risk inventariat"}
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
            Inventar AI
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
                Flux zilnic: {validatedInvoicesToday} facturi validate azi | {efacturaErrorsToday} erori
              </p>
            ) : state.efacturaSignalsCount > 0 ? (
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Flux e-Factura detectat in {state.efacturaSignalsCount} documente, dar integrarea nu este conectata.
              </p>
            ) : (
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Integrarea nu este conectata inca. Poti porni un sync local cand esti pregatit.
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
            {state.efacturaConnected ? "Trimite la ANAF" : "Activeaza sync local"}
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
          <Progress value={state.gdprProgress} className="bg-[var(--color-surface-variant)] [&_[data-slot=progress-indicator]]:bg-[var(--color-success)]" />
          <div className="flex flex-wrap gap-2">
            {gdprQuickFixes.slice(0, 2).map((alert) => (
              <Badge
                key={alert.id}
                className="border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
              >
                Rezolvabil in 5 min
              </Badge>
            ))}
            {gdprQuickFixes.length === 0 && (
              <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]">
                Fara blocaje rapide
              </Badge>
            )}
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
            Testeaza o modificare de politica, banner sau flux AI inainte de implementare.
          </p>
          <Button
            onClick={onSandbox}
            variant="outline"
            className="h-10 w-full rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
          >
            Porneste simulare
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
                    <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">GDPR</Badge>
                    <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">EU AI Act</Badge>
                    <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">e-Factura</Badge>
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
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 text-sm text-[var(--color-on-surface-muted)]">
              Inca nu exista documente scanate.
            </div>
          )}

          {latestScan && (
            <>
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
                      {latestScan.documentName}
                    </Badge>
                    <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
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
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-on-surface-muted)]">
                        Pentru acest document nu exista inca provenance disponibila.
                      </div>
                    )}
                    {latestScanFindings.slice(0, 3).map((finding) => (
                      <div
                        key={finding.id}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
                            {finding.provenance?.ruleId || "fara regula"}
                          </Badge>
                          {finding.provenance?.matchedKeyword && (
                            <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
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
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-on-surface-muted)]">
                      Nu exista task-uri derivate direct din acest document.
                    </div>
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
              Documentele si manifestele raman separate ca sa vezi imediat ce ai scanat si unde mergi pentru detalii.
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
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 text-sm text-[var(--color-on-surface-muted)]">
            Nu exista documente scanate inca. Mergi la{" "}
            <Link href="/dashboard/scanari" className="text-[var(--color-primary)] hover:underline">
              Scanari
            </Link>{" "}
            pentru a adauga primul document.
          </div>
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
              className="group flex items-center justify-between gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 transition hover:border-[var(--border-strong)] hover:bg-[var(--color-surface-hover)]"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-bg)] text-[var(--color-on-surface-muted)]">
                  <FileText className="size-5" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[var(--color-on-surface)]">
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

              <div className="flex shrink-0 items-center gap-3">
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
                <span className="hidden text-sm text-[var(--color-muted)] md:inline">
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
        <CardTitle className="text-lg">Activitate recenta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {events.length === 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--color-on-surface-muted)]">
            Inca nu exista evenimente in jurnal.
          </div>
        )}
        {events.slice(0, 5).map((eventItem) => (
          <div
            key={eventItem.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
          >
            <p className="text-sm font-medium text-[var(--color-on-surface)]">{eventItem.message}</p>
            {eventItem.actorLabel && (
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Actor: {eventItem.actorRole ? `${eventItem.actorLabel} (${eventItem.actorRole})` : eventItem.actorLabel}
              </p>
            )}
            <p className="mt-2 text-xs text-[var(--color-muted)]">
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
          {tasks.length} alerte active care necesita atentie
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
