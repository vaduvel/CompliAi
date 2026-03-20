"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { ArrowRight } from "lucide-react"

import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { ActionCluster } from "@/components/evidence-os/ActionCluster"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { formatRelativeRomanian } from "@/lib/compliance/engine"

const AICompliancePackSummaryCard = dynamic(
  () =>
    import("@/components/compliscan/ai-compliance-pack-card").then(
      (mod) => mod.AICompliancePackSummaryCard
    ),
  {
    ssr: false,
    loading: () => (
      <SectionLoadingCard
        title="AI Compliance Pack"
        detail="Se incarca starea de audit a pack-ului."
      />
    ),
  }
)

const ExportCenter = dynamic(
  () => import("@/components/compliscan/export-center").then((mod) => mod.ExportCenter),
  {
    ssr: false,
    loading: () => (
      <SectionLoadingCard
        title="Export in incarcare"
        detail="Centrul de export se incarca in fundal."
      />
    ),
  }
)

const ExportArtifactsCard = dynamic(
  () =>
    import("@/components/compliscan/rapoarte/reports-support-panels").then(
      (mod) => mod.ExportArtifactsCard
    ),
  {
    loading: () => (
      <SectionLoadingCard
        title="Artefacte in incarcare"
        detail="Explicatia exporturilor se incarca separat de snapshotul principal."
      />
    ),
  }
)

const RecentDriftCard = dynamic(
  () =>
    import("@/components/compliscan/rapoarte/reports-support-panels").then(
      (mod) => mod.RecentDriftCard
    ),
  {
    loading: () => (
      <SectionLoadingCard
        title="Drift in incarcare"
        detail="Lista drifturilor incluse in snapshot se incarca separat de exportul principal."
      />
    ),
  }
)

const EFacturaRiskCard = dynamic(
  () =>
    import("@/components/compliscan/efactura-risk-card").then((mod) => mod.EFacturaRiskCard),
  {
    ssr: false,
    loading: () => (
      <SectionLoadingCard
        title="Semnale e-Factura"
        detail="Se incarca semnalele de risc e-Factura."
      />
    ),
  }
)

const InspectorModePanel = dynamic(
  () =>
    import("@/components/compliscan/inspector-mode-panel").then((mod) => mod.InspectorModePanel),
  {
    ssr: false,
    loading: () => (
      <SectionLoadingCard
        title="Inspector Mode"
        detail="Se incarca simularea controlului extern."
      />
    ),
  }
)

