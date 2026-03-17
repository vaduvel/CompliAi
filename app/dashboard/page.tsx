"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Database, FileText, History, Layers, ShieldCheck } from "lucide-react"

import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Card } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { EvidenceCore, type EvidenceCoreState, type AuditDecision } from "@/components/evidence-os/EvidenceCore"
import { LoadingScreen, ErrorScreen, DriftCommandCenter } from "@/components/compliscan/route-sections"
import { NextBestAction } from "@/components/compliscan/next-best-action"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { ApplicabilityWizard } from "@/components/compliscan/applicability-wizard"
import { LegalSourceBadge } from "@/components/compliscan/legal-source-badge"
import { getSuggestionExplanation } from "@/lib/compliance/legal-sources"
import type { ApplicabilityCertainty, ApplicabilityTag } from "@/lib/compliance/applicability"

// ─── State labels shown beside the orb ────────────────────────────────────────
const CORE_HEADLINE: Record<EvidenceCoreState, string> = {
  dormant:   "Sistem inactiv",
  scanning:  "Remediere în curs",
  reviewing: "Alerte deschise",
  drifting:  "Drift detectat",
  stable:    "Control stabil",
  blocked:   "Blocat de audit",
}
const AUDIT_DECISION_LABEL: Record<AuditDecision, string> = {
  ready:        "Pregătit",
  blocked:      "Blocat",
  weak:         "Dovezi slabe",
  "in-progress": "În progres",
  "not-started": "Neînceput",
}

const SCAN_SOURCE_LABEL: Record<string, string> = {
  document: "Document scanat",
  text:     "Text analizat",
  manifest: "Manifest YAML",
  yaml:     "Fișier YAML",
}

const CORE_HINT: Record<EvidenceCoreState, string> = {
  dormant:   "Rulează primul scan pentru a activa monitorizarea continuă.",
  scanning:  "Task-urile sunt active. Continuă să ataşezi dovezi şi să închidem itemii.",
  reviewing: "Alerte deschise aşteaptă analiză. Intrați în ele înainte de orice altceva.",
  drifting:  "Sistemul a deviat de la baseline validat. Intervino acum pentru a limita impactul.",
  stable:    "Toate task-urile sunt închise şi dovezile sunt în ordine. Pregătit de audit.",
  blocked:   "Drift-uri care blochează auditul activ. Prioritate maximă — rezolvă acum.",
}

