"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RotateCcw,
  Shield,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import {
  MATURITY_DOMAINS,
  scoreMaturity,
  type MaturityAnswer,
  type MaturityAnswers,
  type MaturityDomainResult,
} from "@/lib/compliance/nis2-maturity"
import type { MaturityAssessment } from "@/lib/server/nis2-store"

// ── Helpers ────────────────────────────────────────────────────────────────────

const ANSWER_OPTIONS: { value: MaturityAnswer; label: string; color: string }[] = [
  { value: "yes", label: "Da", color: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
  {
    value: "partial",
    label: "Parțial",
    color: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100",
  },
  { value: "no", label: "Nu", color: "text-red-700 bg-red-50 border-red-200 hover:bg-red-100" },
  {
    value: "na",
    label: "Nu se aplică",
    color: "text-eos-text-muted bg-eos-surface border-eos-border hover:bg-eos-surface-variant",
  },
]

function statusBadge(status: MaturityDomainResult["status"]) {
  if (status === "compliant")
    return <Badge variant="success">Conform</Badge>
  if (status === "partial")
    return <Badge variant="warning">Parțial</Badge>
  return <Badge variant="destructive">Neconform</Badge>
}

function levelBadge(level: MaturityAssessment["level"]) {
  if (level === "essential") return <Badge variant="success">Esențial</Badge>
  if (level === "important") return <Badge variant="warning">Important</Badge>
  return <Badge variant="destructive">Bazic</Badge>
}

function domainProgress(answers: MaturityAnswers, domainId: string) {
  const domain = MATURITY_DOMAINS.find((d) => d.id === domainId)!
  const answered = domain.questions.filter((q) => answers[q.id] !== undefined).length
  return { answered, total: domain.questions.length, complete: answered === domain.questions.length }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })
}

// ── Results view ───────────────────────────────────────────────────────────────