export function ReportsPageSurface() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [showSupport, setShowSupport] = useState(false)
  const heavyPayloadRequested = useRef(false)

  useEffect(() => {
    if (cockpit.data && !cockpit.data.compliancePack && !heavyPayloadRequested.current) {
      heavyPayloadRequested.current = true
      void cockpitActions.ensureHeavyPayload()
    }
  }, [cockpit.data, cockpitActions])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const latestSnapshot = cockpit.data.state.snapshotHistory[0]
  const validatedBaseline = cockpit.data.state.snapshotHistory.find(
    (snapshot) => snapshot.snapshotId === cockpit.data?.state.validatedBaselineSnapshotId
  )
  const openTasks = cockpit.tasks.filter((task) => task.status !== "done")
  const doneTasks = cockpit.tasks.filter((task) => task.status === "done")
  const activeDrifts = cockpit.activeDrifts
  const evidenceLedger = cockpit.data.evidenceLedger ?? []
  const ledgerReadyCount = evidenceLedger.filter((entry) => entry.quality?.status === "sufficient").length
  const ledgerWeakCount = evidenceLedger.filter((entry) => entry.quality?.status === "weak").length
  const ledgerUnratedCount = Math.max(0, evidenceLedger.length - ledgerReadyCount - ledgerWeakCount)
  const ledgerHint =
    evidenceLedger.length > 0
      ? `${ledgerReadyCount} verificate · ${ledgerWeakCount} slabe · ${ledgerUnratedCount} neevaluate`
      : "registrul se populeaza cand storage-ul de dovezi este activ"
  const ledgerTone =
    evidenceLedger.length === 0 ? "neutral" : ledgerWeakCount > 0 ? "warning" : "success"

  const summaryItems: SummaryStripItem[] = [
    {
      label: "Task-uri deschise",
      value: `${openTasks.length}`,
      hint: "daca raman deschise, livrabilul ramane incomplet",
      tone: openTasks.length > 0 ? "warning" : "success",
    },
    {
      label: "Task-uri inchise",
      value: `${doneTasks.length}`,
      hint: "actiuni deja trecute prin executie",
      tone: doneTasks.length > 0 ? "success" : "neutral",
    },
    {
      label: "Registru dovezi",
      value: `${evidenceLedger.length}`,
      hint: ledgerHint,
      tone: ledgerTone,
    },
    {
      label: "Drift activ",
      value: `${activeDrifts.length}`,
      hint: activeDrifts.length > 0 ? "intra in snapshot si cere explicatie" : "snapshot curat pe acest front",
      tone: activeDrifts.length > 0 ? "danger" : "success",
    },
    {
      label: "Baseline",
      value: validatedBaseline ? "validat" : "inca nevalidat",
      hint: validatedBaseline ? "comparatia are reper stabil" : "fara baseline, explicatia ramane mai slaba",
      tone: validatedBaseline ? "success" : "warning",
    },
  ]

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Rapoarte"
        title="Pregatesti livrabilul final"
        description="Verifici snapshot-ul, readiness-ul si artefactele. Executia ramane in De rezolvat, iar ledger-ul complet in Auditor Vault."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              read-only pentru livrabil
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              output canonic
            </Badge>
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Snapshot export
            </p>
            <p className="text-2xl font-semibold text-eos-text">{cockpit.data.summary.score}</p>
            <p className="text-sm text-eos-text-muted">{cockpit.data.summary.riskLabel}</p>
          </div>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={dashboardRoutes.resolve}>
                De rezolvat
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
            <Button asChild>
              <Link href={dashboardRoutes.auditorVault}>
                Auditor Vault
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </>
        }
      />

      <PillarTabs sectionId="dovada" />

      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Rapoarte"
            title="Readiness livrabil"
            description="Ce mai intra in snapshot inainte de export."
            items={summaryItems}
          />
        </CardContent>
      </Card>

      <ActionCluster
        eyebrow="Detalii"
        title="Detalii de livrabil"
        description="Ghidajul complet apare doar la cerere."
        actions={
          <Button variant="outline" onClick={() => setShowSupport((current) => !current)}>
            {showSupport ? "Ascunde detaliile" : "Arata detaliile"}
          </Button>
        }
      />

      {showSupport ? (
        <>
          <SectionBoundary
            eyebrow="Flux canonic"
            title="Livrabilul sta separat de executie"
            description="Verifici ce intra in snapshot si ce merita exportat."
            support={<ReportsGuideCard />}
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <RemediationHandoffCard
              openTasks={openTasks.length}
              doneTasks={doneTasks.length}
              driftCount={activeDrifts.length}
            />
            <HandoffCard
              title="Daca lipseste ceva, revii in pagina potrivita"
              description="Rapoarte ramane suprafata de finalizare. De rezolvat ramane pentru actiune, Vault pentru trasabilitate."
              destinationLabel="de rezolvat / vault"
              checklist={[
                "nu inchizi task-uri din aceasta pagina",
                "generezi artefactul abia dupa verificare umana",
              ]}
              actions={
                <>
                  <Button asChild variant="outline">
                    <Link href={dashboardRoutes.resolve}>Deschide De rezolvat</Link>
                  </Button>
                  <Button asChild>
                    <Link href={dashboardRoutes.auditorVault}>Deschide Auditor Vault</Link>
                  </Button>
                </>
              }
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-6">
              <ReportsStatusGrid
                openTasks={openTasks.length}
                doneTasks={doneTasks.length}
                activeDrifts={activeDrifts.length}
                hasBaseline={Boolean(validatedBaseline)}
              />
              <ExportArtifactsCard />
            </div>
            <div className="space-y-6">
              <RecentDriftCard drifts={activeDrifts} />
            </div>
          </div>
        </>
      ) : null}

      {cockpit.data.compliancePack && (
        <section aria-label="AI Compliance Pack — stare audit">
          <AICompliancePackSummaryCard pack={cockpit.data.compliancePack} />
        </section>
      )}

      <EFacturaRiskCard />

      <InspectorModePanel />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <SnapshotStatusCard
          latestSnapshot={latestSnapshot}
          validatedBaseline={validatedBaseline}
          driftCount={activeDrifts.length}
        />

        <ExportCenter
          onGeneratePdf={() => void cockpitActions.handleGenerateReport()}
          onDownloadExecutivePdf={() => void cockpitActions.handleDownloadExecutivePdf()}
          onGenerateResponsePack={() => void cockpitActions.handleGenerateResponsePack()}
          onGenerateAuditPack={() => void cockpitActions.handleGenerateAuditPack()}
          onGenerateAuditBundle={() => void cockpitActions.handleGenerateAuditBundle()}
          onGenerateAnnexLite={() => void cockpitActions.handleGenerateAnnexLite()}
          onExportChecklist={() => void cockpitActions.handleChecklistExport()}
          onExportCompliScanJson={() => void cockpitActions.handleExportCompliScanJson()}
          onExportCompliScanYaml={() => void cockpitActions.handleExportCompliScanYaml()}
          onShare={() => void cockpitActions.handleShareWithAccountant()}
        />
      </div>
    </div>
  )
}