export default function DashboardPage() {
  const router = useRouter()
  const cockpit = useCockpitData()

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
  const hasEvidence = state.scannedDocuments > 0 || state.scans.length > 0

  // ── EvidenceCore derivation ───────────────────────────────────────────────
  const coreState: EvidenceCoreState = activeDrifts.some((d) => d.blocksAudit)
    ? "blocked"
    : activeDrifts.length > 0
      ? "drifting"
      : openAlerts.length > 0
        ? "reviewing"
        : tasks.length > 0 && openTasks.length === 0
          ? "stable"
          : tasks.length > 0
            ? "scanning"
            : "dormant"

  const coreAuditDecision: AuditDecision =
    data.summary.score >= 90
      ? "ready"
      : activeDrifts.some((d) => d.blocksAudit)
        ? "blocked"
        : missingEvidenceCount > 0
          ? "weak"
          : data.summary.score >= 60
            ? "in-progress"
            : "not-started"

  const coreReasons = [
    ...activeDrifts.slice(0, 2).map((d) => d.summary),
    ...openAlerts.slice(0, 1).map((a) => a.message),
  ].filter(Boolean).slice(0, 3)

  return (
    <div className="space-y-8" role="main" aria-labelledby="dashboard-title">
      <PageIntro
        eyebrow="Dashboard"
        title="Starea actuala a conformitatii tale"
        description="Situatia globala: ce s-a schimbat, ce deviaza si ce cere interventie."
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

      {/* ── DNSC Registration CTA (Sprint 4) ──────────────────────────────────── */}
      {state.orgProfile && applicability?.tags.includes("nis2") && (
        <DnscRegistrationBanner />
      )}

      {/* ── Summary strip ─────────────────────────────────────────────────────── */}
      <section aria-label="Sumar rapid de conformitate">
        <div className="grid grid-cols-2 divide-x divide-y divide-eos-border-subtle overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface sm:grid-cols-5 sm:divide-y-0">
          <SummaryMetric label="Readiness global"  value={`${data.summary.score}%`} />
          <SummaryMetric label="Task-uri active"   value={String(openTasks.length)}     alert={openTasks.length > 0} />
          <SummaryMetric label="Drift deschis"     value={String(activeDrifts.length)}  alert={activeDrifts.length > 0} />
          <SummaryMetric label="Surse procesate"   value={String(state.scans.length)} />
          <SummaryMetric label="Stare audit"       value={AUDIT_DECISION_LABEL[coreAuditDecision]} />
        </div>
      </section>

      {/* ── Stare + acțiune imediată (grupate ca o singură zonă de control) ── */}
      <div className="space-y-4">
        <section aria-label="Nucleu de control">
          <Card className="border-eos-border bg-eos-surface">
            <div className="flex flex-col items-center gap-8 p-6 sm:flex-row sm:items-center sm:gap-10">
              {/* Orb full */}
              <div className="shrink-0">
                <EvidenceCore
                  state={coreState}
                  readinessScore={data.summary.score}
                  auditDecision={coreAuditDecision}
                  activeDrifts={activeDrifts.length}
                  reviewRequiredCount={openAlerts.length}
                  weakEvidenceCount={missingEvidenceCount}
                  reasons={coreReasons}
                  className="w-[200px]"
                />
              </div>

              {/* Description + context links */}
              <div className="flex flex-1 flex-col gap-4 text-center sm:text-left">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
                    Nucleu de control
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-eos-text">
                    {CORE_HEADLINE[coreState]}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-eos-text-muted">
                    {CORE_HINT[coreState]}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  {openTasks.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/dashboard/checklists")}
                      className="gap-2 text-eos-text-muted"
                    >
                      {openTasks.length} task-uri deschise
                      <ArrowRight className="size-3.5" strokeWidth={2} />
                    </Button>
                  )}
                  {activeDrifts.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/dashboard/control")}
                      className="gap-2 text-eos-text-muted"
                    >
                      {activeDrifts.length} drift-uri active
                      <ArrowRight className="size-3.5" strokeWidth={2} />
                    </Button>
                  )}
                  {openTasks.length === 0 && activeDrifts.length === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/dashboard/rapoarte/auditor-vault")}
                      className="gap-2 text-eos-text-muted"
                    >
                      Auditor Vault
                      <ArrowRight className="size-3.5" strokeWidth={2} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section aria-label="Urmatorul pas recomandat">
          <NextBestAction
            task={nextBestAction}
            onResolve={() => router.push("/dashboard/checklists")}
            hasEvidence={hasEvidence}
            activeRiskCount={openAlerts.length}
          />
        </section>
      </div>

      <section aria-label="Conformitate pe cadru" className="space-y-4">
        <h2 className="text-lg font-semibold text-eos-text">Conformitate pe cadru</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReadinessFrameworkCard
            framework="AI Act"
            percent={aiActScore}
            missing={aiHighRisk}
            status={aiActStatus}
            description={totalAiSystems > 0 ? "Sisteme AI in inventar" : "Nu s-au detectat sisteme AI"}
            icon={Layers}
            onViewDetails={() => router.push("/dashboard/sisteme")}
            ariaLabel={`AI Act: ${aiActScore}% pregatit`}
            applicabilityCertainty={applicability?.entries.find(e => e.tag === "ai-act")?.certainty}
            legalTag="ai-act"
            applicabilityReason={applicability?.entries.find(e => e.tag === "ai-act")?.reason}
          />
          <ReadinessFrameworkCard
            framework="GDPR"
            percent={gdprScore}
            missing={tasks.filter((t) => t.principles.includes("privacy_data_governance") && t.status !== "done").length}
            status={gdprStatus}
            description="Conformitatea prelucrarii datelor"
            icon={CheckCircle2}
            onViewDetails={() => router.push("/dashboard/checklists")}
            ariaLabel={`GDPR: ${gdprScore}% pregatit`}
            applicabilityCertainty={applicability?.entries.find(e => e.tag === "gdpr")?.certainty ?? "certain"}
            legalTag="gdpr"
            applicabilityReason={applicability?.entries.find(e => e.tag === "gdpr")?.reason}
          />
          <ReadinessFrameworkCard
            framework="e-Factura"
            percent={efacturaScore}
            missing={state.efacturaConnected ? 0 : 1}
            status={efacturaStatus}
            description={state.efacturaConnected ? "Sincronizare ANAF activa" : "Integrare ANAF lipsa"}
            icon={FileText}
            onViewDetails={() => router.push("/dashboard/setari")}
            ariaLabel={`e-Factura: ${efacturaScore}% pregatit`}
            applicabilityCertainty={applicability?.entries.find(e => e.tag === "efactura")?.certainty}
            legalTag="efactura"
            applicabilityReason={applicability?.entries.find(e => e.tag === "efactura")?.reason}
          />
          <ReadinessFrameworkCard
            framework="Scor Global"
            percent={data.summary.score}
            missing={openTasks.length}
            status={data.summary.score >= 80 ? "strong" : "review"}
            description="Media controalelor validate"
            icon={ShieldCheck}
            onViewDetails={() => router.push("/dashboard/rapoarte/auditor-vault")}
            ariaLabel={`Scor Global: ${data.summary.score}% pregatit`}
          />
        </div>
      </section>

      <section aria-label="Schimbari si drift activ" className="space-y-4" aria-live="polite">
        <DriftCommandCenter
          activeDrifts={activeDrifts}
          hasValidatedBaseline={Boolean(state.validatedBaselineSnapshotId)}
        />
      </section>

      {/* ── Snapshot / Activitate recentă ─────────────────────────────────────── */}
      <section aria-label="Snapshot si activitate recenta" className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-eos-text-tertiary">
          Snapshot &amp; Activitate recentă
        </h2>
        <Card className="divide-y divide-eos-border-subtle overflow-hidden border-eos-border bg-eos-surface">
          {/* Baseline */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2.5">
              <Database className="size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
              <span className="text-sm text-eos-text">Baseline validat</span>
            </div>
            <Badge
              variant={state.validatedBaselineSnapshotId ? "success" : "secondary"}
              className="normal-case tracking-normal text-[11px]"
            >
              {state.validatedBaselineSnapshotId ? "Activ" : "Lipsă"}
            </Badge>
          </div>

          {/* Surse recente */}
          {state.scans.length === 0 ? (
            <div className="flex items-center gap-2.5 px-5 py-4 text-sm text-eos-text-muted">
              <History className="size-4 shrink-0" strokeWidth={2} />
              <span>
                Nicio sursă procesată.{" "}
                <button
                  onClick={() => router.push("/dashboard/scanari")}
                  className="text-eos-primary underline-offset-2 hover:underline"
                >
                  Pornește primul scan
                </button>
              </span>
            </div>
          ) : (
            state.scans.slice(0, 3).map((scan, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <Activity className="size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
                  <span className="text-sm text-eos-text">
                    {SCAN_SOURCE_LABEL[scan.sourceKind as string] ?? scan.sourceKind}
                  </span>
                </div>
                {"scannedAt" in scan && scan.scannedAt ? (
                  <span className="text-xs text-eos-text-muted">
                    {new Date(String(scan.scannedAt)).toLocaleDateString("ro-RO", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                ) : null}
              </div>
            ))
          )}
        </Card>
      </section>
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
  onViewDetails,
  ariaLabel,
  applicabilityCertainty,
  legalTag,
  applicabilityReason,
}: {
  framework: string
  percent: number
  missing: number
  status: "strong" | "good" | "review" | "blocked"
  description?: string
  icon?: React.ElementType
  onViewDetails?: () => void
  ariaLabel?: string
  applicabilityCertainty?: ApplicabilityCertainty
  legalTag?: ApplicabilityTag
  applicabilityReason?: string
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
      {onViewDetails && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewDetails}
          className="group mt-5 w-full justify-between"
        >
          Vezi detalii
          <ArrowRight className="size-4 text-eos-text-muted transition-transform group-hover:translate-x-1" strokeWidth={2} />
        </Button>
      )}
    </Card>
  )
}
