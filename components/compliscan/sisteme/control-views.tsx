"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
} from "lucide-react"

import { ActionCluster } from "@/components/evidence-os/ActionCluster"
import { Button } from "@/components/evidence-os/Button"
import { DenseListItem } from "@/components/evidence-os/DenseListItem"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { formatRelativeRomanian } from "@/lib/compliance/engine"

export function ControlOverview({
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
      <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
        <div className="px-5 py-5">
          <SummaryStrip
            eyebrow="Stare curentă"
            title="Ce cere confirmare acum"
            description="Alegi zona unde continui confirmarea reală."
            items={items}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Continui confirmarea
            </p>
            <p className="mt-1 text-[12px] text-eos-text-muted">
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
              className="text-[11.5px] text-eos-text-muted underline-offset-2 hover:text-eos-text hover:underline"
            >
              {showGuidance ? "Ascunde ghidajul" : "Arată ghidajul"}
            </button>
          </div>
        </div>
      </section>

      {shouldShowGuidance ? (
        <>
          <SectionBoundary
            eyebrow="Control"
            title="Confirmare umană, fără execuție aici"
            description="Aici validezi inventarul, baseline-ul și drift-ul. Execuția rămâne în Dovadă, iar integrările rămân în Setări."
            badges={
              <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
                baseline + drift
              </span>
            }
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

export function ControlDriftWorkspace({
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
      <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
        <div className="px-5 py-5">
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
        </div>
      </section>

      <SectionBoundary
        eyebrow="Investigație"
        title="Drift-ul este un workspace de semnale, nu un board de remediere"
        description="Aici înțelegi ce s-a schimbat și decizi dacă merge spre remediere. Execuția reală rămâne în Dovadă."
        badges={
          <>
            <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
              progressive disclosure
            </span>
            <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
              fără export aici
            </span>
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

      <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
        <header className="border-b border-eos-border-subtle px-4 py-3.5">
          <h3
            data-display-text="true"
            className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Drift recent pe inventar
          </h3>
        </header>
        <div className="space-y-4 px-4 py-4">
          {recentDrifts.length === 0 && (
            <div className="rounded-eos-lg border border-dashed border-eos-border bg-white/[0.02] px-4 py-8 text-center">
              <p
                data-display-text="true"
                className="font-display text-[13.5px] font-semibold tracking-[-0.01em] text-eos-text"
              >
                Niciun drift deschis
              </p>
              <p className="mt-1.5 text-[12px] leading-[1.5] text-eos-text-muted">
                Inventarul confirmat este stabil față de baseline-ul curent.
              </p>
            </div>
          )}
          {recentDrifts.map((drift) => {
            const severityTone =
              drift.severity === "critical" || drift.severity === "high"
                ? "border-eos-error/30 bg-eos-error-soft text-eos-error"
                : drift.severity === "medium"
                  ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
                  : "border-eos-border bg-eos-surface-elevated text-eos-text-muted"
            return (
              <DenseListItem key={drift.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-eos-text">{drift.summary}</p>
                    <p className="mt-2 text-[11.5px] text-eos-text-muted">
                      {drift.systemLabel || drift.sourceDocument || "Inventar AI"} ·{" "}
                      {formatRelativeRomanian(drift.detectedAtISO)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-sm border ${severityTone} px-1.5 py-0.5 font-mono text-[10px] font-medium`}
                  >
                    {drift.severity}
                  </span>
                </div>
              </DenseListItem>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export function ControlReviewWorkspace({
  detectedActiveCount,
  reviewedCount,
  recentDriftsCount,
  validatedBaseline,
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
      <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
        <div className="px-5 py-5">
          <SummaryStrip
            eyebrow="Review"
            title="Queue-ul de validare umană"
            description="Aici vezi ce mai cere confirmare înainte să împingi mai departe."
            items={reviewItems}
          />
        </div>
      </section>

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
