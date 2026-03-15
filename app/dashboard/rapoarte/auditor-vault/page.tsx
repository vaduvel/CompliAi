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
  ShieldCheck,
} from "lucide-react"

import { EvidenceReadinessBadge } from "@/components/evidence-os/EvidenceReadinessBadge"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { LifecycleBadge } from "@/components/evidence-os/LifecycleBadge"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
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
  PersistedTaskState,
} from "@/lib/compliance/types"
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

export default function AuditorVaultPage() {
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
  const summaryItems: SummaryStripItem[] = [
    {
      label: "Audit readiness",
      value: (
        <EvidenceReadinessBadge
          readiness={auditReadiness === "audit_ready" ? "ready" : "partial"}
        />
      ),
      hint:
        auditReadiness === "audit_ready"
          ? "poti sustine pachetul in audit"
          : "mai sunt pasi de validare inainte de audit",
      tone: auditReadiness === "audit_ready" ? "success" : "warning",
    },
    {
      label: "Baseline",
      value: validatedBaseline ? "validat" : "lipseste",
      hint: validatedBaseline ? "comparatia are reper stabil" : "confirma un snapshot ca baseline",
      tone: validatedBaseline ? "success" : "warning",
    },
    {
      label: "Drift activ",
      value: `${activeDrifts.length}`,
      hint: activeDrifts.length > 0 ? "schimbari care cer explicatie" : "nu exista drift deschis",
      tone: activeDrifts.length > 0 ? "danger" : "success",
    },
    {
      label: "Gap dovada",
      value: `${evidenceMissingTasks.length}`,
      hint:
        evidenceMissingTasks.length > 0
          ? "controale fara dovada sau validare completa"
          : "dovezile sunt acoperite",
      tone: evidenceMissingTasks.length > 0 ? "warning" : "success",
    },
  ]

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Dovada / Vault"
        title="Ledger-ul in care verifici daca auditul chiar se sustine"
        description="Aici vezi daca dovada, trasabilitatea si schimbarea recentă tin impreuna. Daca apare un gap, revii in executie sau finalizezi in Audit si export."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              audit ledger
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              trasabilitate
            </Badge>
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Stare vault
            </p>
            <p className="text-2xl font-semibold text-eos-text">
              {auditReadiness === "audit_ready" ? "ready" : "review"}
            </p>
            <p className="text-sm text-eos-text-muted">
              drift {activeDrifts.length} · gap dovezi {evidenceMissingTasks.length}
            </p>
          </div>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/checklists">
                Remediere
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/rapoarte">
                Audit si export
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </Button>
          </>
        }
      />

      <PillarTabs sectionId="dovada" />

        <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Vault"
            title="Ce sustii acum in audit"
            description="Vezi rapid daca pachetul e sustenabil sau daca trebuie sa revii in executie."
            items={summaryItems}
          />
        </CardContent>
      </Card>

      <SectionBoundary
        eyebrow="Acum"
        title="Vault-ul iti spune daca povestea de audit tine"
        description="Verifici legatura dintre control, dovada, articole si drift. Daca lipseste ceva, iesi spre pagina potrivita."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <VaultQuickActionsCard />
        <HandoffCard
          title="Cand vezi gap-uri, iesi direct spre pagina corecta"
          description="Vault-ul centralizeaza ledger-ul. Executia ramane in Remediere, iar livrabilul final ramane in Audit si export."
          destinationLabel="remediere / livrabil"
          checklist={[
            "nu inchizi task-uri direct din vault",
            "nu tratezi exportul final ca ledger intern",
            "validezi uman inainte de orice pachet extern",
          ]}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard/checklists">Deschide Remediere</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/rapoarte">Deschide Audit si export</Link>
              </Button>
            </>
          }
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-eos-border bg-eos-bg-inset p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-eos-text">
            Audit Pack v2 aduna intr-un singur loc sumarul executiv, controalele, dovezile si drift-ul.
          </p>
          <p className="text-sm text-eos-text-muted">
            Client pack pentru stakeholderi. JSON sau ZIP cand ai nevoie de schimb tehnic sau dosar complet.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            className="h-10 rounded-xl bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
          >
            <a href="/api/exports/audit-pack/client" target="_blank" rel="noreferrer">
              Audit Pack client
              <Download className="size-4" strokeWidth={2.25} />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <a href="/api/exports/annex-lite/client" target="_blank" rel="noreferrer">
              Annex IV lite
              <Download className="size-4" strokeWidth={2.25} />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <a href="/api/exports/audit-pack">
              JSON Audit Pack
              <Download className="size-4" strokeWidth={2.25} />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <a href="/api/exports/audit-pack/bundle">
              Pachet ZIP
              <Download className="size-4" strokeWidth={2.25} />
            </a>
          </Button>
        </div>
      </div>

      {cockpit.data.compliancePack ? (
        <AICompliancePackSummaryCard pack={cockpit.data.compliancePack} />
      ) : (
        <SectionLoadingCard
          title="Compliance Pack in incarcare"
          detail="Pachetul complet de control este cerut in fundal si va aparea aici imediat ce este disponibil."
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VaultMetric
          label="Dovezi atasate"
          value={evidenceReadyTasks.length}
          hint="Task-uri care au dovada atasata si au trecut verificarea prin rescan."
          tone="text-eos-success"
        />
        <VaultMetric
          label="Gap-uri de dovada"
          value={evidenceMissingTasks.length}
          hint="Task-uri deschise care inca cer dovada la audit."
          tone={evidenceMissingTasks.length > 0 ? "text-eos-warning" : "text-eos-success"}
        />
        <VaultMetric
          label="Mapari legale"
          value={legalMappedTasks.length}
          hint="Task-uri legate clar de articole si obligatii."
          tone="text-eos-info"
        />
        <VaultMetric
          label="Drift activ"
          value={activeDrifts.length}
          hint="Schimbari noi care trebuie explicate sau remediate."
          tone={activeDrifts.length > 0 ? "text-eos-error" : "text-eos-success"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        <div className="space-y-6">
          {cockpit.data.compliancePack ? (
            <AICompliancePackEntriesCard
              pack={cockpit.data.compliancePack}
              title="Intrări din pack folosite la audit"
              limit={6}
            />
          ) : (
            <SectionLoadingCard
              title="Intrari audit in incarcare"
              detail="Intrarile pack-ului se incarca separat, fara sa blocheze registrul de dovezi si restul ledger-ului."
            />
          )}
          <EvidenceLedgerCard
            evidenceReadyTasks={evidenceReadyTasks}
            evidenceMissingTasks={evidenceMissingTasks}
          />
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
    </div>
  )
}

function VaultQuickActionsCard() {
  const items = [
    {
      title: "Ce verifici acum",
      detail: "Mai intai vezi gap-urile de dovada, drift-ul deschis si controalele care cer confirmare.",
    },
    {
      title: "Ce poti confirma aici",
      detail: "Confirmi doar dupa ce ai dovada buna si un snapshot pe care il poti sustine.",
    },
    {
      title: "Cand folosesti exportul extern",
      detail: "Doar dupa ce dovezile sunt verzi si nu mai ai drift blocant pentru audit.",
    },
  ]

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-eos-border bg-eos-bg-inset p-4"
          >
            <p className="text-sm font-medium text-eos-text">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-eos-text-muted">
              {item.detail}
            </p>
          </div>
        ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <Link href="/dashboard/checklists">
              Remediere
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl">
            <Link href="/dashboard/rapoarte">
              Audit si export
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <Card className="border-eos-border bg-eos-surface">
      <CardContent className="space-y-2 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">{label}</p>
        <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
        <p className="text-sm leading-6 text-eos-text-muted">{hint}</p>
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
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-xl">Registru dovezi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="rounded-2xl border border-eos-border bg-eos-bg-inset p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-eos-success" strokeWidth={2.25} />
            <p className="text-sm font-medium text-eos-text">Dovezi deja atasate</p>
          </div>
          <div className="mt-4 space-y-3">
            {evidenceReadyTasks.length === 0 && (
              <EmptyState
                title="Nu exista inca dovezi validate"
                label="Incepe din Remediere, ataseaza o dovada si ruleaza `Mark as fixed & rescan`, apoi revino aici."
                className="rounded-2xl py-8"
              />
            )}
            {evidenceReadyTasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-eos-border bg-eos-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-eos-text">{task.title}</p>
                    <p className="mt-1 text-xs text-eos-text-muted">
                      {task.source} · {task.lawReference}
                    </p>
                  </div>
                  <Badge variant="success">
                    pregatit
                  </Badge>
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
                  <details className="mt-3 rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                      Detaliu validare
                    </summary>
                    <p className="mt-2 text-xs text-eos-text-muted">{task.validationMessage}</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-eos-border bg-eos-bg-inset p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-eos-warning" strokeWidth={2.25} />
            <p className="text-sm font-medium text-eos-text">Gap-uri de dovada</p>
          </div>
          <div className="mt-4 space-y-3">
            {evidenceMissingTasks.length === 0 && (
              <EmptyState
                title="Nu exista gap-uri de dovada"
                label="Toate task-urile deschise au deja dovada atasata sau validata in ultimul ciclu."
                className="rounded-2xl py-8"
              />
            )}
            {evidenceMissingTasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-eos-border bg-eos-surface p-4"
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
                  <details className="mt-3 rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
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
            <CardTitle className="text-xl">Matrice de mapare legala</CardTitle>
            <p className="mt-1 text-sm text-eos-text-muted">
              Vezi articolul relevant, dovada ceruta si momentul in care revii in executie.
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
          <VaultEmptyState
            title="Nu exista inca mapare legala"
            description="Zona asta apare dupa ce findings-urile si remedierea au suficient context ca sa fie aparate in audit."
          />
        )}
        {tasks.slice(0, 10).map((task) => (
          <div
            key={task.id}
            className="rounded-2xl border border-eos-border bg-eos-surface-variant p-4"
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
            <details className="mt-4 rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
              <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                Dovada si urmatorul pas
              </summary>
              {task.legalSummary && (
                <p className="mt-3 text-xs text-eos-text-muted">{task.legalSummary}</p>
              )}
              <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                  Dovada ceruta
                </p>
                <p className="mt-2 text-sm text-eos-text-muted">
                  {task.evidenceSnippet}
                </p>
              </div>
              <div className="rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
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
        <CardTitle className="text-xl">Snapshot si baseline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {!latestSnapshot && (
          <VaultEmptyState
            title="Nu exista inca snapshot pentru audit"
            description="Ruleaza o scanare sau confirma un sistem, iar primul snapshot va aparea automat aici."
          />
        )}
        {latestSnapshot && (
          <>
            <div className="rounded-2xl border border-eos-border bg-eos-surface-variant p-4">
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
              <MiniMeta label="Sources" value={latestSnapshot.sources.length} />
              <MiniMeta label="Systems" value={latestSnapshot.systems.length} />
              <MiniMeta label="Findings" value={latestSnapshot.findings.length} />
              <MiniMeta label="Compared to" value={latestSnapshot.comparedToSnapshotId ? 1 : 0} />
            </div>
            <div className="rounded-2xl border border-eos-border bg-eos-bg-inset p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                Baseline validat
              </p>
              <p className="mt-2 text-sm text-eos-text-muted">
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

function DriftWatchCard({
  drifts,
}: {
  drifts: ComplianceDriftRecord[]
}) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-xl">Monitor drift</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {drifts.length === 0 && (
          <VaultEmptyState
            title="Nu exista drift activ"
            description="Nu exista drift activ fata de baseline sau snapshot-ul comparat. Dupa urmatorul review stabil poti valida baseline-ul nou."
          />
        )}
        {drifts.slice(0, 6).map((drift) => (
          (() => {
            const guidance = getDriftPolicyFromRecord(drift)
            const breached = isDriftSlaBreached(drift)

            return (
              <div
                key={drift.id}
                className="rounded-2xl border border-eos-border bg-eos-surface-variant p-4"
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
                <details className="mt-4 rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
                  <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                    Impact si escalare
                  </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
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
                  <div className="rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                      Ce faci acum
                    </p>
                    <p className="mt-2 text-sm font-medium text-eos-text">
                      {guidance.nextAction}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                      Dovada
                    </p>
                    <p className="mt-2 text-sm font-medium text-eos-text">
                      {guidance.evidenceRequired}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
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
        <CardTitle className="text-xl">Registru validari</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {entries.length === 0 && (
          <VaultEmptyState
            title="Nu exista inca validari salvate"
            description="Zona asta incepe sa se populeze dupa primul ciclu complet: atasezi dovada, rulezi rescan si apoi primesti validarea."
          />
        )}
        {entries.slice(0, 8).map((entry) => (
          <div
            key={entry.taskId}
            className="rounded-2xl border border-eos-border bg-eos-surface-variant p-4"
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
              <details className="mt-3 rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
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
        <CardTitle className="text-xl">Cronologie audit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {events.length === 0 && (
          <VaultEmptyState
            title="Nu exista inca evenimente de audit"
            description="Primul review, primul rescan sau prima confirmare va deschide automat jurnalul de audit."
          />
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-2xl border border-eos-border bg-eos-surface-variant p-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-2xl border border-eos-border bg-eos-bg-inset text-eos-text">
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
                  <details className="mt-3 rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
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
  return <EmptyState title={title} label={description} className="rounded-2xl" />
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
    <div className="rounded-2xl border border-eos-border bg-eos-bg-inset p-4">
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
  if (kind === "yaml_evidence") return "dovada YAML"
  if (kind === "document_bundle") return "Document bundle"
  return "Other"
}
