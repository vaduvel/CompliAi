"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  Clock3,
  ShieldAlert,
  UserRound,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react"

import { AccumulationCard } from "@/components/compliscan/dashboard/accumulation-card"
import { DriftActiveCard } from "@/components/compliscan/drift-active-card"
import { Nis2CockpitCard } from "@/components/compliscan/nis2-cockpit-card"
import { RiskTrajectoryWidget } from "@/components/compliscan/risk-trajectory-widget"
import { ErrorScreen } from "@/components/compliscan/route-sections"
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

  const auditStatusLabel =
    data.summary.score >= 90
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
  const circumference = 2 * Math.PI * 38
  const strokeDash = (score / 100) * circumference

  return (
    <div className="space-y-6 pb-20 sm:pb-0" role="main">

      {/* ── Context strip — info, no card ────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant/60 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-0 sm:divide-x sm:divide-eos-border-subtle">
        <div className="sm:flex-1 sm:pr-6">
          <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Se aplică</p>
          <p className="mt-0.5 text-sm text-eos-text">{applicabilitySummary}</p>
        </div>
        <div className="sm:flex-1 sm:px-6">
          <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Dovezi lipsă</p>
          <p className="mt-0.5 text-sm text-eos-text">
            {missingEvidenceCount === 0 ? "Toate task-urile au dovadă" : `${missingEvidenceCount} task${missingEvidenceCount === 1 ? "" : "-uri"} fără dovadă`}
          </p>
        </div>
        <div className="sm:flex-1 sm:pl-6">
          <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Acum faci asta</p>
          <p className="mt-0.5 text-sm text-eos-text">{nextActionSummary}</p>
        </div>
      </div>

      {/* ── KPI row — 4 differentiated cards ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Readiness — top accent bar + ring */}
        <div className={`relative overflow-hidden rounded-eos-lg border bg-eos-surface-variant p-5 ${
          score >= 80 ? "border-eos-border" : score >= 60 ? "border-eos-warning/20" : "border-eos-error/20"
        }`}>
          <div className={`absolute inset-x-0 top-0 h-[3px] ${
            score >= 80 ? "bg-eos-primary" : score >= 60 ? "bg-eos-warning" : "bg-eos-error"
          }`} />
          <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Readiness</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-[72px] w-[72px] shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
                <circle
                  cx="50" cy="50" r="38" fill="none"
                  stroke={score >= 80 ? "#3b82f6" : score >= 60 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums leading-none text-eos-text">{score}</span>
                <span className="text-[9px] font-medium tracking-widest text-eos-text-tertiary">%</span>
              </div>
            </div>
            <div>
              <p className={`text-base font-semibold ${score >= 80 ? "text-eos-text" : score >= 60 ? "text-eos-warning" : "text-eos-error"}`}>
                {score >= 80 ? "Stabil" : score >= 60 ? "În progres" : "Risc ridicat"}
              </p>
              {scoreDelta !== null && scoreDelta !== 0 && (
                <div className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${scoreDelta > 0 ? "text-eos-success" : "text-eos-error"}`}>
                  {scoreDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {scoreDelta > 0 ? "+" : ""}{scoreDelta}p vs anterior
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cazuri active — left accent border when issues */}
        <Link href={dashboardRoutes.resolve} className={`group relative overflow-hidden rounded-eos-lg border bg-eos-surface-variant p-5 transition-all hover:bg-eos-surface-active ${
          activeFindings.length > 0 ? "border-eos-error/25" : "border-eos-border"
        }`}>
          {activeFindings.length > 0 && <div className="absolute inset-y-0 left-0 w-[3px] bg-eos-error" />}
          <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Cazuri active</p>
          <div className="mt-3 flex items-end justify-between">
            <span className={`text-4xl font-semibold tabular-nums leading-none ${activeFindings.length > 0 ? "text-eos-error" : "text-eos-text"}`}>
              {activeFindings.length}
            </span>
            {activeFindings.length > 0 && (
              <ChevronRight className="mb-1 h-4 w-4 text-eos-text-tertiary transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            )}
          </div>
          <p className="mt-2 text-[11px] text-eos-text-tertiary">
            {activeFindings.length === 0 ? "Nicio problemă activă" : activeFindings.length === 1 ? "caz deschis" : "cazuri deschise"}
          </p>
        </Link>

        {/* Drift activ — left accent border when drift */}
        <Link href={dashboardRoutes.drifts} className={`group relative overflow-hidden rounded-eos-lg border bg-eos-surface-variant p-5 transition-all hover:bg-eos-surface-active ${
          activeDrifts.length > 0 ? "border-eos-warning/25" : "border-eos-border"
        }`}>
          {activeDrifts.length > 0 && <div className="absolute inset-y-0 left-0 w-[3px] bg-eos-warning" />}
          <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Modificări detectate</p>
          <div className="mt-3 flex items-end justify-between">
            <span className={`text-4xl font-semibold tabular-nums leading-none ${activeDrifts.length > 0 ? "text-eos-warning" : "text-eos-text"}`}>
              {activeDrifts.length}
            </span>
            {activeDrifts.length > 0 && (
              <ChevronRight className="mb-1 h-4 w-4 text-eos-text-tertiary transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            )}
          </div>
          <p className="mt-2 text-[11px] text-eos-text-tertiary">
            {activeDrifts.length === 0 ? "Control stabil" : "schimbări detectate"}
          </p>
        </Link>

        {/* Audit — left accent border by status */}
        <div className={`relative overflow-hidden rounded-eos-lg border bg-eos-surface-variant p-5 ${
          auditStatusLabel === "Pregătit" ? "border-eos-success/25" :
          auditStatusLabel === "Blocat" ? "border-eos-error/25" : "border-eos-border"
        }`}>
          {auditStatusLabel === "Blocat" && <div className="absolute inset-y-0 left-0 w-[3px] bg-eos-error" />}
          {auditStatusLabel === "Pregătit" && <div className="absolute inset-y-0 left-0 w-[3px] bg-eos-success" />}
          <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Audit dosar</p>
          <div className="mt-3">
            <span className={`text-2xl font-semibold leading-none ${
              auditStatusLabel === "Pregătit" ? "text-eos-success" :
              auditStatusLabel === "Blocat" ? "text-eos-error" : "text-eos-warning"
            }`}>
              {auditStatusLabel}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-eos-text-tertiary">
            {missingEvidenceCount > 0 ? `${missingEvidenceCount} dovezi lipsă` : "dosar complet"}
          </p>
        </div>
      </div>

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

      {/* ── Framework-uri + Cazuri active — 2 col ──────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">

        {/* Framework-uri — cu mini progress bars (Drata pattern) */}
        {frameworkItems.length > 0 && (
          <div className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface-variant">
            <div className="flex items-center justify-between border-b border-eos-border-subtle px-5 py-3.5">
              <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Framework-uri aplicabile</p>
              <span className="text-[10px] tabular-nums text-eos-text-tertiary">
                {frameworkItems.filter((f) => f.status === "ok").length}/{frameworkItems.length} ok
              </span>
            </div>
            <div className="divide-y divide-eos-border-subtle">
              {frameworkItems.map((fw) => {
                const barColor = fw.status === "ok" ? "bg-eos-success" : fw.status === "warning" ? "bg-eos-warning" : "bg-eos-error"
                const barWidth = fw.status === "ok" ? "100%" : fw.status === "warning" ? "55%" : "22%"
                return (
                  <div key={fw.tag} className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {fw.status === "ok" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-eos-success" strokeWidth={2.5} />
                      ) : fw.status === "warning" ? (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-eos-warning" strokeWidth={2.5} />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-eos-error" strokeWidth={2.5} />
                      )}
                      <span className="flex-1 text-sm font-medium text-eos-text">{fw.label}</span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        fw.status === "ok" ? "bg-eos-success/10 text-eos-success" :
                        fw.status === "warning" ? "bg-eos-warning/10 text-eos-warning" :
                        "bg-eos-error/10 text-eos-error"
                      }`}>
                        {fw.status === "ok" ? "Activ" : fw.count === 1 ? "1 finding" : `${fw.count} findings`}
                      </span>
                    </div>
                    <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-eos-border-subtle">
                      <div className={`h-full rounded-full transition-all duration-700 ${barColor} opacity-60`} style={{ width: barWidth }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cazuri active — border-l per severity row */}
        <div className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface-variant">
          <div className="flex items-center justify-between border-b border-eos-border-subtle px-5 py-3.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Cazuri active</p>
              {activeFindings.length > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-eos-error px-1 text-[9px] font-bold text-white">
                  {activeFindings.length}
                </span>
              )}
            </div>
            <Link href={dashboardRoutes.resolve} className="flex items-center gap-1 text-[10px] font-medium text-eos-primary transition-colors hover:text-eos-text">
              De rezolvat <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
          {topFindings.length > 0 ? (
            <div className="divide-y divide-eos-border-subtle">
              {topFindings.map((f) => {
                const isHigh = f.severity === "critical" || f.severity === "high"
                const isMed = f.severity === "medium"
                const leftBorder = isHigh ? "border-l-eos-error" : isMed ? "border-l-eos-warning" : "border-l-eos-border-subtle"
                const sevLabel = f.severity === "critical" ? "Critic" : f.severity === "high" ? "Ridicat" : f.severity === "medium" ? "Mediu" : "Scăzut"
                const sevColor = isHigh ? "text-eos-error" : isMed ? "text-eos-warning" : "text-eos-text-tertiary"
                const catLabel = f.category === "GDPR" ? "GDPR" : f.category === "NIS2" ? "NIS2" : f.category === "EU_AI_ACT" ? "AI Act" : f.category === "E_FACTURA" ? "e-Factura" : f.category
                return (
                  <Link
                    key={f.id}
                    href={dashboardFindingRoute(f.id)}
                    className={`flex items-center gap-3 border-l-[3px] py-3 pl-4 pr-5 transition-colors hover:bg-eos-surface-active ${leftBorder}`}
                  >
                    <span className="flex-1 truncate text-sm text-eos-text">{f.title}</span>
                    <span className="shrink-0 rounded bg-eos-surface-elevated px-1.5 py-0.5 text-[10px] font-medium text-eos-text-tertiary">
                      {catLabel}
                    </span>
                    <span className={`shrink-0 text-[11px] font-semibold ${sevColor}`}>{sevLabel}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-5 py-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-eos-success/10">
                <CheckCircle2 className="h-5 w-5 text-eos-success" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-eos-text-tertiary">
                {hasBaselineEvidence ? "Niciun caz activ." : "Scanează primul document."}
              </p>
              {!hasBaselineEvidence && (
                <Link href={dashboardRoutes.scan} className="flex items-center gap-1 text-xs font-medium text-eos-primary hover:underline">
                  Mergi la Scanare <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Activitate recentă — pill badges per tip ─────────────────────── */}
      <div className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface-variant">
        <div className="flex items-center justify-between border-b border-eos-border-subtle px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-eos-text-tertiary" strokeWidth={2} />
            <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Activitate recentă</p>
          </div>
          <Link href={dashboardRoutes.auditLog} className="flex items-center gap-1 text-[10px] font-medium text-eos-primary transition-colors hover:text-eos-text">
            Jurnal audit <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
          </Link>
        </div>
        {activityFeedItems.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-eos-text-tertiary">
            Monitorizarea e activă. Primele verificări vor apărea aici.
          </p>
        ) : (
          <div className="divide-y divide-eos-border-subtle">
            {activityFeedItems.map((item) => {
              const dotColor = item.tone === "success" ? "bg-eos-success" : item.tone === "warning" ? "bg-eos-warning" : "bg-eos-primary"
              const badgeStyle = item.tone === "success" ? "bg-eos-success/10 text-eos-success" : item.tone === "warning" ? "bg-eos-warning/10 text-eos-warning" : "bg-eos-primary/10 text-eos-primary"
              const body = (
                <div className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-eos-surface-active">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${badgeStyle}`}>
                    {item.eyebrow}
                  </span>
                  <span className="flex-1 truncate text-sm text-eos-text">{item.title}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-eos-text-tertiary">
                    {formatDashboardFeedDateTime(item.dateISO)}
                  </span>
                  {item.href && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-eos-text-tertiary" strokeWidth={2} />}
                </div>
              )
              return item.href ? (
                <Link key={item.id} href={item.href} className="block">{body}</Link>
              ) : (
                <div key={item.id}>{body}</div>
              )
            })}
          </div>
        )}
      </div>

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

    return (
      <div className="flex items-center gap-4 rounded-eos-lg border border-eos-border bg-eos-surface-variant px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-eos-lg bg-eos-surface-active">
          <CheckCircle2 className="h-4 w-4 text-eos-success" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Ce faci acum</p>
          <p className="mt-0.5 text-sm text-eos-text-muted">{msg}</p>
        </div>
        {ctaHref && (
          <Link href={ctaHref} className="shrink-0 flex items-center gap-2 rounded-eos-lg border border-eos-border-subtle bg-eos-surface-active px-4 py-2 text-xs font-semibold text-eos-text-muted transition-all hover:bg-eos-surface-elevated hover:text-eos-text">
            {!hasEvidence ? "Scanare" : "Alerte"} <ArrowRight className="size-4" strokeWidth={2} />
          </Link>
        )}
      </div>
    )
  }

  const prioColor =
    task.priority === "P1" ? "bg-eos-error-soft text-eos-error border-eos-error/25" :
    task.priority === "P2" ? "bg-eos-warning-soft text-eos-warning border-eos-warning/25" :
    "bg-eos-surface-active text-eos-text-tertiary border-eos-border-subtle"

  const sevLabel =
    task.severity === "critical" ? "Critic" :
    task.severity === "high" ? "Ridicat" :
    task.severity === "medium" ? "Mediu" : "Scăzut"

  const sevColor =
    task.severity === "critical" || task.severity === "high" ? "text-eos-error" :
    task.severity === "medium" ? "text-eos-warning" : "text-eos-text-tertiary"

  return (
    <div className="rounded-eos-lg border border-eos-border bg-eos-primary-soft shadow-[0_0_32px_rgba(59,130,246,0.07)]">
      <div className="flex items-center gap-3 border-b border-eos-primary/[0.10] px-5 py-3">
        <p className="text-[11px] font-mono font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Ce faci acum</p>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${prioColor}`}>{task.priority}</span>
        <span className={`text-[11px] font-semibold ${sevColor}`}>{sevLabel}</span>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-eos-text-tertiary">
          <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />{task.effortLabel}</span>
          <span className="hidden sm:flex items-center gap-1"><UserRound className="h-3 w-3" />{task.owner}</span>
          <span className="hidden md:flex items-center gap-1"><ShieldAlert className="h-3 w-3" />{task.lawReference}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-eos-text [overflow-wrap:anywhere]">{task.title}</p>
          {task.fixPreview && task.fixPreview.toLowerCase().trim() !== task.summary.toLowerCase().trim() && (
            <p className="mt-1 text-sm text-eos-text-tertiary [overflow-wrap:anywhere]">{task.fixPreview}</p>
          )}
        </div>
        <button
          onClick={onResolve}
          className="shrink-0 flex items-center gap-2 rounded-eos-lg bg-eos-primary px-4 py-2.5 text-sm font-semibold text-eos-text shadow-lg shadow-eos-primary/20 transition-all hover:bg-eos-primary"
        >
          Deschide cazul <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
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