function ResultsView({
  assessment,
  onRestart,
}: {
  assessment: MaturityAssessment
  onRestart: () => void
}) {
  const weakDomains = assessment.domains.filter((d) => d.score < 50)
  const daysToDeadline = Math.ceil(
    (new Date(assessment.remediationPlanDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-eos-text-tertiary">
                Scor general maturitate
              </p>
              <p className="mt-1 text-4xl font-bold text-eos-text">{assessment.overallScore}%</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {levelBadge(assessment.level)}
                <span className="text-xs text-eos-text-muted">
                  Completat: {formatDate(assessment.completedAt)}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-eos-text-muted">Plan remediere datorat până la</p>
              <p
                className={`text-sm font-semibold ${daysToDeadline < 7 ? "text-red-600" : daysToDeadline < 14 ? "text-amber-600" : "text-eos-text"}`}
              >
                {formatDate(assessment.remediationPlanDue)}
              </p>
              {daysToDeadline > 0 ? (
                <p className="text-xs text-eos-text-muted">în {daysToDeadline} zile</p>
              ) : (
                <p className="text-xs font-medium text-red-600 animate-pulse">DEPĂȘIT</p>
              )}
            </div>
          </div>

          {/* Overall bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-eos-surface-variant">
            <div
              className={`h-full rounded-full transition-all ${
                assessment.overallScore >= 70
                  ? "bg-emerald-500"
                  : assessment.overallScore >= 40
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${assessment.overallScore}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Domain scores */}
      <Card className="border-eos-border bg-eos-surface">
        <CardHeader className="px-5 pt-4 pb-0">
          <CardTitle className="text-sm font-semibold">Scoruri pe domenii</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-eos-border-subtle px-5 py-2">
          {assessment.domains.map((d) => {
            const def = MATURITY_DOMAINS.find((x) => x.id === d.id)!
            return (
              <div key={d.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-eos-text">{d.name}</p>
                    <p className="text-[10px] text-eos-text-muted">{def.legalRef}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-eos-text">{d.score}%</span>
                    {statusBadge(d.status)}
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-eos-surface-variant">
                  <div
                    className={`h-full rounded-full ${
                      d.score >= 70 ? "bg-emerald-500" : d.score >= 40 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                {d.score < 50 && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-eos-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-600" />
                    <span>{def.closureRecipe}</span>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {weakDomains.length > 0 && (
        <div className="rounded-eos-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <ShieldAlert className="size-4" />
            {weakDomains.length} domeniu{weakDomains.length > 1 ? "i" : ""} cu scor sub 50% — findings automate generate
          </div>
          <p className="mt-1 text-xs text-amber-700">
            Problemele detectate au fost adăugate în tabloul de remediere. Vezi secțiunea Acțiuni active.
          </p>
        </div>
      )}

      {/* Legal notice */}
      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <p className="font-medium text-eos-text">
          Bază legală: OUG 155/2024 Art. 18(7) ✅ + NIS2 Art.21(2)
        </p>
        <p className="mt-1">
          Auto-evaluarea de maturitate este obligatorie în 60 de zile de la depunerea evaluării riscului. Planul de
          remediere trebuie depus în 30 de zile după completarea auto-evaluării. Nivelurile (bazic / important /
          esențial) sunt determinate de DNSC.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="gap-2" onClick={onRestart}>
          <RotateCcw className="size-4" strokeWidth={2} />
          Reîncepe evaluarea
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href="/dashboard/nis2">Înapoi la NIS2</Link>
        </Button>
      </div>
    </div>
  )
}

// ── Wizard ─────────────────────────────────────────────────────────────────────

export default function MaturitatePage() {
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState<MaturityAssessment | null>(null)
  const [answers, setAnswers] = useState<MaturityAnswers>({})
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<MaturityAssessment | null>(null)

  useEffect(() => {
    fetch("/api/nis2/maturity", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { assessment: MaturityAssessment | null }) => {
        if (d.assessment) {
          setSaved(d.assessment)
          setAnswers(d.assessment.answers as MaturityAnswers)
          setResult(d.assessment)
          setSubmitted(true)
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const domain = MATURITY_DOMAINS[step]
  const totalSteps = MATURITY_DOMAINS.length
  const progress = domainProgress(answers, domain.id)
  const liveResult = scoreMaturity(answers)
  const currentDomainResult = liveResult.domains[step]

  function setAnswer(questionId: string, value: MaturityAnswer) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function canGoNext() {
    return progress.complete
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch("/api/nis2/maturity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      const data = (await res.json()) as { assessment?: MaturityAssessment; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Salvarea a eșuat.")
      setResult(data.assessment!)
      setSubmitted(true)
      toast.success("Auto-evaluare de maturitate salvată", {
        description: `Scor general: ${data.assessment!.overallScore}% — nivel ${data.assessment!.level}`,
      })
    } catch (err) {
      toast.error("Eroare la salvare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  function handleRestart() {
    setAnswers({})
    setStep(0)
    setSubmitted(false)
    setResult(null)
  }

  if (loading) return <LoadingScreen variant="section" />

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageIntro
        eyebrow="NIS2 — Maturitate"
        title="Auto-evaluare maturitate DNSC"
        description="Evaluare pe 10 domenii NIS2 Art.21(2). Obligatorie în 60 de zile de la evaluarea riscului. Bază: OUG 155/2024 Art. 18(7) ✅"
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              OUG 155/2024 Art.18(7)
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              NIS2 Art.21(2)
            </Badge>
          </>
        }
      />

      {submitted && result ? (
        <ResultsView assessment={result} onRestart={handleRestart} />
      ) : (
        <>
          {/* Saved assessment CTA */}
          {saved && !submitted && (
            <div className="rounded-eos-lg border border-eos-primary/30 bg-eos-primary-soft px-4 py-3 text-sm text-eos-text">
              <span className="font-semibold">Evaluare anterioară: </span>
              {saved.overallScore}% · {formatDate(saved.completedAt)}.{" "}
              <button
                type="button"
                className="font-medium text-eos-primary underline"
                onClick={() => {
                  setResult(saved)
                  setSubmitted(true)
                }}
              >
                Vezi rezultatele
              </button>
            </div>
          )}

          {/* Progress header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-eos-text-muted">
              <span>
                Domeniu {step + 1} din {totalSteps}
              </span>
              <span>
                {Object.keys(answers).length} din{" "}
                {MATURITY_DOMAINS.reduce((s, d) => s + d.questions.length, 0)} întrebări
              </span>
            </div>
            <div className="flex gap-1">
              {MATURITY_DOMAINS.map((d, i) => {
                const p = domainProgress(answers, d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i === step
                        ? "bg-eos-primary"
                        : p.complete
                          ? "bg-emerald-400"
                          : p.answered > 0
                            ? "bg-amber-400"
                            : "bg-eos-surface-variant"
                    }`}
                    onClick={() => setStep(i)}
                    title={d.name}
                  />
                )
              })}
            </div>
          </div>

          {/* Domain card */}
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="px-5 pt-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
                    {domain.legalRef}
                  </p>
                  <CardTitle className="mt-0.5 text-base font-semibold text-eos-text">
                    {domain.name}
                  </CardTitle>
                </div>
                {progress.complete && currentDomainResult && statusBadge(currentDomainResult.status)}
              </div>
            </CardHeader>

            <CardContent className="divide-y divide-eos-border-subtle px-5 pb-4">
              {domain.questions.map((q, qi) => {
                const current = answers[q.id]
                return (
                  <div key={q.id} className="py-4">
                    <p className="mb-3 text-sm text-eos-text">
                      <span className="mr-1.5 text-eos-text-muted">{qi + 1}.</span>
                      {q.text}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ANSWER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAnswer(q.id, opt.value)}
                          className={`rounded-eos-md border px-3 py-1.5 text-xs font-medium transition-all ${
                            current === opt.value
                              ? `${opt.color} ring-2 ring-offset-1 ring-current`
                              : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-border-subtle hover:text-eos-text"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft className="size-4" strokeWidth={2} />
              Anterior
            </Button>

            <div className="flex items-center gap-3">
              {step < totalSteps - 1 ? (
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={!canGoNext()}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Următor
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={submitting || !canGoNext()}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <ClipboardCheck className="size-4" strokeWidth={2} />
                  )}
                  Finalizează evaluarea
                </Button>
              )}
            </div>
          </div>

          {/* Legal notice */}
          <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface px-4 py-3 text-xs text-eos-text-muted">
            <span className="font-medium text-eos-text">Cum funcționează scorul:</span> Da = 100p · Parțial = 50p ·
            Nu = 0p · Nu se aplică = exclus din calcul. Domeniile cu scor sub 50% generează automat probleme în
            tabloul de remediere.
          </div>
        </>
      )}
    </div>
  )
}
