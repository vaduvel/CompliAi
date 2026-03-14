"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  ClipboardList,
  FileCode2,
  FileSearch,
} from "lucide-react"

import { EmptyState } from "@/components/evidence-os/EmptyState"
import { LifecycleBadge } from "@/components/evidence-os/LifecycleBadge"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { ExportCenter } from "@/components/compliscan/export-center"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { LoadingScreen, PageHeader } from "@/components/compliscan/route-sections"
import type { TaskPriority } from "@/components/compliscan/types"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import type { ComplianceDriftRecord } from "@/lib/compliance/types"
import {
  formatDriftEscalationDeadline,
  formatDriftEscalationTier,
  formatDriftTypeLabel,
  getDriftPolicyFromRecord,
} from "@/lib/compliance/drift-policy"
import { isDriftSlaBreached } from "@/lib/compliance/drift-lifecycle"
import { formatRelativeRomanian } from "@/lib/compliance/engine"

type TaskFilter = "ALL" | TaskPriority | "DONE" | "RAPID" | "STRUCTURAL"

export default function AuditExportPage() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL")
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const latestSnapshot = cockpit.data.state.snapshotHistory[0]
  const validatedBaseline = cockpit.data.state.snapshotHistory.find(
    (snapshot) => snapshot.snapshotId === cockpit.data?.state.validatedBaselineSnapshotId
  )
  const openTasks = cockpit.tasks.filter((task) => task.status !== "done")
  const doneTasks = cockpit.tasks.filter((task) => task.status === "done")
  const activeDrifts = cockpit.activeDrifts

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit si export"
        description="Snapshot exportabil, baseline pentru drift si remediere gata de livrat"
        score={cockpit.data.summary.score}
        riskLabel={cockpit.data.summary.riskLabel}
      />

      <PillarTabs sectionId="dovada" />

      <ReportsGuideCard />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <ReportsStatusGrid
            openTasks={openTasks.length}
            doneTasks={doneTasks.length}
            activeDrifts={activeDrifts.length}
            hasBaseline={Boolean(validatedBaseline)}
          />

          <RemediationBoard
            tasks={cockpit.tasks}
            activeFilter={taskFilter}
            highlightedTaskId={highlightedTaskId}
            onFilterChange={setTaskFilter}
            onMarkDone={(taskId) => {
              setHighlightedTaskId(taskId)
              cockpitActions.handleMarkDone(taskId)
            }}
            onAttachEvidence={cockpitActions.attachEvidence}
            onExport={cockpitActions.handleTaskExport}
          />
        </div>

        <div className="space-y-6">
          <SnapshotStatusCard
            latestSnapshot={latestSnapshot}
            validatedBaseline={validatedBaseline}
            driftCount={activeDrifts.length}
          />

          <ExportCenter
            onGeneratePdf={() => void cockpitActions.handleGenerateReport()}
            onGenerateAuditPack={() => void cockpitActions.handleGenerateAuditPack()}
            onGenerateAuditBundle={() => void cockpitActions.handleGenerateAuditBundle()}
            onGenerateAnnexLite={() => void cockpitActions.handleGenerateAnnexLite()}
            onExportChecklist={() => void cockpitActions.handleChecklistExport()}
            onExportCompliScanJson={() => void cockpitActions.handleExportCompliScanJson()}
            onExportCompliScanYaml={() => void cockpitActions.handleExportCompliScanYaml()}
            onShare={() => void cockpitActions.handleShareWithAccountant()}
          />

          <ExportArtifactsCard />

          <RecentDriftCard drifts={activeDrifts} />
        </div>
      </div>

    </div>
  )
}

function ReportsGuideCard() {
  const steps = [
    {
      title: "1. Validezi task-urile critice",
      detail:
        "Remedierea rămâne sursa de lucru. Atașezi dovada direct din card și folosești Mark as fixed & rescan ca să închizi task-ul pe bune.",
    },
    {
      title: "2. Verifici snapshot-ul și baseline-ul",
      detail:
        "Înainte de export, te uiți dacă snapshot-ul curent este valid și dacă drift-ul e comparat cu baseline-ul potrivit.",
    },
    {
      title: "3. Exporți artefactul potrivit",
      detail:
        "PDF pentru stakeholderi, checklist pentru execuție, iar compliscan.json/yaml pentru sursa de adevăr și workflow-uri viitoare.",
    },
  ]

  return (
    <Card className="border-[var(--color-border)] bg-[linear-gradient(180deg,var(--bg-panel-2),var(--color-surface))]">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Flux de export
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-on-surface)]">
            Audit si export, snapshot si dovada intr-un singur loc
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-muted)]">
            Pagina asta leagă remedierea de export. Nu doar generezi un fișier, ci verifici ce intră în snapshot, față de ce baseline compari și ce drift este inclus în livrabil.
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

