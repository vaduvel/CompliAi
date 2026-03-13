"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Download,
  FolderKanban,
  Paperclip,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen, PageHeader } from "@/components/compliscan/route-sections"
import {
  AICompliancePackEntriesCard,
  AICompliancePackSummaryCard,
} from "@/components/compliscan/ai-compliance-pack-card"
import type { CockpitTask } from "@/components/compliscan/types"
import { useCockpit } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CompliScanSnapshot } from "@/lib/compliscan/schema"
import { getControlFamilyReusePolicySummary } from "@/lib/compliance/control-families"
import {
  formatDriftEscalationDeadline,
  formatDriftEscalationTier,
  formatDriftTypeLabel,
  getDriftPolicyFromRecord,
} from "@/lib/compliance/drift-policy"
import { formatDriftLifecycleStatus, isDriftSlaBreached } from "@/lib/compliance/drift-lifecycle"
import type { ComplianceTraceRecord } from "@/lib/compliance/traceability"
import type {
  ComplianceDriftRecord,
  ComplianceEvent,
  PersistedTaskState,
} from "@/lib/compliance/types"
import { formatRelativeRomanian } from "@/lib/compliance/engine"

export default function AuditorVaultPage() {
  const cockpit = useCockpit()

  if (cockpit.loading || !cockpit.data) return <LoadingScreen />

  const latestSnapshot = cockpit.data.state.snapshotHistory[0]
  const validatedBaseline = cockpit.data.state.snapshotHistory.find(
    (snapshot) => snapshot.snapshotId === cockpit.data?.state.validatedBaselineSnapshotId
  )
  const evidenceReadyTasks = cockpit.tasks.filter(
    (task) => Boolean(task.attachedEvidence) && task.validationStatus === "passed"
  )
  const evidenceMissingTasks = cockpit.tasks.filter(
    (task) =>
      task.status !== "done" ||
      !task.attachedEvidence ||
      task.validationStatus === "failed" ||
      task.validationStatus === "needs_review"
  )
  const legalMappedTasks = cockpit.tasks.filter(
    (task) => Boolean(task.lawReference) || Boolean(task.legalSummary)
  )
  const recentEvents = cockpit.data.state.events.slice(0, 8)
  const activeDrifts = cockpit.activeDrifts
  const validationEntries = buildValidationEntries(
    cockpit.tasks,
    cockpit.data.state.taskState,
    cockpit.data.state.events
  )
  const auditReadiness =
    validatedBaseline && activeDrifts.length === 0 && evidenceMissingTasks.length === 0
      ? "audit_ready"
      : "review_required"

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit si dovezi"
        description="Dovezi, mapare legala, snapshot, pack de sisteme si drift intr-o singura vedere audit-ready"
        score={cockpit.data.summary.score}
        riskLabel={cockpit.data.summary.riskLabel}
      />

      <PillarTabs sectionId="dovada" />

      <VaultRapidSummaryCard
        auditReadiness={auditReadiness}
        baselineReady={Boolean(validatedBaseline)}
        activeDrifts={activeDrifts.length}
        evidenceGaps={evidenceMissingTasks.length}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--color-on-surface)]">
            Audit Pack v2 include acum executive summary, system register, controls matrix, evidence ledger, drift register si validation log.
          </p>
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            Acum exista si o varianta client-facing, printabila, pentru stakeholderi non-tehnici. Exportul JSON ramane sursa structurata de adevar pentru schimburi tehnice.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            className="h-10 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            <a href="/api/exports/audit-pack/client" target="_blank" rel="noreferrer">
              Deschide Audit Pack client-facing
              <Download className="size-4" strokeWidth={2.25} />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <a href="/api/exports/annex-lite/client" target="_blank" rel="noreferrer">
              Deschide Annex IV lite
              <Download className="size-4" strokeWidth={2.25} />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <a href="/api/exports/audit-pack">
              Export Audit Pack JSON
              <Download className="size-4" strokeWidth={2.25} />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <a href="/api/exports/audit-pack/bundle">
              Export Audit Pack ZIP
              <Download className="size-4" strokeWidth={2.25} />
            </a>
          </Button>
        </div>
      </div>

      <VaultGuideCard />
      <VaultQuickActionsCard />

      <AICompliancePackSummaryCard pack={cockpit.data.compliancePack} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VaultMetric
          label="Dovezi atasate"
          value={evidenceReadyTasks.length}
          hint="Task-uri care au dovada atasata si au trecut verificarea prin rescan."
          tone="text-[var(--status-success-text)]"
        />
        <VaultMetric
          label="Gap-uri de dovada"
          value={evidenceMissingTasks.length}
          hint="Task-uri deschise care inca cer dovada la audit."
          tone={evidenceMissingTasks.length > 0 ? "text-[var(--color-warning)]" : "text-[var(--status-success-text)]"}
        />
        <VaultMetric
          label="Mapari legale"
          value={legalMappedTasks.length}
          hint="Task-uri legate clar de articole si obligatii."
          tone="text-[var(--color-info)]"
        />
        <VaultMetric
          label="Drift activ"
          value={activeDrifts.length}
          hint="Schimbari noi care trebuie explicate sau remediate."
          tone={activeDrifts.length > 0 ? "text-[var(--color-error)]" : "text-[var(--status-success-text)]"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        <div className="space-y-6">
          <AICompliancePackEntriesCard
            pack={cockpit.data.compliancePack}
            title="Intrări din pack folosite la audit"
            limit={6}
          />
          <EvidenceLedgerCard
            evidenceReadyTasks={evidenceReadyTasks}
            evidenceMissingTasks={evidenceMissingTasks}
          />
          <LegalMatrixCard tasks={legalMappedTasks} />
          <TraceabilityMatrixCard
            records={cockpit.data.traceabilityMatrix}
            busy={cockpit.busy}
            onReview={cockpit.updateTraceabilityReview}
            onReuseFamilyEvidence={cockpit.reuseFamilyEvidence}
          />
        </div>

        <div className="space-y-6">
          <SnapshotAuditCard latestSnapshot={latestSnapshot} validatedBaseline={validatedBaseline} />
          <DriftWatchCard drifts={activeDrifts} />
          <ValidationLedgerCard entries={validationEntries} />
          <AuditTimelineCard events={recentEvents} />
        </div>
      </div>
    </div>
  )
}

