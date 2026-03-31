"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  Check,
  CalendarClock,
  AlertTriangle,
} from "lucide-react"

import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { ActionCluster } from "@/components/evidence-os/ActionCluster"
import { DenseListItem } from "@/components/evidence-os/DenseListItem"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import type { AICompliancePack, AICompliancePackEntry } from "@/lib/compliance/ai-compliance-pack"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { formatPurposeLabel } from "@/lib/compliance/ai-inventory"
import { cn } from "@/lib/utils"
import { formatRelativeRomanian } from "@/lib/compliance/engine"
import type { AISystemPurpose } from "@/lib/compliance/types"
import { classifyAISystem, RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from "@/lib/compliance/ai-act-classifier"

type ControlPrimaryViewMode = "overview" | "systems" | "drift" | "review"
type SystemsSubViewMode = "inventory" | "discovery" | "baseline" | "pack"
type UpdateCompliancePackFieldInput = {
  systemId: string
  field: AICompliancePackEntry["prefill"]["fieldStatus"][number]["field"]
  value?: string | null
  action: "save" | "confirm" | "clear"
}

const AIDiscoveryPanel = dynamic(
  () => import("@/components/compliscan/ai-discovery-panel").then((mod) => mod.AIDiscoveryPanel),
  { loading: () => <LoadingScreen variant="section" /> }
)

const AIInventoryPanel = dynamic(
  () => import("@/components/compliscan/ai-inventory-panel").then((mod) => mod.AIInventoryPanel),
  { loading: () => <LoadingScreen variant="section" /> }
)

const AICompliancePackEntriesCard = dynamic(
  () =>
    import("@/components/compliscan/ai-compliance-pack-card").then(
      (mod) => mod.AICompliancePackEntriesCard
    ),
  { loading: () => <LoadingScreen variant="section" /> }
)

const ShadowAiQuestionnaire = dynamic(
  () =>
    import("@/components/compliscan/shadow-ai-questionnaire").then(
      (mod) => mod.ShadowAiQuestionnaire
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 animate-pulse rounded-eos-md bg-eos-surface-variant" />
    ),
  }
)

