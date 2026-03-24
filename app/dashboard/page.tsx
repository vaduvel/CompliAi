"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, ChevronRight, FileText, FileWarning, Flame, Layers, Shield, ShieldCheck, ShieldAlert } from "lucide-react"

import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Card } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { LegalSourceBadge } from "@/components/compliscan/legal-source-badge"
import { getSuggestionExplanation, FRAMEWORK_LEGAL_STATUS } from "@/lib/compliance/legal-sources"
import type { ApplicabilityCertainty, ApplicabilityTag } from "@/lib/compliance/applicability"
import { HealthCheckCard } from "@/components/compliscan/health-check-card"
import { getVigilanceStrip } from "@/lib/compliance/sector-risk"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { NextBestAction } from "@/components/compliscan/next-best-action"
import { SiteScanCard } from "@/components/compliscan/site-scan-card"

export default function DashboardPage() {
  const runtime = useDashboardRuntime()
  const router = useRouter()
  const cockpit = useCockpitData()
  const [nis2Score, setNis2Score] = useState<number | null>(null)
  const [nis2EntityType, setNis2EntityType] = useState<"essential" | "important" | null>(null)
  const [nis2AssessmentDone, setNis2AssessmentDone] = useState(false)
  const [nis2UrgentIncident, setNis2UrgentIncident] = useState(false)
  const [benchmark, setBenchmark] = useState<{ medie: number; percentil: number; nrFirme: number; sector: string } | null>(null)

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
  }, [])

  if (cockpit.error && !cockpit.loading) return <ErrorScreen message={cockpit.error} variant="section" />
  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const { data, activeDrifts, tasks, nextBestAction, openAlerts } = cockpit
  const state = data.state
  const applicability = state.applicability ?? null

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
  const missingEvidenceCount = openTasks.filter((t) => !t.attachedEvidence).length
  const hasBaselineEvidence = Boolean(
    state.scans.length > 0 || state.scannedDocuments > 0 || state.validatedBaselineSnapshotId
  )
  const activeRiskCount = openAlerts.length + activeDrifts.length
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
  const isSolo = runtime?.userMode === "solo"

  return (
    <div className="space-y-5 sm:space-y-8 pb-20 sm:pb-0" role="main" aria-labelledby="dashboard-title">
      <PageIntro
        eyebrow="Acasă"
        title={isSolo ? "Starea actuală a firmei tale" : "Starea actuala a conformitatii tale"}
        description={
          isSolo
            ? "Vezi pe scurt unde există risc și pornește următorul pas concret fără să navighezi prin suprafețe specializate."
            : "Vezi rapid starea curenta si porneste urmatorul pas corect."
        }
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

      {/* ── Onboarding fallback (the real flow now lives in /onboarding) ───── */}
      {!state.orgProfile && (
        <section aria-label="Continua onboarding">
          <Card className="border-eos-primary/30 bg-eos-primary/5">
            <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-eos-text">Onboarding-ul asistat continua in ruta dedicata</p>
                <p className="mt-1 text-sm text-eos-text-muted">
                  Finalizeaza profilul firmei si primul raport initial inainte sa folosesti dashboard-ul.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 text-sm font-medium text-eos-primary hover:underline"
              >
                Continua onboarding
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
            onResolve={() => router.push(dashboardRoutes.resolve)}
            hasEvidence={hasBaselineEvidence}
            activeRiskCount={activeRiskCount}
          />
        </section>
      )}

      {/* ── Summary strip — compact health ─────────────────────────────────── */}
      <section aria-label="Sumar rapid de conformitate">
        <div className="grid grid-cols-2 divide-x divide-y divide-eos-border-subtle overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface sm:grid-cols-5 sm:divide-y-0">
          <SummaryMetric label="Conformitate globală"  value={`${data.summary.score}%`} />
          <SummaryMetric label="Acțiuni active"        value={String(openTasks.length)}     alert={openTasks.length > 0} />
          <SummaryMetric label="Modificări detectate"  value={String(activeDrifts.length)}  alert={activeDrifts.length > 0} />
          <SummaryMetric label="Documente procesate"   value={String(state.scans.length)} />
          <SummaryMetric label="Stare audit"           value={auditStatusLabel} />
        </div>
      </section>

      {/* ── e-Factura health card ────────────────────────────────────────────── */}
      {state.orgProfile && (
        <EFacturaHealthCard
          connected={state.efacturaConnected}
          signalsCount={state.efacturaSignalsCount}
        />
      )}

      {/* ── DSAR countdown card ───────────────────────────────────────────────── */}
      {state.orgProfile && <DsarCountdownCard />}

      {/* ── Site scan — Multiplicator A onboarding ───────────────────────────── */}
      {state.orgProfile && (
        <section aria-label="Scanare site">
          <SiteScanCard existingScan={state.siteScan ?? null} />
        </section>
      )}

      {/* ── NIS2 Applicability Gate ───────────────────────────────────────────── */}
      {state.orgProfile && (
        <Nis2ApplicabilityGate
          assessmentDone={nis2AssessmentDone}
          score={nis2Score}
          entityType={nis2EntityType}
          urgentIncident={nis2UrgentIncident}
        />
      )}

      {/* ── Detailed breakdown — under fold ──────────────────────────────────── */}
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

function SummaryMetric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
        {label}
      </span>
      <span className={`text-lg font-semibold ${alert ? "text-eos-warning" : "text-eos-text"}`}>
        {value}
      </span>
    </div>
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
