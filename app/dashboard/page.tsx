"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, ChevronRight, FileText, Flame, Layers, Shield, ShieldCheck, ShieldAlert } from "lucide-react"

import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Card } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { ApplicabilityWizard } from "@/components/compliscan/applicability-wizard"
import { LegalSourceBadge } from "@/components/compliscan/legal-source-badge"
import { getSuggestionExplanation, FRAMEWORK_LEGAL_STATUS } from "@/lib/compliance/legal-sources"
import type { ApplicabilityCertainty, ApplicabilityTag } from "@/lib/compliance/applicability"
import { HealthCheckCard } from "@/components/compliscan/health-check-card"
import { getVigilanceStrip } from "@/lib/compliance/sector-risk"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { NextBestAction } from "@/components/compliscan/next-best-action"

export default function DashboardPage() {
  const router = useRouter()
  const cockpit = useCockpitData()
  const [nis2Score, setNis2Score] = useState<number | null>(null)
  const [nis2UrgentIncident, setNis2UrgentIncident] = useState(false)
  const [benchmark, setBenchmark] = useState<{ medie: number; percentil: number; nrFirme: number; sector: string } | null>(null)

  useEffect(() => {
    fetch("/api/nis2/assessment", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { assessment?: { score?: number } } | null) => {
        if (data?.assessment?.score != null) setNis2Score(data.assessment.score)
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

  const { data, activeDrifts, tasks, nextBestAction, openAlerts, reloadDashboard } = cockpit
  const state = data.state
  const applicability = state.applicability ?? null

  // ── Framework readiness ───────────────────────────────────────────────────
  const aiHighRisk = state.highRisk
  const aiLowRisk = state.lowRisk
  const totalAiSystems = aiHighRisk + aiLowRisk
  const aiActScore = totalAiSystems === 0 ? 0 : Math.max(0, 100 - aiHighRisk * 20)
  const aiActStatus = aiHighRisk > 0 ? "review" : totalAiSystems > 0 ? "strong" : "good"

  const gdprScore = state.gdprProgress
  const gdprStatus = gdprScore >= 90 ? "strong" : gdprScore >= 50 ? "good" : "review"

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

  return (
    <div className="space-y-8" role="main" aria-labelledby="dashboard-title">
      <PageIntro
        eyebrow="Acasă"
        title="Starea actuala a conformitatii tale"
        description="Vezi rapid starea curenta si porneste urmatorul pas corect."
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

      {/* ── Applicability Wizard (shown only before first profile) ─────────── */}
      {!state.orgProfile && (
        <section aria-label="Wizard aplicabilitate">
          <ApplicabilityWizard onComplete={() => { reloadDashboard() }} />
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