function ReportsGuideCard() {
  const steps = [
    {
      title: "1. Verifici readiness-ul livrabilului",
      detail:
        "Vezi rapid cate task-uri, drift-uri si blocaje mai intra in snapshot inainte sa generezi un artefact extern.",
    },
    {
      title: "2. Confirmi snapshot-ul si baseline-ul",
      detail:
        "Inainte de export, te uiti daca snapshot-ul curent este valid si daca drift-ul e comparat cu baseline-ul potrivit.",
    },
    {
      title: "3. Exportezi artefactul potrivit",
      detail:
        "PDF pentru stakeholderi, ZIP pentru pachet complet, iar compliscan.json/yaml pentru sursa tehnica de adevar si workflow-uri viitoare.",
    },
  ]

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {steps.map((step) => (
        <div
          key={step.title}
          className="rounded-eos-md border border-eos-border bg-eos-surface p-4"
        >
          <p className="text-sm font-medium text-eos-text">{step.title}</p>
          <p className="mt-2 text-sm leading-6 text-eos-text-muted">{step.detail}</p>
        </div>
      ))}
    </div>
  )
}

function RemediationHandoffCard({
  openTasks,
  doneTasks,
  driftCount,
}: {
  openTasks: number
  doneTasks: number
  driftCount: number
}) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">Unde continui munca reala</CardTitle>
            <p className="mt-1 text-sm text-eos-text-muted">
              Daca mai ai task-uri deschise sau gap-uri de dovada, revii in paginile de executie.
            </p>
          </div>
          <Badge variant="outline">
            {openTasks} deschise · {doneTasks} inchise · {driftCount} drift
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
        <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
          <p className="text-sm font-medium text-eos-text">De rezolvat</p>
          <p className="mt-2 text-sm leading-6 text-eos-text-muted">
            Acolo inchizi task-uri, atasezi dovezi si rulezi `Mark as fixed & rescan`.
          </p>
          <Button asChild variant="outline" size="default" className="mt-4 gap-2">
            <Link href={dashboardRoutes.resolve}>
              Deschide De rezolvat
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </Button>
        </div>
        <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
          <p className="text-sm font-medium text-eos-text">Auditor Vault</p>
          <p className="mt-2 text-sm leading-6 text-eos-text-muted">
            Acolo verifici trasabilitatea, calitatea dovezii si povestea completa care sustine auditul.
          </p>
          <Button asChild variant="outline" size="default" className="mt-4 gap-2">
            <Link href={dashboardRoutes.auditorVault}>
              Deschide Auditor Vault
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SectionLoadingCard({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="border-eos-border bg-eos-bg-inset">
      <CardHeader className="border-b border-eos-border pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 text-sm text-eos-text-muted">{detail}</CardContent>
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
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-xl">Ce intra in livrabil</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <StatusTile
          label="Task-uri deschise"
          value={openTasks}
          tone="text-eos-warning"
          hint="Inca afecteaza riscul si recomandarile."
        />
        <StatusTile
          label="Task-uri inchise"
          value={doneTasks}
          tone="text-eos-success"
          hint="Au dovada sau au fost marcate ca rezolvate."
        />
        <StatusTile
          label="Drift activ"
          value={activeDrifts}
          tone={activeDrifts > 0 ? "text-eos-error" : "text-eos-success"}
          hint="Va aparea si in snapshot daca exista."
        />
        <StatusTile
          label="Baseline validat"
          value={hasBaseline ? 1 : 0}
          tone={hasBaseline ? "text-eos-info" : "text-eos-text-muted"}
          hint={hasBaseline ? "Comparam cu baseline-ul salvat." : "Comparam doar cu ultimul snapshot."}
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
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <div>
          <CardTitle className="text-xl">Snapshot curent</CardTitle>
          <p className="mt-1 text-sm text-eos-text-muted">
            Exporturile `compliscan.json` si `compliscan.yaml` pornesc de aici.
          </p>
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
            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">Generat</p>
              <p className="mt-2 text-sm font-semibold text-eos-text">
                {new Date(latestSnapshot.generatedAt).toLocaleString("ro-RO")}
              </p>
              <p className="mt-2 text-xs text-eos-text-muted">
                {formatRelativeRomanian(latestSnapshot.generatedAt)} · {latestSnapshot.snapshotId}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SnapshotMeta label="Surse" value={latestSnapshot.sources.length} />
              <SnapshotMeta label="Sisteme" value={latestSnapshot.systems.length} />
              <SnapshotMeta label="Probleme detectate" value={latestSnapshot.findings.length} />
              <SnapshotMeta label="Modificari incluse" value={driftCount} />
            </div>

            <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">comparat cu</Badge>
                <span className="text-sm text-eos-text">
                  {latestSnapshot.comparedToSnapshotId || "fara comparatie"}
                </span>
              </div>
              <p className="mt-3 text-sm text-eos-text-muted">
                {validatedBaseline
                  ? `Baseline validat activ: ${validatedBaseline.snapshotId}`
                  : "Nu exista baseline validat. Snapshot-ul compara cu ultimul snapshot disponibil."}
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
  return <EmptyState title={title} label={description} className="rounded-eos-md" />
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
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
      <p className="text-sm text-eos-text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-eos-text-muted">{hint}</p>
    </div>
  )
}

function SnapshotMeta({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-eos-text">{value}</p>
    </div>
  )
}
