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
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import { SiteScanCard } from "@/components/compliscan/site-scan-card"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { APPLICABILITY_TAG_LABELS } from "@/lib/compliance/applicability"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type {
  ComplianceDriftRecord,
  ComplianceEvent,
  GeneratedDocumentRecord,
  FindingCategory,
} from "@/lib/compliance/types"
import { buildExternalFeedItems, buildProactiveSystemChecks } from "@/lib/compliscan/feed-sources"
import { describeFindingRiskForTriage, sortFindingsForTriage } from "@/lib/compliscan/finding-triage"
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
  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

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
  const findingsSummary =
    activeFindings.length === 0
      ? "Nicio problemă activă."
      : `${activeFindings.length} cazuri active · ${openAlerts.length} alerte · ${activeDrifts.length} drift`
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
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-eos-xl border border-eos-border bg-eos-primary-soft">
          <ShieldAlert className="h-6 w-6 text-eos-primary" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-eos-text">Completează profilul firmei</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-eos-text-tertiary">
          În 2 minute afli ce legi ți se aplică, ce documente ai nevoie și ce riscuri există.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 flex items-center gap-2 rounded-eos-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-eos-text shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500"
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
    <div className="space-y-3 pb-20 sm:space-y-4 sm:pb-0" role="main">
      <section
        aria-label="Snapshot scurt după onboarding"
        className="grid gap-3 rounded-eos-xl border border-eos-border bg-eos-surface-variant p-4 md:grid-cols-3"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-eos-text-tertiary">Se aplică</p>
          <p className="mt-1 text-sm text-eos-text">{applicabilitySummary}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-eos-text-tertiary">Am găsit</p>
          <p className="mt-1 text-sm text-eos-text">{findingsSummary}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-eos-text-tertiary">Acum faci asta</p>
          <p className="mt-1 text-sm text-eos-text">{nextActionSummary}</p>
        </div>
      </section>

      {/* ── Row 1: Score ring + 3 key metrics ─────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">

        {/* Score ring */}
        <div className="flex items-center gap-4 rounded-eos-xl border border-eos-border bg-eos-surface-variant px-5 py-4">
          <div className="relative h-[80px] w-[80px] shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle
                cx="50" cy="50" r="38"
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <circle
                cx="50" cy="50" r="38"
                fill="none"
                stroke={score >= 80 ? "#3b82f6" : score >= 60 ? "#f59e0b" : "#ef4444"}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold leading-none text-eos-text">{score}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-eos-text-tertiary">%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-eos-text-tertiary">Readiness</p>
            <p className={`mt-1 text-sm font-semibold ${score >= 80 ? "text-eos-text" : score >= 60 ? "text-eos-warning" : "text-eos-error"}`}>
              {score >= 80 ? "Stabil" : score >= 60 ? "În progres" : "Risc ridicat"}
            </p>
            {scoreDelta !== null && scoreDelta !== 0 && (
              <div className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${scoreDelta > 0 ? "text-eos-success" : "text-eos-error"}`}>
                {scoreDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {scoreDelta > 0 ? "+" : ""}{scoreDelta}p față de anterior
              </div>
            )}
          </div>
        </div>

        {/* 3 key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <Link href={dashboardRoutes.resolve} className="group flex flex-col justify-between rounded-eos-xl border border-eos-border bg-eos-surface-variant px-4 py-4 transition-all hover:border-white/[0.12] hover:bg-eos-surface-active">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-eos-text-tertiary">Cazuri active</p>
            <div className="mt-2">
              <span className={`text-3xl font-bold ${activeFindings.length > 0 ? "text-eos-error" : "text-eos-text"}`}>
                {activeFindings.length}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-eos-text-tertiary">
              {activeFindings.length === 0 ? "Nicio problemă" : activeFindings.length === 1 ? "caz deschis" : "cazuri deschise"}
            </p>
          </Link>

          <Link href={dashboardRoutes.drifts} className="group flex flex-col justify-between rounded-eos-xl border border-eos-border bg-eos-surface-variant px-4 py-4 transition-all hover:border-white/[0.12] hover:bg-eos-surface-active">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-eos-text-tertiary">Drift activ</p>
            <div className="mt-2">
              <span className={`text-3xl font-bold ${activeDrifts.length > 0 ? "text-eos-warning" : "text-eos-text"}`}>
                {activeDrifts.length}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-eos-text-tertiary">
              {activeDrifts.length === 0 ? "Control stabil" : "schimbări detectate"}
            </p>
          </Link>

          <div className={`flex flex-col justify-between rounded-eos-xl border px-4 py-4 ${
            auditStatusLabel === "Pregătit"
              ? "border-emerald-500/20 bg-emerald-500/[0.03]"
              : auditStatusLabel === "Blocat"
                ? "border-red-500/20 bg-red-500/[0.03]"
                : "border-eos-border bg-eos-surface-variant"
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-eos-text-tertiary">Audit</p>
            <div className="mt-2">
              <span className={`text-lg font-bold ${
                auditStatusLabel === "Pregătit" ? "text-eos-success" :
                auditStatusLabel === "Blocat" ? "text-eos-error" :
                "text-eos-warning"
              }`}>
                {auditStatusLabel}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-eos-text-tertiary">
              {missingEvidenceCount > 0 ? `${missingEvidenceCount} dovezi lipsă` : "dosar complet"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Row 2: Ce faci acum ──────────────────────────────────────────── */}
      <CompactNextAction
        task={nextBestAction}
        hasEvidence={hasBaselineEvidence}
        activeRiskCount={activeRiskCount}
        onResolve={() => router.push(dashboardRoutes.resolve)}
      />

      {/* ── Row 3: Framework status + Cazuri active ──────────────────────── */}
      <div className="grid gap-3 xl:grid-cols-2">

        {/* Framework cards */}
        {frameworkItems.length > 0 && (
          <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
            <div className="border-b border-eos-border-subtle px-5 py-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-eos-text-tertiary">Framework-uri aplicabile</p>
            </div>
            <div className="divide-y divide-eos-border-subtle">
              {frameworkItems.map((fw) => (
                <div key={fw.tag} className="flex items-center gap-3 px-5 py-3">
                  {fw.status === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500/70" strokeWidth={2} />
                  ) : fw.status === "warning" ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500/80" strokeWidth={2} />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-500/80" strokeWidth={2} />
                  )}
                  <span className="flex-1 text-sm font-medium text-eos-text-muted">{fw.label}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    fw.status === "ok"
                      ? "bg-emerald-500/10 text-eos-success"
                      : fw.status === "warning"
                        ? "bg-amber-500/10 text-eos-warning"
                        : "bg-red-500/10 text-eos-error"
                  }`}>
                    {fw.status === "ok"
                      ? "Activ"
                      : fw.count === 1
                        ? "1 finding"
                        : `${fw.count} findings`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cazuri active */}
        <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
          <div className="flex items-center justify-between border-b border-eos-border-subtle px-5 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-eos-text-tertiary">
              Cazuri active{activeFindings.length > 0 && <span className="ml-2 text-eos-text-muted">— {activeFindings.length}</span>}
            </p>
            <Link
              href={dashboardRoutes.resolve}
              className="flex items-center gap-1 text-[11px] font-medium text-eos-text-tertiary transition-colors hover:text-eos-text-muted"
            >
              De rezolvat <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
          {topFindings.length > 0 ? (
            <div className="divide-y divide-eos-border-subtle">
              {topFindings.map((f) => {
                const sevColor =
                  f.severity === "critical" || f.severity === "high" ? "bg-red-500" :
                  f.severity === "medium" ? "bg-amber-500" : "bg-white/25"
                const sevLabel =
                  f.severity === "critical" ? "Critic" :
                  f.severity === "high" ? "Ridicat" :
                  f.severity === "medium" ? "Mediu" : "Scăzut"
                const catLabel =
                  f.category === "GDPR" ? "GDPR" :
                  f.category === "NIS2" ? "NIS2" :
                  f.category === "EU_AI_ACT" ? "AI Act" :
                  f.category === "E_FACTURA" ? "e-Factura" : f.category
                return (
                  <Link
                    key={f.id}
                    href={`/dashboard/resolve/${encodeURIComponent(f.id)}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.025]"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${sevColor}`} />
                    <span className="flex-1 truncate text-sm text-eos-text-muted">{f.title}</span>
                    <span className="shrink-0 rounded-full bg-eos-surface-elevated px-2 py-0.5 text-[10px] font-medium text-eos-text-tertiary">
                      {catLabel}
                    </span>
                    <span className={`shrink-0 text-[11px] font-semibold ${
                      f.severity === "critical" || f.severity === "high" ? "text-eos-error" :
                      f.severity === "medium" ? "text-eos-warning" : "text-eos-text-tertiary"
                    }`}>
                      {sevLabel}
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="px-5 py-6 text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500/50" strokeWidth={1.5} />
              <p className="mt-2 text-sm text-eos-text-tertiary">
                {hasBaselineEvidence ? "Niciun caz activ." : "Scanează primul document."}
              </p>
              {!hasBaselineEvidence && (
                <Link href={dashboardRoutes.scan} className="mt-2 inline-flex items-center gap-1 text-xs text-eos-primary hover:text-blue-300">
                  Mergi la Scanare <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Activity feed ─────────────────────────────────────────── */}
      <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
        <div className="flex items-center justify-between border-b border-eos-border-subtle px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-eos-text-tertiary" strokeWidth={2} />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-eos-text-tertiary">Activitate recentă</p>
          </div>
          <Link href={dashboardRoutes.auditLog} className="flex items-center gap-1 text-[11px] font-medium text-eos-text-tertiary transition-colors hover:text-eos-text-muted">
            Audit log <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </Link>
        </div>
        {activityFeedItems.length === 0 ? (
          <p className="px-5 py-5 text-center text-sm text-eos-text-tertiary">
            Monitorizarea e activă. Primele verificări vor apărea aici.
          </p>
        ) : (
          <div className="divide-y divide-eos-border-subtle">
            {activityFeedItems.map((item) => {
              const dot =
                item.tone === "success" ? "bg-emerald-500" :
                item.tone === "warning" ? "bg-amber-500" : "bg-blue-500"
              const body = (
                <div className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-eos-surface-variant">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-eos-text-tertiary shrink-0">
                    {item.eyebrow}
                  </span>
                  <span className="flex-1 truncate text-sm text-eos-text-muted">{item.title}</span>
                  <span className="shrink-0 text-[11px] text-eos-text-tertiary">
                    {formatDashboardFeedDateTime(item.dateISO)}
                  </span>
                  {item.href && <ArrowRight className="h-3 w-3 shrink-0 text-eos-text-tertiary" strokeWidth={2} />}
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

      {/* ── Secondary tools — collapsed ──────────────────────────────────── */}
      <details className="group rounded-eos-xl border border-eos-border-subtle">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 px-5 py-4 select-none">
          <ChevronRight className="h-4 w-4 shrink-0 text-eos-text-tertiary transition-transform group-open:rotate-90" strokeWidth={2} />
          <span className="text-sm font-medium text-eos-text-tertiary">Instrumente secundare</span>
          <span className="ml-auto text-xs text-white/18">Scanare · valoare acumulată · rute dedicate</span>
        </summary>
        <div className="border-t border-eos-border-subtle p-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <section
              id="dashboard-accumulation-card"
              className={`scroll-mt-24 rounded-eos-lg transition-all duration-500 ${
                highlightAccumulation ? "ring-2 ring-blue-500/40 ring-offset-2 ring-offset-transparent" : ""
              }`}
            >
              <AccumulationCard />
            </section>
            <div className="space-y-3">
              <SiteScanCard existingScan={state.siteScan ?? null} defaultUrl={state.orgProfile?.website ?? undefined} />
              <div className="rounded-eos-lg border border-eos-border bg-eos-surface-variant px-5 py-4">
                <p className="text-sm font-semibold text-eos-text-muted">Suprafețe dedicate</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    { label: "Fiscal", href: dashboardRoutes.fiscal },
                    { label: "NIS2", href: dashboardRoutes.nis2 },
                    { label: "Dosar", href: dashboardRoutes.dosar },
                  ].map((l) => (
                    <Link key={l.href} href={l.href} className="rounded-eos-md border border-eos-border bg-eos-surface-active px-3 py-2.5 text-sm font-medium text-eos-text-muted transition-all hover:border-eos-border-strong hover:text-eos-text-muted">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </details>

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
      <div className="flex items-center gap-4 rounded-eos-xl border border-eos-border bg-eos-surface-variant px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-eos-lg bg-white/5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500/60" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-eos-text-tertiary">Ce faci acum</p>
          <p className="mt-0.5 text-sm text-eos-text-muted">{msg}</p>
        </div>
        {ctaHref && (
          <Link href={ctaHref} className="shrink-0 flex items-center gap-1.5 rounded-eos-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-eos-text-muted transition-all hover:bg-white/10 hover:text-eos-text">
            {!hasEvidence ? "Scanare" : "Alerte"} <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </Link>
        )}
      </div>
    )
  }

  const prioColor =
    task.priority === "P1" ? "bg-eos-error-soft text-eos-error border-red-500/25" :
    task.priority === "P2" ? "bg-eos-warning-soft text-eos-warning border-amber-500/25" :
    "bg-white/5 text-eos-text-tertiary border-white/10"

  const sevLabel =
    task.severity === "critical" ? "Critic" :
    task.severity === "high" ? "Ridicat" :
    task.severity === "medium" ? "Mediu" : "Scăzut"

  const sevColor =
    task.severity === "critical" || task.severity === "high" ? "text-eos-error" :
    task.severity === "medium" ? "text-eos-warning" : "text-eos-text-tertiary"

  return (
    <div className="rounded-eos-xl border border-eos-border bg-eos-primary-soft shadow-[0_0_32px_rgba(59,130,246,0.07)]">
      <div className="flex items-center gap-3 border-b border-blue-500/[0.10] px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400/50">Ce faci acum</p>
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
          className="shrink-0 flex items-center gap-2 rounded-eos-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-eos-text shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500"
        >
          Deschide <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
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
      event.entityType === "task" || event.entityType === "finding" ? dashboardRoutes.resolve :
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
