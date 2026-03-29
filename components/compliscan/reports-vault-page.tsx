"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useRef } from "react"
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FolderKanban,
  Paperclip,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react"

import { EmptyState } from "@/components/evidence-os/EmptyState"
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/evidence-os/Table"
import { LifecycleBadge } from "@/components/evidence-os/LifecycleBadge"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { Badge } from "@/components/evidence-os/Badge"
import { ActionCluster } from "@/components/evidence-os/ActionCluster"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import type { CockpitTask } from "@/components/compliscan/types"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { resolveEvidenceHref } from "@/lib/compliance/evidence-links"
import { getTaskStateByTaskId } from "@/lib/compliance/task-ids"
import type { CompliScanSnapshot } from "@/lib/compliscan/schema"
import {
  formatDriftEscalationDeadline,
  formatDriftEscalationTier,
  formatDriftTypeLabel,
  getDriftPolicyFromRecord,
} from "@/lib/compliance/drift-policy"
import { isDriftSlaBreached } from "@/lib/compliance/drift-lifecycle"
import type {
  ComplianceDriftRecord,
  ComplianceEvent,
  EvidenceRegistryEntry,
  PersistedTaskState,
} from "@/lib/compliance/types"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { formatRelativeRomanian } from "@/lib/compliance/engine"

const TraceabilityMatrixCard = dynamic(
  () =>
    import("@/components/compliscan/traceability-matrix-card").then(
      (mod) => mod.TraceabilityMatrixCard
    ),
  {
    ssr: false,
    loading: () => (
      <SectionLoadingCard
        title="Traceability in incarcare"
        detail="Matricea de trasabilitate se incarca in fundal."
      />
    ),
  }
)

const AICompliancePackSummaryCard = dynamic(
  () =>
    import("@/components/compliscan/ai-compliance-pack-card").then(
      (mod) => mod.AICompliancePackSummaryCard
    ),
  {
    loading: () => (
      <SectionLoadingCard
        title="Compliance Pack in incarcare"
        detail="Sumarul pack-ului se incarca in fundal."
      />
    ),
  }
)

const AICompliancePackEntriesCard = dynamic(
  () =>
    import("@/components/compliscan/ai-compliance-pack-card").then(
      (mod) => mod.AICompliancePackEntriesCard
    ),
  {
    loading: () => (
      <SectionLoadingCard
        title="Intrari pack in incarcare"
        detail="Intrarile detaliate pentru audit se incarca in fundal."
      />
    ),
  }
)

