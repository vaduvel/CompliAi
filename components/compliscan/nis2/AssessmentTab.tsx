"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Shield,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import {
  NIS2_QUESTIONS,
  NIS2_CATEGORY_LABELS,
  SECTOR_LABELS,
  scoreNis2Assessment,
  type Nis2Answer,
  type Nis2Answers,
  type Nis2Result,
  type Nis2Sector,
  type Nis2Category,
} from "@/lib/compliance/nis2-rules"
import type { Nis2AssessmentRecord } from "@/lib/server/nis2-store"
import { MaturityBadge, buildAssessmentReturnEvidence, ANSWER_OPTIONS } from "./nis2-shared"

export function AssessmentTab({
  orgName,
  sourceFindingId,
  returnTo,
}: {
  orgName?: string
  sourceFindingId?: string
  returnTo?: string
}) {
  const router = useRouter()
  const [sector, setSector] = useState<Nis2Sector>("general")
  const [answers, setAnswers] = useState<Nis2Answers>({})
  const [answersMeta, setAnswersMeta] = useState<Record<string, { source: string; confidence: string; userConfirmed: boolean }>>({})
  const [saving, setSaving] = useState(false)
  const [generatingIR, setGeneratingIR] = useState(false)
  const [savedRecord, setSavedRecord] = useState<Nis2AssessmentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<Nis2Category>>(
    new Set(["risk-management", "incident-response"])
  )

  useEffect(() => {
    fetch("/api/nis2/assessment", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { assessment: Nis2AssessmentRecord | null }) => {
        if (d.assessment) {
          setSavedRecord(d.assessment)
          setSector(d.assessment.sector)
          setAnswers(d.assessment.answers)
          if (d.assessment.answersMeta) setAnswersMeta(d.assessment.answersMeta)
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const applicable = NIS2_QUESTIONS.filter(
    (q) => q.sectors === "all" || q.sectors.includes(sector)
  )

  const liveResult = scoreNis2Assessment(answers, sector)
  const answeredCount = applicable.filter((q) => answers[q.id]).length

  // Group by category
  const byCategory = applicable.reduce<Record<Nis2Category, typeof applicable>>(
    (acc, q) => {
      const cat = q.category
      acc[cat] = acc[cat] ?? []
      acc[cat].push(q)
      return acc
    },
    {} as Record<Nis2Category, typeof applicable>
  )

  async function handleGenerateIR() {
    setGeneratingIR(true)
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "nis2-incident-response",
          orgName: orgName ?? "Organizația mea",
          orgSector: sector !== "general" ? sector : undefined,
        }),
      })
      if (!res.ok) throw new Error("Generarea a eșuat.")
      const doc = (await res.json()) as { content: string; title: string }
      const blob = new Blob([doc.content], { type: "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `plan-ir-nis2-${new Date().toISOString().split("T")[0]}.md`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Plan IR NIS2 generat și descărcat")
    } catch (err) {
      toast.error("Eroare la generare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setGeneratingIR(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/nis2/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, answers, answersMeta }),
      })
      const data = (await res.json()) as { result?: Nis2Result; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Salvarea a eșuat.")
      setSavedRecord({
        sector,
        answers,
        savedAtISO: new Date().toISOString(),
        score: data.result!.score,
        maturityLabel: data.result!.maturityLabel,
      })

      if (sourceFindingId && returnTo) {
        toast.success("Evaluare NIS2 salvată. Revenim în cockpit.")
        const params = new URLSearchParams({
          assessmentFlow: "done",
          evidenceNote: buildAssessmentReturnEvidence(data.result!),
        })
        router.push(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${params.toString()}`)
        return
      }

      toast.success("Evaluare NIS2 salvată", {
        description: `Scor: ${data.result!.score}% — ${data.result!.maturityLabel}`,
      })
    } catch (err) {
      toast.error("Eroare la salvare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setSaving(false)
    }
  }

  function toggleCategory(cat: Nis2Category) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  if (loading) return <LoadingScreen variant="section" />

  const sectorOpts = Object.entries(SECTOR_LABELS()) as [Nis2Sector, string][]

  return (
    <div className="space-y-5">
      {/* Sprint 7: Hero CTA când nu există evaluare salvată */}
      {!savedRecord && answeredCount === 0 && (
        <div className="rounded-eos-lg border border-eos-primary/30 bg-eos-primary-soft p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-eos-text">Evaluează maturitatea NIS2 în 10 minute</p>
              <p className="mt-1 text-sm text-eos-text-muted">
                Alege sectorul tău și răspunde la 20 de întrebări. Primești scor + plan de remediere personalizat.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-eos-primary px-3 py-1.5 text-xs font-medium text-eos-primary-text">
              ~10 min
            </span>
          </div>
        </div>
      )}

      {/* Sector selector */}
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-eos-text-tertiary">
            Sector organizație
          </p>
          <div className="flex flex-wrap gap-2">
            {sectorOpts.map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setSector(val)
                  setAnswers({})
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  sector === val
                    ? "border-eos-primary bg-eos-primary/10 text-eos-primary"
                    : "border-eos-border bg-eos-surface text-eos-text-muted hover:bg-eos-surface-variant"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live score */}
      {answeredCount > 0 && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-eos-text-tertiary">
                  Scor curent ({answeredCount}/{applicable.length} răspunsuri)
                </p>
                <div className="mt-1 flex items-end gap-3">
                  <span className={`text-4xl font-bold ${
                    liveResult.score >= 75 ? "text-eos-success" : liveResult.score >= 50 ? "text-eos-warning" : "text-eos-error"
                  }`}>
                    {liveResult.score}%
                  </span>
                  <div className="mb-1">
                    <MaturityBadge label={liveResult.maturityLabel} />
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="normal-case tracking-normal">
                {liveResult.entityType === "essential" ? "Entitate esențială" : "Entitate importantă"}
              </Badge>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-eos-bg-inset">
              <div
                className={`h-full rounded-full transition-all ${
                  liveResult.score >= 75 ? "bg-eos-success" : liveResult.score >= 50 ? "bg-eos-warning" : "bg-eos-error"
                }`}
                style={{ width: `${liveResult.score}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions by category */}
      {(Object.entries(byCategory) as [Nis2Category, typeof applicable][]).map(([cat, qs]) => {
        const expanded = expandedCategories.has(cat)
        const catAnswered = qs.filter((q) => answers[q.id]).length
        return (
          <Card key={cat} className="border-eos-border bg-eos-surface">
            <button
              type="button"
              onClick={() => toggleCategory(cat)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-eos-text">{NIS2_CATEGORY_LABELS[cat]}</p>
                <span className="text-xs text-eos-text-muted">{catAnswered}/{qs.length}</span>
              </div>
              {expanded ? (
                <ChevronUp className="size-4 text-eos-text-muted" strokeWidth={2} />
              ) : (
                <ChevronDown className="size-4 text-eos-text-muted" strokeWidth={2} />
              )}
            </button>
            {expanded && (
              <CardContent className="space-y-3 px-5 pb-5 pt-0">
                {qs.map((q, idx) => {
                  const ans = answers[q.id]
                  return (
                    <div key={q.id} className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-eos-bg-inset text-[10px] font-bold text-eos-text-muted">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-eos-text">{q.text}</p>
                              {q.weight === 3 && (
                                <Badge variant="destructive" className="text-[10px] normal-case tracking-normal">
                                  obligatoriu
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-eos-text-muted">{q.hint}</p>
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-eos-text-tertiary">
                              {q.article}{q.dnscRef ? ` · ${q.dnscRef}` : ""}
                            </p>
                          </div>
                          {answersMeta[q.id] && !answersMeta[q.id].userConfirmed && (
                            <div className="mb-1 flex items-center gap-2">
                              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${answersMeta[q.id].confidence === "high" ? "bg-eos-success-soft text-eos-success" : answersMeta[q.id].confidence === "medium" ? "bg-eos-warning-soft text-eos-warning" : "bg-eos-error-soft text-eos-error"}`}>
                                {answersMeta[q.id].source === "vendor_data" ? "Vendor" : answersMeta[q.id].source === "org_profile" ? "Profil org" : "Precomplet"} · {answersMeta[q.id].confidence === "high" ? "ridicat" : answersMeta[q.id].confidence === "medium" ? "mediu" : "scăzut"}
                              </span>
                              <button
                                type="button"
                                className="text-[9px] font-medium text-eos-primary hover:underline"
                                onClick={() => setAnswersMeta((prev) => ({ ...prev, [q.id]: { ...prev[q.id], userConfirmed: true } }))}
                              >
                                Confirmă
                              </button>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {ANSWER_OPTIONS.map((opt) => {
                              const selected = ans === opt.value
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))
                                    setAnswersMeta((prev) => ({ ...prev, [q.id]: { source: "manual", confidence: "high", userConfirmed: true } }))
                                  }}
                                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                    selected
                                      ? opt.value === "yes"
                                        ? "border-eos-success/40 bg-eos-success-soft text-eos-success"
                                        : opt.value === "partial"
                                        ? "border-eos-warning/40 bg-eos-warning-soft text-eos-warning"
                                        : opt.value === "no"
                                        ? "border-eos-error/40 bg-eos-error-soft text-eos-error"
                                        : "border-eos-border bg-eos-surface-variant text-eos-text-muted"
                                      : "border-eos-border text-eos-text-muted hover:bg-eos-surface"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              )
                            })}
                          </div>
                          {ans && ans !== "yes" && ans !== "na" && (
                            <div className="flex items-start gap-1.5">
                              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-eos-warning" strokeWidth={2} />
                              <p className="text-xs text-eos-text-muted">{q.hint}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            )}
          </Card>
        )
      })}

      {/* Save + gaps */}
      <div className="space-y-4">
        <Button
          onClick={() => void handleSave()}
          disabled={saving || answeredCount === 0}
          className="w-full gap-2"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se salvează…
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" strokeWidth={2} />
              Salvează evaluarea NIS2{answeredCount < applicable.length ? ` (${answeredCount}/${applicable.length})` : ""}
            </>
          )}
        </Button>

        {/* Gap analysis */}
        {liveResult.gaps.length > 0 && answeredCount > 0 && (
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Gap analysis — {liveResult.gaps.length} lacun{liveResult.gaps.length !== 1 ? "e" : "ă"} identificat{liveResult.gaps.length !== 1 ? "e" : "ă"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {liveResult.gaps.map((gap) => {
                const Icon = gap.severity === "critical" ? XCircle : AlertTriangle
                const color = gap.severity === "critical" ? "text-eos-error" : gap.severity === "high" ? "text-eos-error" : "text-eos-warning"
                return (
                  <div key={gap.questionId} className="flex gap-3 rounded-eos-md border border-eos-border bg-eos-surface p-3">
                    <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} strokeWidth={2} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-eos-text">{gap.question}</p>
                      <p className="mt-0.5 text-xs text-eos-text-muted">{gap.article}</p>
                      <p className="mt-1.5 text-xs leading-5 text-eos-text-muted">{gap.remediationHint}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {savedRecord && (
          <p className="text-center text-xs text-eos-text-muted">
            Ultima salvare: {new Date(savedRecord.savedAtISO).toLocaleString("ro-RO")} · Scor: {savedRecord.score}%
          </p>
        )}

        {/* R-3: Generează Plan IR */}
        {answeredCount > 0 && (
          <Button
            variant="outline"
            onClick={() => void handleGenerateIR()}
            disabled={generatingIR}
            className="w-full gap-2"
          >
            {generatingIR ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Se generează planul IR…
              </>
            ) : (
              <>
                <FileText className="size-4" strokeWidth={2} />
                Generează Plan de Răspuns la Incidente (NIS2)
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

