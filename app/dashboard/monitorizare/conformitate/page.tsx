"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronRight, Download, FileText, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import {
  AI_CONFORMITY_QUESTIONS,
  buildAnnexIVDocument,
  scoreAssessment,
  type AssessmentAnswer,
  type AssessmentAnswers,
  type AssessmentResult,
} from "@/lib/compliance/ai-conformity-assessment"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

// ── Answer selector ───────────────────────────────────────────────────────────

const ANSWER_OPTIONS: Array<{ value: AssessmentAnswer; label: string; color: string }> = [
  { value: "yes", label: "Da", color: "emerald" },
  { value: "partial", label: "Parțial", color: "amber" },
  { value: "no", label: "Nu", color: "red" },
  { value: "na", label: "N/A", color: "gray" },
]

function AnswerSelector({
  value,
  onChange,
}: {
  value: AssessmentAnswer | undefined
  onChange: (v: AssessmentAnswer) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ANSWER_OPTIONS.map((opt) => {
        const selected = value === opt.value
        const baseClass = "rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
        const colorMap: Record<string, string> = {
          emerald: selected
            ? "border-eos-success/40 bg-eos-success-soft text-eos-success"
            : "border-eos-border text-eos-text-muted hover:border-eos-success/30 hover:text-eos-success",
          amber: selected
            ? "border-eos-warning/40 bg-eos-warning-soft text-eos-warning"
            : "border-eos-border text-eos-text-muted hover:border-eos-warning/30 hover:text-eos-warning",
          red: selected
            ? "border-eos-error/40 bg-eos-error-soft text-eos-error"
            : "border-eos-border text-eos-text-muted hover:border-eos-error/30 hover:text-eos-error",
          gray: selected
            ? "border-eos-border bg-eos-surface-variant text-eos-text-muted"
            : "border-eos-border text-eos-text-tertiary hover:border-eos-border",
        }
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`${baseClass} ${colorMap[opt.color]}`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ConformityScore({ result }: { result: AssessmentResult }) {
  const color =
    result.riskLabel === "risc-acceptabil"
      ? "text-eos-success"
      : result.riskLabel === "lacune-moderate"
      ? "text-eos-warning"
      : "text-eos-error"

  const badgeVariant =
    result.riskLabel === "risc-acceptabil"
      ? "success"
      : result.riskLabel === "lacune-moderate"
      ? "warning"
      : "destructive"

  const label =
    result.riskLabel === "risc-acceptabil"
      ? "Risc acceptabil"
      : result.riskLabel === "lacune-moderate"
      ? "Lacune moderate"
      : "Neconform critic"

  return (
    <div className="flex items-end gap-3">
      <span className={`text-5xl font-bold ${color}`}>{result.conformityPercent}%</span>
      <div className="mb-1">
        <Badge variant={badgeVariant}>{label}</Badge>
      </div>
    </div>
  )
}

// ── Gap item ──────────────────────────────────────────────────────────────────

function GapItem({ gap }: { gap: AssessmentResult["gaps"][0] }) {
  const Icon = gap.severity === "critical" ? XCircle : AlertTriangle
  const colorClass =
    gap.severity === "critical"
      ? "text-eos-error"
      : gap.severity === "high"
      ? "text-eos-warning"
      : "text-eos-warning"
  const gapBorderL =
    gap.severity === "critical"
      ? "border-l-[3px] border-l-eos-error"
      : gap.severity === "high"
        ? "border-l-[3px] border-l-eos-warning"
        : "border-l-[3px] border-l-eos-border-subtle"
  const gapBg =
    gap.severity === "critical"
      ? "bg-eos-error-soft/30 border-eos-error/20"
      : "bg-eos-surface border-eos-border"

  return (
    <div className={`flex gap-3 rounded-eos-md border ${gapBorderL} ${gapBg} p-3`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${colorClass}`} strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-eos-text">{gap.question}</p>
        <p className="mt-0.5 text-xs text-eos-text-muted">{gap.legalRef}</p>
        <p className="mt-1.5 text-xs leading-5 text-eos-text-muted">{gap.remediationHint}</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConformitatePage() {
  const cockpit = useCockpitData()
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<AssessmentAnswers>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedResult, setSavedResult] = useState<AssessmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const aiSystems = cockpit.data.state.aiSystems

  // Load saved answers when system is selected
  async function loadAnswers(systemId: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ai-conformity?systemId=${systemId}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Nu am putut încărca evaluarea.")
      const data = (await res.json()) as { answers: AssessmentAnswers; result: AssessmentResult }
      setAnswers(data.answers)
      setSavedResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la încărcare.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!selectedSystemId) return
    setSaving(true)
    try {
      const res = await fetch("/api/ai-conformity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemId: selectedSystemId, answers }),
      })
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string }
        throw new Error(payload.error ?? "Salvarea a eșuat.")
      }
      const data = (await res.json()) as { result: AssessmentResult }
      setSavedResult(data.result)
      toast.success("Evaluare salvată", {
        description: `Scor conformitate: ${data.result.conformityPercent}%`,
      })
    } catch (err) {
      toast.error("Eroare la salvare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setSaving(false)
    }
  }

  function handleDownloadAnnexIV() {
    const system = aiSystems.find((s) => s.id === selectedSystemId)
    if (!system) return
    const doc = buildAnnexIVDocument(system, answers, cockpit.data?.workspace.orgName)
    const blob = new Blob([doc.content], { type: "text/markdown;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `annex-iv-${system.name.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Documentație Anexa IV descărcată")
  }

  function handleAnswer(questionId: string, answer: AssessmentAnswer) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  function handleSelectSystem(systemId: string) {
    setSelectedSystemId(systemId)
    setAnswers({})
    setSavedResult(null)
    void loadAnswers(systemId)
  }

  const liveResult = scoreAssessment(answers)
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === AI_CONFORMITY_QUESTIONS.length

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Conformitate AI"
        title="Evaluare conformitate EU AI Act"
        description="Workflow de 10 întrebări care evaluează conformitatea sistemelor AI cu EU AI Act. Identifică lacunele și generează un plan de remediere prioritizat."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              EU AI Act 2024/1689
            </Badge>
            <Badge variant={aiSystems.length > 0 ? "default" : "secondary"} className="normal-case tracking-normal">
              {aiSystems.length} sistem{aiSystems.length !== 1 ? "e" : ""} AI
            </Badge>
          </>
        }
      />

      {error && <ErrorScreen message={error} variant="section" />}

      {aiSystems.length === 0 ? (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <ShieldCheck className="size-10 text-eos-text-muted" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-eos-text">Niciun sistem AI în inventar</p>
              <p className="mt-1 text-xs text-eos-text-muted">
                Adaugă sisteme AI din pagina Sisteme pentru a putea rula evaluarea de conformitate.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <a href={dashboardRoutes.resolve}>Mergi la De rezolvat →</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* ── System selector ── */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-eos-text-tertiary">
              Sistem AI
            </p>
            {aiSystems.map((system) => {
              const selected = selectedSystemId === system.id
              return (
                <button
                  key={system.id}
                  type="button"
                  onClick={() => handleSelectSystem(system.id)}
                  className={`w-full rounded-eos-md border p-3 text-left transition-colors ${
                    selected
                      ? "border-eos-primary bg-eos-primary/5 ring-1 ring-eos-primary"
                      : "border-eos-border bg-eos-surface hover:bg-eos-surface-variant"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${selected ? "text-eos-primary" : "text-eos-text"}`}>
                      {system.name}
                    </p>
                    <ChevronRight className="size-3.5 text-eos-text-muted" strokeWidth={2} />
                  </div>
                  <p className="mt-0.5 text-xs text-eos-text-muted">{system.riskLevel} risk</p>
                </button>
              )
            })}
          </div>

          {/* ── Assessment form ── */}
          <div className="space-y-5">
            {!selectedSystemId ? (
              <Card className="border-eos-border bg-eos-surface">
                <CardContent className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                  <p className="text-sm text-eos-text-muted">Selectează un sistem AI din stânga pentru a începe evaluarea.</p>
                </CardContent>
              </Card>
            ) : loading ? (
              <LoadingScreen variant="section" />
            ) : (
              <>
                {/* Live score */}
                {answeredCount > 0 && (
                  <Card className="border-eos-border bg-eos-surface">
                    <CardContent className="px-5 py-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-eos-text-tertiary">
                        Scor curent ({answeredCount}/{AI_CONFORMITY_QUESTIONS.length} răspunsuri)
                      </p>
                      <ConformityScore result={liveResult} />
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-eos-bg-inset">
                        <div
                          className={`h-full rounded-full transition-all ${
                            liveResult.conformityPercent >= 80
                              ? "bg-eos-success"
                              : liveResult.conformityPercent >= 50
                              ? "bg-eos-warning"
                              : "bg-eos-error"
                          }`}
                          style={{ width: `${liveResult.conformityPercent}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Questions */}
                <div className="space-y-3">
                  {AI_CONFORMITY_QUESTIONS.map((q, idx) => {
                    const currentAnswer = answers[q.id]
                    return (
                      <Card key={q.id} className="border-eos-border bg-eos-surface">
                        <CardContent className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-eos-bg-inset text-[10px] font-bold text-eos-text-muted">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1 space-y-3">
                              <div>
                                <p className="text-sm font-medium text-eos-text">{q.text}</p>
                                <p className="mt-0.5 text-xs text-eos-text-muted">{q.hint}</p>
                                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-eos-text-tertiary">
                                  {q.legalRef}
                                </p>
                              </div>
                              <AnswerSelector
                                value={currentAnswer}
                                onChange={(v) => handleAnswer(q.id, v)}
                              />
                              {currentAnswer && (
                                <div className="flex items-center gap-1.5">
                                  {currentAnswer === "yes" || (q.positiveAnswer === "no" && currentAnswer === "no") ? (
                                    <CheckCircle2 className="size-3.5 text-eos-success" strokeWidth={2} />
                                  ) : currentAnswer === "na" ? (
                                    <CheckCircle2 className="size-3.5 text-gray-400" strokeWidth={2} />
                                  ) : (
                                    <AlertTriangle className="size-3.5 text-eos-warning" strokeWidth={2} />
                                  )}
                                  {(currentAnswer === "no" || currentAnswer === "partial") && (
                                    <p className="text-xs text-eos-text-muted">{q.remediationHint}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Save + Gaps */}
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
                        Salvează evaluarea{allAnswered ? "" : ` (${answeredCount}/${AI_CONFORMITY_QUESTIONS.length})`}
                      </>
                    )}
                  </Button>

                  {answeredCount >= 8 && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleDownloadAnnexIV}
                      className="w-full gap-2"
                    >
                      <FileText className="size-4" strokeWidth={2} />
                      Generează Documentație Tehnică (Anexa IV)
                      <Download className="ml-auto size-3.5 text-eos-text-muted" strokeWidth={2} />
                    </Button>
                  )}

                  {savedResult && savedResult.gaps.length > 0 && (
                    <Card className="border-eos-border bg-eos-surface">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                          Gap analysis — {savedResult.gaps.length} lacun{savedResult.gaps.length !== 1 ? "e" : "ă"} identificat{savedResult.gaps.length !== 1 ? "e" : "ă"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        {savedResult.gaps.map((gap) => (
                          <GapItem key={gap.questionId} gap={gap} />
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {savedResult && savedResult.gaps.length === 0 && (
                    <Card className="border-eos-success/30 bg-eos-success-soft">
                      <CardContent className="flex items-center gap-3 px-5 py-4">
                        <CheckCircle2 className="size-5 text-eos-success" strokeWidth={2} />
                        <div>
                          <p className="text-sm font-semibold text-eos-success">Evaluare completă</p>
                          <p className="text-xs text-eos-success">Nicio lacună identificată la răspunsurile furnizate.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