export function ReportsVaultPageSurface() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const heavyPayloadRequested = useRef(false)

  const needsCompliancePack = Boolean(cockpit.data && !cockpit.data.compliancePack)
  const needsTraceability = Boolean(cockpit.data && !cockpit.data.traceabilityMatrix)
  const needsHeavyPayload = needsCompliancePack || needsTraceability

  useEffect(() => {
    if (needsHeavyPayload && !heavyPayloadRequested.current) {
      heavyPayloadRequested.current = true
      void cockpitActions.ensureHeavyPayload()
    }
  }, [needsHeavyPayload, cockpitActions])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

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
  const evidenceLedger = cockpit.data.evidenceLedger ?? []
  const ledgerReadyCount = evidenceLedger.filter((entry) => entry.quality?.status === "sufficient").length
  const savedEvidenceCount = evidenceLedger.length > 0 ? evidenceLedger.length : evidenceReadyTasks.length
  const blockers = [
    !validatedBaseline
      ? "Nu ai încă un baseline validat pentru comparația de audit."
      : null,
    evidenceMissingTasks.length > 0
      ? `${evidenceMissingTasks.length} controale au încă gap-uri de dovadă sau validare.`
      : null,
    activeDrifts.length > 0
      ? `${activeDrifts.length} drift-uri deschise pot bloca susținerea pachetului.`
      : null,
  ].filter(Boolean) as string[]
  const summaryItems: SummaryStripItem[] = [
    {
      label: "Dovezi valide",
      value: `${savedEvidenceCount}`,
      hint:
        savedEvidenceCount > 0
          ? `${ledgerReadyCount} confirmate în registru sau în task-uri`
          : "încă nu ai dovadă validată în pachet",
      tone: savedEvidenceCount > 0 ? "success" : "warning",
    },
    {
      label: "Gap-uri active",
      value: `${evidenceMissingTasks.length}`,
      hint:
        evidenceMissingTasks.length > 0
          ? "controale fără dovadă sau validare completă"
          : "dovezile esențiale sunt acoperite",
      tone: evidenceMissingTasks.length > 0 ? "warning" : "success",
    },
    {
      label: "Drift deschis",
      value: `${activeDrifts.length}`,
      hint:
        activeDrifts.length > 0
          ? "schimbări care cer explicație sau revenire în execuție"
          : "nu există drift deschis",
      tone: activeDrifts.length > 0 ? "danger" : "success",
    },
  ]

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Dovada / Vault"
        title="Verifici dacă pachetul chiar se susține"
        description="Aici vezi doar dacă pachetul este gata, ce îl blochează și unde revii dacă încă lipsește ceva."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              vault overview
            </Badge>
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Stare pachet
            </p>
            <p className="text-2xl font-semibold text-eos-text">
              {auditReadiness === "audit_ready" ? "gata" : "în lucru"}
            </p>
            <p className="text-sm text-eos-text-muted">
              drift {activeDrifts.length} · gap dovezi {evidenceMissingTasks.length}
            </p>
          </div>
        }
        actions={
          <>
            <Button asChild>
              <Link href={dashboardRoutes.resolve}>
                Rezolvă gap-urile
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={dashboardRoutes.reports}>
                Deschide Audit Pack
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </>
        }
      />
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Vault"
            title="Ce susții acum în audit"
            description="Doar trei semnale: dovezi valide, gap-uri active și drift deschis."
            items={summaryItems}
          />
        </CardContent>
      </Card>

      <Card className="border-eos-border bg-eos-surface">
        <CardHeader className="border-b border-eos-border pb-4">
          <CardTitle className="text-base">Ce blochează pachetul acum</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {blockers.length === 0 ? (
            <EmptyState
              title="Pachetul stă în picioare"
              label="Ai baseline validat, nu ai drift deschis și nu mai există gap-uri critice de dovadă pe overview."
              className="border-eos-border bg-eos-surface-variant py-8"
            />
          ) : (
            <div className="space-y-3">
              {blockers.map((blocker) => (
                <div
                  key={blocker}
                  className="rounded-eos-md border border-eos-warning-border bg-eos-warning-soft px-4 py-3 text-sm text-eos-text"
                >
                  {blocker}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <details className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
          Dovezi & gap-uri
        </summary>
        <div className="mt-4">
          <EvidenceLedgerCard
            evidenceLedger={evidenceLedger}
            evidenceReadyTasks={evidenceReadyTasks}
            evidenceMissingTasks={evidenceMissingTasks}
            allTasks={cockpit.tasks}
          />
        </div>
      </details>

      <details className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
          Pachete & export
        </summary>
        <div className="mt-4 space-y-6">
          <ActionCluster
            eyebrow="Export"
            title="Audit Pack pentru stakeholderi"
            description="Overview-ul păstrează un singur loc pentru pack; exportul tehnic rămâne dedesubt."
            actions={
              <>
                <Button
                  asChild
                  size="default"
                  className="gap-2 bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
                >
                  <a href="/api/exports/audit-pack/client" target="_blank" rel="noreferrer">
                    Audit Pack client
                    <Download className="size-4" strokeWidth={2} />
                  </a>
                </Button>
                <details className="rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-xs text-eos-text-muted">
                  <summary className="cursor-pointer list-none text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                    Export tehnic
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <a href="/api/exports/audit-pack">
                        JSON Audit Pack
                        <Download className="size-3.5" strokeWidth={2} />
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <a href="/api/exports/audit-pack/bundle">
                        Pachet ZIP
                        <Download className="size-3.5" strokeWidth={2} />
                      </a>
                    </Button>
                  </div>
                </details>
              </>
            }
          />

          {cockpit.data.compliancePack ? (
            <>
              <AICompliancePackSummaryCard pack={cockpit.data.compliancePack} />
              <AICompliancePackEntriesCard
                pack={cockpit.data.compliancePack}
                title="Intrări din pack folosite la audit"
                limit={6}
              />
            </>
          ) : (
            <SectionLoadingCard
              title="Compliance Pack in incarcare"
              detail="Pachetul complet de control este cerut in fundal si va aparea aici imediat ce este disponibil."
            />
          )}
        </div>
      </details>

      <details className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
          Trasabilitate & audit
        </summary>
        <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
          <div className="space-y-6">
            <LegalMatrixCard tasks={legalMappedTasks} />
            {cockpit.data.traceabilityMatrix ? (
              <TraceabilityMatrixCard
                records={cockpit.data.traceabilityMatrix}
                busy={cockpit.busy}
                onReview={cockpitActions.updateTraceabilityReview}
                onReuseFamilyEvidence={cockpitActions.reuseFamilyEvidence}
              />
            ) : (
              <SectionLoadingCard
                title="Traceability in incarcare"
                detail="Matricea de trasabilitate se incarca separat, fara sa blocheze vault-ul."
              />
            )}
          </div>
          <div className="space-y-6">
            <SnapshotAuditCard latestSnapshot={latestSnapshot} validatedBaseline={validatedBaseline} />
            <DriftWatchCard drifts={activeDrifts} />
            <ValidationLedgerCard entries={validationEntries} />
            <AuditTimelineCard events={recentEvents} />
          </div>
        </div>
      </details>
    </div>
  )
}

function EvidenceLedgerCard({
  evidenceLedger,
  evidenceReadyTasks,
  evidenceMissingTasks,
  allTasks,
}: {
  evidenceLedger: EvidenceRegistryEntry[]
  evidenceReadyTasks: CockpitTask[]
  evidenceMissingTasks: CockpitTask[]
  allTasks: CockpitTask[]
}) {
  const taskById = new Map(allTasks.map((task) => [task.id, task] as const))
  const hasLedger = evidenceLedger.length > 0
  const ledgerEntries = hasLedger ? evidenceLedger.slice(0, 6) : []

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-base">Registru dovezi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
          <div className="flex items-center gap-2">
            <Paperclip className="size-4 text-eos-info" strokeWidth={2} />
            <p className="text-sm font-medium text-eos-text">Dovezi in registru</p>
          </div>
          <p className="mt-2 text-xs text-eos-text-muted">
            Registrul vine din storage cand este disponibil. Daca nu este conectat, vezi dovada validata din task-uri.
          </p>
          <div className="mt-4">
            {hasLedger ? (
              <Table density="compact" stickyHeader={ledgerEntries.length > 6}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dovadă</TableHead>
                    <TableHead>Fișier</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Calitate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.length === 0 ? (
                    <TableEmpty colSpan={4}>Nicio dovadă în registru</TableEmpty>
                  ) : (
                    ledgerEntries.map((entry) => {
                      const task = entry.taskId ? taskById.get(entry.taskId) : null
                      const evidenceHref = resolveEvidenceHref(entry)
                      const qualityStatus = entry.quality?.status
                      const qualityLabel =
                        qualityStatus === "sufficient"
                          ? "verificata"
                          : qualityStatus === "weak"
                            ? "slaba"
                            : "neevaluata"
                      const qualityVariant =
                        qualityStatus === "sufficient"
                          ? "success"
                          : qualityStatus === "weak"
                            ? "warning"
                            : "secondary"

                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="max-w-[220px]">
                            <p className="truncate text-sm font-medium text-eos-text">
                              {task?.title ?? entry.fileName}
                            </p>
                            {task && (
                              <p className="truncate text-xs text-eos-text-tertiary">
                                {task.source} · {task.lawReference || "fara referinta"}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[180px]">
                            {evidenceHref ? (
                              <a
                                href={evidenceHref}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate text-xs text-eos-text-link underline-offset-4 hover:underline"
                              >
                                {entry.fileName}
                              </a>
                            ) : (
                              <span className="truncate text-xs text-eos-text-muted">{entry.fileName}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-eos-text-muted">{formatEvidenceKind(entry.kind)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={qualityVariant}>{qualityLabel}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            ) : (
              <>
                {evidenceReadyTasks.length === 0 && (
                  <EmptyState
                    title="Nu există încă dovezi validate"
                    label="Incepe din Remediere, ataseaza o dovada si ruleaza `Mark as fixed & rescan`, apoi revino aici."
                    className="rounded-eos-md py-8"
                  />
                )}
                {evidenceReadyTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-eos-md border border-eos-border bg-eos-surface p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-eos-text">{task.title}</p>
                        <p className="mt-1 text-xs text-eos-text-muted">
                          {task.source} · {task.lawReference}
                        </p>
                      </div>
                      <Badge variant="success">pregatit</Badge>
                    </div>
                    <p className="mt-3 text-sm text-eos-text-muted">
                      {(() => {
                        const evidenceHref = resolveEvidenceHref(task.attachedEvidence)
                        if (evidenceHref && task.attachedEvidence) {
                          return (
                            <a
                              href={evidenceHref}
                              target="_blank"
                              rel="noreferrer"
                              className="text-eos-info underline decoration-eos-border underline-offset-4"
                            >
                              {task.attachedEvidence.fileName}
                            </a>
                          )
                        }

                        return task.attachedEvidence?.fileName ?? null
                      })()}
                    </p>
                    {task.attachedEvidence && (
                      <p className="mt-2 text-xs text-eos-text-muted">
                        Tip dovada: {formatEvidenceKind(task.attachedEvidence.kind)}
                      </p>
                    )}
                    {task.validationMessage && (
                      <details className="mt-3 rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                        <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                          Detaliu validare
                        </summary>
                        <p className="mt-2 text-xs text-eos-text-muted">{task.validationMessage}</p>
                      </details>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-eos-warning" strokeWidth={2} />
            <p className="text-sm font-medium text-eos-text">Gap-uri de dovada</p>
          </div>
          <div className="mt-4 space-y-3">
            {evidenceMissingTasks.length === 0 && (
              <EmptyState
                title="Nu există gap-uri de dovadă"
                label="Toate task-urile deschise au deja dovada atasata sau validata in ultimul ciclu."
                className="rounded-eos-md py-8"
              />
            )}
            {evidenceMissingTasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="rounded-eos-md border border-eos-border bg-eos-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-eos-text">{task.title}</p>
                    <p className="mt-1 text-xs text-eos-text-muted">
                      {task.source} · {task.lawReference}
                    </p>
                  </div>
                  <Badge variant="warning">
                    {task.attachedEvidence ? "validare in asteptare" : "dovada necesara"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-eos-text-muted">
                  {task.validationMessage || task.evidenceSnippet}
                </p>
                {task.validationMessage && task.evidenceSnippet && task.validationMessage !== task.evidenceSnippet && (
                  <details className="mt-3 rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                      Dovada asteptata
                    </summary>
                    <p className="mt-2 text-xs text-eos-text-muted">{task.evidenceSnippet}</p>
                  </details>
                )}
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
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Matrice de mapare legala</CardTitle>
            <p className="mt-1 text-sm text-eos-text-muted">
              Vezi articolul relevant, dovada ceruta si momentul in care revii in executie.
            </p>
          </div>
          <Button asChild variant="outline" size="default" className="gap-2">
            <Link href={dashboardRoutes.reports}>
              Inapoi la rapoarte
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {tasks.length === 0 && (
          <VaultEmptyState
            title="Nu există încă mapare legală"
            description="Zona asta apare dupa ce findings-urile si remedierea au suficient context ca sa fie aparate in audit."
          />
        )}
        {tasks.slice(0, 10).map((task) => (
          <div
            key={task.id}
            className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {task.priority}
              </Badge>
              <Badge className="border-eos-border bg-transparent text-eos-text-muted">
                {task.lawReference}
              </Badge>
            </div>
            <p className="mt-3 text-sm font-semibold text-eos-text">{task.title}</p>
            <p className="mt-2 text-sm text-eos-text-muted">{task.why}</p>
            <details className="mt-4 rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
              <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                Dovada si urmatorul pas
              </summary>
              {task.legalSummary && (
                <p className="mt-3 text-xs text-eos-text-muted">{task.legalSummary}</p>
              )}
              <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                  Dovada ceruta
                </p>
                <p className="mt-2 text-sm text-eos-text-muted">
                  {task.evidenceSnippet}
                </p>
              </div>
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                  Cand revii
                </p>
                <p className="mt-2 text-sm text-eos-text-muted">
                  {task.rescanHint || "Dupa ce actualizezi textul sau controlul tehnic relevant."}
                </p>
              </div>
              </div>
            </details>
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
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-base">Snapshot si baseline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {!latestSnapshot && (
          <VaultEmptyState
            title="Nu există încă snapshot pentru audit"
            description="Ruleaza o scanare sau confirma un sistem, iar primul snapshot va aparea automat aici."
          />
        )}
        {latestSnapshot && (
          <>
            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                Snapshot curent
              </p>
              <p className="mt-2 text-sm font-semibold text-eos-text">
                {latestSnapshot.snapshotId}
              </p>
              <p className="mt-2 text-xs text-eos-text-muted">
                {formatRelativeRomanian(latestSnapshot.generatedAt)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniMeta label="Surse" value={latestSnapshot.sources.length} />
              <MiniMeta label="Sisteme" value={latestSnapshot.systems.length} />
              <MiniMeta label="Probleme detectate" value={latestSnapshot.findings.length} />
              <MiniMeta label="Comparat cu" value={latestSnapshot.comparedToSnapshotId ? 1 : 0} />
            </div>
            <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                Baseline validat
              </p>
              <p className="mt-2 text-sm text-eos-text-muted">
                {validatedBaseline
                  ? `${validatedBaseline.snapshotId} · ${formatRelativeRomanian(validatedBaseline.generatedAt)}`
                  : "Nu există baseline validat încă."}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function DriftWatchCard({
  drifts,
}: {
  drifts: ComplianceDriftRecord[]
}) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-base">Monitor drift</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {drifts.length === 0 && (
          <VaultEmptyState
            title="Nu există drift activ"
            description="Nu există drift activ fata de baseline sau snapshot-ul comparat. Dupa urmatorul review stabil poti valida baseline-ul nou."
          />
        )}
        {drifts.slice(0, 6).map((drift) => (
          (() => {
            const guidance = getDriftPolicyFromRecord(drift)
            const breached = isDriftSlaBreached(drift)
            const driftBorderL =
              drift.severity === "critical" || drift.severity === "high"
                ? "border-l-[3px] border-l-eos-error"
                : drift.severity === "medium"
                  ? "border-l-[3px] border-l-eos-warning"
                  : "border-l-[3px] border-l-eos-border-subtle"
            const driftBg = breached
              ? "border-eos-error/20 bg-eos-error-soft/30"
              : "border-eos-border bg-eos-surface-variant"

            return (
              <div
                key={drift.id}
                className={`rounded-eos-md border ${driftBorderL} ${driftBg} p-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-eos-text">
                      {drift.summary}
                    </p>
                    <p className="mt-2 text-xs text-eos-text-muted">
                      {formatDriftTypeLabel(drift.type)} · {formatRelativeRomanian(drift.detectedAtISO)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-eos-text-muted">
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
                {drift.requiresHumanApproval && (
                  <Badge variant="warning">
                    cere aprobare umană
                  </Badge>
                )}
              </div>
                <details className="mt-4 rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                  <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                    Impact si escalare
                  </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                      De ce conteaza
                    </p>
                    <p className="mt-2 text-sm font-medium text-eos-text">
                      {guidance.lawReference}
                    </p>
                    <p className="mt-1 text-xs text-eos-text-muted">
                      {guidance.severityReason}
                    </p>
                  </div>
                  <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                      Ce faci acum
                    </p>
                    <p className="mt-2 text-sm font-medium text-eos-text">
                      {guidance.nextAction}
                    </p>
                  </div>
                  <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                      Dovada
                    </p>
                    <p className="mt-2 text-sm font-medium text-eos-text">
                      {guidance.evidenceRequired}
                    </p>
                  </div>
                  <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                      Escalare
                    </p>
                    <p className="mt-2 text-sm font-medium text-eos-text">
                      {drift.escalationOwner || guidance.ownerSuggestion}
                    </p>
                    <p className="mt-1 text-xs text-eos-text-muted">
                      {formatDriftEscalationTier(drift.escalationTier || guidance.escalationTier)} · până la{" "}
                      {formatDriftEscalationDeadline(
                        drift.escalationDueAtISO || guidance.escalationDueAtISO
                      )}
                    </p>
                    <p className="mt-2 text-xs text-eos-text-muted">
                      {[
                        drift.blocksAudit ? "blochează auditul" : null,
                        drift.blocksBaseline ? "blochează baseline-ul" : null,
                        drift.requiresHumanApproval ? "cere aprobare umană" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "review operațional recomandat"}
                    </p>
                    {(drift.acknowledgedBy || drift.lastStatusUpdatedAtISO) && (
                      <p className="mt-2 text-xs text-eos-text-muted">
                        {drift.acknowledgedBy ? `Owner: ${drift.acknowledgedBy}` : "Ultima actualizare"} ·{" "}
                        {formatRelativeRomanian(
                          drift.lastStatusUpdatedAtISO || drift.acknowledgedAtISO || drift.detectedAtISO
                        )}
                      </p>
                    )}
                  </div>
                </div>
                </details>
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
  confidence?: CockpitTask["validationConfidence"]
  basis?: CockpitTask["validationBasis"]
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
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-base">Registru validari</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {entries.length === 0 && (
          <VaultEmptyState
            title="Nu există încă validări salvate"
            description="Zona asta incepe sa se populeze dupa primul ciclu complet: atasezi dovada, rulezi rescan si apoi primesti validarea."
          />
        )}
        {entries.slice(0, 8).map((entry) => (
          <div
            key={entry.taskId}
            className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-eos-text">
                  {entry.taskTitle}
                </p>
                <p className="mt-1 text-xs text-eos-text-muted">
                  {entry.lawReference}
                  {entry.checkedSource ? ` · sursă verificată: ${entry.checkedSource}` : ""}
                </p>
              </div>
              <Badge variant={validationBadgeVariant(entry.status)}>
                {entry.status === "passed"
                  ? "validat"
                  : entry.status === "failed"
                    ? "esuat"
                  : "cere review"}
              </Badge>
            </div>
            {(entry.basis || entry.confidence) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.basis && (
                  <Badge variant="secondary">
                    bază: {formatValidationBasis(entry.basis)}
                  </Badge>
                )}
                {entry.confidence && (
                  <Badge variant="secondary">
                    {formatValidationConfidence(entry.confidence)}
                  </Badge>
                )}
              </div>
            )}
            {(entry.message || entry.evidence || entry.validatedAtISO) && (
              <details className="mt-3 rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                  Detalii validare
                </summary>
                {entry.message && (
                  <p className="mt-2 text-sm text-eos-text-muted">{entry.message}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-eos-text-muted">
                  {entry.evidence && <span>Dovadă: {entry.evidence}</span>}
                  {entry.validatedAtISO && (
                    <span>Ultima verificare: {formatRelativeRomanian(entry.validatedAtISO)}</span>
                  )}
                </div>
              </details>
            )}
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
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-base">Cronologie audit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {events.length === 0 && (
          <VaultEmptyState
            title="Nu există încă evenimente de audit"
            description="Primul review, primul rescan sau prima confirmare va deschide automat jurnalul de audit."
          />
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-eos-md border border-eos-border bg-eos-bg-inset text-eos-text">
                <EventIcon type={event.type} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-eos-text">
                    {event.message}
                  </p>
                  <Badge variant={eventBadgeVariant(event.type)}>
                    {formatEventLabel(event.type)}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-eos-text-muted">
                  {event.entityType} · {formatRelativeRomanian(event.createdAtISO)}
                </p>
                {(event.metadata?.validationMessage ||
                  event.metadata?.fileName ||
                  event.metadata?.checkedSource ||
                  event.actorLabel) && (
                  <details className="mt-3 rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                      Detalii eveniment
                    </summary>
                    {event.metadata?.validationMessage && (
                      <p className="mt-2 text-sm text-eos-text-muted">
                        {String(event.metadata.validationMessage)}
                      </p>
                    )}
                    {(event.metadata?.fileName || event.metadata?.checkedSource) && (
                      <p className="mt-2 text-xs text-eos-text-muted">
                        {event.metadata?.fileName ? `Dovadă: ${String(event.metadata.fileName)}` : ""}
                        {event.metadata?.fileName && event.metadata?.checkedSource ? " · " : ""}
                        {event.metadata?.checkedSource
                          ? `Sursă verificată: ${String(event.metadata.checkedSource)}`
                          : ""}
                      </p>
                    )}
                    {event.actorLabel && (
                      <p className="mt-2 text-xs text-eos-text-muted">
                        Actor: {formatEventActor(event)}
                      </p>
                    )}
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function VaultEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return <EmptyState title={title} label={description} className="rounded-eos-md" />
}

function SectionLoadingCard({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="border-eos-border bg-eos-bg-inset">
      <CardHeader className="border-b border-eos-border pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 text-sm text-eos-text-muted">
        {detail}
      </CardContent>
    </Card>
  )
}

function formatEventActor(event: ComplianceEvent) {
  return event.actorRole ? `${event.actorLabel} (${event.actorRole})` : event.actorLabel
}

function MiniMeta({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-eos-text">{value}</p>
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
      const persisted = getTaskStateByTaskId(taskState, task.id)
      return Boolean(task.attachedEvidence || persisted?.validatedAtISO)
    })
    .map((task) => {
      const persisted = getTaskStateByTaskId(taskState, task.id)
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
        confidence: task.validationConfidence,
        basis: task.validationBasis,
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

function validationBadgeVariant(status: ValidationEntry["status"]) {
  if (status === "passed") {
    return "success" as const
  }
  if (status === "failed") {
    return "destructive" as const
  }
  return "warning" as const
}

function formatValidationBasis(value: NonNullable<ValidationEntry["basis"]>) {
  if (value === "direct_signal") return "semnal direct"
  if (value === "inferred_signal") return "semnal inferat"
  return "stare operațională"
}

function formatValidationConfidence(value: NonNullable<ValidationEntry["confidence"]>) {
  if (value === "high") return "încredere mare"
  if (value === "medium") return "încredere medie"
  return "încredere redusă"
}

function formatEventLabel(type: string) {
  if (type === "task.validated") return "validare"
  if (type === "task.evidence-attached") return "dovada"
  if (type === "alert.auto-resolved") return "auto-rezolvat"
  if (type === "alert.reopened") return "redeschis"
  return type.replaceAll(".", " ")
}

function eventBadgeVariant(type: string) {
  if (type === "task.validated") {
    return "default" as const
  }
  if (type === "task.evidence-attached") {
    return "warning" as const
  }
  if (type === "alert.auto-resolved") {
    return "success" as const
  }
  if (type === "alert.reopened") {
    return "destructive" as const
  }
  return "secondary" as const
}

function EventIcon({ type }: { type: string }) {
  if (type === "task.validated") {
    return <RefreshCcw className="size-4" strokeWidth={2} />
  }
  if (type === "task.evidence-attached") {
    return <Paperclip className="size-4" strokeWidth={2} />
  }
  if (type === "alert.auto-resolved") {
    return <CheckCircle2 className="size-4" strokeWidth={2} />
  }
  return <FolderKanban className="size-4" strokeWidth={2} />
}

function formatEvidenceKind(kind: string) {
  if (kind === "screenshot") return "Captura ecran"
  if (kind === "policy_text") return "Text de politica"
  if (kind === "log_export") return "Export loguri"
  if (kind === "yaml_evidence") return "Dovada YAML"
  if (kind === "document_bundle") return "Pachet documente"
  return "Alta dovada"
}
