"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import type {
  ShadowAiAnswer,
  ShadowAiQuestion,
  ShadowAiAssessmentResult,
  ShadowAiRiskLevel,
} from "@/lib/compliance/shadow-ai"
import { SHADOW_AI_QUESTIONS, SHADOW_AI_SECTIONS } from "@/lib/compliance/shadow-ai"

// ── Display helpers ────────────────────────────────────────────────────────────

const RISK_BADGE: Record<ShadowAiRiskLevel, React.ComponentProps<typeof Badge>["variant"]> = {
  critical: "destructive",
  high:     "destructive",
  medium:   "warning",
  low:      "outline",
  none:     "success",
}

const RISK_LABEL: Record<ShadowAiRiskLevel, string> = {
  critical: "Risc Critic",
  high:     "Risc Ridicat",
  medium:   "Risc Mediu",
  low:      "Risc Scăzut",
  none:     "Niciun risc identificat",
}

const RISK_ICON = {
  critical: XCircle,
  high:     ShieldAlert,
  medium:   AlertTriangle,
  low:      AlertTriangle,
  none:     CheckCircle2,
} as const

// ── Question renderer ─────────────────────────────────────────────────────────

function QuestionItem({
  question,
  answer,
  onAnswer,
}: {
  question: ShadowAiQuestion
  answer: ShadowAiAnswer | undefined
  onAnswer: (questionId: string, value: string | string[]) => void
}) {
  const currentValue = answer?.value

  if (question.type === "yes-no" || question.type === "radio") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-eos-text">{question.text}</p>
        {question.helpText && (
          <p className="text-xs text-eos-text-muted">{question.helpText}</p>
        )}
        <div className="space-y-1.5">
          {(question.options ?? []).map((opt) => {
            const selected = currentValue === opt.value
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-eos-md border px-3 py-2.5 transition-colors ${
                  selected
                    ? "border-eos-primary bg-eos-primary/5"
                    : "border-eos-border bg-eos-surface-variant hover:border-eos-border-subtle hover:bg-eos-bg-inset"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt.value}
                  checked={selected}
                  onChange={() => onAnswer(question.id, opt.value)}
                  className="sr-only"
                />
                <div
                  className={`size-4 shrink-0 rounded-full border-2 transition-colors ${
                    selected ? "border-eos-primary bg-eos-primary" : "border-eos-border"
                  }`}
                />
                <span className="text-sm text-eos-text">{opt.label}</span>
                {opt.riskFlag && (
                  <AlertTriangle className="ml-auto size-3.5 shrink-0 text-eos-warning" strokeWidth={2} />
                )}
              </label>
            )
          })}
        </div>
        {question.aiActRef && (
          <p className="text-[10px] text-eos-text-muted opacity-70">{question.aiActRef}</p>
        )}
      </div>
    )
  }

  if (question.type === "multi-select") {
    const selectedValues = Array.isArray(currentValue) ? currentValue : []
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-eos-text">{question.text}</p>
        {question.helpText && (
          <p className="text-xs text-eos-text-muted">{question.helpText}</p>
        )}
        <div className="grid gap-1.5 sm:grid-cols-2">
          {(question.options ?? []).map((opt) => {
            const selected = selectedValues.includes(opt.value)
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-eos-md border px-3 py-2.5 transition-colors ${
                  selected
                    ? "border-eos-primary bg-eos-primary/5"
                    : "border-eos-border bg-eos-surface-variant hover:bg-eos-bg-inset"
                }`}
              >
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={selected}
                  onChange={() => {
                    const next = selected
                      ? selectedValues.filter((v) => v !== opt.value)
                      : [...selectedValues, opt.value]
                    onAnswer(question.id, next)
                  }}
                  className="sr-only"
                />
                <div
                  className={`size-4 shrink-0 rounded border-2 transition-colors ${
                    selected
                      ? "border-eos-primary bg-eos-primary"
                      : "border-eos-border"
                  }`}
                >
                  {selected && (
                    <CheckCircle2 className="size-3 text-white" strokeWidth={3} />
                  )}
                </div>
                <span className="text-xs text-eos-text">{opt.label}</span>
                {opt.riskFlag && (
                  <AlertTriangle className="ml-auto size-3 shrink-0 text-eos-warning" strokeWidth={2} />
                )}
              </label>
            )
          })}
        </div>
        {question.aiActRef && (
          <p className="text-[10px] text-eos-text-muted opacity-70">{question.aiActRef}</p>
        )}
      </div>
    )
  }

  return null
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ShadowAiQuestionnaire() {
  const [answers, setAnswers] = useState<ShadowAiAnswer[]>([])
  const [currentSection, setCurrentSection] = useState(0)
  const [result, setResult] = useState<ShadowAiAssessmentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load existing answers
  useEffect(() => {
    fetch("/api/shadow-ai", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { answers?: ShadowAiAnswer[] } | null) => {
        if (data?.answers && data.answers.length > 0) {
          setAnswers(data.answers)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleAnswer(questionId: string, value: string | string[]) {
    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === questionId)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { questionId, value }
        return next
      }
      return [...prev, { questionId, value }]
    })
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const res = await fetch("/api/shadow-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      if (res.ok) {
        const data: ShadowAiAssessmentResult = await res.json()
        setResult(data)
      }
    } catch {
      // silent fail
    } finally {
      setSaving(false)
    }
  }

  const sectionsWithQuestions = SHADOW_AI_SECTIONS.map((section) => ({
    name: section,
    questions: SHADOW_AI_QUESTIONS.filter((q) => q.section === section),
  }))

  const totalQuestions = SHADOW_AI_QUESTIONS.length
  const answeredCount = answers.filter((a) =>
    Array.isArray(a.value) ? a.value.length > 0 : Boolean(a.value)
  ).length
  const progress = Math.round((answeredCount / totalQuestions) * 100)
  const canSubmit = answeredCount >= Math.ceil(totalQuestions * 0.7)

  if (loading) {
    return (
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="py-8">
          <div className="h-32 animate-pulse rounded-eos-md bg-eos-surface-variant" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium font-mono uppercase tracking-[0.14em] text-eos-text-tertiary">
              Shadow AI
            </p>
            <CardTitle className="flex items-center gap-2 text-base text-eos-text">
              <Eye className="size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
              Chestionar utilizare AI nedeclarată
            </CardTitle>
            <p className="text-xs text-eos-text-muted">
              Identifică instrumente AI utilizate fără aprobare formală și evaluează riscul de conformitate.
            </p>
          </div>
          {result && (
            <Badge variant={RISK_BADGE[result.riskLevel]} className="normal-case tracking-normal">
              {RISK_LABEL[result.riskLevel]} · {result.riskScore}%
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] text-eos-text-muted">
            <span>{answeredCount}/{totalQuestions} întrebări răspunse</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-eos-surface-variant">
            <div
              className="h-full rounded-full bg-eos-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {result ? (
          // Results view
          <div className="space-y-4">
            {/* Risk summary */}
            <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
              {(() => {
                const Icon = RISK_ICON[result.riskLevel]
                return (
                  <div className="flex items-start gap-3">
                    <Icon
                      className={`mt-0.5 size-5 shrink-0 ${
                        result.riskLevel === "none" ? "text-eos-success" :
                        result.riskLevel === "low" ? "text-eos-warning" :
                        result.riskLevel === "medium" ? "text-eos-warning" :
                        "text-eos-error"
                      }`}
                      strokeWidth={2}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-eos-text">
                        {RISK_LABEL[result.riskLevel]} — Scor {result.riskScore}%
                      </p>
                      {result.detectedCategories.length > 0 && (
                        <p className="mt-1 text-xs text-eos-text-muted">
                          Categorii identificate: {result.detectedCategories.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Findings */}
            {result.findings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-eos-text-tertiary">
                  Finding-uri generate
                </p>
                {result.findings.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-3"
                  >
                    <div className="flex items-start gap-2">
                      <Badge
                        variant={f.severity === "critical" ? "destructive" : f.severity === "high" ? "destructive" : "warning"}
                        className="mt-0.5 shrink-0 normal-case tracking-normal text-[10px]"
                      >
                        {f.severity}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-eos-text">{f.title}</p>
                        <p className="mt-0.5 text-xs text-eos-text-muted">{f.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-eos-text-tertiary">
                  Recomandări
                </p>
                <ul className="space-y-1.5">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-eos-text-muted">
                      <ChevronRight className="mt-0.5 size-3 shrink-0 text-eos-primary" strokeWidth={2} />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Redo button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResult(null)}
              className="w-full"
            >
              <RefreshCw className="mr-2 size-3.5" strokeWidth={2} />
              Reface chestionarul
            </Button>
          </div>
        ) : (
          // Questionnaire view
          <>
            {/* Section tabs */}
            <div className="flex flex-wrap gap-2">
              {sectionsWithQuestions.map((section, i) => {
                const sectionAnswered = section.questions.filter((q) =>
                  answers.some(
                    (a) => a.questionId === q.id && (Array.isArray(a.value) ? a.value.length > 0 : Boolean(a.value))
                  )
                ).length
                return (
                  <button
                    key={section.name}
                    onClick={() => setCurrentSection(i)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      currentSection === i
                        ? "border-eos-primary bg-eos-primary text-white"
                        : "border-eos-border bg-eos-surface-variant text-eos-text-muted hover:bg-eos-bg-inset"
                    }`}
                  >
                    {section.name}
                    {sectionAnswered > 0 && (
                      <span className="ml-1 opacity-70">
                        ({sectionAnswered}/{section.questions.length})
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Current section questions */}
            <div className="space-y-6">
              {sectionsWithQuestions[currentSection]?.questions.map((q) => (
                <QuestionItem
                  key={q.id}
                  question={q}
                  answer={answers.find((a) => a.questionId === q.id)}
                  onAnswer={handleAnswer}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between border-t border-eos-border-subtle pt-4">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentSection === 0}
                onClick={() => setCurrentSection((s) => Math.max(0, s - 1))}
              >
                Înapoi
              </Button>

              {currentSection < sectionsWithQuestions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentSection((s) => s + 1)}
                >
                  Continuă
                  <ChevronRight className="ml-1 size-3.5" strokeWidth={2} />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => void handleSubmit()}
                  disabled={!canSubmit || saving}
                >
                  {saving ? (
                    <RefreshCw className="mr-2 size-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <Eye className="mr-2 size-3.5" strokeWidth={2} />
                  )}
                  {saving ? "Se procesează..." : "Evaluează riscul"}
                </Button>
              )}
            </div>

            {!canSubmit && answeredCount > 0 && (
              <p className="text-center text-[11px] text-eos-text-muted">
                Răspundeți la cel puțin 70% din întrebări pentru a genera evaluarea.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
