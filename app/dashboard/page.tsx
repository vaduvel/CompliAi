"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowRight,
  Clock3,
  ShieldAlert,
  UserRound,
  ChevronRight,
  Activity,
  CheckCircle2,
  FileText,
  MapPin,
  Phone,
} from "lucide-react"

import { AccumulationCard } from "@/components/compliscan/dashboard/accumulation-card"
import { DriftActiveCard } from "@/components/compliscan/drift-active-card"
import { Nis2CockpitCard } from "@/components/compliscan/nis2-cockpit-card"
import { RiskTrajectoryWidget } from "@/components/compliscan/risk-trajectory-widget"
import { ErrorScreen } from "@/components/compliscan/route-sections"
import {
  V3FindingRow,
  V3FrameworkTag,
  V3KpiStrip,
  V3PageHero,
  V3Panel,
  V3RiskPill,
  type V3KpiItem,
  type V3KpiTone,
  type V3SeverityTone,
} from "@/components/compliscan/v3"
import { Skeleton, SkeletonMetric } from "@/components/evidence-os/Skeleton"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { APPLICABILITY_TAG_LABELS } from "@/lib/compliance/applicability"
import { dashboardFindingRoute, dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type {
  ComplianceDriftRecord,
  ComplianceEvent,
  GeneratedDocumentRecord,
  FindingCategory,
} from "@/lib/compliance/types"
import { buildExternalFeedItems, buildProactiveSystemChecks } from "@/lib/compliscan/feed-sources"
import { sortFindingsForTriage } from "@/lib/compliscan/finding-triage"
import { isFindingActive } from "@/lib/compliscan/finding-cockpit"
import type { AppNotification } from "@/lib/server/notifications-store"
import type { CockpitTask } from "@/components/compliscan/types"
import type { ApplicabilityTag } from "@/lib/compliance/applicability"

type ActivityFeedItem = {
  id: string
  eyebrow: string
  title: string
  detail: string
  dateISO: string
  tone: "default" | "success" | "warning"
  href?: string
}

// Map applicability tags → FindingCategory
const TAG_TO_CATEGORY: Partial<Record<ApplicabilityTag, FindingCategory>> = {
  gdpr: "GDPR",
  nis2: "NIS2",
  "ai-act": "EU_AI_ACT",
  efactura: "E_FACTURA",
}

const DASHBOARD_TIME_ZONE = "Europe/Bucharest"

const DASHBOARD_FEED_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ro-RO", {
  timeZone: DASHBOARD_TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

const DASHBOARD_FEED_DATE_FORMATTER = new Intl.DateTimeFormat("ro-RO", {
  timeZone: DASHBOARD_TIME_ZONE,
  day: "numeric",
  month: "numeric",
  year: "numeric",
})

function formatDashboardFeedDateTime(iso: string) {
  return DASHBOARD_FEED_DATE_TIME_FORMATTER.format(new Date(iso))
}

function formatDashboardFeedDate(iso: string) {
  return DASHBOARD_FEED_DATE_FORMATTER.format(new Date(iso))
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cockpit = useCockpitData()
  const [highlightAccumulation, setHighlightAccumulation] = useState(false)
  const [externalNotifications, setExternalNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { notifications?: AppNotification[] } | null) => {
        if (d?.notifications) setExternalNotifications(d.notifications)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (searchParams.get("focus") !== "accumulation") return
    const scroll = () => {
      const node = document.getElementById("dashboard-accumulation-card")
      if (!node) return false
      node.scrollIntoView({ behavior: "smooth", block: "center" })
      setHighlightAccumulation(true)
      window.setTimeout(() => setHighlightAccumulation(false), 2600)
      const url = new URL(window.location.href)
      url.searchParams.delete("focus")
      window.history.replaceState(window.history.state, "", url.toString())
      return true
    }
    if (scroll()) return
    const t = window.setTimeout(scroll, 450)
    return () => window.clearTimeout(t)
  }, [searchParams])

  // Layer 4 cross-sell — utilizatorul a încercat să acceseze direct un modul
  // restricted pentru icpSegment-ul lui. Middleware l-a redirectat aici cu
  // ?cross-sell=<navId>. Afișăm toast cu link la Settings → Module disponibile.
  useEffect(() => {
    const navId = searchParams.get("cross-sell")
    if (!navId) return
    const moduleLabels: Record<string, string> = {
      dpia: "DPIA Art. 35",
      ropa: "RoPA Art. 30",
      dsar: "DSAR (cereri persoane vizate)",
      breach: "Breach ANSPDCP",
      training: "Training GDPR",
      "vendor-review": "Vendor Risk Register",
      "cabinet-templates": "Template-uri cabinet",
      "magic-links": "Magic Links aprobare",
      approvals: "Aprobări",
      generator: "Generator documente",
      nis2: "NIS2 — Securitate cibernetică",
      dora: "DORA — Reziliență digitală",
      fiscal: "Fiscal layer (e-Factura/SAF-T/e-TVA)",
      "pay-transparency": "Pay Transparency",
      whistleblowing: "Whistleblowing",
      "review-cycles": "Review-uri",
      agenti: "Agenți AI",
      politici: "Politici interne",
      "dpo-migration": "Migrare istoric DPO",
    }
    const label = moduleLabels[navId] ?? navId
    toast.info(`Modulul ${label} nu este disponibil pe planul tău`, {
      description: "Activează modulele suplimentare din Setări → Module disponibile.",
      duration: 6000,
    })
    // Curăță query param ca să nu reapară toast-ul la refresh
    const url = new URL(window.location.href)
    url.searchParams.delete("cross-sell")
    window.history.replaceState(window.history.state, "", url.toString())
  }, [searchParams])

  if (cockpit.error && !cockpit.loading) return <ErrorScreen message={cockpit.error} variant="section" />
  if (cockpit.loading || !cockpit.data) return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
      </div>
      <Skeleton className="h-32 w-full rounded-eos-lg" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-eos-lg" />
        <Skeleton className="h-24 rounded-eos-lg" />
        <Skeleton className="h-24 rounded-eos-lg" />
      </div>
    </div>
  )

  const { data, activeDrifts, tasks, nextBestAction, openAlerts } = cockpit
  const state = data.state
  const importedContext = state.importedClientContext ?? null
  const applicability = state.applicability ?? null
  const applicableEntries = (applicability?.entries ?? []).filter((e) => e.certainty !== "unlikely")
  const openTasks = tasks.filter((t) => t.status !== "done")
  const activeFindings = state.findings.filter(isFindingActive)
  const missingEvidenceCount = openTasks.filter((t) => !t.attachedEvidence).length
  const hasBaselineEvidence = Boolean(
    state.scans.length > 0 || state.scannedDocuments > 0 || state.validatedBaselineSnapshotId
  )
  const activeRiskCount = openAlerts.length + activeDrifts.length
  const latestSnapshot = state.snapshotHistory[0] ?? null
  const previousSnapshot = state.snapshotHistory[1] ?? null
  const scoreDelta =
    latestSnapshot && previousSnapshot
      ? latestSnapshot.summary.complianceScore - previousSnapshot.summary.complianceScore
      : null
  const topFindings = sortFindingsForTriage(activeFindings).slice(0, 5)
  const nextBestActionFindingId = nextBestAction?.relatedFindingIds[0] ?? null
  const nextBestActionHref = nextBestActionFindingId
    ? dashboardFindingRoute(nextBestActionFindingId)
    : dashboardRoutes.resolve

  // Issue 7 DPO — folosim stadiul canonic deriveAuditReadiness ca sursă unică.
  // "Audit ready" implică acum și baseline validat (a 8-a precondiție).
  const canonicalAuditReadiness = data.auditReadinessSummary?.auditReadiness
  const hasValidatedBaseline = Boolean(state.validatedBaselineSnapshotId)
  const auditStatusLabel =
    canonicalAuditReadiness === "audit_ready"
      ? "Audit ready"
      : data.summary.score >= 90
        ? "Pregătit"
        : activeDrifts.some((d) => d.blocksAudit)
          ? "Blocat"
          : missingEvidenceCount > 0
            ? "Dovezi slabe"
            : data.summary.score >= 60
              ? "În progres"
              : "Neînceput"

  // Per-framework status derived from findings
  const frameworkItems = applicableEntries
    .filter((e) => TAG_TO_CATEGORY[e.tag])
    .map((entry) => {
      const cat = TAG_TO_CATEGORY[entry.tag]!
      const findings = activeFindings.filter((f) => f.category === cat)
      const hasCritical = findings.some((f) => f.severity === "critical" || f.severity === "high")
      const hasMedium = findings.some((f) => f.severity === "medium")
      const status: "ok" | "warning" | "critical" = hasCritical
        ? "critical"
        : hasMedium
          ? "warning"
          : "ok"
      return {
        tag: entry.tag,
        label: APPLICABILITY_TAG_LABELS[entry.tag],
        status,
        count: findings.length,
      }
    })
  const applicabilitySummary =
    applicableEntries.length > 0
      ? applicableEntries.map((entry) => APPLICABILITY_TAG_LABELS[entry.tag]).join(" · ")
      : "Se completează după primul snapshot"
  const nextActionSummary = nextBestAction
    ? nextBestAction.title
    : "Intră în De rezolvat și lucrează pe cazul prioritar."

  const internalFeedItems = buildActivityFeedItems({
    events: state.events,
    activeDrifts,
    generatedDocuments: state.generatedDocuments,
  })
  const externalFeedItems = buildExternalFeedItems(externalNotifications, state)
  const systemCheckItems = buildProactiveSystemChecks(state, data.summary.score, data.summary.redAlerts)
  const activityFeedItems = [
    ...internalFeedItems,
    ...externalFeedItems.map((i) => ({ id: i.id, eyebrow: i.eyebrow, title: i.title, detail: i.detail, dateISO: i.dateISO, tone: i.tone, href: i.href })),
    ...systemCheckItems.map((i) => ({ id: i.id, eyebrow: i.eyebrow, title: i.title, detail: i.detail, dateISO: i.dateISO, tone: i.tone, href: i.href })),
  ]
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .slice(0, 4)

  // ── No profile ────────────────────────────────────────────────────────────
  if (!state.orgProfile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-eos-lg border border-eos-border bg-eos-primary-soft">
          <ShieldAlert className="h-6 w-6 text-eos-primary" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold text-eos-text">Completează profilul firmei</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-eos-text-tertiary">
          În 2 minute afli ce legi ți se aplică, ce documente ai nevoie și ce riscuri există.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 flex items-center gap-2 rounded-eos-lg bg-eos-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-eos-primary/20 transition-all hover:bg-eos-primary/90"
        >
          Începe analiza gratuită <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    )
  }

  const score = data.summary.score

  const readinessStripe: V3KpiTone | undefined =
    score >= 80 ? "info" : score >= 60 ? "warning" : "critical"
  const readinessValueTone: V3KpiTone =
    score >= 80 ? "info" : score >= 60 ? "warning" : "critical"
  const readinessLabel = score >= 80 ? "Stabil" : score >= 60 ? "În progres" : "Risc ridicat"
  const scoreTrend =
    scoreDelta !== null && scoreDelta !== 0 ? `${scoreDelta > 0 ? "+" : ""}${scoreDelta}p` : null
  const scoreTrendDirection: "up" | "down" | "flat" | undefined =
    scoreDelta === null || scoreDelta === 0 ? "flat" : scoreDelta > 0 ? "down" : "up"

  const kpiItems: V3KpiItem[] = [
    {
      id: "readiness",
      label: "Readiness",
      value: score,
      valueUnit: "%",
      stripe: readinessStripe,
      valueTone: readinessValueTone,
      detail: readinessLabel,
      trend: scoreTrend ?? undefined,
      trendDirection: scoreTrendDirection,
    },
    {
      id: "cazuri",
      label: "Cazuri active",
      value: activeFindings.length,
      stripe: activeFindings.length > 0 ? "critical" : undefined,
      valueTone: activeFindings.length > 0 ? "critical" : "neutral",
      detail: activeFindings.length === 0
        ? "Nicio problemă activă"
        : activeFindings.length === 1
          ? "1 caz deschis"
          : `${activeFindings.length} cazuri deschise`,
    },
    {
      id: "drift",
      label: "Modificări detectate",
      value: activeDrifts.length,
      stripe: activeDrifts.length > 0 ? "warning" : undefined,
      valueTone: activeDrifts.length > 0 ? "warning" : "neutral",
      detail: activeDrifts.length === 0 ? "Control stabil" : "schimbări detectate",
    },
    {
      id: "audit",
      label: "Audit dosar",
      value: auditStatusLabel,
      stripe:
        auditStatusLabel === "Audit ready" || auditStatusLabel === "Pregătit"
          ? "success"
          : auditStatusLabel === "Blocat"
            ? "critical"
            : undefined,
      valueTone:
        auditStatusLabel === "Audit ready" || auditStatusLabel === "Pregătit"
          ? "success"
          : auditStatusLabel === "Blocat"
            ? "critical"
            : "warning",
      // Issue 2 DPO — semnal vizibil pe cockpit când baseline e validat.
      detail: hasValidatedBaseline
        ? "Baseline validat ✓"
        : missingEvidenceCount > 0
          ? `${missingEvidenceCount} dovezi lipsă`
          : "dosar complet",
    },
    {
      id: "aplicabil",
      label: "Se aplică",
      value: frameworkItems.length || applicableEntries.length,
      stripe: "info",
      detail: applicabilitySummary,
    },
  ]

  return (
    <div className="space-y-5 pb-20 sm:pb-0" role="main">

      {/* ── V3 hero ─────────────────────────────────────────────────────── */}
      <V3PageHero
        breadcrumbs={[{ label: data.workspace?.orgName ?? "Firma mea" }, { label: "Acasă", current: true }]}
        title={data.workspace?.orgName ?? "Tablou de bord"}
        description={
          <>
            Vezi ce se aplică, ce e în lucru și ce trebuie să faci acum. {" "}
            <strong className="text-eos-text">{nextActionSummary}</strong>
          </>
        }
        actions={
          <>
            <Link
              href={dashboardRoutes.scan}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 text-[12.5px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
            >
              Scanare
            </Link>
            <Link
              href={nextBestActionHref}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-eos-sm bg-eos-primary px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-primary-hover"
            >
              Deschide cockpit
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </Link>
          </>
        }
      />

      {/* ── KPI strip — V3 ──────────────────────────────────────────────── */}
      <V3KpiStrip items={kpiItems} />

      {importedContext ? (
        <div className="rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Context importat din fișierul cabinetului
              </p>
              <p className="mt-1 text-sm font-medium text-eos-text">
                Datele importate din Excel/Drive rămân atașate clientului.
              </p>
            </div>
            <span className="rounded-full border border-eos-border bg-eos-surface-active px-2.5 py-1 font-mono text-[10px] text-eos-text-tertiary">
              import · {new Date(importedContext.importedAtISO).toLocaleDateString("ro-RO")}
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {importedContext.contactName || importedContext.contactEmail ? (
              <ImportedContextChip
                icon={<UserRound className="size-3.5" strokeWidth={2} />}
                label="Contact client"
                value={[importedContext.contactName, importedContext.contactEmail].filter(Boolean).join(" · ")}
              />
            ) : null}
            {importedContext.phone ? (
              <ImportedContextChip
                icon={<Phone className="size-3.5" strokeWidth={2} />}
                label="Telefon"
                value={importedContext.phone}
              />
            ) : null}
            {importedContext.city ? (
              <ImportedContextChip
                icon={<MapPin className="size-3.5" strokeWidth={2} />}
                label="Localitate"
                value={importedContext.city}
              />
            ) : null}
            {importedContext.dpoContract ? (
              <ImportedContextChip
                icon={<FileText className="size-3.5" strokeWidth={2} />}
                label="Contract DPO"
                value={importedContext.dpoContract}
              />
            ) : null}
            {importedContext.notes ? (
              <div className="rounded-eos-sm border border-eos-border-subtle bg-eos-surface-variant px-3 py-2 sm:col-span-2 xl:col-span-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                  Observații cabinet
                </p>
                <p className="mt-1 text-[12.5px] leading-5 text-eos-text-muted">{importedContext.notes}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── Ce faci acum ─────────────────────────────────────────────────── */}
      <CompactNextAction
        task={nextBestAction}
        hasEvidence={hasBaselineEvidence}
        activeRiskCount={activeRiskCount}
        onResolve={() => router.push(nextBestActionHref)}
      />

      <RiskTrajectoryWidget />
      <Nis2CockpitCard />
      <DriftActiveCard findings={state.findings} />

      {/* ── Framework-uri + Cazuri active — V3 panels ────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">

        {/* Framework-uri aplicabile */}
        {frameworkItems.length > 0 && (
          <V3Panel
            eyebrow="Framework-uri aplicabile"
            padding="none"
            action={
              <span className="font-mono text-[10px] font-medium tabular-nums text-eos-text-tertiary">
                {frameworkItems.filter((f) => f.status === "ok").length}/{frameworkItems.length} ok
              </span>
            }
          >
            <div className="px-4 pb-3 pt-2" />
            <div className="divide-y divide-eos-border-subtle">
              {frameworkItems.map((fw) => {
                const barColor = fw.status === "ok" ? "bg-eos-success" : fw.status === "warning" ? "bg-eos-warning" : "bg-eos-error"
                const barWidth = fw.status === "ok" ? "100%" : fw.status === "warning" ? "55%" : "22%"
                const tone: V3SeverityTone = fw.status === "ok" ? "ok" : fw.status === "warning" ? "high" : "critical"
                return (
                  <div key={fw.tag} className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`size-1.5 shrink-0 rounded-full ${barColor}`} aria-hidden />
                      <span className="flex-1 text-[13px] font-medium text-eos-text">{fw.label}</span>
                      <V3FrameworkTag
                        label={fw.status === "ok" ? "Activ" : fw.count === 1 ? "1 finding" : `${fw.count} findings`}
                        tone={tone}
                      />
                    </div>
                    <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.04]">
                      <div className={`h-full rounded-full transition-all duration-700 ${barColor} opacity-70`} style={{ width: barWidth }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </V3Panel>
        )}

        {/* Cazuri active */}
        <V3Panel
          eyebrow={`Cazuri active${activeFindings.length > 0 ? ` · ${activeFindings.length}` : ""}`}
          padding="none"
          action={
            <Link
              href={dashboardRoutes.resolve}
              className="flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-eos-primary transition-colors hover:text-eos-text"
            >
              De rezolvat
              <ChevronRight className="size-3" strokeWidth={2.5} />
            </Link>
          }
        >
          <div className="px-4 pb-3 pt-2" />
          {topFindings.length > 0 ? (
            <div className="space-y-2 px-3 pb-3">
              {topFindings.map((f) => {
                const tone: V3SeverityTone =
                  f.severity === "critical"
                    ? "critical"
                    : f.severity === "high"
                      ? "high"
                      : f.severity === "medium"
                        ? "medium"
                        : "low"
                const sevLabel =
                  f.severity === "critical"
                    ? "Critic"
                    : f.severity === "high"
                      ? "Ridicat"
                      : f.severity === "medium"
                        ? "Mediu"
                        : "Scăzut"
                const catLabel =
                  f.category === "GDPR"
                    ? "GDPR"
                    : f.category === "NIS2"
                      ? "NIS2"
                      : f.category === "EU_AI_ACT"
                        ? "AI Act"
                        : f.category === "E_FACTURA"
                          ? "e-Factura"
                          : f.category
                return (
                  <V3FindingRow
                    key={f.id}
                    href={dashboardFindingRoute(f.id)}
                    severity={tone}
                    title={f.title}
                    badges={
                      <>
                        <V3RiskPill tone={tone}>{sevLabel}</V3RiskPill>
                        <V3FrameworkTag label={catLabel} tone="neutral" />
                      </>
                    }
                    ctaLabel="Deschide"
                  />
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-5 py-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-eos-success-soft">
                <CheckCircle2 className="h-5 w-5 text-eos-success" strokeWidth={1.5} />
              </div>
              <p className="text-[13px] text-eos-text-tertiary">
                {hasBaselineEvidence ? "Niciun caz activ." : "Scanează primul document."}
              </p>
              {!hasBaselineEvidence && (
                <Link
                  href={dashboardRoutes.scan}
                  className="flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-eos-primary hover:underline"
                >
                  Mergi la Scanare
                  <ChevronRight className="size-3" strokeWidth={2.5} />
                </Link>
              )}
            </div>
          )}
        </V3Panel>
      </div>

      {/* ── Activitate recentă — V3 panel ────────────────────────────────── */}
      <V3Panel
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Activity className="size-3" strokeWidth={2} />
            Activitate recentă
          </span>
        }
        padding="none"
        action={
          <Link
            href={dashboardRoutes.auditLog}
            className="flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-eos-primary transition-colors hover:text-eos-text"
          >
            Jurnal audit
            <ChevronRight className="size-3" strokeWidth={2.5} />
          </Link>
        }
      >
        <div className="px-4 pb-2 pt-2" />
        {activityFeedItems.length === 0 ? (
          <p className="px-5 py-6 text-center text-[13px] text-eos-text-tertiary">
            Monitorizarea e activă. Primele verificări vor apărea aici.
          </p>
        ) : (
          <div className="divide-y divide-eos-border-subtle">
            {activityFeedItems.map((item) => {
              const dotColor =
                item.tone === "success"
                  ? "bg-eos-success"
                  : item.tone === "warning"
                    ? "bg-eos-warning"
                    : "bg-eos-primary"
              const badgeTone: V3SeverityTone =
                item.tone === "success" ? "ok" : item.tone === "warning" ? "high" : "info"
              const body = (
                <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]">
                  <span className={`size-1.5 shrink-0 rounded-full ${dotColor}`} aria-hidden />
                  <V3FrameworkTag label={item.eyebrow} tone={badgeTone} />
                  <span className="flex-1 truncate text-[13px] text-eos-text">{item.title}</span>
                  <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-eos-text-tertiary">
                    {formatDashboardFeedDateTime(item.dateISO)}
                  </span>
                  {item.href && (
                    <ChevronRight
                      className="size-3 shrink-0 text-eos-text-tertiary"
                      strokeWidth={2}
                    />
                  )}
                </div>
              )
              return item.href ? (
                <Link key={item.id} href={item.href} className="block">
                  {body}
                </Link>
              ) : (
                <div key={item.id}>{body}</div>
              )
            })}
          </div>
        )}
      </V3Panel>

      {/* ── Valoare acumulată ─────────────────────────────────────────────── */}
      <section
        id="dashboard-accumulation-card"
        className={`scroll-mt-24 rounded-eos-lg transition-all duration-500 ${
          highlightAccumulation ? "ring-2 ring-blue-500/40 ring-offset-2 ring-offset-transparent" : ""
        }`}
      >
        <AccumulationCard />
      </section>

    </div>
  )
}

function ImportedContextChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-eos-sm border border-eos-border-subtle bg-eos-surface-variant px-3 py-2">
      <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-[12.5px] text-eos-text-muted">{value}</p>
    </div>
  )
}

// ── CompactNextAction ─────────────────────────────────────────────────────────

function CompactNextAction({
  task,
  hasEvidence,
  activeRiskCount,
  onResolve,
}: {
  task: CockpitTask | null
  hasEvidence: boolean
  activeRiskCount: number
  onResolve: () => void
}) {
  if (!task) {
    const msg = !hasEvidence
      ? "Scanează primul document pentru a genera evaluarea inițială."
      : activeRiskCount === 0
        ? "Nicio problemă activă — continuă monitorizarea regulată."
        : "Revizuiește alertele și închide riscul cu cel mai mare impact."

    const ctaHref = !hasEvidence ? dashboardRoutes.scan : activeRiskCount > 0 ? dashboardRoutes.drifts : null
    const ctaLabel = !hasEvidence ? "Scanare" : "Alerte"

    return (
      <div className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
        <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r-sm bg-eos-success" aria-hidden />
        <div className="flex items-center gap-3 py-3 pl-5 pr-3 md:pr-4">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-eos-sm bg-eos-success-soft text-eos-success">
            <CheckCircle2 className="size-3.5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Ce faci acum
            </p>
            <p className="mt-0.5 text-[13px] text-eos-text-muted">{msg}</p>
          </div>
          {ctaHref && (
            <Link
              href={ctaHref}
              className="inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3 text-[12px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
            >
              {ctaLabel}
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          )}
        </div>
      </div>
    )
  }

  const prioTone: V3SeverityTone =
    task.priority === "P1" ? "critical" : task.priority === "P2" ? "high" : "neutral" as V3SeverityTone

  const sevTone: V3SeverityTone =
    task.severity === "critical"
      ? "critical"
      : task.severity === "high"
        ? "high"
        : task.severity === "medium"
          ? "medium"
          : "low"

  const sevLabel =
    task.severity === "critical"
      ? "Critic"
      : task.severity === "high"
        ? "Ridicat"
        : task.severity === "medium"
          ? "Mediu"
          : "Scăzut"

  return (
    <div className="relative overflow-hidden rounded-eos-lg border border-eos-primary/25 bg-eos-primary/[0.04] shadow-[0_0_32px_rgba(59,130,246,0.05)]">
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-primary" aria-hidden />
      <div className="flex flex-wrap items-center gap-2 border-b border-eos-primary/10 px-5 py-2.5">
        <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Ce faci acum
        </p>
        <V3FrameworkTag label={task.priority} tone={prioTone as Exclude<V3SeverityTone, "ok">} />
        <V3RiskPill tone={sevTone}>{sevLabel}</V3RiskPill>
        <div className="ml-auto flex items-center gap-3 font-mono text-[10.5px] text-eos-text-tertiary">
          <span className="flex items-center gap-1">
            <Clock3 className="size-3" strokeWidth={2} />
            {task.effortLabel}
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <UserRound className="size-3" strokeWidth={2} />
            {task.owner}
          </span>
          <span className="hidden items-center gap-1 md:flex">
            <ShieldAlert className="size-3" strokeWidth={2} />
            {task.lawReference}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <p
            data-display-text="true"
            className="font-display text-[14.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text [overflow-wrap:anywhere]"
          >
            {task.title}
          </p>
          {task.fixPreview && task.fixPreview.toLowerCase().trim() !== task.summary.toLowerCase().trim() && (
            <p className="mt-1 text-[12.5px] leading-[1.5] text-eos-text-tertiary [overflow-wrap:anywhere]">
              {task.fixPreview}
            </p>
          )}
        </div>
        <button
          onClick={onResolve}
          className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-eos-sm bg-eos-primary px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-primary-hover"
        >
          Deschide cockpit
          <ArrowRight className="size-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

// ── buildActivityFeedItems ────────────────────────────────────────────────────

function buildActivityFeedItems({
  events,
  activeDrifts,
  generatedDocuments,
}: {
  events: ComplianceEvent[]
  activeDrifts: ComplianceDriftRecord[]
  generatedDocuments: GeneratedDocumentRecord[]
}) {
  const items: ActivityFeedItem[] = []
  const now = Date.now()

  for (const doc of generatedDocuments) {
    if (doc.approvalStatus !== "approved_as_evidence") continue
    items.push({
      id: `doc-saved-${doc.id}`,
      eyebrow: "Salvat",
      title: `${doc.title} — în dosar`,
      detail: "",
      dateISO: doc.approvedAtISO ?? doc.generatedAtISO,
      tone: "success",
      href: dashboardRoutes.dosar,
    })
    if (doc.nextReviewDateISO) {
      const reviewAt = new Date(doc.nextReviewDateISO).getTime()
      if (Number.isFinite(reviewAt) && reviewAt - now <= 45 * 24 * 60 * 60 * 1000) {
        items.push({
          id: `doc-review-${doc.id}`,
          eyebrow: "Reverificare",
          title: `${doc.title} — review la ${formatDashboardFeedDate(doc.nextReviewDateISO)}`,
          detail: "",
          dateISO: doc.nextReviewDateISO,
          tone: "warning",
          href: dashboardRoutes.dosar,
        })
      }
    }
  }

  for (const drift of activeDrifts.slice(0, 3)) {
    items.push({
      id: `drift-${drift.id}`,
      eyebrow: "Drift detectat",
      title: drift.summary,
      detail: "",
      dateISO: drift.detectedAtISO,
      tone: drift.severity === "critical" || drift.severity === "high" ? "warning" : "default",
      href: dashboardRoutes.drifts,
    })
  }

  for (const event of events.slice(0, 6)) {
    const eyebrow =
      event.entityType === "drift" ? "Verificat" :
      event.entityType === "task" ? "Validat" :
      event.entityType === "finding" ? "Actualizat" : "Activitate"
    const href =
      event.entityType === "drift" ? dashboardRoutes.drifts :
      event.entityType === "finding" ? dashboardFindingRoute(event.entityId) :
      event.entityType === "task" ? dashboardRoutes.resolve :
      dashboardRoutes.dosar
    items.push({
      id: `event-${event.id}`,
      eyebrow,
      title: event.message,
      detail: "",
      dateISO: event.createdAtISO,
      tone:
        event.entityType === "drift" ? "warning" :
        event.type.includes("validated") || event.type.includes("evidence") ? "success" : "default",
      href,
    })
  }

  return items.sort((a, b) => b.dateISO.localeCompare(a.dateISO)).slice(0, 6)
}
