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
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
          <ShieldAlert className="h-6 w-6 text-blue-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-white">Completează profilul firmei</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/45">
          În 2 minute afli ce legi ți se aplică, ce documente ai nevoie și ce riscuri există.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500"
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

      {/* ── Row 1: Score ring + 3 key metrics ─────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">

        {/* Score ring */}
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
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
              <span className="text-xl font-bold leading-none text-white">{score}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Readiness</p>
            <p className={`mt-1 text-sm font-semibold ${score >= 80 ? "text-white/80" : score >= 60 ? "text-amber-400" : "text-red-400"}`}>
              {score >= 80 ? "Stabil" : score >= 60 ? "În progres" : "Risc ridicat"}
            </p>
            {scoreDelta !== null && scoreDelta !== 0 && (
              <div className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${scoreDelta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {scoreDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {scoreDelta > 0 ? "+" : ""}{scoreDelta}p față de anterior
              </div>
            )}
          </div>
        </div>

        {/* 3 key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <Link href={dashboardRoutes.resolve} className="group flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Cazuri active</p>
            <div className="mt-2">
              <span className={`text-3xl font-bold ${activeFindings.length > 0 ? "text-red-400" : "text-white"}`}>
                {activeFindings.length}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-white/25">
              {activeFindings.length === 0 ? "Nicio problemă" : activeFindings.length === 1 ? "caz deschis" : "cazuri deschise"}
            </p>
          </Link>

          <Link href={dashboardRoutes.drifts} className="group flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Drift activ</p>
            <div className="mt-2">
              <span className={`text-3xl font-bold ${activeDrifts.length > 0 ? "text-amber-400" : "text-white"}`}>
                {activeDrifts.length}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-white/25">
              {activeDrifts.length === 0 ? "Control stabil" : "schimbări detectate"}
            </p>
          </Link>

          <div className={`flex flex-col justify-between rounded-2xl border px-4 py-4 ${
            auditStatusLabel === "Pregătit"
              ? "border-emerald-500/20 bg-emerald-500/[0.03]"
              : auditStatusLabel === "Blocat"
                ? "border-red-500/20 bg-red-500/[0.03]"
                : "border-white/[0.07] bg-white/[0.02]"
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Audit</p>
            <div className="mt-2">
              <span className={`text-lg font-bold ${
                auditStatusLabel === "Pregătit" ? "text-emerald-400" :
                auditStatusLabel === "Blocat" ? "text-red-400" :
                "text-amber-400"
              }`}>
                {auditStatusLabel}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-white/25">
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
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <div className="border-b border-white/[0.05] px-5 py-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Framework-uri aplicabile</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {frameworkItems.map((fw) => (
                <div key={fw.tag} className="flex items-center gap-3 px-5 py-3">
                  {fw.status === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500/70" strokeWidth={2} />
                  ) : fw.status === "warning" ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500/80" strokeWidth={2} />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-500/80" strokeWidth={2} />
                  )}
                  <span className="flex-1 text-sm font-medium text-white/75">{fw.label}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    fw.status === "ok"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : fw.status === "warning"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400"
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
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
              Cazuri active{activeFindings.length > 0 && <span className="ml-2 text-white/50">— {activeFindings.length}</span>}
            </p>
            <Link
              href={dashboardRoutes.resolve}
              className="flex items-center gap-1 text-[11px] font-medium text-white/30 transition-colors hover:text-white/60"
            >
              De rezolvat <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
          {topFindings.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
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
                    href={`${dashboardRoutes.resolve}?findingId=${f.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.025]"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${sevColor}`} />
                    <span className="flex-1 truncate text-sm text-white/70">{f.title}</span>
                    <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/35">
                      {catLabel}
                    </span>
                    <span className={`shrink-0 text-[11px] font-semibold ${
                      f.severity === "critical" || f.severity === "high" ? "text-red-400" :
                      f.severity === "medium" ? "text-amber-400" : "text-white/30"
                    }`}>
                      {sevLabel}
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-white/20" strokeWidth={2} />
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="px-5 py-6 text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500/50" strokeWidth={1.5} />
              <p className="mt-2 text-sm text-white/30">
                {hasBaselineEvidence ? "Niciun caz activ." : "Scanează primul document."}
              </p>
              {!hasBaselineEvidence && (
                <Link href={dashboardRoutes.scan} className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                  Mergi la Scanare <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Activity feed ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-white/25" strokeWidth={2} />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Activitate recentă</p>
          </div>
          <Link href={dashboardRoutes.auditLog} className="flex items-center gap-1 text-[11px] font-medium text-white/30 transition-colors hover:text-white/60">
            Audit log <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </Link>
        </div>
        {activityFeedItems.length === 0 ? (
          <p className="px-5 py-5 text-center text-sm text-white/25">
            Monitorizarea e activă. Primele verificări vor apărea aici.
          </p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {activityFeedItems.map((item) => {
              const dot =
                item.tone === "success" ? "bg-emerald-500" :
                item.tone === "warning" ? "bg-amber-500" : "bg-blue-500"
              const body = (
                <div className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 shrink-0">
                    {item.eyebrow}
                  </span>
                  <span className="flex-1 truncate text-sm text-white/65">{item.title}</span>
                  <span className="shrink-0 text-[11px] text-white/20">
                    {new Date(item.dateISO).toLocaleString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {item.href && <ArrowRight className="h-3 w-3 shrink-0 text-white/15" strokeWidth={2} />}
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
      <details className="group rounded-2xl border border-white/[0.06]">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 px-5 py-4 select-none">
          <ChevronRight className="h-4 w-4 shrink-0 text-white/25 transition-transform group-open:rotate-90" strokeWidth={2} />
          <span className="text-sm font-medium text-white/40">Instrumente secundare</span>
          <span className="ml-auto text-xs text-white/18">Scanare · valoare acumulată · rute dedicate</span>
        </summary>
        <div className="border-t border-white/[0.05] p-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <section
              id="dashboard-accumulation-card"
              className={`scroll-mt-24 rounded-xl transition-all duration-500 ${
                highlightAccumulation ? "ring-2 ring-blue-500/40 ring-offset-2 ring-offset-transparent" : ""
              }`}
            >
              <AccumulationCard />
            </section>
            <div className="space-y-3">
              <SiteScanCard existingScan={state.siteScan ?? null} defaultUrl={state.orgProfile?.website ?? undefined} />
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
                <p className="text-sm font-semibold text-white/55">Suprafețe dedicate</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    { label: "Fiscal", href: dashboardRoutes.fiscal },
                    { label: "NIS2", href: dashboardRoutes.nis2 },
                    { label: "Dosar", href: dashboardRoutes.dosar },
                  ].map((l) => (
                    <Link key={l.href} href={l.href} className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-white/45 transition-all hover:border-white/[0.14] hover:text-white/70">
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
      <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500/60" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/25">Ce faci acum</p>
          <p className="mt-0.5 text-sm text-white/50">{msg}</p>
        </div>
        {ctaHref && (
          <Link href={ctaHref} className="shrink-0 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/55 transition-all hover:bg-white/10 hover:text-white/80">
            {!hasEvidence ? "Scanare" : "Alerte"} <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </Link>
        )}
      </div>
    )
  }

  const prioColor =
    task.priority === "P1" ? "bg-red-500/15 text-red-400 border-red-500/25" :
    task.priority === "P2" ? "bg-amber-500/15 text-amber-400 border-amber-500/25" :
    "bg-white/5 text-white/40 border-white/10"

  const sevLabel =
    task.severity === "critical" ? "Critic" :
    task.severity === "high" ? "Ridicat" :
    task.severity === "medium" ? "Mediu" : "Scăzut"

  const sevColor =
    task.severity === "critical" || task.severity === "high" ? "text-red-400" :
    task.severity === "medium" ? "text-amber-400" : "text-white/35"

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] shadow-[0_0_32px_rgba(59,130,246,0.07)]">
      <div className="flex items-center gap-3 border-b border-blue-500/[0.10] px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400/50">Ce faci acum</p>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${prioColor}`}>{task.priority}</span>
        <span className={`text-[11px] font-semibold ${sevColor}`}>{sevLabel}</span>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-white/25">
          <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />{task.effortLabel}</span>
          <span className="hidden sm:flex items-center gap-1"><UserRound className="h-3 w-3" />{task.owner}</span>
          <span className="hidden md:flex items-center gap-1"><ShieldAlert className="h-3 w-3" />{task.lawReference}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white [overflow-wrap:anywhere]">{task.title}</p>
          {task.fixPreview && task.fixPreview.toLowerCase().trim() !== task.summary.toLowerCase().trim() && (
            <p className="mt-1 text-sm text-white/40 [overflow-wrap:anywhere]">{task.fixPreview}</p>
          )}
        </div>
        <button
          onClick={onResolve}
          className="shrink-0 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500"
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
          title: `${doc.title} — review la ${new Date(doc.nextReviewDateISO).toLocaleDateString("ro-RO")}`,
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