function ReportsStatusGrid({
  openTasks,
  doneTasks,
  activeDrifts,
  hasBaseline,
}: {
  openTasks: number
  doneTasks: number
  activeDrifts: number
  hasBaseline: boolean
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Ce intră în livrabil</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <StatusTile
          label="Task-uri deschise"
          value={openTasks}
          tone="text-[var(--color-warning)]"
          hint="Încă afectează riscul și recomandările."
        />
        <StatusTile
          label="Task-uri închise"
          value={doneTasks}
          tone="text-[var(--status-success-text)]"
          hint="Au dovadă sau au fost marcate ca rezolvate."
        />
        <StatusTile
          label="Drift activ"
          value={activeDrifts}
          tone={
            activeDrifts > 0 ? "text-[var(--color-error)]" : "text-[var(--status-success-text)]"
          }
          hint="Va apărea și în snapshot dacă există."
        />
        <StatusTile
          label="Baseline validat"
          value={hasBaseline ? 1 : 0}
          tone={hasBaseline ? "text-[var(--color-info)]" : "text-[var(--color-muted)]"}
          hint={hasBaseline ? "Comparăm cu baseline-ul salvat." : "Comparăm doar cu ultimul snapshot."}
        />
      </CardContent>
    </Card>
  )
}

function SnapshotStatusCard({
  latestSnapshot,
  validatedBaseline,
  driftCount,
}: {
  latestSnapshot:
    | {
        snapshotId: string
        generatedAt: string
        comparedToSnapshotId: string | null
        sources: unknown[]
        systems: unknown[]
        findings: unknown[]
      }
    | undefined
  validatedBaseline:
    | {
        snapshotId: string
        generatedAt: string
      }
    | undefined
  driftCount: number
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">Snapshot curent</CardTitle>
            <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
              Exporturile `compliscan.json` și `compliscan.yaml` pornesc de aici.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="h-10 rounded-xl">
              <Link href="/dashboard/rapoarte/auditor-vault">
                Auditor Vault
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-xl">
              <Link href="/dashboard/setari">
                Baseline
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {!latestSnapshot && (
          <ReportsEmptyState
            title="Nu exista inca snapshot"
            description="Ruleaza mai intai un scan real sau autodiscovery din manifest, apoi revino aici pentru export si baseline."
          />
        )}

        {latestSnapshot && (
          <>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Generat
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                {new Date(latestSnapshot.generatedAt).toLocaleString("ro-RO")}
              </p>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {formatRelativeRomanian(latestSnapshot.generatedAt)} · {latestSnapshot.snapshotId}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SnapshotMeta label="Surse" value={latestSnapshot.sources.length} />
              <SnapshotMeta label="Sisteme" value={latestSnapshot.systems.length} />
              <SnapshotMeta label="Finding-uri" value={latestSnapshot.findings.length} />
              <SnapshotMeta label="Drift inclus" value={driftCount} />
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  comparat cu
                </Badge>
                <span className="text-sm text-[var(--color-on-surface)]">
                  {latestSnapshot.comparedToSnapshotId || "fără comparație"}
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
                {validatedBaseline
                  ? `Baseline validat activ: ${validatedBaseline.snapshotId}`
                  : "Nu există baseline validat. Snapshot-ul compară cu ultimul snapshot disponibil."}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ReportsEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return <EmptyState title={title} label={description} className="rounded-2xl" />
}

function ExportArtifactsCard() {
  const artifacts = [
    {
      icon: FileSearch,
      title: "Audit Pack PDF",
      detail:
        "Dosar executiv pentru client: sumar, blocaje, sisteme, controale, dovezi, drift si jurnal de validare intr-un format printabil.",
    },
    {
      icon: FileSearch,
      title: "Audit Pack ZIP",
      detail:
        "Pachet complet cu varianta pentru client, JSON-urile structurale, traceability matrix si dovezile agregate disponibile din workspace.",
    },
    {
      icon: FileSearch,
      title: "Raport PDF",
      detail:
        "Rezumat pentru stakeholderi: scor, alerte, progres și remediere într-un format ușor de distribuit.",
    },
    {
      icon: FileCode2,
      title: "compliscan.json / yaml",
      detail:
        "Snapshot structurat cu surse, sisteme, findings, drift si sumar. Devine sursa tehnica de adevar pentru comparatii viitoare.",
    },
    {
      icon: ClipboardList,
      title: "Checklist execuție",
      detail:
        "Listă practică pentru închiderea task-urilor și pentru dovezile pe care trebuie să le aduni.",
    },
  ]

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Ce exportă fiecare artefact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {artifacts.map((artifact) => (
          <div
            key={artifact.title}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface)]">
                <artifact.icon className="size-4" strokeWidth={2.25} />
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--color-on-surface)]">
                  {artifact.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                  {artifact.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RecentDriftCard({
  drifts,
}: {
  drifts: ComplianceDriftRecord[]
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Drift inclus în snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {drifts.length === 0 && (
          <ReportsEmptyState
            title="Nu exista drift activ"
            description="Snapshot-ul va iesi curat din acest punct de vedere."
          />
        )}
        {drifts.map((drift) => (
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
                  <SeverityBadge severity={drift.severity} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <LifecycleBadge state={(drift.lifecycleStatus ?? "open") as "open" | "acknowledged" | "in_progress" | "resolved" | "waived"} />
                  {breached && (
                    <Badge variant="destructive">
                      SLA depășit
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

function StatusTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string
  value: number
  tone: string
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">{hint}</p>
    </div>
  )
}

function SnapshotMeta({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">{value}</p>
    </div>
  )
}
