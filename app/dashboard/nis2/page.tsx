"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Download,
  FileText,
  Loader2,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  Users,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SimpleTooltip } from "@/components/evidence-os"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
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
import type {
  AnspdcpBreachNotification,
  Nis2AssessmentRecord,
  Nis2AttackType,
  Nis2Incident,
  Nis2IncidentSeverity,
  Nis2IncidentStatus,
  Nis2OperationalImpact,
  Nis2Vendor,
  Nis2VendorRiskLevel,
} from "@/lib/server/nis2-store"
import { buildDNSCReport, ATTACK_TYPE_LABELS, OPERATIONAL_IMPACT_LABELS } from "@/lib/compliance/dnsc-report"
import type { MaturityAssessment, BoardMember } from "@/lib/server/nis2-store"
import { computeVendorRisk } from "@/lib/compliance/vendor-risk"
import { Nis2RescueBanner } from "@/components/compliscan/nis2-rescue-banner"
import type { IncidentChecklist, ChecklistStep } from "@/lib/compliance/incident-checklists"

// ── DNSC download helper ───────────────────────────────────────────────────────

function downloadDNSCReport(incident: Nis2Incident, orgName?: string) {
  const content = buildDNSCReport(incident, orgName)
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `raport-dnsc-${incident.id}-${new Date().toISOString().split("T")[0]}.md`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

const SEVERITY_BADGE: Record<string, "default" | "warning" | "destructive" | "success" | "outline"> = {
  low: "outline",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
}

const ANSWER_OPTIONS: { value: Nis2Answer; label: string }[] = [
  { value: "yes", label: "Da" },
  { value: "partial", label: "Parțial" },
  { value: "no", label: "Nu" },
  { value: "na", label: "N/A" },
]

function slaLabel(
  deadlineISO: string,
  totalMs: number
): { label: string; urgent: boolean; expired: boolean; progressPct: number } {
  const diff = new Date(deadlineISO).getTime() - Date.now()
  const progressPct = Math.min(100, Math.max(0, Math.round(((totalMs - diff) / totalMs) * 100)))
  if (diff < 0) return { label: "DEPĂȘIT", urgent: true, expired: true, progressPct: 100 }
  const totalSec = Math.floor(diff / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const urgent = diff < 4 * 3_600_000
  if (h < 1) return { label: `${m}min`, urgent: true, expired: false, progressPct }
  if (h < 24) return { label: `${h}h ${m}min`, urgent, expired: false, progressPct }
  const d = Math.floor(h / 24)
  const remH = h % 24
  return { label: `${d}z ${remH}h`, urgent: false, expired: false, progressPct }
}

function buildAssessmentReturnEvidence(result: Nis2Result) {
  return `Assessment NIS2 salvat. Scor ${result.score}% (${result.maturityLabel}). Entitate ${result.entityType}.`
}

// ── Assessment tab ─────────────────────────────────────────────────────────────

function MaturityBadge({ label }: { label: Nis2Result["maturityLabel"] }) {
  const map: Record<string, { variant: "success" | "warning" | "destructive" | "outline"; text: string }> = {
    robust: { variant: "success", text: "Robust" },
    partial: { variant: "warning", text: "Parțial" },
    initial: { variant: "destructive", text: "Inițial" },
    "non-conform": { variant: "destructive", text: "Neconform" },
  }
  const { variant, text } = map[label]
  return <Badge variant={variant}>{text}</Badge>
}

function AssessmentTab({
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

// ── Incident tab ───────────────────────────────────────────────────────────────

const INCIDENT_STATUS_LABELS: Record<Nis2IncidentStatus, string> = {
  "open": "Deschis",
  "reported-24h": "Raportat 24h",
  "reported-72h": "Raportat 72h",
  "closed": "Închis",
}

type Nis2TabValue = "assessment" | "incidents" | "vendors"

function normalizeNis2TabValue(value: string | null): Nis2TabValue {
  return value === "incidents" || value === "vendors" ? value : "assessment"
}

function IncidentChecklist_UI({ attackType }: { attackType?: Nis2AttackType }) {
  const [checklist, setChecklist] = useState<IncidentChecklist | null>(null)
  const [loading, setLoading] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    const type = attackType ?? "unknown"
    setLoading(true)
    fetch(`/api/nis2/incidents/checklist?type=${type}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { checklist?: IncidentChecklist }) => setChecklist(data.checklist ?? null))
      .catch(() => setChecklist(null))
      .finally(() => setLoading(false))
  }, [attackType])

  if (loading) return <div className="flex items-center gap-2 py-2 text-xs text-eos-text-muted"><Loader2 className="size-3.5 animate-spin" /> Se încarcă checklist-ul...</div>
  if (!checklist) return null

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  const CATEGORY_LABELS: Record<ChecklistStep["category"], string> = {
    immediate: "Imediat",
    investigation: "Investigare",
    notification: "Notificare",
    recovery: "Recuperare",
    evidence: "Dovezi",
  }

  const CATEGORY_COLORS: Record<ChecklistStep["category"], string> = {
    immediate: "text-eos-error bg-eos-error-soft border-eos-error/30",
    investigation: "text-eos-warning bg-eos-warning-soft border-eos-warning/30",
    notification: "text-eos-primary bg-eos-primary-soft border-eos-primary/30",
    recovery: "text-eos-success bg-eos-success-soft border-eos-success/30",
    evidence: "text-eos-text-muted bg-eos-surface-variant border-eos-border",
  }

  const progress = checklist.steps.length > 0
    ? Math.round((completedSteps.size / checklist.steps.length) * 100)
    : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-eos-text">{checklist.label}</p>
          <p className="text-[10px] text-eos-text-muted">{checklist.description}</p>
        </div>
        <Badge variant={progress === 100 ? "default" : "outline"} className="text-[10px] normal-case tracking-normal">
          {completedSteps.size}/{checklist.steps.length} pași
        </Badge>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-eos-surface">
        <div
          className={`h-full rounded-full transition-all ${progress === 100 ? "bg-eos-success" : "bg-eos-primary"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {checklist.steps.map((step) => {
          const done = completedSteps.has(step.id)
          return (
            <button
              key={step.id}
              type="button"
              className={`flex w-full items-start gap-2.5 rounded-eos-md border px-3 py-2 text-left transition-colors ${done ? "border-eos-success/20 bg-eos-success-soft" : "border-eos-border bg-eos-surface-variant hover:bg-eos-surface"}`}
              onClick={() => toggleStep(step.id)}
            >
              <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border ${done ? "border-eos-success bg-eos-success text-white" : "border-eos-border"}`}>
                {done && <CheckCircle2 className="size-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs ${done ? "text-eos-text-muted line-through" : "text-eos-text"}`}>
                  {step.critical && <span className="mr-1 text-eos-error">●</span>}
                  {step.text}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={`inline-block rounded-sm border px-1.5 py-0.5 text-[9px] font-medium ${CATEGORY_COLORS[step.category]}`}>
                    {CATEGORY_LABELS[step.category]}
                  </span>
                  {step.deadlineHours && (
                    <span className="text-[9px] text-eos-text-tertiary">⏱ {step.deadlineHours}h</span>
                  )}
                  {step.legalBasis && (
                    <span className="text-[9px] text-eos-text-tertiary">{step.legalBasis}</span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 3-Stage Stepper (S0.1) ──────────────────────────────────────────────────

type StageKey = "earlyWarning" | "fullReport" | "finalReport"

const STAGE_META: { key: StageKey; label: string; deadline: string; article: string }[] = [
  { key: "earlyWarning", label: "Alertă inițială", deadline: "24h", article: "Art. 23(4)(a)" },
  { key: "fullReport",   label: "Raport complet",  deadline: "72h", article: "Art. 23(4)(b)" },
  { key: "finalReport",  label: "Raport final",    deadline: "1 lună", article: "Art. 23(4)(d)" },
]

function getStageStatus(incident: Nis2Incident, key: StageKey): "done" | "active" | "locked" {
  if (key === "earlyWarning") return incident.earlyWarningReport ? "done" : "active"
  if (key === "fullReport") return incident.fullReport72h ? "done" : incident.earlyWarningReport ? "active" : "locked"
  return incident.finalReport ? "done" : incident.fullReport72h ? "active" : "locked"
}

function IncidentStageStepper({
  incident,
  onSubmitStage,
}: {
  incident: Nis2Incident
  onSubmitStage: (stage: StageKey, data: Record<string, unknown>) => void
}) {
  const [expandedStage, setExpandedStage] = useState<StageKey | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [crossBorder, setCrossBorder] = useState(false)

  function handleSubmit(stage: StageKey) {
    const now = new Date().toISOString()
    if (stage === "earlyWarning") {
      onSubmitStage(stage, {
        earlyWarningReport: {
          submittedAtISO: now,
          content: formData.content || "",
          initialImpactAssessment: formData.impactAssessment || "",
          crossBorderEffect: crossBorder,
        },
      })
    } else if (stage === "fullReport") {
      onSubmitStage(stage, {
        fullReport72h: {
          submittedAtISO: now,
          content: formData.content || "",
          detailedAnalysis: formData.detailedAnalysis || "",
          technicalIndicators: formData.technicalIndicators || "",
          affectedDataCategories: (formData.dataCategories || "").split(",").map((s) => s.trim()).filter(Boolean),
          estimatedAffectedUsers: formData.affectedUsers ? parseInt(formData.affectedUsers, 10) : null,
        },
      })
    } else {
      onSubmitStage(stage, {
        finalReport: {
          submittedAtISO: now,
          content: formData.content || "",
          rootCauseAnalysis: formData.rootCause || "",
          lessonsLearned: formData.lessons || "",
          preventiveMeasures: formData.preventive || "",
          remediationDeadlineISO: formData.remediationDeadline || undefined,
        },
      })
    }
    setExpandedStage(null)
    setFormData({})
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
        Raportare NIS2 Art. 23 — 3 etape
      </p>
      <div className="flex gap-1">
        {STAGE_META.map((stage, idx) => {
          const status = getStageStatus(incident, stage.key)
          return (
            <div
              key={stage.key}
              className={`h-1.5 flex-1 rounded-full ${
                status === "done" ? "bg-eos-success" : status === "active" ? "bg-eos-primary" : "bg-eos-surface-variant"
              }`}
            />
          )
        })}
      </div>
      {STAGE_META.map((stage) => {
        const status = getStageStatus(incident, stage.key)
        const isExpanded = expandedStage === stage.key
        return (
          <div key={stage.key} className={`rounded-eos-md border ${status === "done" ? "border-eos-success/20 bg-eos-success-soft" : status === "active" ? "border-eos-primary/30 bg-eos-primary/5" : "border-eos-border bg-eos-surface-variant opacity-60"}`}>
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2"
              onClick={() => status !== "locked" && setExpandedStage(isExpanded ? null : stage.key)}
              disabled={status === "locked"}
            >
              <div className="flex items-center gap-2">
                <div className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${status === "done" ? "bg-eos-success text-white" : status === "active" ? "bg-eos-primary text-white" : "bg-eos-surface text-eos-text-muted"}`}>
                  {status === "done" ? <CheckCircle2 className="size-3" /> : STAGE_META.indexOf(stage) + 1}
                </div>
                <span className={`text-xs font-medium ${status === "locked" ? "text-eos-text-muted" : "text-eos-text"}`}>
                  {stage.label}
                </span>
                <span className="text-[10px] text-eos-text-tertiary">{stage.deadline} · {stage.article}</span>
              </div>
              {status === "done" && (
                <Badge variant="success" className="text-[10px] normal-case tracking-normal">Trimis</Badge>
              )}
              {status === "active" && !isExpanded && (
                <Badge variant="warning" className="text-[10px] normal-case tracking-normal">De completat</Badge>
              )}
              {status === "locked" && (
                <Badge variant="outline" className="text-[10px] normal-case tracking-normal">Blocat</Badge>
              )}
            </button>
            {isExpanded && status === "active" && (
              <div className="space-y-3 border-t border-eos-border-subtle px-3 pb-3 pt-3">
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Conținut raport</label>
                  <textarea
                    className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary"
                    rows={3}
                    placeholder="Descrierea situației..."
                    value={formData.content ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                  />
                </div>
                {stage.key === "earlyWarning" && (
                  <>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Evaluare inițială impact</label>
                      <textarea
                        className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary"
                        rows={2}
                        placeholder="Ce sisteme/servicii sunt afectate..."
                        value={formData.impactAssessment ?? ""}
                        onChange={(e) => setFormData((p) => ({ ...p, impactAssessment: e.target.value }))}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-eos-text">
                      <input type="checkbox" checked={crossBorder} onChange={(e) => setCrossBorder(e.target.checked)} className="rounded" />
                      Efect transfrontalier (alte state UE afectate)
                    </label>
                  </>
                )}
                {stage.key === "fullReport" && (
                  <>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Analiză detaliată</label>
                      <textarea className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" rows={2} placeholder="Cauze, cronologie, amploare..." value={formData.detailedAnalysis ?? ""} onChange={(e) => setFormData((p) => ({ ...p, detailedAnalysis: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Indicatori tehnici (IoC)</label>
                      <input className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" placeholder="IP-uri, hash-uri, domenii..." value={formData.technicalIndicators ?? ""} onChange={(e) => setFormData((p) => ({ ...p, technicalIndicators: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Categorii date afectate</label>
                        <input className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" placeholder="personale, financiare, medicale..." value={formData.dataCategories ?? ""} onChange={(e) => setFormData((p) => ({ ...p, dataCategories: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Nr. utilizatori afectați (estimat)</label>
                        <input type="number" className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" placeholder="0" value={formData.affectedUsers ?? ""} onChange={(e) => setFormData((p) => ({ ...p, affectedUsers: e.target.value }))} />
                      </div>
                    </div>
                  </>
                )}
                {stage.key === "finalReport" && (
                  <>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Analiză cauză rădăcină (RCA)</label>
                      <textarea className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" rows={2} placeholder="Ce a cauzat incidentul..." value={formData.rootCause ?? ""} onChange={(e) => setFormData((p) => ({ ...p, rootCause: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Lecții învățate</label>
                      <textarea className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" rows={2} placeholder="Ce am învățat..." value={formData.lessons ?? ""} onChange={(e) => setFormData((p) => ({ ...p, lessons: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Măsuri preventive</label>
                      <textarea className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" rows={2} placeholder="Ce măsuri luăm pentru a preveni..." value={formData.preventive ?? ""} onChange={(e) => setFormData((p) => ({ ...p, preventive: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Termen remediere</label>
                      <input type="date" className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text" value={formData.remediationDeadline ?? ""} onChange={(e) => setFormData((p) => ({ ...p, remediationDeadline: e.target.value }))} />
                    </div>
                  </>
                )}
                <Button size="sm" className="w-full gap-2" onClick={() => handleSubmit(stage.key)} disabled={!(formData.content ?? "").trim()}>
                  <Shield className="size-3.5" strokeWidth={2} />
                  Trimite {stage.label}
                </Button>
              </div>
            )}
            {isExpanded && status === "done" && (
              <div className="border-t border-eos-border-subtle px-3 pb-3 pt-2 text-xs text-eos-text-muted">
                {stage.key === "earlyWarning" && incident.earlyWarningReport && (
                  <div className="space-y-1">
                    <p><span className="font-medium text-eos-text">Trimis:</span> {new Date(incident.earlyWarningReport.submittedAtISO).toLocaleString("ro-RO")}</p>
                    <p>{incident.earlyWarningReport.content}</p>
                    {incident.earlyWarningReport.crossBorderEffect && <Badge variant="warning" className="text-[10px] normal-case tracking-normal">Efect transfrontalier</Badge>}
                  </div>
                )}
                {stage.key === "fullReport" && incident.fullReport72h && (
                  <div className="space-y-1">
                    <p><span className="font-medium text-eos-text">Trimis:</span> {new Date(incident.fullReport72h.submittedAtISO).toLocaleString("ro-RO")}</p>
                    <p>{incident.fullReport72h.detailedAnalysis}</p>
                  </div>
                )}
                {stage.key === "finalReport" && incident.finalReport && (
                  <div className="space-y-1">
                    <p><span className="font-medium text-eos-text">Trimis:</span> {new Date(incident.finalReport.submittedAtISO).toLocaleString("ro-RO")}</p>
                    <p><span className="font-medium text-eos-text">Cauză:</span> {incident.finalReport.rootCauseAnalysis}</p>
                    <p><span className="font-medium text-eos-text">Lecții:</span> {incident.finalReport.lessonsLearned}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Post-Incident Tracking (S2.4) ──────────────────────────────────────────

function PostIncidentPanel({
  incident,
  onUpdate,
}: {
  incident: Nis2Incident
  onUpdate: (patch: Record<string, unknown>) => void
}) {
  const tracking = incident.postIncidentTracking
  const [notes, setNotes] = useState(tracking?.notes ?? "")
  const [dnscRef, setDnscRef] = useState(tracking?.dnscReference ?? "")
  const [newCorr, setNewCorr] = useState({ direction: "received" as "sent" | "received", summary: "" })

  if (incident.status !== "closed") return null

  function saveDnscRef() {
    onUpdate({
      postIncidentTracking: {
        ...tracking,
        isRemediated: tracking?.isRemediated ?? false,
        dnscReference: dnscRef,
      },
    })
  }

  function addCorrespondence() {
    if (!newCorr.summary.trim()) return
    const entry = {
      id: `corr-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
      direction: newCorr.direction,
      summary: newCorr.summary.trim(),
      createdAtISO: new Date().toISOString(),
    }
    onUpdate({
      postIncidentTracking: {
        ...tracking,
        isRemediated: tracking?.isRemediated ?? false,
        dnscCorrespondence: [...(tracking?.dnscCorrespondence ?? []), entry],
      },
    })
    setNewCorr({ direction: "received", summary: "" })
  }

  return (
    <div className="rounded-eos-md border border-eos-primary/30 bg-eos-primary/5 px-3 py-3 space-y-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-primary">
        Post-incident tracking
      </p>
      {/* DNSC Reference */}
      <div>
        <label className="text-[10px] font-medium text-eos-primary">Nr. înregistrare DNSC</label>
        <div className="mt-1 flex gap-2">
          <input
            className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            placeholder="DNSC-2026-..."
            value={dnscRef}
            onChange={(e) => setDnscRef(e.target.value)}
          />
          <Button size="sm" variant="outline" onClick={saveDnscRef} disabled={dnscRef === (tracking?.dnscReference ?? "")}>
            Salvează
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: "remediationStartedAtISO", label: "Remediere începută" },
          { key: "remediationCompletedAtISO", label: "Remediere finalizată" },
          { key: "followUpValidationAtISO", label: "Validare follow-up" },
        ].map(({ key, label }) => {
          const value = tracking?.[key as keyof typeof tracking] as string | undefined
          return (
            <div key={key}>
              <label className="text-[10px] font-medium text-eos-primary">{label}</label>
              {value ? (
                <p className="mt-0.5 text-xs text-eos-text">{new Date(value).toLocaleDateString("ro-RO")}</p>
              ) : (
                <button
                  type="button"
                  className="mt-0.5 text-[10px] font-medium text-eos-primary hover:underline"
                  onClick={() =>
                    onUpdate({
                      postIncidentTracking: {
                        ...tracking,
                        isRemediated: key === "remediationCompletedAtISO" ? true : tracking?.isRemediated ?? false,
                        [key]: new Date().toISOString(),
                      },
                    })
                  }
                >
                  Marchează acum
                </button>
              )}
            </div>
          )
        })}
      </div>
      {/* DNSC Correspondence */}
      <div>
        <label className="text-[10px] font-medium text-eos-primary">Corespondență DNSC</label>
        {(tracking?.dnscCorrespondence ?? []).length > 0 && (
          <div className="mt-1 space-y-1">
            {(tracking?.dnscCorrespondence ?? []).map((c) => (
              <div key={c.id} className="flex items-start gap-2 text-xs text-eos-text">
                <span className={`shrink-0 text-[10px] font-medium ${c.direction === "sent" ? "text-eos-primary" : "text-eos-warning"}`}>
                  {c.direction === "sent" ? "Trimis" : "Primit"}
                </span>
                <span className="text-eos-text-muted">{new Date(c.date).toLocaleDateString("ro-RO")}</span>
                <span className="flex-1">{c.summary}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-1.5 flex gap-2">
          <select
            className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text"
            value={newCorr.direction}
            onChange={(e) => setNewCorr((p) => ({ ...p, direction: e.target.value as "sent" | "received" }))}
          >
            <option value="received">Primit de la DNSC</option>
            <option value="sent">Trimis către DNSC</option>
          </select>
          <input
            className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            placeholder="Rezumat corespondență..."
            value={newCorr.summary}
            onChange={(e) => setNewCorr((p) => ({ ...p, summary: e.target.value }))}
          />
          <Button size="sm" variant="outline" onClick={addCorrespondence} disabled={!newCorr.summary.trim()}>
            Adaugă
          </Button>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-medium text-eos-primary">Note post-incident</label>
        <div className="mt-1 flex gap-2">
          <input
            className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            placeholder="Observații, acțiuni rămase..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onUpdate({
                postIncidentTracking: {
                  ...tracking,
                  isRemediated: tracking?.isRemediated ?? false,
                  notes,
                },
              })
            }
          >
            Salvează
          </Button>
        </div>
      </div>
      {tracking?.isRemediated && (
        <Badge variant="success" className="text-[10px] normal-case tracking-normal">Remediat complet</Badge>
      )}
    </div>
  )
}

// ── ANSPDCP Breach Notification Panel (GOLD 6) ─────────────────────────────

function AnspdcpNotificationPanel({
  incident,
  onUpdate,
  emphasized = false,
  sourceFindingId,
  returnTo,
}: {
  incident: Nis2Incident
  onUpdate: (patch: Record<string, unknown>) => void | Promise<void>
  emphasized?: boolean
  sourceFindingId?: string
  returnTo?: string
}) {
  const router = useRouter()
  const notif = incident.anspdcpNotification
  const [form, setForm] = useState({
    dataCategories: notif?.dataCategories.join(", ") ?? "",
    estimatedDataSubjects: notif?.estimatedDataSubjects?.toString() ?? "",
    dpoContact: notif?.dpoContact ?? "",
    consequencesDescription: notif?.consequencesDescription ?? "",
    measuresTaken: notif?.measuresTaken ?? "",
    anspdcpReference: notif?.anspdcpReference ?? "",
    notifyDataSubjects: notif?.notifyDataSubjects ?? false,
  })
  const [saving, setSaving] = useState(false)

  if (!incident.involvesPersonalData) return null

  const buildAnspdcpEvidenceNote = (notification: AnspdcpBreachNotification) => {
    const evidenceParts = [
      `Flow ANSPDCP completat pentru incidentul "${incident.title}".`,
      notification.status === "acknowledged"
        ? "Notificarea este confirmată de ANSPDCP."
        : notification.status === "submitted"
          ? "Notificarea a fost trimisă către ANSPDCP."
          : "Notificarea a fost pregătită în flow-ul dedicat.",
      notification.anspdcpReference ? `Referință: ${notification.anspdcpReference}.` : null,
      notification.dataCategories.length > 0
        ? `Categorii afectate: ${notification.dataCategories.join(", ")}.`
        : null,
      notification.estimatedDataSubjects != null
        ? `Persoane estimate: ${notification.estimatedDataSubjects}.`
        : null,
      notification.notifyDataSubjects ? "Este necesară și notificarea persoanelor vizate." : null,
    ]

    return evidenceParts.filter(Boolean).join(" ")
  }

  const deadline72h = notif?.deadlineISO
    ? slaLabel(notif.deadlineISO, 72 * 3_600_000)
    : null
  const backToCockpitHref =
    !returnTo && sourceFindingId && notif && (notif.status === "submitted" || notif.status === "acknowledged")
      ? `/dashboard/resolve/${encodeURIComponent(sourceFindingId)}?${new URLSearchParams({
          anspdcp: "done",
          evidenceNote: buildAnspdcpEvidenceNote(notif),
        }).toString()}`
      : null

  async function handleSubmit(submitted: boolean) {
    setSaving(true)
    const updated: AnspdcpBreachNotification = {
      required: true,
      deadlineISO: notif?.deadlineISO ?? new Date(new Date(incident.detectedAtISO).getTime() + 72 * 3_600_000).toISOString(),
      status: submitted ? "submitted" : (notif?.status ?? "pending"),
      dataCategories: form.dataCategories.split(",").map((s) => s.trim()).filter(Boolean),
      estimatedDataSubjects: form.estimatedDataSubjects ? parseInt(form.estimatedDataSubjects, 10) : null,
      dpoContact: form.dpoContact.trim() || undefined,
      consequencesDescription: form.consequencesDescription.trim() || undefined,
      measuresTaken: form.measuresTaken.trim() || undefined,
      submittedAtISO: submitted ? new Date().toISOString() : notif?.submittedAtISO,
      anspdcpReference: form.anspdcpReference.trim() || undefined,
      notifyDataSubjects: form.notifyDataSubjects,
      dataSubjectsNotifiedAtISO: notif?.dataSubjectsNotifiedAtISO,
    }
    await Promise.resolve(onUpdate({ anspdcpNotification: updated }))
    setSaving(false)
    if (sourceFindingId && returnTo && (submitted || updated.status === "submitted" || updated.status === "acknowledged")) {
      toast.success("Notificare ANSPDCP salvată. Revenim în cockpit.")
      const params = new URLSearchParams({
        anspdcp: "done",
        evidenceNote: buildAnspdcpEvidenceNote(updated),
      })
      router.push(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${params.toString()}`)
      return
    }
    if (submitted) toast.success("Notificare ANSPDCP marcată ca trimisă")
  }

  const statusColors: Record<string, string> = {
    pending: "border-eos-warning/30 bg-eos-warning-soft",
    submitted: "border-eos-primary/30 bg-eos-primary-soft",
    acknowledged: "border-eos-success/30 bg-eos-success-soft",
  }
  const statusLabels: Record<string, string> = {
    pending: "De trimis",
    submitted: "Trimisă",
    acknowledged: "Confirmată de ANSPDCP",
  }

  return (
    <div className={`rounded-eos-md border px-3 py-3 space-y-3 ${statusColors[notif?.status ?? "pending"]} ${emphasized ? "ring-2 ring-eos-warning/50 ring-offset-2 ring-offset-eos-bg" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-3.5 text-eos-warning" strokeWidth={2} />
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-warning">
            Notificare ANSPDCP — GDPR Art. 33
          </p>
        </div>
        <div className="flex items-center gap-2">
          {deadline72h && notif?.status === "pending" && (
            <span className={`text-[10px] font-bold ${deadline72h.expired ? "text-eos-error" : deadline72h.urgent ? "text-eos-warning" : "text-eos-warning"}`}>
              {deadline72h.expired ? "DEPĂȘIT" : `${deadline72h.label} rămas`}
            </span>
          )}
          <Badge
            variant={notif?.status === "submitted" ? "default" : notif?.status === "acknowledged" ? "success" : "warning"}
            className="text-[10px] normal-case tracking-normal"
          >
            {statusLabels[notif?.status ?? "pending"]}
          </Badge>
        </div>
      </div>

      <p className="text-[10px] text-eos-warning/80">
        Incidentul implică date cu caracter personal. Notificarea ANSPDCP este obligatorie în 72h de la descoperire (GDPR Art. 33). Aceasta este <strong>separată</strong> de raportarea DNSC.
      </p>

      <div className="space-y-2">
        <div>
          <label className="text-[10px] font-medium text-eos-warning">Categorii date afectate (virgulă)</label>
          <input
            className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            placeholder="ex: date identitate, date financiare, date medicale..."
            value={form.dataCategories}
            onChange={(e) => setForm((p) => ({ ...p, dataCategories: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-eos-warning">Nr. persoane vizate (estimat)</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text"
              placeholder="0"
              value={form.estimatedDataSubjects}
              onChange={(e) => setForm((p) => ({ ...p, estimatedDataSubjects: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-eos-warning">DPO / Responsabil conformitate</label>
            <input
              className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text"
              placeholder="email@exemplu.ro"
              value={form.dpoContact}
              onChange={(e) => setForm((p) => ({ ...p, dpoContact: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-eos-warning">Consecințe probabile (Art. 33(3)(c))</label>
          <textarea
            className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            rows={2}
            placeholder="Consecințe probabile pentru persoanele vizate..."
            value={form.consequencesDescription}
            onChange={(e) => setForm((p) => ({ ...p, consequencesDescription: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-eos-warning">Măsuri luate / propuse (Art. 33(3)(d))</label>
          <textarea
            className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            rows={2}
            placeholder="Măsuri de remediere adoptate sau propuse..."
            value={form.measuresTaken}
            onChange={(e) => setForm((p) => ({ ...p, measuresTaken: e.target.value }))}
          />
        </div>

        {/* Art. 34 — notificare persoane vizate */}
        <label className="flex items-start gap-2 text-xs text-eos-warning cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 rounded"
            checked={form.notifyDataSubjects}
            onChange={(e) => setForm((p) => ({ ...p, notifyDataSubjects: e.target.checked }))}
          />
          <span>
            <span className="font-medium">Art. 34 — Notifică persoanele vizate individual</span>
            <span className="block text-[10px] text-eos-warning/70">Dacă breach-ul prezintă risc ridicat pentru drepturile și libertățile persoanelor.</span>
          </span>
        </label>

        {notif?.status !== "pending" && (
          <div>
            <label className="text-[10px] font-medium text-eos-warning">Nr. înregistrare ANSPDCP</label>
            <input
              className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text"
              placeholder="ANSPDCP-2026-..."
              value={form.anspdcpReference}
              onChange={(e) => setForm((p) => ({ ...p, anspdcpReference: e.target.value }))}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 border-eos-warning/30 text-eos-warning hover:bg-eos-warning-soft"
          disabled={saving}
          onClick={() => void handleSubmit(false)}
        >
          Salvează
        </Button>
        {notif?.status === "pending" && (
          <Button
            size="sm"
            className="flex-1 gap-1.5 bg-eos-warning hover:bg-eos-warning/90 text-white"
            disabled={saving || !form.dataCategories.trim()}
            onClick={() => void handleSubmit(true)}
          >
            <Bell className="size-3.5" strokeWidth={2} />
            Marchează ca trimisă la ANSPDCP
          </Button>
        )}
        {backToCockpitHref ? (
          <Link href={backToCockpitHref} className="flex-1 min-w-[220px]">
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 border-eos-warning/30 text-eos-warning hover:bg-eos-warning-soft"
            >
              <FileText className="size-3.5" strokeWidth={2} />
              Înapoi în cockpit cu dovada
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function buildIncidentCockpitEvidenceNote(incident: Nis2Incident) {
  const evidenceParts = [
    `Flow DNSC completat pentru incidentul "${incident.title}".`,
    incident.earlyWarningReport
      ? `Early warning trimis la ${new Date(incident.earlyWarningReport.submittedAtISO).toLocaleString("ro-RO")}.`
      : null,
    incident.fullReport72h
      ? `Raportul 72h este deja salvat în timeline.`
      : null,
    incident.finalReport
      ? `Raportul final este deja salvat în timeline.`
      : null,
    incident.postIncidentTracking?.dnscReference
      ? `Referință DNSC: ${incident.postIncidentTracking.dnscReference}.`
      : null,
  ]

  return evidenceParts.filter(Boolean).join(" ")
}

// ── IncidentRow (refactored cu 3-stage stepper + post-incident) ──────────────

function IncidentRow({
  incident,
  orgName,
  onUpdate,
  onDelete,
  highlighted = false,
  focusMode,
  sourceFindingId,
  returnTo,
}: {
  incident: Nis2Incident
  orgName?: string
  onUpdate: (id: string, patch: Partial<Nis2Incident>) => void | Promise<void>
  onDelete: (id: string) => void
  highlighted?: boolean
  focusMode?: "anspdcp" | "incident"
  sourceFindingId?: string
  returnTo?: string
}) {
  const sla24 = slaLabel(incident.deadline24hISO, 24 * 3_600_000)
  const sla72 = slaLabel(incident.deadline72hISO, 72 * 3_600_000)
  const isOpen = incident.status !== "closed"
  const [showChecklist, setShowChecklist] = useState(false)
  const [showStages, setShowStages] = useState(true)

  const completedStages = [incident.earlyWarningReport, incident.fullReport72h, incident.finalReport].filter(Boolean).length

  const nis2IncidentBorderL =
    incident.severity === "critical" || incident.severity === "high"
      ? "border-l-[3px] border-l-eos-error"
      : incident.severity === "medium"
        ? "border-l-[3px] border-l-eos-warning"
        : "border-l-[3px] border-l-eos-border-subtle"

  return (
    <div
      id={`incident-${incident.id}`}
      className={`space-y-3 px-5 py-4 ${nis2IncidentBorderL} ${highlighted ? "scroll-mt-24 rounded-eos-lg bg-eos-warning-soft ring-1 ring-eos-warning/30" : ""}`}
    >
      {highlighted && focusMode === "anspdcp" ? (
        <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-xs text-eos-warning">
          Ai venit aici din cockpitul finding-ului GDPR de breach. Completează notificarea ANSPDCP și apoi întoarce-te cu dovada în același caz.
        </div>
      ) : highlighted && focusMode === "incident" ? (
        <div className="rounded-eos-md border border-eos-primary/30 bg-eos-primary-soft/20 px-3 py-2 text-xs text-eos-primary">
          Ai venit aici din cockpitul finding-ului NIS2. Parcurge timeline-ul 24h / 72h / 30 zile pentru incidentul selectat și întoarce-te cu dovada early warning-ului în același caz.
        </div>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-eos-text">{incident.title}</p>
            <Badge variant={SEVERITY_BADGE[incident.severity]} className="text-[10px] normal-case tracking-normal">
              {incident.severity}
            </Badge>
            <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
              {INCIDENT_STATUS_LABELS[incident.status]}
            </Badge>
            <Badge variant={completedStages === 3 ? "success" : "warning"} className="text-[10px] normal-case tracking-normal">
              {completedStages}/3 etape
            </Badge>
            {incident.involvesPersonalData && (
              <Badge
                variant={incident.anspdcpNotification?.status === "submitted" || incident.anspdcpNotification?.status === "acknowledged" ? "default" : "destructive"}
                className="text-[10px] normal-case tracking-normal gap-1"
              >
                <Bell className="size-2.5" strokeWidth={2.5} />
                ANSPDCP {incident.anspdcpNotification?.status === "pending" ? "— de notificat" : incident.anspdcpNotification?.status === "submitted" ? "— trimis" : "— confirmat"}
              </Badge>
            )}
          </div>
          {incident.description && (
            <p className="mt-1 text-xs text-eos-text-muted">{incident.description}</p>
          )}
          <p className="mt-1 text-xs text-eos-text-tertiary">
            Detectat: {new Date(incident.detectedAtISO).toLocaleString("ro-RO")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => downloadDNSCReport(incident, orgName)}
            title="Generează raport DNSC"
            className="flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface px-2.5 py-1.5 text-xs font-medium text-eos-text-muted hover:border-eos-primary/30 hover:bg-eos-primary-soft hover:text-eos-primary"
            aria-label="Export raport DNSC"
          >
            <Download className="size-3.5" strokeWidth={2} />
            DNSC
          </button>
          <button
            type="button"
            onClick={() => onDelete(incident.id)}
            className="rounded-eos-md border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted hover:bg-eos-error-soft hover:text-eos-error"
            aria-label="Șterge incident"
          >
            <Trash2 className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* SLA timers */}
      {isOpen && (
        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-eos-md border px-3 py-2 ${sla24.expired ? "border-eos-error/30 bg-eos-error-soft" : sla24.urgent ? "border-eos-warning/30 bg-eos-warning-soft" : "border-eos-border bg-eos-surface-variant"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-medium uppercase tracking-[0.15em] ${sla24.expired || sla24.urgent ? "text-eos-error" : "text-eos-text-muted"}`}>24h Early Warning</span>
              <span className={`text-xs font-bold ${sla24.expired ? "text-eos-error" : sla24.urgent ? "text-eos-warning" : "text-eos-text"}`}>
                {sla24.expired ? "DEPASIT" : sla24.label}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-eos-surface">
              <div className={`h-full rounded-full transition-all ${sla24.expired ? "bg-eos-error" : sla24.urgent ? "bg-eos-warning" : "bg-eos-primary"}`} style={{ width: `${sla24.progressPct}%` }} />
            </div>
          </div>
          <div className={`rounded-eos-md border px-3 py-2 ${sla72.expired ? "border-eos-error/30 bg-eos-error-soft" : sla72.urgent ? "border-eos-warning/30 bg-eos-warning-soft" : "border-eos-border bg-eos-surface-variant"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-medium uppercase tracking-[0.15em] ${sla72.expired || sla72.urgent ? "text-eos-error" : "text-eos-text-muted"}`}>72h Raport Complet</span>
              <span className={`text-xs font-bold ${sla72.expired ? "text-eos-error" : sla72.urgent ? "text-eos-warning" : "text-eos-text"}`}>
                {sla72.expired ? "DEPASIT" : sla72.label}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-eos-surface">
              <div className={`h-full rounded-full transition-all ${sla72.expired ? "bg-eos-error" : sla72.urgent ? "bg-eos-warning" : "bg-eos-primary"}`} style={{ width: `${sla72.progressPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Câmpuri DNSC completate */}
      {(incident.attackType || incident.operationalImpact) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-eos-text-muted">
          {incident.attackType && (
            <span><span className="font-medium text-eos-text">Tip atac:</span> {ATTACK_TYPE_LABELS[incident.attackType]}</span>
          )}
          {incident.operationalImpact && (
            <span><span className="font-medium text-eos-text">Impact:</span> {OPERATIONAL_IMPACT_LABELS[incident.operationalImpact]}</span>
          )}
        </div>
      )}

      {/* 3-Stage Stepper */}
      <div>
        <button type="button" className="flex items-center gap-1.5 text-xs font-medium text-eos-primary hover:underline" onClick={() => setShowStages((v) => !v)}>
          <Shield className="size-3.5" />
          {showStages ? "Ascunde etapele de raportare" : "Etapele de raportare NIS2"}
          {showStages ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {showStages && (
          <div className="mt-2">
            <IncidentStageStepper
              incident={incident}
              onSubmitStage={(_stage, data) => onUpdate(incident.id, data as Partial<Nis2Incident>)}
            />
          </div>
        )}
      </div>

      {/* Post-incident tracking */}
      <PostIncidentPanel
        incident={incident}
        onUpdate={(patch) => onUpdate(incident.id, patch as Partial<Nis2Incident>)}
      />

      {/* ANSPDCP breach notification panel (GOLD 6) */}
      <AnspdcpNotificationPanel
        incident={incident}
        onUpdate={(patch) => onUpdate(incident.id, patch as Partial<Nis2Incident>)}
        emphasized={highlighted && focusMode === "anspdcp"}
        sourceFindingId={sourceFindingId}
        returnTo={returnTo}
      />

      {/* Checklist răspuns incident */}
      <div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-medium text-eos-primary hover:underline"
          onClick={() => setShowChecklist((v) => !v)}
        >
          <ClipboardCheck className="size-3.5" />
          {showChecklist ? "Ascunde checklist" : "Checklist răspuns incident"}
          {showChecklist ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {showChecklist && (
          <div className="mt-2 rounded-eos-md border border-eos-border bg-eos-surface p-3">
            <IncidentChecklist_UI attackType={incident.attackType} />
          </div>
        )}
      </div>
    </div>
  )
}

function IncidentsTab({
  orgName,
  highlightedIncidentId,
  focusMode,
  sourceFindingId,
  returnTo,
}: {
  orgName?: string
  highlightedIncidentId?: string
  focusMode?: "anspdcp" | "incident"
  sourceFindingId?: string
  returnTo?: string
}) {
  const router = useRouter()
  const [incidents, setIncidents] = useState<Nis2Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [generatingIR, setGeneratingIR] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "high" as Nis2IncidentSeverity,
    affectedSystems: "",
    attackType: "" as Nis2AttackType | "",
    attackVector: "",
    operationalImpact: "" as Nis2OperationalImpact | "",
    operationalImpactDetails: "",
    measuresTaken: "",
    involvesPersonalData: false,
  })

  useEffect(() => {
    fetch("/api/nis2/incidents", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { incidents: Nis2Incident[] }) => setIncidents(d.incidents ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading || !highlightedIncidentId) return
    const row = document.getElementById(`incident-${highlightedIncidentId}`)
    if (!row) return
    row.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [highlightedIncidentId, incidents.length, loading])

  async function handleGenerateIR() {
    setGeneratingIR(true)
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "nis2-incident-response",
          orgName: orgName ?? "Organizația mea",
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

  async function handleCreate() {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/nis2/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          severity: form.severity,
          affectedSystems: form.affectedSystems.split(",").map((s) => s.trim()).filter(Boolean),
          ...(form.attackType && { attackType: form.attackType }),
          ...(form.attackVector.trim() && { attackVector: form.attackVector.trim() }),
          ...(form.operationalImpact && { operationalImpact: form.operationalImpact }),
          ...(form.operationalImpactDetails.trim() && { operationalImpactDetails: form.operationalImpactDetails.trim() }),
          ...(form.measuresTaken.trim() && { measuresTaken: form.measuresTaken.trim() }),
          involvesPersonalData: form.involvesPersonalData || form.attackType === "data-breach",
        }),
      })
      const data = (await res.json()) as { incident?: Nis2Incident; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      setIncidents((prev) => [data.incident!, ...prev])
      setForm({
        title: "", description: "", severity: "high", affectedSystems: "",
        attackType: "", attackVector: "", operationalImpact: "",
        operationalImpactDetails: "", measuresTaken: "", involvesPersonalData: false,
      })
      setShowForm(false)
      toast.success("Incident înregistrat", { description: "Termenele SLA au fost calculate automat." })
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(id: string, patch: Partial<Nis2Incident>) {
    try {
      const res = await fetch(`/api/nis2/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = (await res.json()) as { incident?: Nis2Incident; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la actualizare.")
      setIncidents((prev) => prev.map((i) => (i.id === id ? data.incident! : i)))

      if (patch.earlyWarningReport && sourceFindingId && returnTo && data.incident) {
        toast.success("Early warning salvat. Revenim în cockpit.")
        const params = new URLSearchParams({
          incidentFlow: "done",
          evidenceNote: buildIncidentCockpitEvidenceNote(data.incident),
        })
        router.push(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${params.toString()}`)
        return
      }
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Ștergi acest incident NIS2?")) return
    try {
      const res = await fetch(`/api/nis2/incidents/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Eroare la ștergere.")
      setIncidents((prev) => prev.filter((i) => i.id !== id))
      toast.success("Incident șters")
    } catch {
      toast.error("Eroare la ștergere")
    }
  }

  const openCount = incidents.filter((i) => i.status !== "closed").length
  const highlightedIncident = highlightedIncidentId
    ? incidents.find((incident) => incident.id === highlightedIncidentId)
    : null
  const backToCockpitHref =
    !returnTo && sourceFindingId && highlightedIncident?.earlyWarningReport
      ? `/dashboard/resolve/${encodeURIComponent(sourceFindingId)}?${new URLSearchParams({
          incidentFlow: "done",
          evidenceNote: buildIncidentCockpitEvidenceNote(highlightedIncident),
        }).toString()}`
      : null

  return (
    <div className="space-y-4">
      {highlightedIncident && focusMode === "anspdcp" ? (
        <Card className="border-eos-warning/30 bg-eos-warning-soft">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-eos-text">Flow ANSPDCP deschis din cockpit</p>
              <p className="mt-1 text-xs text-eos-warning/80">
                Incidentul „{highlightedIncident.title}” este deja selectat mai jos. Completează notificarea ANSPDCP și revino în cockpit cu dovada pregătită.
              </p>
            </div>
            <Badge variant="warning" className="shrink-0 normal-case tracking-normal">
              GDPR Art. 33
            </Badge>
          </CardContent>
        </Card>
      ) : highlightedIncident && focusMode === "incident" ? (
        <Card className="border-sky-300 bg-sky-50">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-950">Flow de incident NIS2 deschis din cockpit</p>
              <p className="mt-1 text-xs text-sky-900/80">
                Incidentul „{highlightedIncident.title}” este deja selectat mai jos. Completează early warning-ul în 24h, iar după salvare revii automat în același cockpit pentru închidere.
              </p>
            </div>
            {backToCockpitHref ? (
              <Link href={backToCockpitHref} className="shrink-0">
                <Button size="sm" variant="outline" className="gap-1.5 border-sky-300 bg-white text-sky-950 hover:bg-sky-100">
                  <ArrowLeft className="size-3.5" strokeWidth={2} />
                  Înapoi la finding
                </Button>
              </Link>
            ) : (
              <Badge variant="outline" className="shrink-0 normal-case tracking-normal border-sky-300 bg-white text-sky-950">
                NIS2 Art. 23
              </Badge>
            )}
          </CardContent>
        </Card>
      ) : sourceFindingId && focusMode === "incident" ? (
        <Card className="border-sky-300 bg-sky-50">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-950">Alege incidentul corect din cockpit</p>
              <p className="mt-1 text-xs text-sky-900/80">
                Nu am putut selecta automat incidentul potrivit. Alege un incident existent sau înregistrează unul nou, apoi revino în același finding cu dovada early warning-ului.
              </p>
            </div>
            <Link
              href={`/dashboard/resolve/${encodeURIComponent(sourceFindingId)}`}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-sky-950 hover:underline"
            >
              <ArrowLeft className="size-3" strokeWidth={2} />
              Înapoi la finding
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {openCount > 0 && (
            <Badge variant="destructive" dot className="normal-case tracking-normal">
              {openCount} deschis{openCount !== 1 ? "e" : ""}
            </Badge>
          )}
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" strokeWidth={2} />
          Înregistrează incident
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="text-sm">Incident nou</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="text"
              placeholder="Titlu incident *"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
            />
            <textarea
              placeholder="Descriere (opțional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none resize-none"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Severitate</label>
                <select
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as Nis2IncidentSeverity }))}
                >
                  {(["low", "medium", "high", "critical"] as Nis2IncidentSeverity[]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Sisteme afectate (virgulă)</label>
                <input
                  type="text"
                  placeholder="ERP, email, VPN"
                  value={form.affectedSystems}
                  onChange={(e) => setForm((f) => ({ ...f, affectedSystems: e.target.value }))}
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                />
              </div>
            </div>
            {/* Câmpuri DNSC opționale */}
            <p className="text-xs font-medium text-eos-text-muted pt-1">Câmpuri raportare DNSC (opționale)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Tip atac</label>
                <select
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.attackType}
                  onChange={(e) => setForm((f) => ({ ...f, attackType: e.target.value as Nis2AttackType | "" }))}
                >
                  <option value="">— Selectează —</option>
                  {(Object.entries(ATTACK_TYPE_LABELS) as [Nis2AttackType, string][]).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Impact operațional</label>
                <select
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.operationalImpact}
                  onChange={(e) => setForm((f) => ({ ...f, operationalImpact: e.target.value as Nis2OperationalImpact | "" }))}
                >
                  <option value="">— Selectează —</option>
                  {(Object.entries(OPERATIONAL_IMPACT_LABELS) as [Nis2OperationalImpact, string][]).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>
            </div>
            <input
              type="text"
              placeholder="Vector de atac (ex: email phishing cu .exe atașat)"
              value={form.attackVector}
              onChange={(e) => setForm((f) => ({ ...f, attackVector: e.target.value }))}
              className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
            />
            <textarea
              placeholder="Măsuri luate (containment, remediere)"
              value={form.measuresTaken}
              onChange={(e) => setForm((f) => ({ ...f, measuresTaken: e.target.value }))}
              rows={2}
              className="w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none resize-none"
            />
            {/* ANSPDCP: personal data flag */}
            <label className={`flex items-start gap-2 cursor-pointer rounded-eos-md border px-3 py-2.5 text-xs transition-colors ${
              form.involvesPersonalData || form.attackType === "data-breach"
                ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
                : "border-eos-border bg-eos-surface-variant text-eos-text"
            }`}>
              <input
                type="checkbox"
                className="mt-0.5 rounded"
                checked={form.involvesPersonalData || form.attackType === "data-breach"}
                onChange={(e) => setForm((f) => ({ ...f, involvesPersonalData: e.target.checked }))}
              />
              <span>
                <span className="font-medium">Implică date cu caracter personal</span>
                <span className="block text-[10px] opacity-70 mt-0.5">
                  Activează notificarea ANSPDCP în 72h (GDPR Art. 33), separată de raportarea DNSC.
                  {form.attackType === "data-breach" && " (detectat automat din tipul atacului)"}
                </span>
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Anulează
              </Button>
              <Button
                size="sm"
                disabled={creating || !form.title.trim()}
                onClick={() => void handleCreate()}
                className="gap-2"
              >
                {creating && <Loader2 className="size-3.5 animate-spin" />}
                Salvează incident
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingScreen variant="section" />
      ) : incidents.length === 0 ? (
        <div className="rounded-eos-md border border-eos-border bg-eos-surface p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 size-10 text-eos-text-muted" strokeWidth={1.5} />
          <p className="font-semibold text-eos-text">Niciun incident înregistrat</p>
          <p className="mt-1 text-sm text-eos-text-muted">
            Înregistrează incidente de securitate pentru a monitoriza termenele SLA de raportare DNSC.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
            onClick={() => void handleGenerateIR()}
            disabled={generatingIR}
          >
            {generatingIR ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <FileText className="size-4" strokeWidth={2} />}
            Generează Plan de Răspuns la Incidente
          </Button>
        </div>
      ) : (
        <Card className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
          {incidents.map((inc) => (
            <IncidentRow
              key={inc.id}
              incident={inc}
              orgName={orgName}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              highlighted={inc.id === highlightedIncidentId}
              focusMode={focusMode}
              sourceFindingId={sourceFindingId}
              returnTo={returnTo}
            />
          ))}
        </Card>
      )}

      {/* DNSC info */}
      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <p className="font-medium text-eos-text">Obligații raportare NIS2 (Art. 23)</p>
        <p className="mt-1">
          <span className="font-semibold text-eos-warning">24h</span> — Alertă inițială la DNSC (confirmare incident semnificativ).{" "}
          <span className="font-semibold text-eos-error">72h</span> — Raport complet (impact, cauze, măsuri luate).{" "}
          1 lună — Raport final cu lecțiile învățate.
        </p>
      </div>
    </div>
  )
}

// ── Vendors tab ────────────────────────────────────────────────────────────────

const RISK_SCORE_COLORS: Record<string, string> = {
  high: "text-eos-error bg-eos-error-soft border-eos-error/30",
  medium: "text-eos-warning bg-eos-warning-soft border-eos-warning/30",
  low: "text-eos-success bg-eos-success-soft border-eos-success/30",
}

function VendorRow({
  vendor,
  onDelete,
  onPatch,
  highlighted = false,
}: {
  vendor: Nis2Vendor
  onDelete: (id: string) => void
  onPatch: (id: string, patch: Partial<Nis2Vendor>) => Promise<void>
  highlighted?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [patching, setPatching] = useState<string | null>(null)

  const { riskScore, riskLevel, factors } = computeVendorRisk(vendor)

  const clauses = [
    { ok: vendor.hasSecurityClause, label: "Clauze securitate" },
    { ok: vendor.hasIncidentNotification, label: "Notificare incident" },
    { ok: vendor.hasAuditRight, label: "Drept audit" },
  ]

  async function markField(field: "hasDPA" | "hasSecuritySLA" | "lastReviewDate", value: boolean | string) {
    setPatching(field)
    try {
      await onPatch(vendor.id, { [field]: value })
    } finally {
      setPatching(null)
    }
  }

  const nis2VendorBorderL =
    riskLevel === "high"
      ? "border-l-[3px] border-l-eos-error"
      : riskLevel === "medium"
        ? "border-l-[3px] border-l-eos-warning"
        : "border-l-[3px] border-l-eos-border-subtle"

  return (
    <div
      id={`vendor-${vendor.id}`}
      className={highlighted ? "scroll-mt-24 rounded-eos-lg bg-eos-primary-soft/20 ring-1 ring-eos-primary/30" : ""}
    >
      <div className={`flex flex-wrap items-start gap-4 px-5 py-4 ${nis2VendorBorderL}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-eos-text">{vendor.name}</p>
            {/* Computed risk score badge */}
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${RISK_SCORE_COLORS[riskLevel]}`}>
              risc {riskLevel} ({riskScore}/100)
            </span>
            {vendor.techConfidence === "high" && (
              <span className="rounded bg-eos-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-eos-primary">
                tech ✓ certitudine ridicată
              </span>
            )}
            {vendor.techConfidence === "low" && (
              <span className="rounded bg-eos-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-eos-warning" title={vendor.techDetectionReason}>
                posibil tech — verifică manual
              </span>
            )}
          </div>
          {vendor.service && <p className="text-xs text-eos-text-muted">{vendor.service}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {clauses.map((c) => (
            <span
              key={c.label}
              className={`flex items-center gap-1 text-xs ${c.ok ? "text-eos-success" : "text-eos-text-muted line-through"}`}
            >
              {c.ok ? (
                <CheckCircle2 className="size-3" strokeWidth={2} />
              ) : (
                <XCircle className="size-3" strokeWidth={2} />
              )}
              {c.label}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-eos-md border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted hover:bg-eos-bg-inset"
          aria-label="Detalii risc"
        >
          {expanded ? <ChevronUp className="size-3.5" strokeWidth={2} /> : <ChevronDown className="size-3.5" strokeWidth={2} />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(vendor.id)}
          className="shrink-0 rounded-eos-md border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted hover:bg-eos-error-soft hover:text-eos-error"
          aria-label="Șterge vendor"
        >
          <Trash2 className="size-3.5" strokeWidth={2} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-eos-border-subtle bg-eos-bg-inset px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-eos-text-muted">
            Factori de risc NIS2 Art. 21(2)(d)
          </p>
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <div className={`flex items-center gap-2 rounded-eos-md border px-3 py-2 text-xs ${factors.isTechVendor ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning" : "border-eos-border bg-eos-surface text-eos-text-muted"}`}>
              {factors.isTechVendor ? <ShieldAlert className="size-3.5 shrink-0" strokeWidth={2} /> : <CheckCircle2 className="size-3.5 shrink-0 text-eos-success" strokeWidth={2} />}
              Furnizor tech/cloud {factors.isTechVendor ? "(+30 pct risc)" : "— nedetectat"}
            </div>
            <div className={`flex items-center gap-2 rounded-eos-md border px-3 py-2 text-xs ${!factors.hasDPA && factors.isTechVendor ? "border-eos-error/30 bg-eos-error-soft text-eos-error" : "border-eos-border bg-eos-surface text-eos-text-muted"}`}>
              {factors.hasDPA ? <CheckCircle2 className="size-3.5 shrink-0 text-eos-success" strokeWidth={2} /> : <XCircle className="size-3.5 shrink-0" strokeWidth={2} />}
              DPA (Acord procesare date) {!factors.hasDPA && factors.isTechVendor ? "(+25 pct risc)" : factors.hasDPA ? "— bifat" : ""}
            </div>
            <div className={`flex items-center gap-2 rounded-eos-md border px-3 py-2 text-xs ${!factors.hasSecuritySLA && factors.isTechVendor ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning" : "border-eos-border bg-eos-surface text-eos-text-muted"}`}>
              {factors.hasSecuritySLA ? <CheckCircle2 className="size-3.5 shrink-0 text-eos-success" strokeWidth={2} /> : <XCircle className="size-3.5 shrink-0" strokeWidth={2} />}
              SLA securitate {!factors.hasSecuritySLA && factors.isTechVendor ? "(+15 pct risc)" : factors.hasSecuritySLA ? "— bifat" : ""}
            </div>
            <div className={`flex items-center gap-2 rounded-eos-md border px-3 py-2 text-xs ${factors.dataProcessingVolume === "high" ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning" : "border-eos-border bg-eos-surface text-eos-text-muted"}`}>
              <Shield className="size-3.5 shrink-0" strokeWidth={2} />
              Date procesate: {factors.dataProcessingVolume === "high" ? "volum ridicat (+20 pct)" : factors.dataProcessingVolume === "low" ? "volum scăzut" : "necunoscut"}
            </div>
          </div>

          {/* Scor bar */}
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs text-eos-text-muted">
              <span>Scor risc</span>
              <span className="font-semibold">{riskScore}/100</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-eos-border">
              <div
                className={`h-full rounded-full transition-all ${riskLevel === "high" ? "bg-eos-error" : riskLevel === "medium" ? "bg-eos-warning" : "bg-eos-success"}`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </div>

          {/* Acțiuni remediere */}
          <div className="flex flex-wrap gap-2">
            {!factors.hasDPA && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                disabled={patching === "hasDPA"}
                onClick={() => void markField("hasDPA", true)}
              >
                {patching === "hasDPA" ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" strokeWidth={2} />}
                Marchează DPA existent
              </Button>
            )}
            {!factors.hasSecuritySLA && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                disabled={patching === "hasSecuritySLA"}
                onClick={() => void markField("hasSecuritySLA", true)}
              >
                {patching === "hasSecuritySLA" ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" strokeWidth={2} />}
                Marchează SLA verificat
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              disabled={patching === "lastReviewDate"}
              onClick={() => void markField("lastReviewDate", new Date().toISOString())}
            >
              {patching === "lastReviewDate" ? <Loader2 className="size-3 animate-spin" /> : <ClipboardCheck className="size-3" strokeWidth={2} />}
              Marchează revizuire azi
            </Button>
          </div>
          {vendor.lastReviewDate && (
            <p className="mt-2 text-xs text-eos-text-muted">
              Ultima revizuire: {new Date(vendor.lastReviewDate).toLocaleDateString("ro-RO")}
              {vendor.nextReviewDue && ` · Scadentă: ${new Date(vendor.nextReviewDue).toLocaleDateString("ro-RO")}`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function VendorsTab({
  highlightedVendorId,
  highlightedVendorName,
  focusMode,
  sourceFindingId,
  returnTo,
}: {
  highlightedVendorId?: string
  highlightedVendorName?: string
  focusMode?: "vendor"
  sourceFindingId?: string
  returnTo?: string
}) {
  const router = useRouter()
  const [vendors, setVendors] = useState<Nis2Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "",
    service: "",
    riskLevel: "medium" as Nis2VendorRiskLevel,
    hasSecurityClause: false,
    hasIncidentNotification: false,
    hasAuditRight: false,
    notes: "",
  })

  useEffect(() => {
    fetch("/api/nis2/vendors", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { vendors: Nis2Vendor[] }) => setVendors(d.vendors ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const normalizeVendorName = (value: string) =>
    value.toLowerCase().replace(/corporation|emea sarl|services|web|amazon/g, "").replace(/\s+/g, " ").trim()

  const highlightedVendor =
    (highlightedVendorId ? vendors.find((vendor) => vendor.id === highlightedVendorId) ?? null : null) ??
    (highlightedVendorName
      ? vendors.find((vendor) => {
          const current = normalizeVendorName(vendor.name)
          const target = normalizeVendorName(highlightedVendorName)
          return current.includes(target) || target.includes(current)
        }) ?? null
      : null)

  useEffect(() => {
    if (loading || !highlightedVendor) return
    const row = document.getElementById(`vendor-${highlightedVendor.id}`)
    if (!row) return
    row.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [highlightedVendor, loading, vendors.length])

  async function handleCreate() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/nis2/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { vendor?: Nis2Vendor; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      setVendors((prev) => [data.vendor!, ...prev])
      setForm({ name: "", service: "", riskLevel: "medium", hasSecurityClause: false, hasIncidentNotification: false, hasAuditRight: false, notes: "" })
      setShowForm(false)
      toast.success("Furnizor adăugat")
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setCreating(false)
    }
  }

  async function handleImportFromEfactura() {
    setImporting(true)
    try {
      const res = await fetch("/api/nis2/vendors/import-efactura", { method: "POST" })
      const data = (await res.json()) as { added: number; skipped: number; message: string; demoMode?: boolean }
      if (!res.ok) throw new Error(data.message ?? "Import eșuat.")
      if (data.added > 0) {
        // reload vendors
        const updated = await fetch("/api/nis2/vendors", { cache: "no-store" }).then((r) => r.json()) as { vendors: Nis2Vendor[] }
        setVendors(updated.vendors ?? [])
        if (data.demoMode) {
          toast.warning(data.message, {
            description: "Conectează contul ANAF din Setări pentru date reale.",
            duration: 6000,
          })
        } else {
          toast.success(data.message)
        }
      } else {
        toast.info(data.message)
      }
    } catch (err) {
      toast.error("Eroare la import", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setImporting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Ștergi acest furnizor din registru?")) return
    try {
      const res = await fetch(`/api/nis2/vendors/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setVendors((prev) => prev.filter((v) => v.id !== id))
      toast.success("Furnizor șters")
    } catch {
      toast.error("Eroare la ștergere")
    }
  }

  async function handlePatch(id: string, patch: Partial<Nis2Vendor>) {
    try {
      const res = await fetch(`/api/nis2/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = (await res.json()) as { vendor?: Nis2Vendor; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la actualizare.")
      setVendors((prev) => prev.map((v) => (v.id === id ? data.vendor! : v)))
      toast.success("Furnizor actualizat")
      if (
        sourceFindingId &&
        returnTo &&
        highlightedVendor?.id === id &&
        typeof patch.lastReviewDate === "string"
      ) {
        const evidenceNote = [
          `Revizuire furnizor salvată pentru ${data.vendor!.name}.`,
          data.vendor!.hasDPA ? "DPA verificat." : "DPA încă lipsă.",
          data.vendor!.hasSecuritySLA ? "SLA de securitate verificat." : "SLA de securitate încă lipsă.",
          data.vendor!.lastReviewDate
            ? `Ultima revizuire: ${new Date(data.vendor!.lastReviewDate).toLocaleDateString("ro-RO")}.`
            : null,
        ]
          .filter(Boolean)
          .join(" ")
        const params = new URLSearchParams({
          vendorFlow: "done",
          evidenceNote,
        })
        router.push(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${params.toString()}`)
        return
      }
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    }
  }

  const highRiskCount = vendors.filter((v) => computeVendorRisk(v).riskLevel === "high").length
  const missingClausesCount = vendors.filter((v) => !v.hasSecurityClause || !v.hasIncidentNotification).length

  return (
    <div className="space-y-4">
      {highlightedVendor && focusMode === "vendor" ? (
        <Card className="border-sky-300 bg-sky-50">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-950">Registrul furnizorilor este deschis din cockpit</p>
              <p className="mt-1 text-xs text-sky-900/80">
                Furnizorul „{highlightedVendor.name}” este deja selectat mai jos. Verifică DPA-ul, clauzele de securitate și marchează revizuirea contractuală; după salvare, revii automat în cockpit.
              </p>
            </div>
            {sourceFindingId ? (
              <Link
                href={returnTo || `/dashboard/resolve/${encodeURIComponent(sourceFindingId)}`}
                className="inline-flex shrink-0 items-center gap-1 text-xs text-sky-950 hover:underline"
              >
                <ArrowLeft className="size-3" strokeWidth={2} />
                Înapoi la finding
              </Link>
            ) : (
              <Badge variant="outline" className="shrink-0 normal-case tracking-normal border-sky-300 bg-white text-sky-950">
                NIS2 Art. 21(2)(d)
              </Badge>
            )}
          </CardContent>
        </Card>
      ) : sourceFindingId && focusMode === "vendor" ? (
        <Card className="border-sky-300 bg-sky-50">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-950">Alege furnizorul corect din cockpit</p>
              <p className="mt-1 text-xs text-sky-900/80">
                Nu am putut selecta automat furnizorul potrivit. Alege vendorul afectat din registru, marchează revizuirea și apoi revii automat în același finding.
              </p>
            </div>
            <Link
              href={returnTo || `/dashboard/resolve/${encodeURIComponent(sourceFindingId)}`}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-sky-950 hover:underline"
            >
              <ArrowLeft className="size-3" strokeWidth={2} />
              Înapoi la finding
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {highRiskCount > 0 && (
            <Badge variant="destructive" className="normal-case tracking-normal">
              {highRiskCount} scor risc ridicat
            </Badge>
          )}
          {missingClausesCount > 0 && (
            <Badge variant="warning" className="normal-case tracking-normal">
              {missingClausesCount} fără clauze complete
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => void handleImportFromEfactura()}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5" strokeWidth={2} />
            )}
            Importă din e-Factura
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-3.5" strokeWidth={2} />
            Adaugă furnizor
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="text-sm">Furnizor ICT nou</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Nume furnizor *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-9 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
              />
              <input
                type="text"
                placeholder="Serviciu (ex: hosting, ERP, email)"
                value={form.service}
                onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                className="h-9 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-eos-text-muted">Nivel risc</label>
              <select
                className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none sm:w-48"
                value={form.riskLevel}
                onChange={(e) => setForm((f) => ({ ...f, riskLevel: e.target.value as Nis2VendorRiskLevel }))}
              >
                {(["low", "medium", "high", "critical"] as Nis2VendorRiskLevel[]).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { key: "hasSecurityClause" as const, label: "Clauze securitate în contract" },
                { key: "hasIncidentNotification" as const, label: "Notificare incidente" },
                { key: "hasAuditRight" as const, label: "Drept de audit" },
              ].map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 text-sm text-eos-text">
                  <input
                    type="checkbox"
                    checked={form[c.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.checked }))}
                    className="size-4 accent-eos-primary"
                  />
                  {c.label}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Anulează
              </Button>
              <Button
                size="sm"
                disabled={creating || !form.name.trim()}
                onClick={() => void handleCreate()}
                className="gap-2"
              >
                {creating && <Loader2 className="size-3.5 animate-spin" />}
                Salvează furnizor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingScreen variant="section" />
      ) : vendors.length === 0 ? (
        <div className="rounded-eos-md border border-eos-border bg-eos-surface p-8 text-center">
          <Shield className="mx-auto mb-3 size-10 text-eos-text-muted" strokeWidth={1.5} />
          <p className="font-semibold text-eos-text">Niciun furnizor ICT înregistrat</p>
          <p className="mt-1 text-sm text-eos-text-muted">
            Adaugă furnizorii IT și cloud care procesează date sau susțin sisteme critice ale organizației tale.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
            onClick={() => void handleImportFromEfactura()}
            disabled={importing}
          >
            {importing ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <Download className="size-4" strokeWidth={2} />}
            Importă automat din e-Factura
          </Button>
        </div>
      ) : (
        <Card className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
          {vendors.map((v) => (
            <VendorRow
              key={v.id}
              vendor={v}
              onDelete={handleDelete}
              onPatch={handlePatch}
              highlighted={v.id === highlightedVendor?.id}
            />
          ))}
        </Card>
      )}

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <p className="font-medium text-eos-text">De ce registrul furnizorilor ICT?</p>
        <p className="mt-1">
          NIS2 Art. 21(2)(d) obligă evaluarea riscurilor din lanțul de aprovizionare. La audit, DNSC verifică dacă ai clauze de securitate,
          notificare incidente și drept de audit în contractele cu furnizorii critici.
        </p>
      </div>
    </div>
  )
}

// ── NIS2 Progress Stepper ───────────────────────────────────────────────────────

type StepStatus = "done" | "in_progress" | "pending"

function Nis2ProgressStepper() {
  const [maturityDone, setMaturityDone] = useState<boolean | null>(null)
  const [hasIncidents, setHasIncidents] = useState<boolean | null>(null)
  const [governanceDone, setGovernanceDone] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/nis2/maturity", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { assessment: MaturityAssessment | null }) => setMaturityDone(!!d.assessment))
      .catch(() => setMaturityDone(false))

    fetch("/api/nis2/incidents", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { incidents: Nis2Incident[] }) => setHasIncidents(Array.isArray(d.incidents)))
      .catch(() => setHasIncidents(false))

    fetch("/api/nis2/governance", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { members: BoardMember[] }) => setGovernanceDone((d.members ?? []).length > 0))
      .catch(() => setGovernanceDone(false))
  }, [])

  const steps: { label: string; sub: string; status: StepStatus; href: string; anchor?: string }[] = [
    {
      label: "Clasificare",
      sub: "Sector și tip entitate",
      status: "done",
      href: "/dashboard/nis2",
    },
    {
      label: "Maturitate",
      sub: "Auto-evaluare DNSC",
      status: maturityDone === null ? "pending" : maturityDone ? "done" : "in_progress",
      href: "/dashboard/nis2/maturitate",
    },
    {
      label: "Incidente",
      sub: "Log SLA 24h / 72h",
      status: hasIncidents === null ? "pending" : hasIncidents ? "done" : "pending",
      href: "/dashboard/nis2",
      anchor: "incidents",
    },
    {
      label: "Guvernanță",
      sub: "Board & CISO training",
      status: governanceDone === null ? "pending" : governanceDone ? "done" : "in_progress",
      href: "/dashboard/nis2/governance",
    },
  ]

  const statusIcon: Record<StepStatus, string> = {
    done: "✓",
    in_progress: "⚠",
    pending: "—",
  }
  const statusColor: Record<StepStatus, string> = {
    done: "border-eos-success/30 bg-eos-success-soft text-eos-success",
    in_progress: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
    pending: "border-eos-border bg-eos-surface text-eos-text-muted",
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {steps.map((step, i) => (
        <Link
          key={step.label}
          href={step.anchor ? `${step.href}#${step.anchor}` : step.href}
          className={`flex flex-col gap-1 rounded-eos-lg border px-3 py-2.5 transition-all hover:border-eos-primary/40 ${statusColor[step.status]}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-eos-text-tertiary">Pasul {i + 1}</span>
            <span className="text-[11px] font-bold">{statusIcon[step.status]}</span>
          </div>
          <p className="text-sm font-semibold leading-tight">{step.label}</p>
          <p className="text-[11px] leading-tight opacity-70">{step.sub}</p>
        </Link>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

function MaturityCard() {
  const [assessment, setAssessment] = useState<MaturityAssessment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/nis2/maturity", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { assessment: MaturityAssessment | null }) => setAssessment(d.assessment ?? null))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  if (!assessment) {
    return (
      <Link href="/dashboard/nis2/maturitate" className="block">
        <div className="flex items-center justify-between gap-4 rounded-eos-lg border border-dashed border-eos-primary/40 bg-eos-primary-soft px-4 py-3 transition-all hover:border-eos-primary/70">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="size-5 shrink-0 text-eos-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-semibold text-eos-text">Auto-evaluare maturitate DNSC</p>
              <p className="text-xs text-eos-text-muted">Obligatorie — OUG 155/2024 Art.18(7) ✅ · ~15 min · 10 domenii</p>
            </div>
          </div>
          <Badge variant="warning" className="shrink-0">Necompletată</Badge>
        </div>
      </Link>
    )
  }

  const daysLeft = Math.ceil(
    (new Date(assessment.remediationPlanDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Link href="/dashboard/nis2/maturitate" className="block">
      <div className="flex items-center justify-between gap-4 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3 transition-all hover:border-eos-primary/40">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="size-5 shrink-0 text-eos-primary" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold text-eos-text">
              Maturitate DNSC — {assessment.overallScore}%
            </p>
            <p className="text-xs text-eos-text-muted">
              Nivel {assessment.level} ·{" "}
              {daysLeft > 0
                ? `Plan remediere în ${daysLeft} zile`
                : "⚠ Deadline plan remediere depășit"}
            </p>
          </div>
        </div>
        <Badge
          variant={assessment.level === "essential" ? "success" : assessment.level === "important" ? "warning" : "destructive"}
          className="shrink-0 normal-case"
        >
          {assessment.level}
        </Badge>
      </div>
    </Link>
  )
}

function GovernanceCard() {
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/nis2/governance", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { members: BoardMember[] }) => setMembers(d.members ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  const missingTraining = members.filter((m) => !m.nis2TrainingCompleted).length
  const issues = missingTraining

  return (
    <Link href="/dashboard/nis2/governance" className="block">
      <div className={`flex items-center justify-between gap-4 rounded-eos-lg border px-4 py-3 transition-all hover:border-eos-primary/40 ${
        members.length === 0
          ? "border-dashed border-eos-border bg-eos-surface"
          : issues > 0
            ? "border-eos-warning/30 bg-eos-warning-soft"
            : "border-eos-border bg-eos-surface"
      }`}>
        <div className="flex items-center gap-3">
          <Users className={`size-5 shrink-0 ${issues > 0 ? "text-eos-warning" : "text-eos-primary"}`} strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold text-eos-text">Training Board & CISO</p>
            <p className="text-xs text-eos-text-muted">
              {members.length === 0
                ? "Adaugă membrii conducerii — OUG 155/2024 Art. 14 ✅"
                : `${members.length} membri · ${missingTraining > 0 ? `${missingTraining} fără training` : "toți cu training documentat"}`}
            </p>
          </div>
        </div>
        {members.length === 0 ? (
          <Badge variant="outline" className="shrink-0">Necompletat</Badge>
        ) : issues > 0 ? (
          <Badge variant="warning" className="shrink-0">{issues} problemă{issues > 1 ? "i" : ""}</Badge>
        ) : (
          <Badge variant="success" className="shrink-0">Conform</Badge>
        )}
      </div>
    </Link>
  )
}

export default function Nis2Page() {
  // orgName pentru rapoartele DNSC — citit din session header via fetch minimal
  const searchParams = useSearchParams()
  const [orgName, setOrgName] = useState<string | undefined>()
  const [activeTab, setActiveTab] = useState<Nis2TabValue>("assessment")
  const requestedTab = normalizeNis2TabValue(searchParams.get("tab"))
  const highlightedIncidentId = searchParams.get("incidentId") ?? undefined
  const highlightedVendorId = searchParams.get("vendorId") ?? undefined
  const highlightedVendorName = searchParams.get("vendor") ?? undefined
  const rawFocusMode = searchParams.get("focus")
  const focusMode =
    rawFocusMode === "anspdcp" || rawFocusMode === "incident" || rawFocusMode === "vendor"
      ? rawFocusMode
      : undefined
  const assessmentFocus = searchParams.get("focus") === "assessment"
  const sourceFindingId = searchParams.get("findingId") ?? undefined
  const returnTo = searchParams.get("returnTo") ?? undefined
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { orgName?: string }) => { if (d.orgName) setOrgName(d.orgName) })
      .catch(() => null)
  }, [])

  useEffect(() => {
    setActiveTab(requestedTab)
  }, [requestedTab])

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={<SimpleTooltip content="Network and Information Security Directive 2 — Directiva UE 2022/2555"><span className="cursor-help border-b border-dotted border-current">NIS2</span></SimpleTooltip>}
        title="Directiva NIS2 — Securitate cibernetică"
        description="Instrument de evaluare și monitorizare pentru conformitatea cu Directiva NIS2 (2022/2555) și ghidul DNSC. Evaluare, incident log cu SLA tracking și registrul furnizorilor ICT."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              Directiva (UE) 2022/2555
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              DNSC Romania
            </Badge>
          </>
        }
      />

      {sourceFindingId && activeTab === "assessment" && assessmentFocus ? (
        <Card className="border-eos-warning/30 bg-eos-warning/5">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-eos-text">Evaluarea NIS2 este deschisă din cockpit</p>
              <p className="mt-1 text-xs text-eos-text-muted">
                Completează assessment-ul NIS2. După salvare, revii automat în același finding pentru închidere.
              </p>
            </div>
            <Link
              href={returnTo ?? `/dashboard/resolve/${sourceFindingId}`}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-eos-primary hover:underline"
            >
              <ArrowLeft className="size-3" strokeWidth={2} />
              Înapoi la finding
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {/* Eligibility CTA — link to wizard page */}
      <Card className="border-eos-primary/30 bg-eos-primary/5">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              Verifică dacă firma ta intră sub NIS2
            </p>
            <p className="mt-0.5 text-xs text-eos-text-muted">
              Wizard rapid — 3 întrebări bazate pe OUG 155/2024
            </p>
          </div>
          <Link href="/dashboard/nis2/eligibility">
            <Button size="sm" className="shrink-0 gap-1.5 bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover">
              <ShieldAlert className="size-4" strokeWidth={2} />
              Verifică eligibilitatea
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Nis2ProgressStepper />
      <Nis2RescueBanner />
      <MaturityCard />
      <GovernanceCard />

      <Tabs
        value={activeTab}
        onValueChange={(next: string) => setActiveTab(normalizeNis2TabValue(next))}
        className="space-y-5"
      >
        <TabsList className="border-b border-eos-border">
          <TabsTrigger value="assessment" className="min-h-12 flex-col items-start px-4 py-3 text-left">
            <span className="text-sm font-medium">Evaluare</span>
            <span className="mt-0.5 text-xs font-normal text-eos-text-muted">Gap analysis NIS2</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="min-h-12 flex-col items-start px-4 py-3 text-left">
            <span className="text-sm font-medium">Incidente</span>
            <span className="mt-0.5 text-xs font-normal text-eos-text-muted">SLA 24h / 72h DNSC</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="min-h-12 flex-col items-start px-4 py-3 text-left">
            <span className="text-sm font-medium">Furnizori ICT</span>
            <span className="mt-0.5 text-xs font-normal text-eos-text-muted">Registru lanț aprovizionare</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessment">
          <AssessmentTab orgName={orgName} sourceFindingId={sourceFindingId} returnTo={returnTo} />
        </TabsContent>
        <TabsContent value="incidents">
          <IncidentsTab
            orgName={orgName}
            highlightedIncidentId={highlightedIncidentId}
            focusMode={focusMode === "anspdcp" || focusMode === "incident" ? focusMode : undefined}
            sourceFindingId={sourceFindingId}
            returnTo={returnTo}
          />
        </TabsContent>
        <TabsContent value="vendors">
          <VendorsTab
            highlightedVendorId={highlightedVendorId}
            highlightedVendorName={highlightedVendorName}
            focusMode={focusMode === "vendor" ? "vendor" : undefined}
            sourceFindingId={sourceFindingId}
            returnTo={returnTo}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
