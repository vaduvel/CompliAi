"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
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
import { formatPurposeLabel } from "@/lib/compliance/ai-inventory"
import { formatRelativeRomanian } from "@/lib/compliance/engine"
import type { AISystemPurpose } from "@/lib/compliance/types"

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

const AICompliancePackSummaryCard = dynamic(
  () =>
    import("@/components/compliscan/ai-compliance-pack-card").then(
      (mod) => mod.AICompliancePackSummaryCard
    ),
  { loading: () => <LoadingScreen variant="section" /> }
)

const AICompliancePackEntriesCard = dynamic(
  () =>
    import("@/components/compliscan/ai-compliance-pack-card").then(
      (mod) => mod.AICompliancePackEntriesCard
    ),
  { loading: () => <LoadingScreen variant="section" /> }
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
        title="Confirmi ce intra in inventarul oficial si ce devine drift real"
        description="Aici validezi candidatele, reperul si drift-ul real. Executia ramane in Dovada."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {confirmedCount} sisteme confirmate
            </Badge>
            <Badge variant={recentDrifts.length > 0 ? "warning" : "success"} className="normal-case tracking-normal">
              {recentDrifts.length > 0 ? `${recentDrifts.length} drift activ` : "fara drift activ"}
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              {validatedBaseline ? "baseline validat" : "baseline in curs"}
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
              : "inca nevalidat"
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
      hint: confirmedCount > 0 ? "sisteme asumate operational" : "inca lipsesc sisteme confirmate",
      tone: confirmedCount > 0 ? "success" : "neutral",
    },
    {
      label: "Detectii active",
      value: `${detectedActiveCount}`,
      hint: "candidate care cer validare umana inainte de intrare in inventar",
      tone: detectedActiveCount > 0 ? "warning" : "neutral",
    },
    {
      label: "Calitate dovada",
      value: hasEvidenceLedger
        ? evidenceLedgerWeak > 0
          ? `${evidenceLedgerWeak} slabe`
          : evidenceLedgerUnrated > 0
            ? `${evidenceLedgerUnrated} neevaluate`
            : `${evidenceLedgerReady} verificate`
        : "fara registru",
      hint: hasEvidenceLedger
        ? evidenceLedgerWeak > 0
          ? "inlocuiesti dovezile slabe in Dovada"
          : evidenceLedgerUnrated > 0
            ? "complementezi review-ul de dovada"
            : "registru curat"
        : "apare dupa primul upload de dovada",
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
      hint: "reperul fata de care masuram drift-ul real",
      tone: validatedBaselineLabel.startsWith("validat") ? "success" : "warning",
    },
    {
      label: "Drift activ",
      value: `${recentDriftsCount}`,
      hint: recentDriftsCount > 0 ? "semnale care cer investigatie" : "nu exista semnale deschise acum",
      tone: recentDriftsCount > 0 ? "danger" : "success",
      meta: `${summary.score} · ${summary.riskLabel}`,
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Stare curenta"
            title="Ce ceri sa confirmi acum"
            description="Alegi zona unde continui confirmarea reala."
            items={items}
          />
        </CardContent>
      </Card>

      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-sm font-semibold text-eos-text">Continui confirmarea</p>
            <p className="text-xs text-eos-text-muted">
              Control ramane doar pentru confirmare. Executia ramane in Dovada.
            </p>
          </div>
          <div className="min-w-[240px] space-y-2">
            <ActionCluster
              eyebrow="Actiuni"
              title="Unde continui"
              description="Alegi zona de confirmare reala."
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
              {showGuidance ? "Ascunde ghidajul" : "Arata ghidajul"}
            </button>
          </div>
        </CardContent>
      </Card>

      {shouldShowGuidance ? (
        <>
          <SectionBoundary
            eyebrow="Control"
            title="Confirmare umana, fara executie aici"
            description="Aici validezi inventarul, baseline-ul si drift-ul. Executia ramane in Dovada, iar integrarile raman in Setari."
            badges={<Badge variant="outline" className="normal-case tracking-normal">baseline + drift</Badge>}
            support={
              <ActionCluster
                eyebrow="Actiuni"
                title="Handoff rapid"
                description="Continui in zona potrivita."
                actions={
                  <>
                    <Button variant="outline" onClick={onOpenDiscovery}>
                      Discovery
                    </Button>
                    <Button variant="outline" onClick={onOpenBaseline}>
                      Baseline
                    </Button>
                    <Button asChild>
                      <Link href="/dashboard/setari">
                        Setari
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
              title="Continui in Sisteme"
              description="Aici lucrezi pe candidate, inventar, compliance pack si baseline."
              destinationLabel="workspace principal"
              checklist={[
                "incepi cu Discovery daca ai candidate noi",
                "confirmi doar ce este real si asumat",
                "salvezi baseline-ul dupa review uman",
              ]}
              actions={<Button onClick={onOpenSystems}>Deschide Sisteme</Button>}
            />
            <HandoffCard
              title="Drift-ul sta separat"
              description="Cand ai schimbari fata de baseline, le investighezi separat si trimiti doar ce merita in remediere."
              destinationLabel="investigatie"
              checklist={[
                "vezi ce s-a schimbat fata de baseline",
                "decizi daca merge spre remediere",
                "nu inchizi auditul direct din Control",
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
        title="Candidatele, inventarul, compliance pack si baseline-ul stau pe acelasi fir de confirmare"
        description="Sub-taburile de mai jos separa ce descoperi, ce confirmi, ce revizuiesti si ce fixezi ca reper."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {confirmedCount} confirmate
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              {detectedActiveCount} detectii active
            </Badge>
          </>
        }
        support={<SystemsSubTabs active={active} onChange={onChange} />}
      />

      {active === "discovery" && (
        <div className="space-y-6">
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="px-5 py-5">
              <SummaryStrip
                eyebrow="Discovery"
                title="Candidate detectate automat"
                description="Aici lucrezi pe work queue-ul de detectie. Corectezi si validezi doar ce merita sa devina sistem oficial."
                items={[
                  {
                    label: "Detectii active",
                    value: `${detectedActiveCount}`,
                    hint: "candidate care inca nu au fost confirmate sau respinse",
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
            title="Dupa Discovery continui in Inventar"
            description="Ce a fost confirmat uman trebuie sa intre in inventarul oficial, nu sa ramana blocat in candidate."
            destinationLabel="inventar oficial"
            checklist={[
              "confirmi scopul si modelul",
              "verifici nivelul de risc si review uman",
              "misti doar sistemele curate in inventar",
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
                title="Sisteme asumate operational"
                description="De aici incolo nu mai lucrezi cu candidate, ci cu inventarul confirmat care sustine baseline-ul si drift-ul."
                items={[
                  {
                    label: "Confirmate",
                    value: `${confirmedCount}`,
                    hint: "sisteme deja intrate in inventarul oficial",
                    tone: confirmedCount > 0 ? "success" : "neutral",
                  },
                  {
                    label: "High-risk",
                    value: `${aiHighRisk}`,
                    hint: "cer control si urmarire prioritara",
                    tone: aiHighRisk > 0 ? "danger" : "success",
                  },
                  {
                    label: "Limited / minimal",
                    value: `${aiLowRisk}`,
                    hint: "raman in inventar, dar cu presiune de control mai mica",
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
                  title="Inca nu exista sisteme confirmate"
                  label="Confirmi mai intai o detectie din Discovery sau adaugi manual un sistem nou daca sursa tehnica lipseste."
                  className="border-eos-border bg-eos-surface-variant py-8"
                />
              )}
              {recentInventory.map((system) => (
                <div
                  key={system.id}
                  className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-eos-text">{system.name}</p>
                      <p className="mt-1 text-sm text-eos-text-muted">
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
                  <p className="mt-2 text-xs text-eos-text-muted">
                    {system.modelType} · {system.hasHumanReview ? "cu review uman" : "fara review uman"}
                  </p>
                </div>
              ))}
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
                title="Reperul fata de care comparam schimbarea reala"
                description="Baseline-ul validat separa drift-ul real de zgomotul operational si da incredere inventarului."
                items={[
                  {
                    label: "Status",
                    value: validatedBaseline
                      ? `validat ${new Date(validatedBaseline.generatedAt).toLocaleString("ro-RO")}`
                      : "nu exista baseline validat",
                    hint: validatedBaseline
                      ? "comparatiile actuale folosesc snapshot-ul validat uman"
                      : "fara baseline validat, drift-ul ramane mai greu de interpretat",
                    tone: validatedBaseline ? "success" : "warning",
                  },
                  {
                    label: "Inventar confirmat",
                    value: `${confirmedCount}`,
                    hint: "numarul de sisteme care intra in snapshot",
                  },
                  {
                    label: "Drift deschis",
                    value: `${recentDriftsCount}`,
                    hint: "semnale deschise fata de snapshot-ul curent",
                    tone: recentDriftsCount > 0 ? "danger" : "success",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <HandoffCard
            title={validatedBaseline ? "Baseline-ul este gata pentru Drift" : "Mai intai validezi baseline-ul"}
            description={
              validatedBaseline
                ? "Dupa ce ai reperul validat, schimbarile merg in Drift si nu mai polueaza Discovery sau inventarul."
                : "Momentan baseline-ul se gestioneaza din Setari. Dupa validare, revii aici doar pentru comparatii curate si explicabile."
            }
            destinationLabel={validatedBaseline ? "drift" : "setari / operational"}
            checklist={
              validatedBaseline
                ? [
                    "urmaresti schimbarile fata de snapshot",
                    "nu refaci inventarul de la zero",
                    "trimiti doar abaterile reale spre remediere",
                  ]
                : [
                    "validezi snapshot-ul cu review uman",
                    "fixezi baseline-ul operational",
                    "revii apoi in Control pentru comparatii curate",
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
                  <Link href="/dashboard/setari">
                    Gestioneaza Baseline
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
            title="Review pe campuri si pachete de control"
            description="Aici verifici ce a fost precompletat si ce trebuie confirmat uman inainte de a impinge mai departe spre dovada si audit."
          />

          {compliancePack ? (
            <>
              <AICompliancePackSummaryCard pack={compliancePack} compact />
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
                title="Dupa review continui in Dovada"
                description="Compliance Pack ramane review de control. Livrabilul final si exporturile raman in Dovada, nu in aceeasi suprafata."
                destinationLabel="dovada / audit pack"
                checklist={[
                  "confirmi campurile importante",
                  "separi review-ul de exportul final",
                  "impingi mai departe doar un pack curat si inteligibil",
                ]}
                actions={
                  <Button asChild>
                    <Link href="/dashboard/rapoarte">
                      Mergi la Audit si export
                      <ArrowRight className="size-4" strokeWidth={2} />
                    </Link>
                  </Button>
                }
              />
            </>
          ) : (
            <EmptyState
              title="Compliance Pack indisponibil"
              label="Solicita payload-ul complet sau confirma mai intai suficiente sisteme pentru review de control."
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
            title="Schimbarile fata de baseline stau separat de restul Controlului"
            description="Aici investighezi abaterile fata de snapshot-ul validat, fara sa amesteci inventarul si candidatele cu semnalele de schimbare."
            items={[
              {
                label: "Drift activ",
                value: `${recentDrifts.length}`,
                hint: recentDrifts.length > 0 ? "semnale deschise acum" : "nu exista drift deschis",
                tone: recentDrifts.length > 0 ? "danger" : "success",
              },
              {
                label: "Inventar confirmat",
                value: `${confirmedCount}`,
                hint: "sisteme urmarite fata de baseline",
              },
              {
                label: "Baseline",
                value: validatedBaseline ? "validat" : "inca nevalidat",
                hint: validatedBaseline ? "comparatia este curata" : "fara baseline, drift-ul e mai greu de interpretat",
                tone: validatedBaseline ? "success" : "warning",
              },
            ]}
          />
        </CardContent>
      </Card>

      <SectionBoundary
        eyebrow="Investigatie"
        title="Drift-ul este un workspace de semnale, nu un board de remediere"
        description="Aici intelegi ce s-a schimbat si decizi daca merge spre remediere. Execuția reala ramane in Dovada."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              progressive disclosure
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              fara export aici
            </Badge>
          </>
        }
        support={
          <ActionCluster
            eyebrow="Actiuni"
            title="Handoff rapid"
            description="Vezi driftul complet sau continua in Dovada."
            actions={
              <>
                <Button asChild>
                  <Link href="/dashboard/alerte">
                    Vezi drift complet
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </Link>
                </Button>
                <Button variant="outline" onClick={onOpenBaseline}>
                  Verifica Baseline
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/checklists">Deschide Remedierea</Link>
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
              title="Nu exista drift deschis"
              label="Inventarul confirmat este stabil fata de baseline-ul curent."
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
  compliancePack,
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
      label: "Detectii active",
      value: `${detectedActiveCount}`,
      hint: "cer confirmare sau respingere umana",
      tone: detectedActiveCount > 0 ? "warning" : "success",
    },
    {
      label: "Revizuite",
      value: `${reviewedCount}`,
      hint: "candidate deja corectate de operator",
    },
    {
      label: "Baseline",
      value: validatedBaseline ? "validat" : "in curs",
      hint: validatedBaseline ? "reperul este stabil" : "lipseste confirmarea finala",
      tone: validatedBaseline ? "success" : "warning",
    },
    {
      label: "Drift deschis",
      value: `${recentDriftsCount}`,
      hint: recentDriftsCount > 0 ? "semnale ce cer investigatie" : "nu exista drift deschis",
      tone: recentDriftsCount > 0 ? "danger" : "success",
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Review"
            title="Queue-ul de validare umana"
            description="Aici vezi ce mai cere confirmare inainte sa impingi mai departe."
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
            "verifici providerul, scopul si modelul",
            "corectezi increderea si review-ul uman",
            "confirmi doar ce este real",
          ]}
          actions={<Button onClick={onOpenDiscovery}>Deschide Discovery</Button>}
        />
        <HandoffCard
          title="Review pentru Compliance Pack"
          description="Campurile precompletate cer validare umana inainte sa mearga spre dovada si export."
          destinationLabel="systems / compliance pack"
          checklist={[
            "verifici campurile sensibile",
            "nu confunzi review-ul cu livrabilul final",
            "impingi mai departe doar un pack curat",
          ]}
          actions={<Button onClick={onOpenPack}>Deschide Compliance Pack</Button>}
        />
        <HandoffCard
          title="Review pentru baseline si drift"
          description="Daca baseline-ul si drift-ul nu sunt curate, restul controlului devine zgomotos."
          destinationLabel="baseline / drift"
          checklist={[
            "validezi snapshot-ul corect",
            "separi drift-ul real de zgomot",
            "trimiti spre remediere doar ce e justificat",
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

      {compliancePack ? (
        <>
          <AICompliancePackSummaryCard pack={compliancePack} compact />
          <ControlPackageHighlightsCard highlights={buildControlPackageHighlights(compliancePack.entries)} />
        </>
      ) : null}
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
      title: "Overview",
      description: "Snapshot control si handoff clar spre zona unde continui lucrul real.",
      badge: `${counts.reviewQueueCount} review`,
    },
    {
      id: "systems",
      title: "Sisteme",
      description: "Candidate, inventar, compliance pack si baseline pe acelasi fir de confirmare.",
      badge: `${counts.confirmedCount} confirmate`,
    },
    {
      id: "drift",
      title: "Drift",
      description: "Schimbarile fata de baseline si investigatia lor, separat de inventar.",
      badge: `${counts.recentDrifts} active`,
    },
    {
      id: "review",
      title: "Review",
      description: "Tot ce cere validare umana inainte sa poata deveni sursa de adevar.",
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-eos-text">{tab.title}</p>
                <p className="mt-1 text-sm leading-6 text-eos-text-muted">{tab.description}</p>
              </div>
              <Badge variant="outline" className="rounded-full px-2.5 py-1 normal-case tracking-normal">
                {tab.badge}
              </Badge>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function SystemsSubTabs({
  active,
  onChange,
}: {
  active: SystemsSubViewMode
  onChange: (next: SystemsSubViewMode) => void
}) {
  const tabs: Array<{
    id: SystemsSubViewMode
    title: string
    description: string
  }> = [
    {
      id: "discovery",
      title: "Discovery",
      description: "Candidate detectate automat si corectate inainte de confirmare.",
    },
    {
      id: "inventory",
      title: "Inventar",
      description: "Sistemele oficiale asumate operational.",
    },
    {
      id: "baseline",
      title: "Baseline",
      description: "Snapshot-ul validat fata de care masuram drift-ul.",
    },
    {
      id: "pack",
      title: "Compliance Pack",
      description: "Review pe campuri si pachete de control pentru sursele confirmate.",
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
            className={`rounded-eos-md border px-4 py-3 text-left transition ${
              isActive
                ? "border-eos-border-subtle bg-eos-surface-active"
                : "border-eos-border bg-eos-surface hover:bg-eos-secondary-hover"
            }`}
          >
            <p className="text-sm font-semibold text-eos-text">{tab.title}</p>
            <p className="mt-1 text-xs leading-5 text-eos-text-muted">{tab.description}</p>
          </button>
        )
      })}
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
            title="Inca nu exista suficiente semnale pentru grupuri dominante"
            label="Confirmi mai intai suficiente sisteme sau completezi campurile lipsa din pack, apoi aici vei vedea ce bundle domina pe fiecare categorie."
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