function VaultGuideCard() {
  const steps = [
    {
      title: "1. Vezi ce s-a analizat",
      detail:
        "Snapshot-ul curent iti arata sursele, sistemele si findings-urile care intra in pachetul de audit.",
    },
    {
      title: "2. Verifici dovada pentru fiecare task",
      detail:
        "Nu inchizi doar task-uri. Verifici si ce dovada trebuie pastrata pentru a sustine remedierea.",
    },
    {
      title: "3. Explici schimbarea, nu doar scorul",
      detail:
        "Daca exista drift, vezi exact ce s-a schimbat fata de baseline si de ce merita atentia auditului.",
    },
  ]

  return (
    <Card className="border-[var(--color-border)] bg-[linear-gradient(180deg,var(--bg-panel-2),var(--color-surface))]">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(400px,0.95fr)]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Audit-ready view
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-on-surface)]">
            Podul dintre tehnic, remediation si audit
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-muted)]">
            Auditor Vault nu este un nou flux separat. Este vederea in care toate sursele, articolele, dovezile si schimbarile recente se leaga intr-un loc usor de explicat intern sau extern.
          </p>
        </div>
        <div className="grid gap-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4"
            >
              <p className="text-sm font-medium text-[var(--color-on-surface)]">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function VaultQuickActionsCard() {
  const items = [
    {
      title: "Ce verifici acum",
      detail:
        "Mai intai te uiti la gap-urile de dovada, drift-ul deschis si controalele care cer confirmare manuala.",
    },
    {
      title: "Ce poti confirma aici",
      detail:
        "Confirma pe control, pe articol sau pe familie doar dupa ce ai o dovada buna si un snapshot pe care il poti sustine.",
    },
    {
      title: "Cand folosesti exportul extern",
      detail:
        "Abia dupa ce vezi green pe dovezi si nu mai ai drift blocant care opreste auditul sau baseline-ul.",
    },
  ]

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardContent className="grid gap-4 p-5 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4"
          >
            <p className="text-sm font-medium text-[var(--color-on-surface)]">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">
              {item.detail}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function VaultRapidSummaryCard({
  auditReadiness,
  baselineReady,
  activeDrifts,
  evidenceGaps,
}: {
  auditReadiness: "audit_ready" | "review_required"
  baselineReady: boolean
  activeDrifts: number
  evidenceGaps: number
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardContent className="grid gap-3 p-5 md:grid-cols-4">
        <RapidSummaryItem
          label="Audit readiness"
          value={auditReadiness === "audit_ready" ? "audit ready" : "review required"}
          tone={auditReadiness === "audit_ready" ? "text-[var(--status-success-text)]" : "text-[var(--color-warning)]"}
          hint={auditReadiness === "audit_ready" ? "Poți pregăti distribuirea externă." : "Mai sunt pași de validare înainte de audit."}
        />
        <RapidSummaryItem
          label="Baseline"
          value={baselineReady ? "validat" : "lipsește"}
          tone={baselineReady ? "text-[var(--status-success-text)]" : "text-[var(--color-warning)]"}
          hint={baselineReady ? "Comparația are punct de referință stabil." : "Confirmă un snapshot ca baseline."}
        />
        <RapidSummaryItem
          label="Drift activ"
          value={String(activeDrifts)}
          tone={activeDrifts > 0 ? "text-[var(--color-error)]" : "text-[var(--status-success-text)]"}
          hint={activeDrifts > 0 ? "Schimbări care cer explicație." : "Nu există drift deschis."}
        />
        <RapidSummaryItem
          label="Gap dovadă"
          value={String(evidenceGaps)}
          tone={evidenceGaps > 0 ? "text-[var(--color-warning)]" : "text-[var(--status-success-text)]"}
          hint={evidenceGaps > 0 ? "Controale fără dovadă validată." : "Dovezile sunt acoperite."}
        />
      </CardContent>
    </Card>
  )
}

function RapidSummaryItem({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${tone}`}>{value}</p>
      <p className="mt-2 text-xs leading-6 text-[var(--color-on-surface-muted)]">{hint}</p>
    </div>
  )
}

function VaultMetric({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: number
  hint: string
  tone: string
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardContent className="space-y-2 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{label}</p>
        <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
        <p className="text-sm leading-6 text-[var(--color-on-surface-muted)]">{hint}</p>
      </CardContent>
    </Card>
  )
}

function EvidenceLedgerCard({
  evidenceReadyTasks,
  evidenceMissingTasks,
}: {
  evidenceReadyTasks: CockpitTask[]
  evidenceMissingTasks: CockpitTask[]
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Evidence ledger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-[var(--status-success-text)]" strokeWidth={2.25} />
            <p className="text-sm font-medium text-[var(--color-on-surface)]">Dovezi deja atasate</p>
          </div>
          <div className="mt-4 space-y-3">
            {evidenceReadyTasks.length === 0 && (
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Încă nu există task-uri cu dovadă validată. Începe din Remediere, atașează o dovadă și rulează `Mark as fixed & rescan`, apoi revino aici.
              </p>
            )}
            {evidenceReadyTasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">{task.title}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {task.source} · {task.lawReference}
                    </p>
                  </div>
                  <Badge className="border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]">
                    ready
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
                  {task.attachedEvidence?.publicPath ? (
                    <a
                      href={task.attachedEvidence.publicPath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-info)] underline decoration-[color:var(--color-border)] underline-offset-4"
                    >
                      {task.attachedEvidence.fileName}
                    </a>
                  ) : (
                    task.attachedEvidence?.fileName
                  )}
                </p>
                {task.attachedEvidence && (
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Tip dovada: {formatEvidenceKind(task.attachedEvidence.kind)}
                  </p>
                )}
                {task.validationMessage && (
                  <p className="mt-2 text-xs text-[var(--color-muted)]">{task.validationMessage}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-[var(--color-warning)]" strokeWidth={2.25} />
            <p className="text-sm font-medium text-[var(--color-on-surface)]">Gap-uri de dovada</p>
          </div>
          <div className="mt-4 space-y-3">
            {evidenceMissingTasks.length === 0 && (
              <p className="text-sm text-[var(--status-success-text)]">
                Toate task-urile deschise au deja dovada atasata.
              </p>
            )}
            {evidenceMissingTasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">{task.title}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {task.source} · {task.lawReference}
                    </p>
                  </div>
                  <Badge className="border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]">
                    {task.attachedEvidence ? "validation pending" : "proof needed"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
                  {task.validationMessage || task.evidenceSnippet}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LegalMatrixCard({
  tasks,
}: {
  tasks: CockpitTask[]
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Legal mapping matrix</CardTitle>
            <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
              Pentru fiecare task vezi articolul, de ce conteaza si ce dovada trebuie tinuta.
            </p>
          </div>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <Link href="/dashboard/rapoarte">
              Inapoi la rapoarte
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {tasks.length === 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--color-on-surface-muted)]">
            Încă nu există task-uri cu mapare legală. Asta apare după ce ai findings și remedieri suficient de clare ca să fie apărate la audit.
          </div>
        )}
        {tasks.slice(0, 10).map((task) => (
          <div
            key={task.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                {task.priority}
              </Badge>
              <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-muted)]">
                {task.lawReference}
              </Badge>
            </div>
            <p className="mt-3 text-sm font-semibold text-[var(--color-on-surface)]">{task.title}</p>
            <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">{task.why}</p>
            {task.legalSummary && (
              <p className="mt-3 text-xs text-[var(--color-muted)]">{task.legalSummary}</p>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Dovada ceruta
                </p>
                <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                  {task.evidenceSnippet}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Cand revii
                </p>
                <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                  {task.rescanHint || "Dupa ce actualizezi textul sau controlul tehnic relevant."}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SnapshotAuditCard({
  latestSnapshot,
  validatedBaseline,
}: {
  latestSnapshot: CompliScanSnapshot | undefined
  validatedBaseline: CompliScanSnapshot | undefined
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Snapshot si baseline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {!latestSnapshot && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--color-on-surface-muted)]">
            Încă nu există snapshot disponibil pentru audit. Rulează o scanare sau confirmă un sistem, iar primul snapshot va apărea automat aici.
          </div>
        )}
        {latestSnapshot && (
          <>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Snapshot curent
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                {latestSnapshot.snapshotId}
              </p>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {formatRelativeRomanian(latestSnapshot.generatedAt)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniMeta label="Sources" value={latestSnapshot.sources.length} />
              <MiniMeta label="Systems" value={latestSnapshot.systems.length} />
              <MiniMeta label="Findings" value={latestSnapshot.findings.length} />
              <MiniMeta label="Compared to" value={latestSnapshot.comparedToSnapshotId ? 1 : 0} />
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Baseline validat
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                {validatedBaseline
                  ? `${validatedBaseline.snapshotId} · ${formatRelativeRomanian(validatedBaseline.generatedAt)}`
                  : "Nu exista baseline validat inca."}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function TraceabilityMatrixCard({
  records,
  busy,
  onReview,
  onReuseFamilyEvidence,
}: {
  records: ComplianceTraceRecord[]
  busy: boolean
  onReview: (input: {
    scope?: "record" | "law_reference" | "family"
    familyKey?: string
    traceId?: string
    lawReference?: string
    action: "confirm" | "clear"
    note?: string | null
  }) => Promise<unknown>
  onReuseFamilyEvidence: (familyKey: string) => Promise<unknown>
}) {
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})
  const familyGroups = buildTraceabilityFamilyGroups(records)
  const reviewGroups = buildTraceabilityReviewGroups(records)

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-primary)]">
            <ClipboardList className="size-4" strokeWidth={2.25} />
          </div>
          <div>
            <CardTitle className="text-xl">Traceability matrix</CardTitle>
            <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
              Traseul dintre sursă, finding, task, drift și snapshot pentru fiecare control urmărit la audit.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {records.length === 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--color-on-surface-muted)]">
            Încă nu există trasee complete de control pentru audit. După ce ai task-uri, dovadă și cel puțin un snapshot, matricea de trasabilitate se completează singură.
          </div>
        )}
        {familyGroups.length > 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Familie de controale
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                  Aici refolosim dovada validată și confirmăm împreună controale care au aceeași natură operațională. Scădem munca repetitivă, dar păstrăm trasabilitatea pe fiecare control.
                </p>
              </div>
              <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-muted)]">
                {familyGroups.length} familii
              </Badge>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {familyGroups.map((group) => (
                <div
                  key={group.familyKey}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                        {group.familyLabel}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {group.recordsCount} controale · {group.confirmedCount} confirmate · {group.reusableEvidenceCount} dovezi reutilizabile
                      </p>
                    </div>
                    <Badge
                      className={
                        group.pendingEvidenceCount === 0
                          ? "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
                          : "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
                      }
                    >
                      {group.pendingEvidenceCount === 0 ? "family covered" : "reuse available"}
                    </Badge>
                  </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                        {group.description}
                      </p>
                      <div className="mt-3 grid gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3 text-xs text-[var(--color-muted)]">
                        <p>
                          <span className="font-medium text-[var(--color-on-surface)]">De ce contează:</span>{" "}
                          {group.familyImpact}
                        </p>
                        <p>
                          <span className="font-medium text-[var(--color-on-surface)]">Ce dovedește:</span>{" "}
                          {group.proofSummary}
                        </p>
                        <p>
                          <span className="font-medium text-[var(--color-on-surface)]">Surse în scope:</span>{" "}
                          {group.sourceDocuments.length > 0 ? group.sourceDocuments.join(" · ") : "fără surse legate încă"}
                        </p>
                        <p>
                          <span className="font-medium text-[var(--color-on-surface)]">Presiune curentă:</span>{" "}
                          {group.findingsCount} findings · {group.driftsCount} drift
                        </p>
                      </div>
                      <p className="mt-3 text-xs leading-6 text-[var(--color-muted)]">
                        {group.reusePolicy}
                      </p>
                      <p className="mt-3 text-xs text-[var(--color-muted)]">
                        Articole: {group.lawReferences.join(" · ") || "fără articol explicit"}
                      </p>
                      {group.reusableFiles.length > 0 && (
                        <p className="mt-2 text-xs text-[var(--color-muted)]">
                          Bundle curent: {group.reusableFiles.join(" · ")}
                        </p>
                      )}
                  <textarea
                    value={draftNotes[group.familyKey] ?? group.defaultNote}
                    onChange={(event) =>
                      setDraftNotes((current) => ({
                        ...current,
                        [group.familyKey]: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] px-3 py-3 text-sm text-[var(--color-on-surface)] outline-none ring-0"
                    placeholder="Notă comună pentru această familie de controale."
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="h-8 rounded-lg bg-[var(--color-primary)] px-3 text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                      disabled={busy}
                      onClick={() =>
                        void onReview({
                          scope: "family",
                          familyKey: group.familyKey,
                          action: "confirm",
                          note: (draftNotes[group.familyKey] ?? group.defaultNote).trim() || null,
                        })
                      }
                    >
                      Confirmă familia
                    </Button>
                    {group.reusableEvidenceCount > 0 && group.pendingEvidenceCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg"
                        disabled={busy}
                        onClick={() => void onReuseFamilyEvidence(group.familyKey)}
                      >
                        Reutilizează ultima dovadă
                      </Button>
                    )}
                    {group.confirmedCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg"
                        disabled={busy}
                        onClick={() =>
                          void onReview({
                            scope: "family",
                            familyKey: group.familyKey,
                            action: "clear",
                          })
                        }
                      >
                        Elimină confirmarea
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {reviewGroups.length > 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Confirmare pe articol / control
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                  Poți confirma toate controalele legate de același articol legal dintr-o singură acțiune. Asta păstrează auditul coerent când mai multe task-uri susțin aceeași obligație.
                </p>
              </div>
              <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-muted)]">
                {reviewGroups.length} grupuri
              </Badge>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {reviewGroups.map((group) => (
                <div
                  key={group.lawReference}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                        {group.lawReference}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {group.recordsCount} controale · {group.confirmedCount} confirmate · {group.sourceCount} surse
                      </p>
                    </div>
                    <Badge className={group.confirmedCount === group.recordsCount
                      ? "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
                      : "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"}>
                      {group.confirmedCount === group.recordsCount ? "group confirmed" : "review pending"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                    {group.sampleNextStep}
                  </p>
                  <textarea
                    value={draftNotes[group.lawReference] ?? group.defaultNote}
                    onChange={(event) =>
                      setDraftNotes((current) => ({
                        ...current,
                        [group.lawReference]: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] px-3 py-3 text-sm text-[var(--color-on-surface)] outline-none ring-0"
                    placeholder="Notă comună pentru toate controalele din acest articol."
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="h-8 rounded-lg bg-[var(--color-primary)] px-3 text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                      disabled={busy}
                      onClick={() =>
                        void onReview({
                          scope: "law_reference",
                          lawReference: group.lawReference,
                          action: "confirm",
                          note: (draftNotes[group.lawReference] ?? group.defaultNote).trim() || null,
                        })
                      }
                    >
                      Confirmă grupul
                    </Button>
                    {group.confirmedCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg"
                        disabled={busy}
                        onClick={() =>
                          void onReview({
                            scope: "law_reference",
                            lawReference: group.lawReference,
                            action: "clear",
                          })
                        }
                      >
                        Elimină confirmarea
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {records.length > 3 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] px-4 py-3 text-sm text-[var(--color-on-surface-muted)]">
            Afisam primele 3 trasee de control ca sa ramana pagina usor de citit. Pentru restul, confirma mai intai pe familie sau pe articol si apoi revino pe controalele individuale.
          </div>
        )}
        {records.slice(0, 3).map((record) => (
          <div
            key={record.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                    {record.entryKind === "control_task" ? "control task" : "finding task"}
                  </Badge>
                  {record.remediationMode && (
                    <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-muted)]">
                      {record.remediationMode === "rapid" ? "rapid" : "structural"}
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--color-on-surface)]">
                  {record.title}
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {record.sourceDocuments.length > 0
                    ? record.sourceDocuments.join(" · ")
                    : "fără sursă explicită"}
                </p>
                {record.review.confirmedByUser && (
                  <p className="mt-2 text-xs text-[var(--status-success-text)]">
                    Confirmat pentru audit
                    {record.review.updatedAtISO
                      ? ` · ${new Date(record.review.updatedAtISO).toLocaleString("ro-RO")}`
                      : ""}
                  </p>
                )}
              </div>
              <Badge className={traceStatusBadgeClass(record.traceStatus)}>
                {record.traceStatus === "validated"
                  ? "validated"
                  : record.traceStatus === "evidence_required"
                    ? "evidence required"
                    : "action required"}
              </Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <TraceMiniCard
                label="Finding / drift"
                value={`${record.findingRefs.length} findings · ${record.driftRefs.length} drift`}
                hint={
                  record.lawReferences.length > 0
                    ? record.lawReferences.join(" · ")
                    : "fără referință explicită"
                }
              />
              <TraceMiniCard
                label="Snapshot"
                value={record.snapshotContext.currentSnapshotId ?? "n/a"}
                hint={
                  record.snapshotContext.validatedBaselineSnapshotId
                    ? `baseline ${record.snapshotContext.validatedBaselineSnapshotId}`
                    : "baseline lipsă"
                }
              />
              <TraceMiniCard
                label="Dovadă"
                value={record.evidence.fileName ?? "neatașată"}
                hint={
                  record.evidence.attached
                    ? `status ${record.evidence.validationStatus}`
                    : "cere dovadă pentru audit"
                }
                  />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    Coverage pe control
                  </p>
                  <Badge className={controlCoverageBadgeClass(record.bundleCoverageStatus)}>
                    {record.bundleCoverageStatus}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                  {record.evidenceRequired || "Nu există încă o cerință explicită de dovadă pentru acest control."}
                </p>
                {record.bundleFiles.length > 0 && (
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Fișiere legate: {record.bundleFiles.join(" · ")}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Referințe și surse
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                  {record.lawReferences.length > 0
                    ? record.lawReferences.join(" · ")
                    : "Fără referință legală explicită"}
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {record.sourceKinds.join(" · ") || "tip sursă neconfirmat"}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Ce urmează
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                {record.nextStep}
              </p>
              <div className="mt-4 space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Confirmare control / articol
                </p>
                <textarea
                  value={draftNotes[record.id] ?? record.review.note ?? ""}
                  onChange={(event) =>
                    setDraftNotes((current) => ({
                      ...current,
                      [record.id]: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-on-surface)] outline-none ring-0"
                  placeholder="Notează de ce acest control este acceptat sau ce a fost validat manual."
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-[var(--color-primary)] px-3 text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                    disabled={busy}
                    onClick={() =>
                      void onReview({
                        scope: "record",
                        traceId: record.id,
                        action: "confirm",
                        note: (draftNotes[record.id] ?? record.review.note ?? "").trim() || null,
                      })
                    }
                  >
                    Confirmă pentru audit
                  </Button>
                  {record.review.confirmedByUser && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg"
                      disabled={busy}
                      onClick={() =>
                        void onReview({ scope: "record", traceId: record.id, action: "clear" })
                      }
                    >
                      Elimină confirmarea
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function buildTraceabilityFamilyGroups(records: ComplianceTraceRecord[]) {
  const grouped = new Map<
    string,
    {
      familyKey: string
      familyLabel: string
      description: string
      recordsCount: number
      confirmedCount: number
      pendingEvidenceCount: number
      reusableEvidenceFiles: Set<string>
      reusePolicy: string
      lawReferences: Set<string>
      sourceDocuments: Set<string>
      findingsCount: number
      driftsCount: number
      familyImpact: string
      proofSummary: string
      defaultNote: string
    }
  >()

  for (const record of records) {
    const current = grouped.get(record.controlFamily.key) ?? {
      familyKey: record.controlFamily.key,
      familyLabel: record.controlFamily.label,
      description: record.controlFamily.description,
      recordsCount: 0,
      confirmedCount: 0,
      pendingEvidenceCount: 0,
      reusableEvidenceFiles: new Set<string>(),
      reusePolicy: getControlFamilyReusePolicySummary(record.controlFamily.key),
      lawReferences: new Set<string>(),
      sourceDocuments: new Set<string>(),
      findingsCount: 0,
      driftsCount: 0,
      familyImpact: buildFamilyImpact(record.controlFamily.key),
      proofSummary: buildFamilyProofSummary(record.controlFamily.key),
      defaultNote: `Familia ${record.controlFamily.label} a fost revizuită pe baza dovezii comune și a snapshot-ului curent.`,
    }

    current.recordsCount += 1
    current.confirmedCount += record.review.confirmedByUser ? 1 : 0
    current.findingsCount += record.linkedFindingIds.length
    current.driftsCount += record.linkedDriftIds.length
    current.pendingEvidenceCount +=
      record.evidence.attached && record.evidence.validationStatus === "passed" ? 0 : 1
    if (record.evidence.attached && record.evidence.validationStatus === "passed" && record.evidence.fileName) {
      current.reusableEvidenceFiles.add(record.evidence.fileName)
    }
    for (const lawReference of record.lawReferences) current.lawReferences.add(lawReference)
    for (const sourceDocument of record.sourceDocuments) current.sourceDocuments.add(sourceDocument)
    if (record.review.note) current.defaultNote = record.review.note
    grouped.set(record.controlFamily.key, current)
  }

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      reusableEvidenceCount: group.reusableEvidenceFiles.size,
      reusableFiles: [...group.reusableEvidenceFiles],
      lawReferences: [...group.lawReferences],
      sourceDocuments: [...group.sourceDocuments],
    }))
    .sort((left, right) => left.familyLabel.localeCompare(right.familyLabel))
}

function buildFamilyImpact(familyKey: string) {
  if (familyKey === "human-oversight") {
    return "Arată dacă sistemul poate fi oprit, revizuit sau escaladat înainte să producă efecte operaționale."
  }
  if (familyKey === "privacy-tracking") {
    return "Arată dacă profilarea, tracking-ul și suprafețele publice pot fi apărate legal și operațional."
  }
  if (familyKey === "data-residency") {
    return "Arată dacă rezidența datelor și transferurile sunt explicate clar înainte de audit."
  }
  if (familyKey === "retention-and-deletion") {
    return "Arată dacă datele personale sunt păstrate doar cât trebuie și dacă există ieșire controlată din flux."
  }
  if (familyKey === "governance-baseline") {
    return "Leagă scopul declarat, baseline-ul și asumarea operațională într-un punct defensibil."
  }
  if (familyKey === "efactura-operations") {
    return "Arată că fluxurile cu impact financiar au owner, reconciliere și dovadă operațională."
  }

  return "Această familie ține împreună controale care trebuie explicate ca un pachet, nu ca task-uri izolate."
}

function buildFamilyProofSummary(familyKey: string) {
  if (familyKey === "human-oversight") {
    return "Workflow de review, log de override și notă clară de escaladare."
  }
  if (familyKey === "privacy-tracking") {
    return "CMP activ, consent log și textul legal folosit în suprafața relevantă."
  }
  if (familyKey === "data-residency") {
    return "Regiune declarată, traseu de transfer și document tehnic de susținere."
  }
  if (familyKey === "retention-and-deletion") {
    return "Politică de retenție și dovadă de ștergere sau anonimizare."
  }
  if (familyKey === "governance-baseline") {
    return "Baseline validat, owner confirmat și decizie de review legată de snapshot."
  }
  if (familyKey === "efactura-operations") {
    return "Runbook operațional, owner financiar și exemplu de reconciliere."
  }

  return "O combinație de dovadă operațională, referință legală și confirmare de audit."
}

function buildTraceabilityReviewGroups(records: ComplianceTraceRecord[]) {
  const grouped = new Map<
    string,
    {
      lawReference: string
      recordsCount: number
      confirmedCount: number
      sourceDocuments: Set<string>
      sampleNextStep: string
      defaultNote: string
    }
  >()

  for (const record of records) {
    for (const lawReference of record.lawReferences) {
      const current = grouped.get(lawReference)
      const defaultNote = record.review.confirmedByUser
        ? record.review.note ?? ""
        : `Control validat în contextul ${lawReference} pe baza dovezilor și a snapshot-ului curent.`

      if (!current) {
        grouped.set(lawReference, {
          lawReference,
          recordsCount: 1,
          confirmedCount: record.review.confirmedByUser ? 1 : 0,
          sourceDocuments: new Set(record.sourceDocuments),
          sampleNextStep: record.nextStep,
          defaultNote,
        })
        continue
      }

      current.recordsCount += 1
      current.confirmedCount += record.review.confirmedByUser ? 1 : 0
      for (const sourceDocument of record.sourceDocuments) {
        current.sourceDocuments.add(sourceDocument)
      }
      if (current.sampleNextStep.length < record.nextStep.length) {
        current.sampleNextStep = record.nextStep
      }
      if (!current.defaultNote && defaultNote) {
        current.defaultNote = defaultNote
      }
    }
  }

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      sourceCount: group.sourceDocuments.size,
    }))
    .sort((left, right) => left.lawReference.localeCompare(right.lawReference))
}

function TraceMiniCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">{value}</p>
      <p className="mt-2 text-xs text-[var(--color-muted)]">{hint}</p>
    </div>
  )
}

function DriftWatchCard({
  drifts,
}: {
  drifts: ComplianceDriftRecord[]
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Drift watch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {drifts.length === 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--status-success-text)]">
            Nu exista drift activ fata de baseline sau snapshot-ul comparat. Dacă vrei un control mai curat pe viitor, validează baseline-ul după următorul review stabil.
          </div>
        )}
        {drifts.slice(0, 6).map((drift) => (
          (() => {
            const guidance = getDriftPolicyFromRecord(drift)
            const breached = isDriftSlaBreached(drift)

            return (
              <div
                key={drift.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-on-surface)]">
                      {drift.summary}
                    </p>
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      {formatDriftTypeLabel(drift.type)} · {formatRelativeRomanian(drift.detectedAtISO)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                      {guidance.impactSummary}
                    </p>
                  </div>
                  <Badge
                    className={
                      drift.severity === "critical" || drift.severity === "high"
                        ? "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
                        : drift.severity === "medium"
                          ? "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
                          : "border-[var(--color-border)] bg-transparent text-[var(--color-muted)]"
                    }
                  >
                    {drift.severity}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                    {formatDriftLifecycleStatus(drift.lifecycleStatus ?? "open")}
                  </Badge>
                  {breached && (
                    <Badge className="border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]">
                      SLA depășit
                    </Badge>
                  )}
                  {drift.requiresHumanApproval && (
                    <Badge className="border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]">
                      cere aprobare umană
                    </Badge>
                  )}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      De ce conteaza
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                      {guidance.lawReference}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {guidance.severityReason}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Ce faci acum
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                      {guidance.nextAction}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Dovada
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                      {guidance.evidenceRequired}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Escalare
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                      {drift.escalationOwner || guidance.ownerSuggestion}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {formatDriftEscalationTier(drift.escalationTier || guidance.escalationTier)} · până la{" "}
                      {formatDriftEscalationDeadline(
                        drift.escalationDueAtISO || guidance.escalationDueAtISO
                      )}
                    </p>
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      {[
                        drift.blocksAudit ? "blochează auditul" : null,
                        drift.blocksBaseline ? "blochează baseline-ul" : null,
                        drift.requiresHumanApproval ? "cere aprobare umană" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "review operațional recomandat"}
                    </p>
                    {(drift.acknowledgedBy || drift.lastStatusUpdatedAtISO) && (
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {drift.acknowledgedBy ? `Owner: ${drift.acknowledgedBy}` : "Ultima actualizare"} ·{" "}
                        {formatRelativeRomanian(
                          drift.lastStatusUpdatedAtISO || drift.acknowledgedAtISO || drift.detectedAtISO
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })()
        ))}
      </CardContent>
    </Card>
  )
}

type ValidationEntry = {
  taskId: string
  taskTitle: string
  status: CockpitTask["validationStatus"]
  validatedAtISO?: string
  evidence?: string
  message?: string
  checkedSource?: string
  lawReference: string
}

function ValidationLedgerCard({
  entries,
}: {
  entries: ValidationEntry[]
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Validation ledger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {entries.length === 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--color-on-surface-muted)]">
            Încă nu există dovadă plus verificare salvate pentru task-uri. Zona asta începe să se populeze după primul ciclu complet: atașezi dovada, rulezi rescan și apoi primești validarea.
          </div>
        )}
        {entries.slice(0, 8).map((entry) => (
          <div
            key={entry.taskId}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-on-surface)]">
                  {entry.taskTitle}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {entry.lawReference}
                  {entry.checkedSource ? ` · sursă verificată: ${entry.checkedSource}` : ""}
                </p>
              </div>
              <Badge className={validationBadgeClass(entry.status)}>
                {entry.status === "passed"
                  ? "validated"
                  : entry.status === "failed"
                    ? "failed"
                    : "needs review"}
              </Badge>
            </div>
            {entry.message && (
              <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">{entry.message}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
              {entry.evidence && <span>Dovadă: {entry.evidence}</span>}
              {entry.validatedAtISO && (
                <span>Ultima verificare: {formatRelativeRomanian(entry.validatedAtISO)}</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function AuditTimelineCard({
  events,
}: {
  events: ComplianceEvent[]
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Audit timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {events.length === 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--color-on-surface-muted)]">
            Nu exista evenimente de audit inca. Primul review, primul rescan sau prima confirmare va deschide automat jurnalul de audit.
          </div>
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface)]">
                <EventIcon type={event.type} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">
                    {event.message}
                  </p>
                  <Badge className={eventBadgeClass(event.type)}>
                    {formatEventLabel(event.type)}
                  </Badge>
                </div>
                {event.metadata?.validationMessage && (
                  <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                    {String(event.metadata.validationMessage)}
                  </p>
                )}
                {(event.metadata?.fileName || event.metadata?.checkedSource) && (
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {event.metadata?.fileName ? `Dovadă: ${String(event.metadata.fileName)}` : ""}
                    {event.metadata?.fileName && event.metadata?.checkedSource ? " · " : ""}
                    {event.metadata?.checkedSource
                      ? `Sursă verificată: ${String(event.metadata.checkedSource)}`
                      : ""}
                  </p>
                )}
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {event.entityType} · {formatRelativeRomanian(event.createdAtISO)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function MiniMeta({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">{value}</p>
    </div>
  )
}

function buildValidationEntries(
  tasks: CockpitTask[],
  taskState: Record<string, PersistedTaskState>,
  events: ComplianceEvent[]
): ValidationEntry[] {
  return tasks
    .filter((task) => {
      const persisted = taskState[task.id]
      return Boolean(task.attachedEvidence || persisted?.validatedAtISO)
    })
    .map((task) => {
      const persisted = taskState[task.id]
      const latestValidationEvent = events.find(
        (event) => event.entityType === "task" && event.entityId === task.id && event.type === "task.validated"
      )

      return {
        taskId: task.id,
        taskTitle: task.title,
        status: (
          task.validationStatus === "idle"
            ? task.attachedEvidence
              ? "needs_review"
              : "idle"
            : task.validationStatus
        ) as ValidationEntry["status"],
        validatedAtISO: persisted?.validatedAtISO,
        evidence: task.attachedEvidence?.fileName,
        message:
          task.validationMessage ||
          (latestValidationEvent?.metadata?.validationMessage
            ? String(latestValidationEvent.metadata.validationMessage)
            : undefined),
        checkedSource: latestValidationEvent?.metadata?.checkedSource
          ? String(latestValidationEvent.metadata.checkedSource)
          : undefined,
        lawReference: task.lawReference,
      }
    })
    .filter((entry) => entry.status !== "idle")
    .sort((left, right) => {
      const leftTs = left.validatedAtISO ? new Date(left.validatedAtISO).getTime() : 0
      const rightTs = right.validatedAtISO ? new Date(right.validatedAtISO).getTime() : 0
      return rightTs - leftTs
    })
}

function validationBadgeClass(status: ValidationEntry["status"]) {
  if (status === "passed") {
    return "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
  }
  if (status === "failed") {
    return "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
  }
  return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
}

function traceStatusBadgeClass(status: ComplianceTraceRecord["traceStatus"]) {
  if (status === "validated") {
    return "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
  }
  if (status === "evidence_required") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }
  return "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
}

function controlCoverageBadgeClass(status: ComplianceTraceRecord["bundleCoverageStatus"]) {
  if (status === "covered") {
    return "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
  }
  if (status === "partial") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }
  return "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
}

function formatEventLabel(type: string) {
  if (type === "task.validated") return "validation"
  if (type === "task.evidence-attached") return "evidence"
  if (type === "alert.auto-resolved") return "auto-resolved"
  if (type === "alert.reopened") return "reopened"
  return type.replaceAll(".", " ")
}

function eventBadgeClass(type: string) {
  if (type === "task.validated") {
    return "border-[var(--color-info)] bg-[var(--color-info-muted)] text-[var(--color-info)]"
  }
  if (type === "task.evidence-attached") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }
  if (type === "alert.auto-resolved") {
    return "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
  }
  if (type === "alert.reopened") {
    return "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
  }
  return "border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]"
}

function EventIcon({ type }: { type: string }) {
  if (type === "task.validated") {
    return <RefreshCcw className="size-4" strokeWidth={2.25} />
  }
  if (type === "task.evidence-attached") {
    return <Paperclip className="size-4" strokeWidth={2.25} />
  }
  if (type === "alert.auto-resolved") {
    return <CheckCircle2 className="size-4" strokeWidth={2.25} />
  }
  return <FolderKanban className="size-4" strokeWidth={2.25} />
}

function formatEvidenceKind(kind: string) {
  if (kind === "screenshot") return "Screenshot"
  if (kind === "policy_text") return "Policy text"
  if (kind === "log_export") return "Log export"
  if (kind === "yaml_evidence") return "YAML evidence"
  if (kind === "document_bundle") return "Document bundle"
  return "Other"
}