export default function SistemePage() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const heavyPayloadRequested = useRef(false)
  const [primaryView, setPrimaryView] = useState<ControlPrimaryViewMode>("overview")
  const [systemsView, setSystemsView] = useState<SystemsSubViewMode>("discovery")

  const needsCompliancePack =
    Boolean(cockpit.data) &&
    (primaryView === "review" || (primaryView === "systems" && systemsView === "pack")) &&
    !cockpit.data?.compliancePack

  useEffect(() => {
    if (needsCompliancePack && !heavyPayloadRequested.current) {
      heavyPayloadRequested.current = true
      void cockpitActions.ensureHeavyPayload()
    }
  }, [needsCompliancePack, cockpitActions])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />
  if (needsCompliancePack) return <LoadingScreen variant="section" />

  const data = cockpit.data

  const aiHighRisk = data.state.aiSystems.filter((s) => s.riskLevel === "high").length
  const aiLowRisk = data.state.aiSystems.filter(
    (s) => s.riskLevel === "minimal" || s.riskLevel === "limited"
  ).length
  const detectedActiveCount = data.state.detectedAISystems.filter(
    (system) => system.detectionStatus !== "confirmed" && system.detectionStatus !== "rejected"
  ).length
  const reviewedCount = data.state.detectedAISystems.filter(
    (system) => system.detectionStatus === "reviewed"
  ).length
  const confirmedCount = data.state.aiSystems.length
  const validatedBaseline = data.state.snapshotHistory.find(
    (snapshot) => snapshot.snapshotId === data.state.validatedBaselineSnapshotId
  )
  const recentInventory = data.state.aiSystems.slice(0, 4)
  const recentDrifts = cockpit.activeDrifts.slice(0, 4)
  const reviewQueueCount = detectedActiveCount + recentDrifts.length + (validatedBaseline ? 0 : 1)
  const evidenceLedger = data.evidenceLedger ?? []
  const ledgerReadyCount = evidenceLedger.filter((entry) => entry.quality?.status === "sufficient").length
  const ledgerWeakCount = evidenceLedger.filter((entry) => entry.quality?.status === "weak").length
  const ledgerUnratedCount = Math.max(
    0,
    evidenceLedger.length - ledgerReadyCount - ledgerWeakCount
  )

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Control"
        title="Confirmi ce intră în inventarul oficial și ce devine drift real"
        description="Aici validezi candidatele, reperul și drift-ul real. Execuția rămâne în Dovadă."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {confirmedCount} sisteme confirmate
            </Badge>
            <Badge variant={recentDrifts.length > 0 ? "warning" : "success"} className="normal-case tracking-normal">
              {recentDrifts.length > 0 ? `${recentDrifts.length} drift activ` : "fără drift activ"}
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              {validatedBaseline ? "baseline validat" : "baseline în curs"}
            </Badge>
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Snapshot control
            </p>
            <p className="text-2xl font-semibold text-eos-text">{data.summary.score}</p>
            <p className="text-sm text-eos-text-muted">{data.summary.riskLabel}</p>
          </div>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setPrimaryView("systems")}>
              Sisteme
            </Button>
            <Button asChild>
              <Link href="/dashboard/alerte">
                Drift
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </>
        }
      />

      <PillarTabs sectionId="control" />

      {/* ── GOLD 8: AI Act deadline banner ───────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-eos-md border border-eos-warning/20 bg-eos-warning-soft px-4 py-3 text-sm dark:border-eos-warning/80/40 dark:bg-eos-warning-soft/20">
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-eos-warning dark:text-eos-warning" strokeWidth={2} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-eos-warning dark:text-eos-warning">
            AI Act — deadline 2 august 2026
          </p>
          <p className="mt-0.5 text-xs text-eos-warning dark:text-eos-warning">
            Sistemele AI cu risc ridicat trebuie înregistrate în EU AI Database înainte de 2 aug 2026
            (Regulament (UE) 2024/1689, Art. 49). Folosește wizardul per sistem pentru pregătire.
          </p>
        </div>
        <Link
          href="/dashboard/sisteme/eu-db-wizard"
          className="shrink-0 rounded-eos-md border border-eos-warning/30 bg-white px-3 py-1.5 text-xs font-medium text-eos-warning transition hover:bg-eos-warning-soft dark:border-eos-warning/70 dark:bg-transparent dark:text-eos-warning"
        >
          Wizard EU DB →
        </Link>
      </div>

      {/* ── Sprint 10: False confidence prevention ────────────────────────────── */}
      {aiHighRisk > 0 && (
        <div className="flex items-start gap-3 rounded-eos-md border border-eos-error/20 bg-eos-error-soft/60 px-4 py-3 text-sm dark:border-eos-error/50/40 dark:bg-eos-error-soft/20">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-eos-error dark:text-eos-error" strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-eos-error dark:text-eos-error">
              {aiHighRisk} sistem{aiHighRisk !== 1 ? "e" : ""} high-risk — obligații active
            </p>
            <p className="mt-0.5 text-xs text-eos-error dark:text-eos-error">
              Clasificarea automată este un punct de plecare, nu un verdict juridic.
              Fiecare sistem high-risk necesită documentație Annex IV verificată de expert,
              evaluare de conformitate și înregistrare EU DB înainte de utilizare operațională.
            </p>
          </div>
        </div>
      )}

      <ControlPrimaryTabs
        active={primaryView}
        onChange={setPrimaryView}
        counts={{
          confirmedCount,
          detectedActiveCount,
          recentDrifts: recentDrifts.length,
          reviewQueueCount,
        }}
      />

      {primaryView === "overview" && (
        <ControlOverview
          summary={data.summary}
          confirmedCount={confirmedCount}
          detectedActiveCount={detectedActiveCount}
          recentDriftsCount={recentDrifts.length}
          validatedBaselineLabel={
            validatedBaseline
              ? `validat ${new Date(validatedBaseline.generatedAt).toLocaleString("ro-RO")}`
              : "încă nevalidat"
          }
          evidenceLedgerTotal={evidenceLedger.length}
          evidenceLedgerReady={ledgerReadyCount}
          evidenceLedgerWeak={ledgerWeakCount}
          evidenceLedgerUnrated={ledgerUnratedCount}
          onOpenSystems={() => setPrimaryView("systems")}
          onOpenDiscovery={() => {
            setPrimaryView("systems")
            setSystemsView("discovery")
          }}
          onOpenBaseline={() => {
            setPrimaryView("systems")
            setSystemsView("baseline")
          }}
          onOpenDrift={() => setPrimaryView("drift")}
        />
      )}

      {primaryView === "systems" && (
        <ControlSystemsWorkspace
          active={systemsView}
          onChange={setSystemsView}
          detectedActiveCount={detectedActiveCount}
          reviewedCount={reviewedCount}
          confirmedCount={confirmedCount}
          aiHighRisk={aiHighRisk}
          aiLowRisk={aiLowRisk}
          validatedBaseline={validatedBaseline}
          recentDriftsCount={recentDrifts.length}
          recentInventory={recentInventory}
          discoveryPanel={
            <AIDiscoveryPanel
              systems={data.state.detectedAISystems}
              drifts={cockpit.activeDrifts}
              busy={cockpit.busy}
              onDiscover={cockpitActions.discoverAISystemsFromManifest}
              onUpdateStatus={cockpitActions.updateDetectedAISystem}
              onEdit={cockpitActions.editDetectedAISystem}
            />
          }
          inventoryPanel={
            <AIInventoryPanel
              systems={data.state.aiSystems}
              busy={cockpit.busy}
              onSubmit={cockpitActions.addAISystem}
              onRemove={cockpitActions.removeAISystem}
              onPatch={cockpitActions.patchAISystem}
            />
          }
          compliancePack={data.compliancePack ?? null}
          onUpdateCompliancePackField={cockpitActions.updateCompliancePackField}
          busy={cockpit.busy}
          onOpenReview={() => setPrimaryView("review")}
          onOpenDrift={() => setPrimaryView("drift")}
        />
      )}

      {primaryView === "drift" && (
        <ControlDriftWorkspace
          recentDrifts={recentDrifts}
          confirmedCount={confirmedCount}
          validatedBaseline={Boolean(validatedBaseline)}
          onOpenBaseline={() => {
            setPrimaryView("systems")
            setSystemsView("baseline")
          }}
        />
      )}

      {primaryView === "review" && (
        <ControlReviewWorkspace
          detectedActiveCount={detectedActiveCount}
          reviewedCount={reviewedCount}
          recentDriftsCount={recentDrifts.length}
          validatedBaseline={Boolean(validatedBaseline)}
          compliancePack={data.compliancePack ?? null}
          onOpenDiscovery={() => {
            setPrimaryView("systems")
            setSystemsView("discovery")
          }}
          onOpenPack={() => {
            setPrimaryView("systems")
            setSystemsView("pack")
          }}
          onOpenBaseline={() => {
            setPrimaryView("systems")
            setSystemsView("baseline")
          }}
          onOpenDrift={() => setPrimaryView("drift")}
        />
      )}

      {/* ── V3 P2.1: Shadow AI Questionnaire ──────────────────────────────────── */}
      <section aria-label="Shadow AI — utilizare nedeclarată">
        <ShadowAiQuestionnaire />
      </section>
    </div>
  )
}

