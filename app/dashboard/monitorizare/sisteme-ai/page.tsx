"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, CalendarClock, AlertTriangle } from "lucide-react"

import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { ControlOverview, ControlDriftWorkspace, ControlReviewWorkspace } from "@/components/compliscan/sisteme/control-views"
import { ControlSystemsWorkspace } from "@/components/compliscan/sisteme/ControlSystemsWorkspace"
import { ControlPrimaryTabs } from "@/components/compliscan/sisteme/control-nav"
import type {
  ControlPrimaryViewMode,
  SystemsSubViewMode,
} from "@/components/compliscan/sisteme/sisteme-shared"

const AIDiscoveryPanel = dynamic(
  () => import("@/components/compliscan/ai-discovery-panel").then((mod) => mod.AIDiscoveryPanel),
  { loading: () => <LoadingScreen variant="section" /> }
)

const AIInventoryPanel = dynamic(
  () => import("@/components/compliscan/ai-inventory-panel").then((mod) => mod.AIInventoryPanel),
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
              <Link href="/dashboard/monitorizare/alerte">
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
          href="/dashboard/monitorizare/sisteme-ai/eu-db-wizard"
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
