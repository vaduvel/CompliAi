"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowRight, BarChart3, Bot, CalendarClock, CheckCircle2, ChevronRight, Download, FileText, FileWarning, Flame, Layers, Scale, Shield, ShieldCheck, ShieldAlert, TrendingUp } from "lucide-react"

import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Card } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { LegalSourceBadge } from "@/components/compliscan/legal-source-badge"
import { getSuggestionExplanation, FRAMEWORK_LEGAL_STATUS } from "@/lib/compliance/legal-sources"
import {
  APPLICABILITY_TAG_LABELS,
  type ApplicabilityCertainty,
  type ApplicabilityTag,
} from "@/lib/compliance/applicability"
import { HealthCheckCard } from "@/components/compliscan/health-check-card"
import { AccumulationCard } from "@/components/compliscan/dashboard/accumulation-card"
import { getVigilanceStrip } from "@/lib/compliance/sector-risk"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { NextBestAction } from "@/components/compliscan/next-best-action"
import { SiteScanCard } from "@/components/compliscan/site-scan-card"
import type {
  ComplianceDriftRecord,
  ComplianceEvent,
  GeneratedDocumentRecord,
} from "@/lib/compliance/types"
import type { AppNotification } from "@/lib/server/notifications-store"
import { buildExternalFeedItems, buildProactiveSystemChecks } from "@/lib/compliscan/feed-sources"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cockpit = useCockpitData()
  const [nis2Score, setNis2Score] = useState<number | null>(null)
  const [nis2EntityType, setNis2EntityType] = useState<"essential" | "important" | null>(null)
  const [nis2AssessmentDone, setNis2AssessmentDone] = useState(false)
  const [nis2UrgentIncident, setNis2UrgentIncident] = useState(false)
  const [benchmark, setBenchmark] = useState<{ medie: number; percentil: number; nrFirme: number; sector: string } | null>(null)
  const [highlightAccumulation, setHighlightAccumulation] = useState(false)
  const [externalNotifications, setExternalNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    fetch("/api/nis2/assessment", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { assessment?: { score?: number; sector?: string } } | null) => {
        if (data?.assessment?.score != null) {
          setNis2Score(data.assessment.score)
          setNis2AssessmentDone(true)
          // Approximate entity type from score (essential = higher bar)
          setNis2EntityType(data.assessment.score >= 60 ? "essential" : "important")
        } else {
          setNis2AssessmentDone(false)
        }
      })
      .catch(() => {})

    fetch("/api/nis2/incidents", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { incidents?: { deadline24hISO: string; status: string }[] } | null) => {
        const urgent = (data?.incidents ?? []).some(
          (i) => i.status !== "closed" && new Date(i.deadline24hISO).getTime() - Date.now() < 4 * 3_600_000
        )
        setNis2UrgentIncident(urgent)
      })
      .catch(() => {})

    fetch("/api/benchmark", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { benchmark?: { medie: number; percentil: number; nrFirme: number; sector: string } | null } | null) => {
        if (data?.benchmark) setBenchmark(data.benchmark)
      })
      .catch(() => {})

    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { notifications?: AppNotification[] } | null) => {
        if (data?.notifications) setExternalNotifications(data.notifications)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (searchParams.get("focus") !== "accumulation") return

    const scrollToAccumulation = () => {
      const node = document.getElementById("dashboard-accumulation-card")
      if (!node) return false

      node.scrollIntoView({ behavior: "smooth", block: "center" })
      setHighlightAccumulation(true)
      window.setTimeout(() => setHighlightAccumulation(false), 2600)

      const nextUrl = new URL(window.location.href)
      nextUrl.searchParams.delete("focus")
      window.history.replaceState(window.history.state, "", nextUrl.toString())
      return true
    }

    if (scrollToAccumulation()) return

    const timeoutId = window.setTimeout(scrollToAccumulation, 450)
    return () => window.clearTimeout(timeoutId)
  }, [searchParams])

  if (cockpit.error && !cockpit.loading) return <ErrorScreen message={cockpit.error} variant="section" />
  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const { data, activeDrifts, tasks, nextBestAction, openAlerts } = cockpit
  const state = data.state
  const applicability = state.applicability ?? null
  const applicableEntries = (applicability?.entries ?? [])
    .filter((entry) => entry.certainty !== "unlikely")
    .slice(0, 4)

  // ── Framework readiness ───────────────────────────────────────────────────
  const aiHighRisk = state.highRisk
  const aiLowRisk = state.lowRisk
  const totalAiSystems = aiHighRisk + aiLowRisk
  const aiActScore = totalAiSystems === 0 ? 0 : Math.max(0, 100 - aiHighRisk * 20)
  const aiActStatus = aiHighRisk > 0 ? "review" : totalAiSystems > 0 ? "strong" : "good"

  const gdprOpenActions = tasks.filter((t) => t.principles.includes("privacy_data_governance") && t.status !== "done").length
  const gdprScore = state.gdprProgress
  const gdprStatus = gdprOpenActions > 3 ? "review" : gdprScore >= 90 ? "strong" : gdprScore >= 50 ? "good" : "review"

  const efacturaScore = state.efacturaConnected ? 100 : state.efacturaSignalsCount > 0 ? 40 : 10
  const efacturaStatus = state.efacturaConnected
    ? "strong"
    : state.efacturaSignalsCount > 0
      ? "review"
      : "blocked"

  const openTasks = tasks.filter((t) => t.status !== "done")
  const activeFindings = state.findings.filter((finding) => finding.findingStatus !== "dismissed")
  const missingEvidenceCount = openTasks.filter((t) => !t.attachedEvidence).length
  const hasBaselineEvidence = Boolean(
    state.scans.length > 0 || state.scannedDocuments > 0 || state.validatedBaselineSnapshotId
  )
  const activeRiskCount = openAlerts.length + activeDrifts.length
  const firstSnapshotSignals = [
    `${activeFindings.length} cazuri active sau confirmate`,
    state.scans.length > 0
      ? `${state.scans.length} surse deja analizate`
      : "Încă nu ai surse scanate în workspace",
    state.siteScan
      ? `Website scanat: ${state.siteScan.findingCount} semnale detectate`
      : state.orgProfile?.website
        ? "Website adăugat, dar fără snapshot de scan încă"
        : "Fără website în profilul firmei",
    state.generatedDocuments.length > 0
      ? `${state.generatedDocuments.length} documente sau artefacte deja în lucru`
      : "Nicio dovadă sau document pregătit încă",
  ]
  const internalFeedItems = buildActivityFeedItems({
    events: state.events,
    activeDrifts,
    generatedDocuments: state.generatedDocuments,
  })
  const externalFeedItems = buildExternalFeedItems(externalNotifications, state)
  const systemCheckItems = buildProactiveSystemChecks(state, data.summary.score, data.summary.redAlerts)
  const activityFeedItems = [
    ...internalFeedItems,
    ...externalFeedItems.map((e) => ({
      id: e.id,
      eyebrow: e.eyebrow,
      title: e.title,
      detail: e.detail,
      dateISO: e.dateISO,
      tone: e.tone,
      href: e.href,
    })),
    ...systemCheckItems.map((e) => ({
      id: e.id,
      eyebrow: e.eyebrow,
      title: e.title,
      detail: e.detail,
      dateISO: e.dateISO,
      tone: e.tone,
      href: e.href,
    })),
  ]
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .slice(0, 10)
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
  return (
    <div className="space-y-5 sm:space-y-8 pb-20 sm:pb-0" role="main" aria-labelledby="dashboard-title">
      <PageIntro
        eyebrow="Snapshot"
        title="Starea firmei tale acum"
        description="Asta ți se aplică, asta am găsit deja și asta faci acum. Rezolvarea pornește de aici."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              Readiness global: {data.summary.score}%
            </Badge>
            <Badge
              dot
              variant={activeDrifts.length > 0 ? "destructive" : "success"}
              className="normal-case tracking-normal"
            >
              {activeDrifts.length > 0 ? `${activeDrifts.length} drift-uri active` : "Control stabil"}
            </Badge>
          </>
        }

      />

      {state.orgProfile && (
        <section aria-label="Primul snapshot">
          <div className="grid gap-4 lg:grid-cols-2">
            <SnapshotFocusCard
              title="Ce ți se aplică"
              subtitle="Framework-urile care contează deja pentru firma ta"
              items={
                applicableEntries.length > 0
                  ? applicableEntries.map((entry) => ({
                      label: APPLICABILITY_TAG_LABELS[entry.tag],
                      detail: entry.reason,
                    }))
                  : [
                      {
                        label: "Maparea este în curs",
                        detail: "Compli completează obligațiile aplicabile imediat ce profilul și sursele sunt suficient de clare.",
                      },
                    ]
              }
            />
            <SnapshotFocusCard
              title="Ce am găsit deja"
              subtitle="Semnale și constatări pregătite înainte să intri în cockpit"
              items={firstSnapshotSignals.map((signal) => ({ label: signal }))}
            />
          </div>
        </section>
      )}

      {/* ── Onboarding fallback (the real flow now lives in /onboarding) ───── */}
      {!state.orgProfile && (
        <section aria-label="Bun venit">
          <Card className="border-eos-primary/30 bg-eos-primary/5">
            <div className="flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <span className="text-3xl leading-none">👋</span>
                <div>
                  <p className="text-base font-semibold text-eos-text">Bun venit în CompliAI!</p>
                  <p className="mt-1 text-sm text-eos-text-muted">
                    Completează profilul firmei în 2 minute — primești imediat o analiză de conformitate personalizată: ce legi se aplică, ce documente ai nevoie și ce riscuri există.
                  </p>
                  <p className="mt-2 text-xs text-eos-text-tertiary">
                    GDPR · NIS2 · EU AI Act · e-Factura — toate calculate pentru firma ta.
                  </p>
                </div>
              </div>
              <Link
                href="/onboarding"
                className="inline-flex shrink-0 items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-eos-primary/90"
              >
                Începe analiza gratuită
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </div>
          </Card>
        </section>
      )}

      {state.orgProfile && (
        <section aria-label="Actiunea recomandata acum">
          <NextBestAction
            task={nextBestAction}
            additionalTasks={openTasks
              .filter((t) => t.id !== nextBestAction?.id)
              .slice(0, 2)}
            onResolve={() => router.push(dashboardRoutes.resolve)}
            onResolveTask={(id) => router.push(`${dashboardRoutes.resolve}?taskId=${id}`)}
            hasEvidence={hasBaselineEvidence}
            activeRiskCount={activeRiskCount}
          />
        </section>
      )}

      {/* ── Accumulation card — valoare acumulată, lângă acțiuni ─────────── */}
      {state.orgProfile && (
        <section
          id="dashboard-accumulation-card"
          aria-label="Valoare acumulată"
          className={`scroll-mt-24 rounded-eos-xl transition-all duration-500 ${
            highlightAccumulation
              ? "ring-2 ring-eos-primary/45 ring-offset-2 ring-offset-eos-bg"
              : ""
          }`}
        >
          <AccumulationCard />
        </section>
      )}

      {state.orgProfile && (
        <section aria-label="Activitate și monitorizare">
          <ActivityMonitorCard items={activityFeedItems} />
        </section>
      )}

      {/* ── Compact snapshot strip ─────────────────────────────────────────── */}
      <section aria-label="Sumar rapid de conformitate">
        <div className="grid grid-cols-2 divide-x divide-y divide-eos-border-subtle overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface sm:grid-cols-5 sm:divide-y-0">
          <SummaryMetric
            label="Conformitate globală"
            value={`${data.summary.score}%`}
            trend={
              benchmark
                ? {
                    delta: data.summary.score - benchmark.medie,
                    label: "% față de sector",
                  }
                : undefined
            }
          />
          <SummaryMetric label="Acțiuni active"        value={String(openTasks.length)}     alert={openTasks.length > 0} />
          <SummaryMetric label="Modificări detectate"  value={String(activeDrifts.length)}  alert={activeDrifts.length > 0} />
          <SummaryMetric label="Documente procesate"   value={String(state.scans.length)} />
          <SummaryMetric label="Stare audit"           value={auditStatusLabel} />
        </div>
      </section>

      {/* ── Secondary cards — below the fold, collapsible ─────────────────── */}
      {state.orgProfile && (
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-5 py-3.5 text-sm font-medium text-eos-text hover:bg-eos-surface-variant [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 shrink-0 text-eos-text-muted transition-transform group-open:rotate-90" strokeWidth={2} />
            Semnale, benchmark și instrumente
            <span className="ml-auto text-xs text-eos-text-muted">
              {benchmark ? `Top ${benchmark.percentil}% sector · ` : ""}
              {openAlerts.length > 0 ? `${openAlerts.length} alerte · ` : ""}
              {state.efacturaConnected ? "e-Factura activ" : "e-Factura inactiv"}
            </span>
          </summary>

          <div className="mt-4 space-y-5">
            {/* Benchmark sector widget */}
            {benchmark && (
              <div className="flex items-center gap-4 rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-4">
                <BarChart3 className="size-5 shrink-0 text-eos-primary" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-eos-text">
                    Ești în top{" "}
                    <span className={benchmark.percentil <= 33 ? "text-eos-success" : benchmark.percentil <= 66 ? "text-eos-warning" : "text-eos-error"}>
                      {benchmark.percentil}%
                    </span>{" "}
                    din firme din sectorul{" "}
                    <span className="font-semibold">{benchmark.sector}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-eos-text-muted">
                    Media sectorului: {benchmark.medie}% · Scorul tău: {data.summary.score}% · Bazat pe {benchmark.nrFirme} firme similare
                  </p>
                </div>
                <Badge
                  className={`shrink-0 ${
                    data.summary.score >= benchmark.medie
                      ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
                      : "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
                  }`}
                >
                  {data.summary.score >= benchmark.medie ? "Peste medie" : "Sub medie"}
                </Badge>
              </div>
            )}

            {/* Executive summary one-pager */}
            <Card className="border-eos-border bg-eos-surface">
              <div className="px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-4 shrink-0 text-eos-primary" strokeWidth={2} />
                    <p className="text-sm font-semibold text-eos-text">Rezumat executiv</p>
                    <Badge variant="outline" className="text-[10px] normal-case tracking-normal">Board / Investitor</Badge>
                  </div>
                  <Link
                    href={dashboardRoutes.reports}
                    className="flex items-center gap-1 text-xs text-eos-primary hover:underline"
                  >
                    <Download className="size-3" />
                    Descarcă PDF
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ExecMetric label="Scor conformitate" value={`${data.summary.score}%`} good={data.summary.score >= 70} />
                  <ExecMetric label="Acțiuni deschise" value={String(openTasks.length)} good={openTasks.length === 0} />
                  <ExecMetric label="Riscuri active" value={String(activeRiskCount)} good={activeRiskCount === 0} />
                  <ExecMetric label="Documente auditate" value={String(state.scans.length)} good={state.scans.length > 0} />
                </div>
                {openTasks.slice(0, 3).length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-eos-text-muted">Priorități cheie</p>
                    {openTasks.slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-xs text-eos-text-muted">
                        <span className={`size-1.5 rounded-full shrink-0 ${t.priority === "P1" ? "bg-eos-error" : t.priority === "P2" ? "bg-eos-warning" : "bg-eos-text-muted"}`} />
                        {t.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Calendar widget */}
            <CalendarWidget />

            {/* Pay Transparency 2026 */}
            <PayTransparencyWidget employeeCount={state.orgProfile.employeeCount} />

            {/* e-Factura health card */}
            <EFacturaHealthCard
              connected={state.efacturaConnected}
              signalsCount={state.efacturaSignalsCount}
            />

            {/* DSAR countdown card */}
            <DsarCountdownCard />

            {/* Site scan */}
            <SiteScanCard
              existingScan={state.siteScan ?? null}
              defaultUrl={state.orgProfile?.website ?? undefined}
            />

            {/* NIS2 Applicability Gate */}
            <Nis2ApplicabilityGate
              assessmentDone={nis2AssessmentDone}
              score={nis2Score}
              entityType={nis2EntityType}
              urgentIncident={nis2UrgentIncident}
            />

            {/* Agent status */}
            <AgentStatusWidget />
          </div>
        </details>
      )}

      {/* ── Detailed breakdown — framework readiness ─────────────────────────── */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-5 py-4 text-sm font-medium text-eos-text hover:bg-eos-surface-variant [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 shrink-0 text-eos-text-muted transition-transform group-open:rotate-90" strokeWidth={2} />
          Detalii conformitate pe cadru
          <span className="ml-auto text-xs text-eos-text-muted">
            GDPR {gdprScore}%
            {applicability?.tags.includes("nis2") && <> · NIS2 {nis2Score !== null ? `${nis2Score}%` : "—"}</>}
            {" "}· AI Act {aiActScore}% · e-Factura {state.efacturaConnected ? "activ" : "inactiv"}
          </span>
        </summary>
        <div className="mt-4 space-y-6">
          {/* DNSC registration CTA */}
          {state.orgProfile && applicability?.tags.includes("nis2") && (
            <DnscRegistrationBanner />
          )}

          {/* Vigilance Strip */}
          {state.orgProfile && (() => {
            const strip = getVigilanceStrip(state.orgProfile.sector)
            if (!strip.visible) return null
            const bgClass = strip.level === "high"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
            const iconColor = strip.level === "high" ? "text-red-500" : "text-amber-500"
            return (
              <div className={`flex items-center gap-3 rounded-eos-lg border px-4 py-2.5 text-sm ${bgClass}`}>
                <ShieldAlert className={`size-4 shrink-0 ${iconColor}`} strokeWidth={2} />
                <div className="flex-1">
                  <span className="font-semibold">Vigilență {strip.label.toLowerCase()}</span>
                  <span className="mx-1.5 text-xs opacity-60">·</span>
                  <span className="text-xs opacity-80">{strip.message}</span>
                </div>
                <Badge variant={strip.level === "high" ? "destructive" : "warning"} className="shrink-0 text-[10px] normal-case tracking-normal">
                  ANAF
                </Badge>
              </div>
            )
          })()}

          {/* Compliance Streak */}
          {state.complianceStreak && state.complianceStreak.currentDays > 0 && (
            <div className="flex items-center gap-3 rounded-eos-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              <Flame className="size-4 shrink-0 text-amber-500" strokeWidth={2} />
              <div className="flex-1">
                <span className="font-semibold">
                  {state.complianceStreak.currentDays} zile consecutive peste {state.complianceStreak.threshold}%
                </span>
                <span className="mx-1.5 text-xs opacity-60">·</span>
                <span className="text-xs opacity-80">
                  Record: {state.complianceStreak.longestStreak} zile
                </span>
              </div>
              <Badge variant="warning" className="shrink-0 text-[10px] normal-case tracking-normal">
                Streak
              </Badge>
            </div>
          )}

          {state.complianceStreak && state.complianceStreak.currentDays === 0 && state.complianceStreak.brokenAt && (
            <div className="flex items-center gap-3 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-2.5 text-sm text-eos-text-muted">
              <Flame className="size-4 shrink-0 opacity-40" strokeWidth={2} />
              <div className="flex-1">
                <span className="font-medium">Seria ta s-a întrerupt</span>
                <span className="mx-1.5 text-xs opacity-60">·</span>
                <span className="text-xs opacity-70">
                  Record: {state.complianceStreak.longestStreak} zile · Crește scorul peste {state.complianceStreak.threshold}% pentru a reporni
                </span>
              </div>
            </div>
          )}

          {/* Framework readiness cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <ReadinessFrameworkCard
              framework="GDPR"
              percent={gdprScore}
              missing={tasks.filter((t) => t.principles.includes("privacy_data_governance") && t.status !== "done").length}
              status={gdprStatus}
              description="Conformitatea prelucrarii datelor"
              icon={CheckCircle2}
              ariaLabel={`GDPR: ${gdprScore}% pregatit`}
              applicabilityCertainty={applicability?.entries.find(e => e.tag === "gdpr")?.certainty ?? "certain"}
              legalTag="gdpr"
              applicabilityReason={applicability?.entries.find(e => e.tag === "gdpr")?.reason}
              legalStatusNote={FRAMEWORK_LEGAL_STATUS.gdpr.note}
            />
            <ReadinessFrameworkCard
              framework="NIS2"
              percent={nis2Score ?? 0}
              missing={nis2Score === null ? 1 : nis2Score < 50 ? 1 : 0}
              status={nis2UrgentIncident ? "blocked" : nis2Score === null ? "review" : nis2Score >= 75 ? "strong" : nis2Score >= 40 ? "good" : "review"}
              description={nis2UrgentIncident ? "⚠ Incident critic — deadline DNSC < 4h" : nis2Score !== null ? "Maturitate cibernetică evaluată" : "Evaluare maturitate lipsă"}
              icon={Shield}
              ariaLabel={`NIS2: ${nis2Score ?? 0}% pregatit`}
              applicabilityCertainty={applicability?.entries.find(e => e.tag === "nis2")?.certainty}
              legalTag="nis2"
              applicabilityReason={applicability?.entries.find(e => e.tag === "nis2")?.reason}
              urgentPulse={nis2UrgentIncident}
              legalStatusNote={FRAMEWORK_LEGAL_STATUS.nis2.note}
            />
            <ReadinessFrameworkCard
              framework="AI Act"
              percent={aiActScore}
              missing={aiHighRisk}
              status={aiActStatus}
              description={totalAiSystems > 0 ? "Sisteme AI in inventar" : "Nu s-au detectat sisteme AI"}
              icon={Layers}
              ariaLabel={`AI Act: ${aiActScore}% pregatit`}
              applicabilityCertainty={applicability?.entries.find(e => e.tag === "ai-act")?.certainty}
              legalTag="ai-act"
              applicabilityReason={applicability?.entries.find(e => e.tag === "ai-act")?.reason}
              legalStatusNote={FRAMEWORK_LEGAL_STATUS["ai-act"].note}
            />
            <ReadinessFrameworkCard
              framework="e-Factura"
              percent={efacturaScore}
              missing={state.efacturaConnected ? 0 : 1}
              status={efacturaStatus}
              description={state.efacturaConnected ? "Sincronizare ANAF activa" : "Integrare ANAF lipsa"}
              icon={FileText}
              ariaLabel={`e-Factura: ${efacturaScore}% pregatit`}
              applicabilityCertainty={applicability?.entries.find(e => e.tag === "efactura")?.certainty}
              legalTag="efactura"
              applicabilityReason={applicability?.entries.find(e => e.tag === "efactura")?.reason}
              legalStatusNote={FRAMEWORK_LEGAL_STATUS.efactura.note}
            />
            <ReadinessFrameworkCard
              framework="Scor Global"
              percent={data.summary.score}
              missing={openTasks.length}
              status={data.summary.score >= 80 ? "strong" : "review"}
              description="Media controalelor validate"
              icon={ShieldCheck}
              ariaLabel={`Scor Global: ${data.summary.score}% pregatit`}
            />
          </div>

          {/* Sector Benchmark */}
          {benchmark && (
            <div className="flex items-center gap-3 rounded-eos-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
              <BarChart3 className="size-4 shrink-0 text-blue-500" strokeWidth={2} />
              <div className="flex-1">
                <span className="font-semibold">
                  Ești mai bun decât {benchmark.percentil}% din firme în {benchmark.sector}
                </span>
                <span className="mx-1.5 text-xs opacity-60">·</span>
                <span className="text-xs opacity-80">
                  Media sector: {benchmark.medie}% · {benchmark.nrFirme} firme comparate
                </span>
              </div>
              <Badge variant="default" className="shrink-0 text-[10px] normal-case tracking-normal">
                Benchmark
              </Badge>
            </div>
          )}

          {/* CER cross-signal */}
          {applicability?.tags.includes("cer") && (
            <div className="flex items-start gap-3 rounded-eos-lg border border-dashed border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <span className="mt-0.5 shrink-0 text-base">🏛️</span>
              <div className="flex-1">
                <p className="font-semibold">Directiva CER — Reziliență Entități Critice</p>
                <p className="mt-0.5 text-xs text-blue-700">
                  {applicability.entries.find((e) => e.tag === "cer")?.reason}
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  Directiva (EU) 2022/2557 vizează reziliența fizică (nu doar cibernetică) a infrastructurii critice — în paralel cu NIS2.
                  Verificați cu un specialist juridic dacă aveți obligații suplimentare de continuitate operațională.
                </p>
              </div>
            </div>
          )}

          {/* Health Check */}
          <HealthCheckCard />
        </div>
      </details>
    </div>
  )
}

// ── Calendar Widget (MULT C) ──────────────────────────────────────────────────

type DashCalEvent = {
  id: string
  title: string
  detail: string
  deadlineISO: string
  daysLeft: number
  group: "overdue" | "today" | "this-week" | "this-month" | "later"
  severity: "critical" | "high" | "medium" | "low"
  href: string
}

type AgentSummary = {
  agentType: string
  label: string
  implemented: boolean
  lastRun: { completedAt: string; status: string } | null
}

function AgentStatusWidget() {
  const [agents, setAgents] = useState<AgentSummary[]>([])

  useEffect(() => {
    fetch("/api/agents", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { agents?: AgentSummary[] }) => { if (d.agents) setAgents(d.agents) })
      .catch(() => null)
  }, [])

  if (agents.length === 0) return null

  const activeCount = agents.filter((a) => a.lastRun).length

  return (
    <section aria-label="Agenți CompliAI">
      <Link href={dashboardRoutes.agents} className="block">
        <div className="flex items-center justify-between gap-4 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3 transition-all hover:border-eos-primary/40">
          <div className="flex items-center gap-3">
            <Bot className="size-5 shrink-0 text-eos-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-semibold text-eos-text">
                Agenții CompliAI monitorizează activ
              </p>
              <p className="text-xs text-eos-text-muted">
                {agents.slice(0, 3).map((a) => a.label).join(", ")}
                {agents.length > 3 && ` +${agents.length - 3} mai mulți`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={activeCount > 0 ? "success" : "outline"} className="text-[10px] normal-case tracking-normal">
              {activeCount}/{agents.length} activi
            </Badge>
            <ChevronRight className="size-4 text-eos-text-muted" strokeWidth={2} />
          </div>
        </div>
      </Link>
    </section>
  )
}

function CalendarWidget() {
  const [events, setEvents] = useState<DashCalEvent[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard/calendar", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { events?: DashCalEvent[] } | null) => {
        setEvents(data?.events ?? [])
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded) return null

  const urgent = events.filter((e) => e.group === "overdue" || e.group === "today")
  const thisWeek = events.filter((e) => e.group === "this-week")

  if (urgent.length === 0 && thisWeek.length === 0) return null

  const sevColor = (s: DashCalEvent["severity"]) =>
    s === "critical" || s === "high"
      ? "text-eos-error"
      : s === "medium"
        ? "text-eos-warning"
        : "text-eos-text-muted"

  return (
    <section aria-label="Deadline-uri calendar">
      <div className="overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface">
        <div className="flex items-center gap-2 border-b border-eos-border-subtle px-5 py-3">
          <CalendarClock className="size-4 shrink-0 text-eos-text-muted" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-eos-text">Calendar deadline-uri</span>
          <Link
            href="/dashboard/calendar"
            className="ml-auto text-xs font-medium text-eos-primary hover:underline"
          >
            Vezi tot →
          </Link>
        </div>

        <div className="divide-y divide-eos-border-subtle">
          {urgent.length > 0 && (
            <div className="px-5 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-eos-error">
                Urgențe azi{urgent.some((e) => e.group === "overdue") ? " · Depășite" : ""}
              </p>
              <div className="space-y-1.5">
                {urgent.map((e) => (
                  <Link
                    key={e.id}
                    href={e.href}
                    className="flex items-center gap-3 rounded-eos-md px-2 py-1.5 hover:bg-eos-surface-variant"
                  >
                    <span className={`shrink-0 text-xs font-semibold tabular-nums ${sevColor(e.severity)}`}>
                      {e.daysLeft < 0 ? `−${Math.abs(e.daysLeft)}z` : e.daysLeft === 0 ? "Azi" : `${e.daysLeft}z`}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-eos-text">{e.title}</span>
                    <ChevronRight className="size-3.5 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {thisWeek.length > 0 && (
            <div className="px-5 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
                Săptămâna asta
              </p>
              <div className="space-y-1.5">
                {thisWeek.slice(0, 3).map((e) => (
                  <Link
                    key={e.id}
                    href={e.href}
                    className="flex items-center gap-3 rounded-eos-md px-2 py-1.5 hover:bg-eos-surface-variant"
                  >
                    <span className={`shrink-0 text-xs font-semibold tabular-nums ${sevColor(e.severity)}`}>
                      {e.daysLeft}z
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-eos-text">{e.title}</span>
                    <ChevronRight className="size-3.5 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
                  </Link>
                ))}
                {thisWeek.length > 3 && (
                  <Link
                    href="/dashboard/calendar"
                    className="block px-2 text-xs text-eos-text-muted hover:text-eos-primary"
                  >
                    + {thisWeek.length - 3} mai mult...
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function DnscRegistrationBanner() {
  return (
    <section aria-label="Înregistrare DNSC NIS2">
      <div className="flex flex-col gap-3 rounded-eos-lg border border-eos-warning-border bg-eos-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-eos-warning" strokeWidth={2} />
          <div>
            <p className="text-sm font-semibold text-eos-text">
              Înregistrare DNSC obligatorie — NIS2
            </p>
            <p className="mt-0.5 text-xs text-eos-text-muted">
              Termenul a expirat în septembrie 2025. Înregistrează-te acum pentru a evita sancțiunile.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/nis2/inregistrare-dnsc"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-eos-md border border-eos-warning-border bg-eos-warning px-3 py-2 text-sm font-medium text-eos-warning-text transition hover:opacity-90"
        >
          Începe acum
          <ArrowRight className="size-4" strokeWidth={2} />
        </Link>
      </div>
    </section>
  )
}

function ExecMetric({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.15em] text-eos-text-tertiary">{label}</p>
      <p className={`mt-1 text-base font-semibold ${good ? "text-eos-success" : "text-eos-warning"}`}>{value}</p>
    </div>
  )
}

function SnapshotFocusCard({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: { label: string; detail?: string }[]
}) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <div className="border-b border-eos-border-subtle px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
          Primul snapshot
        </p>
        <p className="mt-2 text-base font-semibold text-eos-text">{title}</p>
        <p className="mt-1 text-sm text-eos-text-muted">{subtitle}</p>
      </div>
      <div className="space-y-3 px-5 py-4">
        {items.map((item) => (
          <div key={`${title}-${item.label}`} className="rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-3">
            <p className="text-sm font-medium text-eos-text">{item.label}</p>
            {item.detail ? (
              <p className="mt-1 text-xs leading-relaxed text-eos-text-muted">{item.detail}</p>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  )
}

function SummaryMetric({
  label,
  value,
  alert = false,
  trend,
}: {
  label: string
  value: string
  alert?: boolean
  trend?: { delta: number; label: string }
}) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-lg font-semibold ${alert ? "text-eos-warning" : "text-eos-text"}`}>
          {value}
        </span>
        {trend && trend.delta !== 0 ? (
          <span
            className={`text-[11px] font-medium ${
              trend.delta > 0 ? "text-eos-success" : "text-eos-error"
            }`}
          >
            {trend.delta > 0 ? "▲" : "▼"} {Math.abs(trend.delta)}{trend.label}
          </span>
        ) : null}
      </div>
    </div>
  )
}

type ActivityFeedItem = {
  id: string
  eyebrow: string
  title: string
  detail: string
  dateISO: string
  tone: "default" | "success" | "warning"
  href?: string
}

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
      eyebrow: "Ți-am salvat",
      title: `${doc.title} este în dosar`,
      detail:
        doc.approvedByEmail
          ? `Aprobat de ${doc.approvedByEmail} și păstrat în Vault pentru audit și handoff.`
          : "Documentul aprobat rămâne în Vault pentru audit și handoff.",
      dateISO: doc.approvedAtISO ?? doc.generatedAtISO,
      tone: "success",
      href: dashboardRoutes.auditorVault,
    })

    if (doc.nextReviewDateISO) {
      const reviewAt = new Date(doc.nextReviewDateISO).getTime()
      const withinWindow = Number.isFinite(reviewAt) && reviewAt - now <= 45 * 24 * 60 * 60 * 1000
      if (withinWindow) {
        items.push({
          id: `doc-review-${doc.id}`,
          eyebrow: "Urmează reverificare",
          title: `${doc.title} cere review`,
          detail: `Review recomandat la ${new Date(doc.nextReviewDateISO).toLocaleDateString("ro-RO")}. Dacă apare drift, finding-ul se poate redeschide pe aceeași urmă.`,
          dateISO: doc.nextReviewDateISO,
          tone: "warning",
          href: dashboardRoutes.auditorVault,
        })
      }
    }
  }

  for (const drift of activeDrifts.slice(0, 4)) {
    items.push({
      id: `drift-${drift.id}`,
      eyebrow: "Am detectat",
      title: drift.summary,
      detail: drift.nextAction ?? drift.impactSummary ?? "Verifică schimbarea și decide dacă revine în execuție.",
      dateISO: drift.detectedAtISO,
      tone: drift.severity === "critical" || drift.severity === "high" ? "warning" : "default",
      href: dashboardRoutes.drifts,
    })
  }

  for (const event of events.slice(0, 8)) {
    const eyebrow =
      event.entityType === "drift"
        ? "Am verificat"
        : event.entityType === "task"
          ? "Am validat"
          : event.entityType === "finding"
            ? "Am actualizat"
            : "Activitate"
    const href =
      event.entityType === "drift"
        ? dashboardRoutes.drifts
        : event.entityType === "task" || event.entityType === "finding"
          ? dashboardRoutes.resolve
          : dashboardRoutes.reports

    items.push({
      id: `event-${event.id}`,
      eyebrow,
      title: event.message,
      detail:
        event.actorLabel
          ? `${event.actorLabel}${event.actorRole ? ` · ${event.actorRole}` : ""}`
          : "Activitate salvată în logul operațional.",
      dateISO: event.createdAtISO,
      tone:
        event.entityType === "drift"
          ? "warning"
          : event.type.includes("validated") || event.type.includes("evidence")
            ? "success"
            : "default",
      href,
    })
  }

  return items
    .sort((left, right) => right.dateISO.localeCompare(left.dateISO))
    .slice(0, 6)
}

function ActivityMonitorCard({ items }: { items: ActivityFeedItem[] }) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-eos-text">Compli lucrează pentru tine</p>
            <p className="mt-1 text-xs text-eos-text-muted">
              Ce am verificat pentru tine, ce am detectat, ce a intrat la dosar și ce urmează să reverificăm.
            </p>
          </div>
          <Link
            href={dashboardRoutes.auditLog}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-eos-primary hover:underline"
          >
            Audit log
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-4 text-sm text-eos-text-muted">
            Monitorizarea este activă. Primele verificări, dovezi salvate și reverificări vor apărea aici.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => {
              const toneClass =
                item.tone === "success"
                  ? "bg-eos-success"
                  : item.tone === "warning"
                    ? "bg-eos-warning"
                    : "bg-eos-primary"

              const body = (
                <div className="flex items-start gap-3 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3 transition-colors hover:bg-eos-surface-variant">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${toneClass}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                        {item.eyebrow}
                      </p>
                      <span className="text-[11px] text-eos-text-muted">
                        {new Date(item.dateISO).toLocaleString("ro-RO", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-eos-text">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-eos-text-muted">{item.detail}</p>
                  </div>
                  {item.href ? (
                    <ArrowRight className="mt-1 size-3.5 shrink-0 text-eos-text-muted" strokeWidth={2} />
                  ) : null}
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
      </div>
    </Card>
  )
}

function ReadinessFrameworkCard({
  framework,
  percent,
  missing,
  status,
  description,
  icon: Icon,
  ariaLabel,
  applicabilityCertainty,
  legalTag,
  applicabilityReason,
  urgentPulse = false,
  legalStatusNote,
}: {
  framework: string
  percent: number
  missing: number
  status: "strong" | "good" | "review" | "blocked"
  description?: string
  icon?: React.ElementType
  ariaLabel?: string
  applicabilityCertainty?: ApplicabilityCertainty
  legalTag?: ApplicabilityTag
  applicabilityReason?: string
  urgentPulse?: boolean
  legalStatusNote?: string
}) {
  const statusConfig = {
    strong:  { label: "CONFIRMARE PUTERNICĂ",    color: "success"     as const },
    good:    { label: "CONFIRMARE OPERAȚIONALĂ", color: "default"     as const },
    review:  { label: "REVIEW NECESAR",          color: "warning"     as const },
    blocked: { label: "BLOCAT",                  color: "destructive" as const },
  }
  const config = statusConfig[status]

  const isUnlikely = applicabilityCertainty === "unlikely"

  return (
    <Card
      className={`flex flex-col justify-between p-5 transition-all ${
        isUnlikely
          ? "border-eos-border bg-eos-surface opacity-50 hover:opacity-70"
          : urgentPulse
            ? "border-red-400 bg-red-50 animate-pulse hover:animate-none"
            : "border-eos-border bg-eos-surface hover:border-eos-border-strong"
      }`}
      aria-label={ariaLabel}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="size-5 text-eos-text-muted" strokeWidth={2} />}
            <h3 className="font-semibold text-eos-text">{framework}</h3>
            {legalTag && applicabilityCertainty && applicabilityCertainty !== "unlikely" && (
              <LegalSourceBadge
                explanation={getSuggestionExplanation(
                  legalTag,
                  applicabilityReason ?? "",
                  applicabilityCertainty
                )}
              />
            )}
          </div>
          {isUnlikely ? (
            <Badge variant="secondary" className="text-[10px] normal-case tracking-normal">
              Nu se aplică
            </Badge>
          ) : (
            <Badge variant={config.color} className="text-[10px]">
              {config.label}
            </Badge>
          )}
        </div>
        {applicabilityCertainty === "probable" && (
          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-eos-warning">
            Probabil aplicabil
          </p>
        )}
        {description && (
          <p className={`mt-2 text-xs leading-tight ${isUnlikely ? "text-eos-text-muted" : "text-eos-text-muted"}`}>
            {description}
          </p>
        )}
        {legalStatusNote && !isUnlikely && (
          <p className="mt-2 text-[11px] leading-snug text-eos-text-muted italic">
            {legalStatusNote}
          </p>
        )}
        <div className="mt-5 flex items-end gap-2">
          <span className="text-3xl font-semibold text-eos-text">{percent}%</span>
          <span className="mb-1 text-xs text-eos-text-muted">pregatit</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-eos-surface-variant">
          <div className="h-full bg-eos-primary transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
        {!isUnlikely && missing > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-eos-warning">
            <AlertTriangle className="size-3.5" strokeWidth={2} />
            <span>{missing} actiuni deschise</span>
          </div>
        )}
      </div>
    </Card>
  )
}

function EFacturaHealthCard({ connected, signalsCount }: { connected: boolean; signalsCount: number }) {
  const [summary, setSummary] = useState<{ rejected: number; xmlErrors: number; delayed: number; unsubmitted: number; total: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/efactura/signals", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { signals?: { status: string }[] } | null) => {
        const signals = data?.signals ?? []
        setSummary({
          total: signals.length,
          rejected: signals.filter((s) => s.status === "rejected").length,
          xmlErrors: signals.filter((s) => s.status === "xml-error").length,
          delayed: signals.filter((s) => s.status === "processing-delayed").length,
          unsubmitted: signals.filter((s) => s.status === "unsubmitted").length,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hasRisk = summary && (summary.rejected + summary.xmlErrors) > 0
  const hasSomething = connected || signalsCount > 0

  if (!hasSomething && !summary?.total) return null

  return (
    <section aria-label="Semnale e-Factura">
      <Card className={`border-eos-border ${hasRisk ? "border-eos-error/30 bg-eos-error/4" : "bg-eos-surface"}`}>
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FileWarning className={`mt-0.5 size-5 shrink-0 ${hasRisk ? "text-eos-error" : "text-eos-text-muted"}`} strokeWidth={2} />
            <div>
              <p className="text-sm font-semibold text-eos-text">
                Semnale e-Factura
                {loading ? "" : summary?.total ? ` — ${summary.total} active` : " — fara semnale"}
              </p>
              {!loading && summary && summary.total > 0 && (
                <p className="mt-1 text-xs text-eos-text-muted">
                  {summary.rejected > 0 && <span className="font-medium text-eos-error">{summary.rejected} respinse</span>}
                  {summary.rejected > 0 && summary.xmlErrors > 0 && " · "}
                  {summary.xmlErrors > 0 && <span className="font-medium text-eos-error">{summary.xmlErrors} erori XML</span>}
                  {(summary.rejected > 0 || summary.xmlErrors > 0) && summary.delayed > 0 && " · "}
                  {summary.delayed > 0 && <span>{summary.delayed} blocate</span>}
                  {(summary.rejected > 0 || summary.xmlErrors > 0 || summary.delayed > 0) && summary.unsubmitted > 0 && " · "}
                  {summary.unsubmitted > 0 && <span>{summary.unsubmitted} netransmise</span>}
                </p>
              )}
              {!loading && (!summary || summary.total === 0) && (
                <p className="mt-1 text-xs text-eos-text-muted">
                  {connected ? "Sincronizare ANAF activa — fara probleme detectate." : "Nicio factura cu probleme detectata."}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/fiscal"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-eos-primary hover:underline"
          >
            Detalii
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
        </div>
      </Card>
    </section>
  )
}

// ── NIS2 Applicability Gate (GOLD 6) ─────────────────────────────────────────
function Nis2ApplicabilityGate({
  assessmentDone,
  score,
  entityType,
  urgentIncident,
}: {
  assessmentDone: boolean
  score: number | null
  entityType: "essential" | "important" | null
  urgentIncident: boolean
}) {
  // Only show when not assessed OR when there's a urgent incident
  if (assessmentDone && !urgentIncident) return null

  if (urgentIncident) {
    return (
      <section aria-label="NIS2 incident critic">
        <Card className="border-red-200 bg-red-50">
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600" strokeWidth={2} />
              <div>
                <p className="text-sm font-semibold text-red-800">Incident NIS2 critic — deadline DNSC sub 4h</p>
                <p className="mt-1 text-xs text-red-700">
                  Ai un incident cu deadline de raportare iminent. Deschide NIS2 pentru a trimite early warning.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/nis2?tab=incidents"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-red-700 hover:underline"
            >
              Deschide incidente
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          </div>
        </Card>
      </section>
    )
  }

  // Not assessed yet — show the gate
  return (
    <section aria-label="NIS2 aplicabilitate">
      <Card className="border-eos-primary/20 bg-eos-primary/3">
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 size-5 shrink-0 text-eos-primary" strokeWidth={2} />
            <div>
              <p className="text-sm font-semibold text-eos-text">Se aplică NIS2 firmei tale?</p>
              <p className="mt-1 text-xs text-eos-text-muted">
                Directiva NIS2 (2022/2555) impune obligații de securitate cibernetică pentru entitățile esențiale și importante.
                Evaluarea durează ~10 minute și îți arată exact ce trebuie să faci.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/nis2"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-eos-md border border-eos-primary/30 bg-eos-primary/10 px-3 py-2 text-sm font-medium text-eos-primary hover:bg-eos-primary/20"
          >
            Evaluează acum
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
        </div>
      </Card>
    </section>
  )
}

// ── Pay Transparency 2026 — RULE PACK aggregate widget ───────────────────────
function PayTransparencyWidget({ employeeCount }: { employeeCount: string }) {
  const isLarge = employeeCount === "250+"
  const isCandidate = employeeCount === "50-249" || isLarge

  if (!isCandidate) return null

  const deadline = "7 iunie 2026"
  const reportingNote = isLarge
    ? "Raportare anuală a ecartului salarial de gen (din 2027)"
    : "Raportare la 3 ani a ecartului salarial de gen (din 2031)"

  return (
    <section aria-label="Pay Transparency 2026">
      <Card className="border-eos-border bg-eos-surface">
        <div className="flex items-start gap-3 px-5 py-4">
          <Scale className="mt-0.5 size-5 shrink-0 text-eos-primary" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-eos-text">Pregătire Pay Transparency — Directiva UE 2023/970</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Deadline transpunere: {deadline}
              </span>
            </div>
            <p className="mt-1 text-xs text-eos-text-muted">{reportingNote}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Inventar roluri", note: "Clasifică funcții pe benzi salariale" },
                { label: "Calcul ecart", note: "Gen pay gap per categorie" },
                { label: "Politică salarială", note: "Documente transparente" },
              ].map((step) => (
                <div key={step.label} className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-2">
                  <p className="text-[11px] font-semibold text-eos-text">{step.label}</p>
                  <p className="mt-0.5 text-[10px] text-eos-text-muted">{step.note}</p>
                </div>
              ))}
            </div>
          </div>
          <Link
            href="/dashboard/resolve"
            className="shrink-0 text-xs font-medium text-eos-primary hover:underline"
          >
            Vezi finding →
          </Link>
        </div>
      </Card>
    </section>
  )
}

function DsarCountdownCard() {
  const [dsarData, setDsarData] = useState<{ active: number; urgent: number; nearestDays: number | null } | null>(null)

  useEffect(() => {
    fetch("/api/dsar", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { requests?: { status: string; deadlineISO: string; extendedDeadlineISO?: string }[] } | null) => {
        const requests = data?.requests ?? []
        const active = requests.filter((r) => !["responded", "refused"].includes(r.status))
        if (active.length === 0) { setDsarData(null); return }
        const now = Date.now()
        const daysList = active.map((r) => {
          const dl = new Date(r.extendedDeadlineISO ?? r.deadlineISO).getTime()
          return Math.ceil((dl - now) / (24 * 60 * 60 * 1000))
        })
        const urgent = daysList.filter((d) => d <= 5).length
        const nearest = Math.min(...daysList)
        setDsarData({ active: active.length, urgent, nearestDays: nearest })
      })
      .catch(() => {})
  }, [])

  if (!dsarData || dsarData.active === 0) return null

  const isUrgent = dsarData.urgent > 0

  return (
    <section aria-label="DSAR active">
      <Card className={`border-eos-border ${isUrgent ? "border-eos-error/30 bg-eos-error/4" : "bg-eos-surface"}`}>
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Shield className={`mt-0.5 size-5 shrink-0 ${isUrgent ? "text-eos-error" : "text-eos-primary"}`} strokeWidth={2} />
            <div>
              <p className="text-sm font-semibold text-eos-text">
                {dsarData.active} DSAR active
                {dsarData.urgent > 0 && <span className="text-eos-error"> — {dsarData.urgent} urgente</span>}
              </p>
              <p className="mt-1 text-xs text-eos-text-muted">
                {dsarData.nearestDays !== null && dsarData.nearestDays <= 0
                  ? `Deadline depășit cu ${Math.abs(dsarData.nearestDays)} zile!`
                  : `Cel mai apropiat deadline: ${dsarData.nearestDays} zile`}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/dsar"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-eos-primary hover:underline"
          >
            Deschide DSAR
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
        </div>
      </Card>
    </section>
  )
}
