"use client"

// FC-6 (2026-05-14) — Pre-ANAF Simulation Card.
//
// "Dacă ANAF ar verifica azi clientul, unde pici prima dată?" — butonul wow
// din Doc 09 cap 5. Click → afișează Top 5 riscuri ordonate după magnitude
// (probabilitate × expunere), cu sumă în RON și acțiuni concrete.

import { useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  FileText,
  Info,
  Loader2,
  Play,
  Target,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

// ── Types (mirror lib/compliance/pre-anaf-simulation.ts) ─────────────────────

type Probability = "imminent" | "high" | "medium" | "low"
type Category =
  | "cross-correlation"
  | "filing-discipline"
  | "audit-risk-signal"
  | "sequence-gap"
  | "recurring-pattern"

type Risk = {
  id: string
  category: Category
  title: string
  detail: string
  exposureRON: { min: number; max: number }
  probability: Probability
  sourceDocs: string[]
  missingDocs: string[]
  nextAction: string
  owner: "cabinet" | "client" | "ambii"
  avoidedCostRON: number
  period: string | null
  legalReference: string
  rankingScore: number
  sourceId?: string
}

type SimulationReport = {
  generatedAtISO: string
  question: string
  topRisks: Risk[]
  summary: {
    totalRisks: number
    totalExposureMinRON: number
    totalExposureMaxRON: number
    totalAvoidedIfResolvedRON: number
    breakdown: { imminent: number; high: number; medium: number; low: number }
  }
  strategicRecommendation: string
}

// ── Visual config ────────────────────────────────────────────────────────────

const PROBABILITY_CONFIG: Record<
  Probability,
  { label: string; tone: string; icon: typeof AlertCircle }
> = {
  imminent: {
    label: "IMINENT",
    tone: "border-eos-error/40 bg-eos-error-soft text-eos-error",
    icon: Zap,
  },
  high: {
    label: "RIDICAT",
    tone: "border-eos-warning/40 bg-eos-warning-soft text-eos-warning",
    icon: AlertCircle,
  },
  medium: {
    label: "MEDIU",
    tone: "border-eos-warning/30 bg-eos-warning-soft/50 text-eos-warning",
    icon: AlertTriangle,
  },
  low: {
    label: "SCĂZUT",
    tone: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
    icon: Info,
  },
}

const CATEGORY_LABELS: Record<Category, string> = {
  "cross-correlation": "Cross-correlation",
  "filing-discipline": "Disciplină depuneri",
  "audit-risk-signal": "Semnal audit",
  "sequence-gap": "Gap secvență",
  "recurring-pattern": "Pattern recurent",
}

function fmtRON(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return n.toLocaleString("ro-RO", { maximumFractionDigits: 0 })
}

// ── Component ────────────────────────────────────────────────────────────────

export function PreANAFSimulationCard() {
  const [report, setReport] = useState<SimulationReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  async function runSimulation() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/pre-anaf-simulation?topN=5", {
        method: "POST",
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Simulare eșuată.")
        return
      }
      setReport(data.simulation as SimulationReport)
      setHasRun(true)
      const sim = data.simulation as SimulationReport
      toast.success(
        sim.summary.totalRisks === 0
          ? "Niciun risc activ! 🎉"
          : `${sim.summary.totalRisks} riscuri — top ${sim.topRisks.length} afișate.`,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare simulare.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-eos-lg border-2 border-eos-warning/40 bg-gradient-to-br from-eos-warning-soft via-eos-surface to-eos-surface p-6 shadow-eos-md">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-eos-warning" strokeWidth={2} />
            <h2
              data-display-text="true"
              className="font-display text-[17px] font-bold tracking-[-0.015em] text-eos-text"
            >
              Simulare control ANAF
            </h2>
          </div>
          <p
            data-display-text="true"
            className="mt-2 font-display text-[20px] font-semibold leading-[1.25] tracking-[-0.015em] text-eos-text md:text-[24px]"
          >
            „Dacă ANAF te-ar verifica azi,
            <br />
            <span className="text-eos-warning">unde pici prima dată?"</span>
          </p>
          <p className="mt-2 max-w-2xl text-[12.5px] text-eos-text-muted">
            Apasă butonul: agregăm diferențele între declarații, întârzierile și
            impactul economic și-ți arătăm <strong>Top 5 riscuri active</strong>{" "}
            ordonate după magnitudine. Pentru fiecare: sumă în lei, probabilitate
            escalare, acțiunea concretă de remediere.
          </p>
        </div>
        <button
          type="button"
          onClick={runSimulation}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-eos-md border-2 border-eos-warning bg-eos-warning px-5 py-3 text-[14px] font-bold text-white shadow-eos-md transition hover:bg-eos-warning/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />
          ) : (
            <Play className="size-4" strokeWidth={2.5} />
          )}
          {loading ? "Simulez..." : hasRun ? "Re-simulează" : "Simulează ACUM"}
        </button>
      </header>

      {report && (
        <div className="mt-6">
          {report.topRisks.length === 0 ? (
            <div className="rounded-eos-md border border-eos-success/40 bg-eos-success-soft p-4 text-eos-success">
              <p data-display-text="true" className="font-display text-[16px] font-bold">
                🎉 Niciun risc activ identificat
              </p>
              <p className="mt-1 text-[12px]">
                {report.strategicRecommendation}
              </p>
            </div>
          ) : (
            <>
              {/* Strategic recommendation banner */}
              <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft/50 p-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
                  Recomandare strategică
                </p>
                <p className="mt-1 text-[12.5px] text-eos-text">
                  {report.strategicRecommendation}
                </p>
              </div>

              {/* Summary tiles */}
              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2.5">
                  <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
                    Total riscuri active
                  </p>
                  <p
                    data-display-text="true"
                    className="mt-0.5 font-display text-[24px] font-bold text-eos-text"
                  >
                    {report.summary.totalRisks}
                  </p>
                </div>
                <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3 py-2.5 text-eos-error">
                  <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
                    Iminente
                  </p>
                  <p
                    data-display-text="true"
                    className="mt-0.5 font-display text-[24px] font-bold"
                  >
                    {report.summary.breakdown.imminent}
                  </p>
                </div>
                <div className="rounded-eos-sm border border-eos-warning/40 bg-eos-warning-soft px-3 py-2.5 text-eos-warning">
                  <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
                    💰 Expunere maximă
                  </p>
                  <p
                    data-display-text="true"
                    className="mt-0.5 font-display text-[18px] font-bold"
                  >
                    {fmtRON(report.summary.totalExposureMaxRON)} RON
                  </p>
                </div>
                <div className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-3 py-2.5 text-eos-success">
                  <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
                    Cost evitat dacă rezolvi
                  </p>
                  <p
                    data-display-text="true"
                    className="mt-0.5 font-display text-[18px] font-bold"
                  >
                    {fmtRON(report.summary.totalAvoidedIfResolvedRON)} RON
                  </p>
                </div>
              </div>

              {/* Top risks list */}
              <div className="mt-4 space-y-2">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Top {report.topRisks.length} riscuri (ordonate după magnitudine)
                </p>
                {report.topRisks.map((risk, idx) => {
                  const probCfg = PROBABILITY_CONFIG[risk.probability]
                  const ProbIcon = probCfg.icon
                  return (
                    <div
                      key={risk.id}
                      className="rounded-eos-md border border-eos-border bg-eos-surface p-3 transition hover:border-eos-warning/40 hover:shadow-eos-sm"
                    >
                      <div className="flex items-start gap-3">
                        {/* Ranking number + probability badge */}
                        <div className="flex shrink-0 flex-col items-center gap-1.5">
                          <div className="flex size-7 items-center justify-center rounded-full bg-eos-warning/20 font-display text-[14px] font-bold text-eos-warning">
                            #{idx + 1}
                          </div>
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-eos-sm border px-1.5 py-0 font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] ${probCfg.tone}`}
                          >
                            <ProbIcon className="size-2.5" strokeWidth={2.5} />
                            {probCfg.label}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p
                            data-display-text="true"
                            className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
                          >
                            {risk.title}
                          </p>
                          {risk.period && (
                            <span className="mt-0.5 inline-block rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0 font-mono text-[9.5px] text-eos-text-muted">
                              {risk.period}
                            </span>
                          )}
                          <p className="mt-1 text-[11.5px] leading-[1.5] text-eos-text-muted">
                            {risk.detail}
                          </p>

                          {/* Exposure + avoided */}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
                            <div className="flex items-center gap-1 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-2 py-0.5 text-eos-warning">
                              <TrendingDown className="size-3" strokeWidth={2.5} />
                              <strong>
                                {fmtRON(risk.exposureRON.min)}–
                                {fmtRON(risk.exposureRON.max)} RON
                              </strong>
                              <span className="opacity-70">expunere</span>
                            </div>
                            <div className="flex items-center gap-1 text-eos-text-muted">
                              <Users className="size-3" strokeWidth={2} />
                              owner: <strong>{risk.owner}</strong>
                            </div>
                          </div>

                          {/* Missing docs */}
                          {risk.missingDocs.length > 0 && (
                            <div className="mt-2 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft/30 px-2 py-1.5 text-[10.5px] text-eos-warning">
                              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] opacity-80">
                                <FileText className="-mt-0.5 mr-1 inline size-3" strokeWidth={2.5} />
                                Documente lipsă
                              </p>
                              <ul className="mt-0.5 ml-3 list-disc">
                                {risk.missingDocs.map((d, i) => (
                                  <li key={i}>{d}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Next action */}
                          <div className="mt-2 flex items-start gap-1.5 rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-2 py-1.5 text-eos-primary">
                            <ArrowRight className="mt-0.5 size-3 shrink-0" strokeWidth={2.5} />
                            <p className="text-[11px] font-medium">
                              <strong className="font-mono text-[9.5px] uppercase tracking-[0.12em] opacity-70">
                                Următorul pas:
                              </strong>{" "}
                              {risk.nextAction}
                            </p>
                          </div>

                          {/* Legal ref + category */}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-eos-text-tertiary">
                            <span className="font-mono uppercase tracking-[0.12em]">
                              {CATEGORY_LABELS[risk.category]}
                            </span>
                            <span>·</span>
                            <span>{risk.legalReference}</span>
                          </div>
                        </div>

                        {/* Ranking score badge */}
                        <div className="hidden shrink-0 md:block">
                          <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-2 py-1 text-center">
                            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-eos-text-muted">
                              Score
                            </p>
                            <p
                              data-display-text="true"
                              className="mt-0.5 font-display text-[16px] font-bold text-eos-warning"
                            >
                              {risk.rankingScore}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="mt-4 flex items-center gap-1 text-[10.5px] text-eos-text-tertiary">
                <Clock className="size-3" strokeWidth={2} />
                Simulare generată{" "}
                {new Date(report.generatedAtISO).toLocaleString("ro-RO")}. Re-rulează
                periodic pentru a urmări evoluția riscurilor.
              </p>
            </>
          )}
        </div>
      )}

      {!report && !loading && (
        <div className="mt-6 rounded-eos-md border border-dashed border-eos-warning/40 bg-eos-warning-soft/20 px-4 py-5 text-center">
          <Eye className="mx-auto size-6 text-eos-warning" strokeWidth={1.8} />
          <p
            data-display-text="true"
            className="mt-2 font-display text-[14px] font-semibold text-eos-text"
          >
            Apasă "Simulează ACUM" pentru a vedea ce ar găsi ANAF azi
          </p>
          <p className="mt-1 text-[11.5px] text-eos-text-muted">
            Răspuns instant. Niciun call extern. Doar agregare cross-correlation +
            economic impact din state-ul tău curent.
          </p>
        </div>
      )}
    </section>
  )
}