function ControlOverview({
  summary,
  confirmedCount,
  detectedActiveCount,
  recentDriftsCount,
  validatedBaselineLabel,
  evidenceLedgerTotal,
  evidenceLedgerReady,
  evidenceLedgerWeak,
  evidenceLedgerUnrated,
  onOpenSystems,
  onOpenDiscovery,
  onOpenBaseline,
  onOpenDrift,
}: {
  summary: { score: number; riskLabel: string }
  confirmedCount: number
  detectedActiveCount: number
  recentDriftsCount: number
  validatedBaselineLabel: string
  evidenceLedgerTotal: number
  evidenceLedgerReady: number
  evidenceLedgerWeak: number
  evidenceLedgerUnrated: number
  onOpenSystems: () => void
  onOpenDiscovery: () => void
  onOpenBaseline: () => void
  onOpenDrift: () => void
}) {
  const [showGuidance, setShowGuidance] = useState(false)
  const shouldShowGuidance =
    showGuidance || (confirmedCount === 0 && detectedActiveCount === 0 && recentDriftsCount === 0)
  const hasEvidenceLedger = evidenceLedgerTotal > 0
  const items: SummaryStripItem[] = [
    {
      label: "Inventar confirmat",
      value: `${confirmedCount}`,
      hint: confirmedCount > 0 ? "sisteme asumate operațional" : "încă lipsesc sisteme confirmate",
      tone: confirmedCount > 0 ? "success" : "neutral",
    },
    {
      label: "Detecții active",
      value: `${detectedActiveCount}`,
      hint: "candidate care cer validare umană înainte de intrare în inventar",
      tone: detectedActiveCount > 0 ? "warning" : "neutral",
    },
    {
      label: "Calitate dovadă",
      value: hasEvidenceLedger
        ? evidenceLedgerWeak > 0
          ? `${evidenceLedgerWeak} slabe`
          : evidenceLedgerUnrated > 0
            ? `${evidenceLedgerUnrated} neevaluate`
            : `${evidenceLedgerReady} verificate`
        : "fără registru",
      hint: hasEvidenceLedger
        ? evidenceLedgerWeak > 0
          ? "înlocuiești dovezile slabe în Dovadă"
          : evidenceLedgerUnrated > 0
            ? "complementezi review-ul de dovadă"
            : "registru curat"
        : "apare după primul upload de dovadă",
      tone: hasEvidenceLedger
        ? evidenceLedgerWeak > 0
          ? "warning"
          : evidenceLedgerUnrated > 0
            ? "accent"
            : "success"
        : "neutral",
    },
    {
      label: "Baseline",
      value: validatedBaselineLabel,
      hint: "reperul față de care măsurăm drift-ul real",
      tone: validatedBaselineLabel.startsWith("validat") ? "success" : "warning",
    },
    {
      label: "Drift activ",
      value: `${recentDriftsCount}`,
      hint: recentDriftsCount > 0 ? "semnale care cer investigație" : "nu există semnale deschise acum",
      tone: recentDriftsCount > 0 ? "danger" : "success",
      meta: `${summary.score} · ${summary.riskLabel}`,
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Stare curentă"
            title="Ce cere confirmare acum"
            description="Alegi zona unde continui confirmarea reală."
            items={items}
          />
        </CardContent>
      </Card>

      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-sm font-semibold text-eos-text">Continui confirmarea</p>
            <p className="text-xs text-eos-text-muted">
              Control rămâne doar pentru confirmare. Execuția rămâne în Dovadă.
            </p>
          </div>
          <div className="min-w-[240px] space-y-2">
            <ActionCluster
              eyebrow="Acțiuni"
              title="Unde continui"
              description="Alegi zona de confirmare reală."
              actions={
                <>
                  <Button variant="outline" onClick={onOpenDiscovery}>
                    Discovery
                  </Button>
                  <Button variant="outline" onClick={onOpenBaseline}>
                    Baseline
                  </Button>
                  <Button onClick={onOpenSystems}>Sisteme</Button>
                </>
              }
            />
            <button
              type="button"
              onClick={() => setShowGuidance((current) => !current)}
              className="text-xs text-eos-text-muted underline-offset-2 hover:text-eos-text hover:underline"
            >
              {showGuidance ? "Ascunde ghidajul" : "Arată ghidajul"}
            </button>
          </div>
        </CardContent>
      </Card>

      {shouldShowGuidance ? (
        <>
          <SectionBoundary
            eyebrow="Control"
            title="Confirmare umană, fără execuție aici"
            description="Aici validezi inventarul, baseline-ul și drift-ul. Execuția rămâne în Dovadă, iar integrările rămân în Setări."
            badges={<Badge variant="outline" className="normal-case tracking-normal">baseline + drift</Badge>}
            support={
              <ActionCluster
                eyebrow="Acțiuni"
                title="Handoff rapid"
                description="Continui în zona potrivită."
                actions={
                  <>
                    <Button variant="outline" onClick={onOpenDiscovery}>
                      Discovery
                    </Button>
                    <Button variant="outline" onClick={onOpenBaseline}>
                      Baseline
                    </Button>
                    <Button asChild>
                      <Link href={dashboardRoutes.settings}>
                        Setări
                        <ArrowRight className="size-4" strokeWidth={2} />
                      </Link>
                    </Button>
                  </>
                }
              />
            }
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <HandoffCard
              title="Continui în Sisteme"
              description="Aici lucrezi pe candidate, inventar, compliance pack și baseline."
              destinationLabel="workspace principal"
              checklist={[
                "începi cu Discovery dacă ai candidate noi",
                "confirmi doar ce este real și asumat",
                "salvezi baseline-ul după review uman",
              ]}
              actions={<Button onClick={onOpenSystems}>Deschide Sisteme</Button>}
            />
            <HandoffCard
              title="Drift-ul stă separat"
              description="Când ai schimbări față de baseline, le investighezi separat și trimiți doar ce merită în remediere."
              destinationLabel="investigație"
              checklist={[
                "vezi ce s-a schimbat față de baseline",
                "decizi dacă merge spre remediere",
                "nu închizi auditul direct din Control",
              ]}
              actions={
                <>
                  <Button variant="outline" onClick={onOpenBaseline}>
                    Baseline
                  </Button>
                  <Button onClick={onOpenDrift}>Drift</Button>
                </>
              }
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

function ControlSystemsWorkspace({
  active,
  onChange,
  detectedActiveCount,
  reviewedCount,
  confirmedCount,
  aiHighRisk,
  aiLowRisk,
  validatedBaseline,
  recentDriftsCount,
  recentInventory,
  discoveryPanel,
  inventoryPanel,
  compliancePack,
  onUpdateCompliancePackField,
  busy,
  onOpenReview,
  onOpenDrift,
}: {
  active: SystemsSubViewMode
  onChange: (next: SystemsSubViewMode) => void
  detectedActiveCount: number
  reviewedCount: number
  confirmedCount: number
  aiHighRisk: number
  aiLowRisk: number
  validatedBaseline: { generatedAt: string } | undefined
  recentDriftsCount: number
  recentInventory: Array<{
    id: string
    name: string
    vendor: string
    purpose: AISystemPurpose
    riskLevel: string
    modelType: string
    hasHumanReview: boolean
  }>
  discoveryPanel: React.ReactNode
  inventoryPanel: React.ReactNode
  compliancePack: AICompliancePack | null
  onUpdateCompliancePackField: (input: UpdateCompliancePackFieldInput) => Promise<unknown>
  busy: boolean
  onOpenReview: () => void
  onOpenDrift: () => void
}) {
  return (
    <div className="space-y-6">
      <SectionBoundary
        eyebrow="Sisteme"
        title="Candidatele, inventarul, compliance pack și baseline-ul stau pe același fir de confirmare"
        description="Parcurgi pașii în ordine: mai întâi descoperi, confirmi, fixezi reperul și revizuiești pack-ul."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {confirmedCount} confirmate
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              {detectedActiveCount} detecții active
            </Badge>
          </>
        }
        support={
          <SystemsLinearStepper
            active={active}
            onChange={onChange}
            detectedActiveCount={detectedActiveCount}
            confirmedCount={confirmedCount}
            validatedBaseline={Boolean(validatedBaseline)}
            compliancePack={compliancePack}
          />
        }
      />

      {active === "discovery" && (
        <div className="space-y-6">
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="px-5 py-5">
              <SummaryStrip
                eyebrow="Discovery"
                title="Candidate detectate automat"
                description="Aici lucrezi pe work queue-ul de detecție. Corectezi și validezi doar ce merită să devină sistem oficial."
                items={[
                  {
                    label: "Detecții active",
                    value: `${detectedActiveCount}`,
                    hint: "candidate care încă nu au fost confirmate sau respinse",
                    tone: detectedActiveCount > 0 ? "warning" : "neutral",
                  },
                  {
                    label: "Revizuite",
                    value: `${reviewedCount}`,
                    hint: "candidate deja ajustate de operator",
                  },
                  {
                    label: "Drift asociat",
                    value: `${recentDriftsCount}`,
                    hint: "semnale noi care cer verificare dupa confirmare",
                    tone: recentDriftsCount > 0 ? "danger" : "success",
                  },
                ]}
              />
            </CardContent>
          </Card>

          {discoveryPanel}

          <HandoffCard
            title="După Discovery continui în Inventar"
            description="Ce a fost confirmat uman trebuie să intre în inventarul oficial, nu să rămână blocat în candidate."
            destinationLabel="inventar oficial"
            checklist={[
              "confirmi scopul și modelul",
              "verifici nivelul de risc și review uman",
              "muți doar sistemele curate în inventar",
            ]}
            actions={
              <>
                <Button onClick={() => onChange("inventory")}>Mergi la Inventar</Button>
                <Button variant="outline" onClick={onOpenReview}>
                  Vezi Queue de Review
                </Button>
              </>
            }
          />
        </div>
      )}

      {active === "inventory" && (
        <div className="space-y-6">
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="px-5 py-5">
              <SummaryStrip
                eyebrow="Inventar oficial"
                title="Sisteme asumate operațional"
                description="De aici încolo nu mai lucrezi cu candidate, ci cu inventarul confirmat care susține baseline-ul și drift-ul."
                items={[
                  {
                    label: "Confirmate",
                    value: `${confirmedCount}`,
                    hint: "sisteme deja intrate în inventarul oficial",
                    tone: confirmedCount > 0 ? "success" : "neutral",
                  },
                  {
                    label: "High-risk",
                    value: `${aiHighRisk}`,
                    hint: "cer control și urmărire prioritară",
                    tone: aiHighRisk > 0 ? "danger" : "success",
                  },
                  {
                    label: "Limited / minimal",
                    value: `${aiLowRisk}`,
                    hint: "rămân în inventar, dar cu presiune de control mai mică",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="border-b border-eos-border pb-5">
              <CardTitle className="text-xl">Inventar confirmat recent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {recentInventory.length === 0 && (
                <EmptyState
                  title="Niciun sistem confirmat încă"
                  label="Confirmă mai întâi o detecție din Discovery sau adaugă manual un sistem nou dacă sursa tehnică lipsește."
                  className="border-eos-border bg-eos-surface-variant py-8"
                />
              )}
              {recentInventory.map((system) => {
                const aiActClass = classifyAISystem(system.purpose)
                return (
                  <DenseListItem key={system.id} className="bg-eos-surface-variant">
                    <div className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="break-words text-sm font-semibold text-eos-text">
                            {system.name}
                          </p>
                          <p className="mt-1 text-sm text-eos-text-muted [overflow-wrap:anywhere]">
                            {system.vendor} · {formatPurposeLabel(system.purpose)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            system.riskLevel === "high"
                              ? "destructive"
                              : system.riskLevel === "limited"
                                ? "warning"
                                : "success"
                          }
                        >
                          {system.riskLevel}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-eos-text-muted [overflow-wrap:anywhere]">
                        {system.modelType} · {system.hasHumanReview ? "cu review uman" : "fără review uman"}
                      </p>
                      {/* GOLD 8 — AI Act classification (propusa, nu verdict final) */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${RISK_LEVEL_COLORS[aiActClass.riskLevel]}`}
                        >
                          {RISK_LEVEL_LABELS[aiActClass.riskLevel]}
                        </span>
                        <span className="text-[11px] text-eos-text-muted">
                          {aiActClass.article} · propus automat — confirmă
                        </span>
                        {aiActClass.riskLevel === "high_risk" && (
                          <Link
                            href={`/dashboard/sisteme/eu-db-wizard?system=${system.id}`}
                            className="text-[11px] font-medium text-eos-primary underline-offset-2 hover:underline"
                          >
                            Pregătire EU DB → deadline 2 aug 2026
                          </Link>
                        )}
                        {aiActClass.riskLevel === "prohibited" && (
                          <span className="text-[11px] font-semibold text-eos-error">
                            Verifică imediat — posibil interzis
                          </span>
                        )}
                      </div>
                    </div>
                  </DenseListItem>
                )
              })}
            </CardContent>
          </Card>

          {inventoryPanel}
        </div>
      )}

      {active === "baseline" && (
        <div className="space-y-6">
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="px-5 py-5">
              <SummaryStrip
                eyebrow="Baseline"
                title="Reperul față de care comparăm schimbarea reală"
                description="Baseline-ul validat separă drift-ul real de zgomotul operațional și dă încredere inventarului."
                items={[
                  {
                    label: "Status",
                    value: validatedBaseline
                      ? `validat ${new Date(validatedBaseline.generatedAt).toLocaleString("ro-RO")}`
                      : "nu există baseline validat",
                    hint: validatedBaseline
                      ? "comparațiile actuale folosesc snapshot-ul validat uman"
                      : "fără baseline validat, drift-ul rămâne mai greu de interpretat",
                    tone: validatedBaseline ? "success" : "warning",
                  },
                  {
                    label: "Inventar confirmat",
                    value: `${confirmedCount}`,
                    hint: "numărul de sisteme care intră în snapshot",
                  },
                  {
                    label: "Drift deschis",
                    value: `${recentDriftsCount}`,
                    hint: "semnale deschise față de snapshot-ul curent",
                    tone: recentDriftsCount > 0 ? "danger" : "success",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <HandoffCard
            title={validatedBaseline ? "Baseline-ul este gata pentru Drift" : "Mai întâi validezi baseline-ul"}
            description={
              validatedBaseline
                ? "După ce ai reperul validat, schimbările merg în Drift și nu mai poluează Discovery sau inventarul."
                : "Momentan baseline-ul se gestionează din Setări. După validare, revii aici doar pentru comparații curate și explicabile."
            }
            destinationLabel={validatedBaseline ? "drift" : "setari / operational"}
            checklist={
              validatedBaseline
                ? [
                    "urmărești schimbările față de snapshot",
                    "nu refaci inventarul de la zero",
                    "trimiți doar abaterile reale spre remediere",
                  ]
                : [
                    "validezi snapshot-ul cu review uman",
                    "fixezi baseline-ul operațional",
                    "revii apoi în Control pentru comparații curate",
                  ]
            }
            actions={
              <>
                {validatedBaseline ? (
                  <Button variant="outline" onClick={onOpenDrift}>
                    Vezi Drift
                  </Button>
                ) : null}
                <Button asChild>
                  <Link href={dashboardRoutes.settings}>
                    Gestionează Baseline
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </Link>
                </Button>
              </>
            }
          />
        </div>
      )}

      {active === "pack" && (
        <div className="space-y-6">
          <SectionBoundary
            eyebrow="Compliance Pack"
            title="Review pe câmpuri și pachete de control"
            description="Confirmi câmpurile și controalele per sistem. Starea de audit și exportul rămân în Audit și export."
          />

          {compliancePack ? (
            <>
              <ControlPackageHighlightsCard
                highlights={buildControlPackageHighlights(compliancePack.entries)}
              />
              <AICompliancePackEntriesCard
                pack={compliancePack}
                title="Pack pre-completat pentru review"
                editable
                busy={busy}
                onUpdateField={onUpdateCompliancePackField}
              />
              <HandoffCard
                title="După review continui în Dovadă"
                description="Compliance Pack rămâne review de control. Livrabilul final și exporturile rămân în Dovadă, nu în aceeași suprafață."
                destinationLabel="dovadă / audit pack"
                checklist={[
                  "confirmi câmpurile importante",
                  "separi review-ul de exportul final",
                  "împingi mai departe doar un pack curat și inteligibil",
                ]}
                actions={
                  <Button asChild>
                    <Link href={dashboardRoutes.dosar}>
                      Mergi la Dosar
                      <ArrowRight className="size-4" strokeWidth={2} />
                    </Link>
                  </Button>
                }
              />
            </>
          ) : (
            <EmptyState
              title="Compliance Pack indisponibil"
              label="Solicită payload-ul complet sau confirmă mai întâi suficiente sisteme pentru review de control."
              className="border-eos-border bg-eos-surface py-10"
            />
          )}
        </div>
      )}
    </div>
  )
}

function ControlDriftWorkspace({
  recentDrifts,
  confirmedCount,
  validatedBaseline,
  onOpenBaseline,
}: {
  recentDrifts: Array<{
    id: string
    summary: string
    severity: "critical" | "high" | "medium" | "low"
    systemLabel?: string | null
    sourceDocument?: string | null
    detectedAtISO: string
  }>
  confirmedCount: number
  validatedBaseline: boolean
  onOpenBaseline: () => void
}) {
  return (
    <div className="space-y-6">
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Drift"
            title="Schimbările față de baseline stau separat de restul Controlului"
            description="Aici investighezi abaterile față de snapshot-ul validat, fără să amesteci inventarul și candidatele cu semnalele de schimbare."
            items={[
              {
                label: "Drift activ",
                value: `${recentDrifts.length}`,
                hint: recentDrifts.length > 0 ? "semnale deschise acum" : "nu există drift deschis",
                tone: recentDrifts.length > 0 ? "danger" : "success",
              },
              {
                label: "Inventar confirmat",
                value: `${confirmedCount}`,
                hint: "sisteme urmărite față de baseline",
              },
              {
                label: "Baseline",
                value: validatedBaseline ? "validat" : "încă nevalidat",
                hint: validatedBaseline ? "comparația este curată" : "fără baseline, drift-ul e mai greu de interpretat",
                tone: validatedBaseline ? "success" : "warning",
              },
            ]}
          />
        </CardContent>
      </Card>

      <SectionBoundary
        eyebrow="Investigație"
        title="Drift-ul este un workspace de semnale, nu un board de remediere"
        description="Aici înțelegi ce s-a schimbat și decizi dacă merge spre remediere. Execuția reală rămâne în Dovadă."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              progressive disclosure
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              fără export aici
            </Badge>
          </>
        }
        support={
          <ActionCluster
            eyebrow="Acțiuni"
            title="Handoff rapid"
            description="Vezi driftul complet sau continuă în Dovadă."
            actions={
              <>
                <Button asChild>
                  <Link href="/dashboard/alerte">
                    Vezi drift complet
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </Link>
                </Button>
                <Button variant="outline" onClick={onOpenBaseline}>
                  Verifică Baseline
                </Button>
                <Button asChild variant="outline">
                  <Link href={dashboardRoutes.resolve}>Deschide De rezolvat</Link>
                </Button>
              </>
            }
          />
        }
      />

      <Card className="border-eos-border bg-eos-surface">
        <CardHeader className="border-b border-eos-border pb-5">
          <CardTitle className="text-xl">Drift recent pe inventar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {recentDrifts.length === 0 && (
            <EmptyState
              title="Niciun drift deschis"
              label="Inventarul confirmat este stabil față de baseline-ul curent."
              className="border-eos-border bg-eos-surface-variant py-8"
            />
          )}
          {recentDrifts.map((drift) => (
            <DenseListItem key={drift.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-eos-text">{drift.summary}</p>
                  <p className="mt-2 text-xs text-eos-text-muted">
                    {drift.systemLabel || drift.sourceDocument || "Inventar AI"} · {formatRelativeRomanian(drift.detectedAtISO)}
                  </p>
                </div>
                <Badge
                  variant={
                    drift.severity === "critical" || drift.severity === "high"
                      ? "destructive"
                      : drift.severity === "medium"
                        ? "warning"
                        : "outline"
                  }
                >
                  {drift.severity}
                </Badge>
              </div>
            </DenseListItem>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ControlReviewWorkspace({
  detectedActiveCount,
  reviewedCount,
  recentDriftsCount,
  validatedBaseline,
  compliancePack: _compliancePack,
  onOpenDiscovery,
  onOpenPack,
  onOpenBaseline,
  onOpenDrift,
}: {
  detectedActiveCount: number
  reviewedCount: number
  recentDriftsCount: number
  validatedBaseline: boolean
  compliancePack: AICompliancePack | null
  onOpenDiscovery: () => void
  onOpenPack: () => void
  onOpenBaseline: () => void
  onOpenDrift: () => void
}) {
  const reviewItems: SummaryStripItem[] = [
    {
      label: "Detecții active",
      value: `${detectedActiveCount}`,
      hint: "cer confirmare sau respingere umană",
      tone: detectedActiveCount > 0 ? "warning" : "success",
    },
    {
      label: "Revizuite",
      value: `${reviewedCount}`,
      hint: "candidate deja corectate de operator",
    },
    {
      label: "Baseline",
      value: validatedBaseline ? "validat" : "în curs",
      hint: validatedBaseline ? "reperul este stabil" : "lipsește confirmarea finală",
      tone: validatedBaseline ? "success" : "warning",
    },
    {
      label: "Drift deschis",
      value: `${recentDriftsCount}`,
      hint: recentDriftsCount > 0 ? "semnale ce cer investigație" : "nu există drift deschis",
      tone: recentDriftsCount > 0 ? "danger" : "success",
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Review"
            title="Queue-ul de validare umană"
            description="Aici vezi ce mai cere confirmare înainte să împingi mai departe."
            items={reviewItems}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <HandoffCard
          title="Review pentru candidate"
          description="Candidatele detectate automat trebuie validate sau respinse explicit."
          destinationLabel="systems / discovery"
          checklist={[
            "verifici providerul, scopul și modelul",
            "corectezi încrederea și review-ul uman",
            "confirmi doar ce este real",
          ]}
          actions={<Button onClick={onOpenDiscovery}>Deschide Discovery</Button>}
        />
        <HandoffCard
          title="Review pentru Compliance Pack"
          description="Câmpurile precompletate cer validare umană înainte să meargă spre dovadă și export."
          destinationLabel="sisteme / compliance pack"
          checklist={[
            "verifici câmpurile sensibile",
            "nu confunzi review-ul cu livrabilul final",
            "împingi mai departe doar un pack curat",
          ]}
          actions={<Button onClick={onOpenPack}>Deschide Compliance Pack</Button>}
        />
        <HandoffCard
          title="Review pentru baseline și drift"
          description="Dacă baseline-ul și drift-ul nu sunt curate, restul controlului devine zgomotos."
          destinationLabel="baseline / drift"
          checklist={[
            "validezi snapshot-ul corect",
            "separi drift-ul real de zgomot",
            "trimiți spre remediere doar ce e justificat",
          ]}
          actions={
            <>
              <Button variant="outline" onClick={onOpenBaseline}>
                Vezi Baseline
              </Button>
              <Button onClick={onOpenDrift}>Vezi Drift</Button>
            </>
          }
        />
      </div>

    </div>
  )
}

function ControlPrimaryTabs({
  active,
  onChange,
  counts,
}: {
  active: ControlPrimaryViewMode
  onChange: (next: ControlPrimaryViewMode) => void
  counts: {
    confirmedCount: number
    detectedActiveCount: number
    recentDrifts: number
    reviewQueueCount: number
  }
}) {
  const tabs: Array<{
    id: ControlPrimaryViewMode
    title: string
    description: string
    badge: string
  }> = [
    {
      id: "overview",
      title: "Prezentare",
      description: "Snapshot control și handoff clar spre zona unde continui lucrul real.",
      badge: `${counts.reviewQueueCount} de validat`,
    },
    {
      id: "systems",
      title: "Sisteme",
      description: "Candidate, inventar, compliance pack și baseline pe același fir de confirmare.",
      badge: `${counts.confirmedCount} confirmate`,
    },
    {
      id: "drift",
      title: "Drift",
      description: "Schimbările față de baseline și investigația lor, separat de inventar.",
      badge: `${counts.recentDrifts} active`,
    },
    {
      id: "review",
      title: "Validare",
      description: "Tot ce cere validare umană înainte să poată deveni sursă de adevăr.",
      badge: `${counts.detectedActiveCount} detectii`,
    },
  ]

  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-eos-md border p-4 text-left transition ${
              isActive
                ? "border-eos-border-subtle bg-eos-surface-active"
                : "border-eos-border bg-eos-surface hover:bg-eos-secondary-hover"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-eos-text">{tab.title}</p>
                <Badge variant="outline" className="shrink-0 normal-case tracking-normal">
                  {tab.badge}
                </Badge>
              </div>
              <p className="text-xs leading-5 text-eos-text-muted">{tab.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function SystemsLinearStepper({
  active,
  onChange,
  detectedActiveCount,
  confirmedCount,
  validatedBaseline,
  compliancePack,
}: {
  active: SystemsSubViewMode
  onChange: (next: SystemsSubViewMode) => void
  detectedActiveCount: number
  confirmedCount: number
  validatedBaseline: boolean
  compliancePack: AICompliancePack | null
}) {
  type StepStatus = "done" | "active" | "pending"

  const steps: Array<{
    id: SystemsSubViewMode
    step: number
    title: string
    description: string
    done: boolean
  }> = [
    {
      id: "discovery",
      step: 1,
      title: "Discovery",
      description: "Detectezi și revizuiești candidatele automate.",
      done: detectedActiveCount === 0 && confirmedCount > 0,
    },
    {
      id: "inventory",
      step: 2,
      title: "Inventar",
      description: "Confirmi sistemele oficiale.",
      done: confirmedCount > 0 && validatedBaseline,
    },
    {
      id: "baseline",
      step: 3,
      title: "Baseline",
      description: "Fixezi reperul pentru drift.",
      done: validatedBaseline,
    },
    {
      id: "pack",
      step: 4,
      title: "Compliance Pack",
      description: "Revizuiești pachetul pre-completat.",
      done: compliancePack !== null,
    },
  ]

  function stepStatus(step: (typeof steps)[number]): StepStatus {
    if (step.id === active) return "active"
    if (step.done) return "done"
    return "pending"
  }

  return (
    <div className="space-y-2">
      {/* Desktop: horizontal stepper */}
      <div className="hidden items-start sm:flex">
        {steps.map((step, index) => {
          const status = stepStatus(step)
          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-start">
              <button
                type="button"
                onClick={() => onChange(step.id)}
                className="group flex min-w-0 flex-1 flex-col items-center gap-2 px-2"
              >
                <div
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition",
                    status === "done"
                      ? "border-eos-success bg-eos-success-soft text-eos-success"
                      : status === "active"
                        ? "border-eos-border-strong bg-eos-surface-active text-eos-text"
                        : "border-eos-border bg-eos-bg text-eos-text-muted"
                  )}
                >
                  {status === "done" ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    step.step
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-semibold transition",
                      status === "active"
                        ? "text-eos-text"
                        : "text-eos-text-muted group-hover:text-eos-text"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-eos-text-muted">{step.description}</p>
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className="mt-4 h-px w-6 shrink-0 self-start bg-eos-border" />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: vertical step list */}
      <div className="flex flex-col gap-2 sm:hidden">
        {steps.map((step) => {
          const status = stepStatus(step)
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onChange(step.id)}
              className={cn(
                "flex items-start gap-3 rounded-eos-md border p-3 text-left transition",
                status === "active"
                  ? "border-eos-border-subtle bg-eos-surface-active"
                  : "border-eos-border bg-eos-surface hover:bg-eos-secondary-hover"
              )}
            >
              <div
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                  status === "done"
                    ? "border-eos-success bg-eos-success-soft text-eos-success"
                    : status === "active"
                      ? "border-eos-border-strong bg-eos-surface-active text-eos-text"
                      : "border-eos-border bg-eos-bg text-eos-text-muted"
                )}
              >
                {status === "done" ? <Check className="size-3" strokeWidth={2.5} /> : step.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-eos-text">{step.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-eos-text-muted">{step.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ControlPackageHighlightsCard({
  highlights,
}: {
  highlights: Array<{
    groupKey: string
    groupLabel: string
    systemsCount: number
    highestPriority: "P1" | "P2" | "P3"
    ownerRoute: string
    bundleHint: string
    businessImpact: string
    familyLabels: string[]
  }>
}) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-xl">Pachete de control dominante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {highlights.length === 0 && (
          <EmptyState
            title="Insuficiente semnale pentru grupuri dominante"
            label="Confirmă mai întâi suficiente sisteme sau completează câmpurile lipsă din pack — vei vedea ce bundle domină pe fiecare categorie."
            className="border-eos-border bg-eos-surface-variant py-8"
          />
        )}
        <div className="grid gap-4 xl:grid-cols-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.groupKey}
              className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-eos-text">{highlight.groupLabel}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      highlight.highestPriority === "P1"
                        ? "destructive"
                        : highlight.highestPriority === "P2"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {highlight.highestPriority}
                  </Badge>
                  <Badge variant="outline">{highlight.systemsCount} sisteme</Badge>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-eos-text-muted">{highlight.businessImpact}</p>
              <p className="mt-3 text-xs text-eos-text-muted">
                <span className="font-medium text-eos-text">Owner route:</span>{" "}
                {highlight.ownerRoute}
              </p>
              <p className="mt-2 text-xs text-eos-text-muted">
                <span className="font-medium text-eos-text">Bundle util:</span>{" "}
                {highlight.bundleHint}
              </p>
              {highlight.familyLabels.length > 0 && (
                <p className="mt-2 text-xs text-eos-text-muted">
                  <span className="font-medium text-eos-text">Familii:</span>{" "}
                  {highlight.familyLabels.join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function buildControlPackageHighlights(entries: AICompliancePackEntry[]) {
  const groups = new Map<
    string,
    {
      groupKey: string
      groupLabel: string
      systems: Set<string>
      highestPriority: "P1" | "P2" | "P3"
      ownerRoute: string
      bundleHint: string
      businessImpact: string
      familyLabels: Set<string>
    }
  >()

  for (const entry of entries) {
    for (const control of entry.compliance.suggestedControls) {
      const groupKey = control.systemGroup ?? "general-operations"
      const current = groups.get(groupKey) ?? {
        groupKey,
        groupLabel: formatSystemGroupLabel(groupKey),
        systems: new Set<string>(),
        highestPriority: control.priority,
        ownerRoute: control.ownerRoute ?? "Owner sistem + responsabil compliance",
        bundleHint:
          control.bundleHint ?? "Bundle recomandat: owner, dovadă operațională și confirmare a controlului.",
        businessImpact:
          control.businessImpact ??
          "Acest grup concentrează controalele care fac sistemele din aceeași zonă mai ușor de apărat în audit.",
        familyLabels: new Set<string>(),
      }

      current.systems.add(entry.systemName)
      if (priorityRank(control.priority) < priorityRank(current.highestPriority)) {
        current.highestPriority = control.priority
      }
      if (control.controlFamily?.label) current.familyLabels.add(control.controlFamily.label)
      if (control.ownerRoute) current.ownerRoute = control.ownerRoute
      if (control.bundleHint) current.bundleHint = control.bundleHint
      if (control.businessImpact) current.businessImpact = control.businessImpact

      groups.set(groupKey, current)
    }
  }

  return [...groups.values()]
    .map((group) => ({
      groupKey: group.groupKey,
      groupLabel: group.groupLabel,
      systemsCount: group.systems.size,
      highestPriority: group.highestPriority,
      ownerRoute: group.ownerRoute,
      bundleHint: group.bundleHint,
      businessImpact: group.businessImpact,
      familyLabels: [...group.familyLabels],
    }))
    .sort((left, right) => {
      if (priorityRank(left.highestPriority) !== priorityRank(right.highestPriority)) {
        return priorityRank(left.highestPriority) - priorityRank(right.highestPriority)
      }
      if (right.systemsCount !== left.systemsCount) {
        return right.systemsCount - left.systemsCount
      }
      return left.groupLabel.localeCompare(right.groupLabel, "ro")
    })
    .slice(0, 3)
}

function formatSystemGroupLabel(value: string) {
  if (value === "customer-support") return "suport clienți"
  if (value === "hr-recruitment") return "HR / recrutare"
  if (value === "finance-operations") return "operațiuni financiare"
  if (value === "marketing-analytics") return "marketing / analytics"
  return "operațiuni generale"
}

function priorityRank(priority: "P1" | "P2" | "P3") {
  if (priority === "P1") return 0
  if (priority === "P2") return 1
  return 2
}
