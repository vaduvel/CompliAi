"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Shield } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import type { Nis2Incident, Nis2AttackType } from "@/lib/server/nis2-store"
import type { IncidentChecklist, ChecklistStep } from "@/lib/compliance/incident-checklists"

export function IncidentChecklist_UI({ attackType }: { attackType?: Nis2AttackType }) {
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
          <p className="text-[10.5px] text-eos-text-muted">{checklist.description}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${
            progress === 100
              ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
              : "border-eos-border bg-eos-surface-elevated text-eos-text-muted"
          }`}
        >
          {completedSteps.size}/{checklist.steps.length} pași
        </span>
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
              className={`flex w-full items-start gap-2.5 rounded-eos-sm border px-3 py-2 text-left transition-colors ${done ? "border-eos-success/20 bg-eos-success-soft" : "border-eos-border bg-eos-surface-variant hover:bg-eos-surface"}`}
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
                  <span className={`inline-block rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-medium ${CATEGORY_COLORS[step.category]}`}>
                    {CATEGORY_LABELS[step.category]}
                  </span>
                  {step.deadlineHours && (
                    <span className="font-mono text-[9px] text-eos-text-tertiary">⏱ {step.deadlineHours}h</span>
                  )}
                  {step.legalBasis && (
                    <span className="font-mono text-[9px] text-eos-text-tertiary">{step.legalBasis}</span>
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

export function getStageStatus(incident: Nis2Incident, key: StageKey): "done" | "active" | "locked" {
  if (key === "earlyWarning") return incident.earlyWarningReport ? "done" : "active"
  if (key === "fullReport") return incident.fullReport72h ? "done" : incident.earlyWarningReport ? "active" : "locked"
  return incident.finalReport ? "done" : incident.fullReport72h ? "active" : "locked"
}

const STAGE_STATUS_TONE: Record<
  "done" | "active" | "locked",
  { pill: string; label: string }
> = {
  done: {
    pill: "border-eos-success/30 bg-eos-success-soft text-eos-success",
    label: "Trimis",
  },
  active: {
    pill: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
    label: "De completat",
  },
  locked: {
    pill: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
    label: "Blocat",
  },
}

export function IncidentStageStepper({
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
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
        Raportare NIS2 Art. 23 — 3 etape
      </p>
      <div className="flex gap-1">
        {STAGE_META.map((stage) => {
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
        const statusTone = STAGE_STATUS_TONE[status]
        return (
          <div key={stage.key} className={`rounded-eos-sm border ${status === "done" ? "border-eos-success/20 bg-eos-success-soft" : status === "active" ? "border-eos-primary/30 bg-eos-primary/5" : "border-eos-border bg-eos-surface-variant opacity-60"}`}>
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2"
              onClick={() => status !== "locked" && setExpandedStage(isExpanded ? null : stage.key)}
              disabled={status === "locked"}
            >
              <div className="flex items-center gap-2">
                <div className={`flex size-5 items-center justify-center rounded-full font-mono text-[10px] font-bold ${status === "done" ? "bg-eos-success text-white" : status === "active" ? "bg-eos-primary text-white" : "bg-eos-surface text-eos-text-muted"}`}>
                  {status === "done" ? <CheckCircle2 className="size-3" /> : STAGE_META.indexOf(stage) + 1}
                </div>
                <span className={`text-xs font-medium ${status === "locked" ? "text-eos-text-muted" : "text-eos-text"}`}>
                  {stage.label}
                </span>
                <span className="font-mono text-[10px] text-eos-text-tertiary">{stage.deadline} · {stage.article}</span>
              </div>
              {(!isExpanded || status !== "active") && (
                <span
                  className={`inline-flex shrink-0 items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${statusTone.pill}`}
                >
                  {statusTone.label}
                </span>
              )}
            </button>
            {isExpanded && status === "active" && (
              <div className="space-y-3 border-t border-eos-border-subtle px-3 pb-3 pt-3">
                <div>
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-muted">Conținut raport</label>
                  <textarea
                    className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary"
                    rows={3}
                    placeholder="Descrierea situației..."
                    value={formData.content ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                  />
                </div>
                {stage.key === "earlyWarning" && (
                  <>
                    <div>
                      <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-muted">Evaluare inițială impact</label>
                      <textarea
                        className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary"
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
                      <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-muted">Analiză detaliată</label>
                      <textarea className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" rows={2} placeholder="Cauze, cronologie, amploare..." value={formData.detailedAnalysis ?? ""} onChange={(e) => setFormData((p) => ({ ...p, detailedAnalysis: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-muted">Indicatori tehnici (IoC)</label>
                      <input className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" placeholder="IP-uri, hash-uri, domenii..." value={formData.technicalIndicators ?? ""} onChange={(e) => setFormData((p) => ({ ...p, technicalIndicators: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-muted">Categorii date afectate</label>
                        <input className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" placeholder="personale, financiare, medicale..." value={formData.dataCategories ?? ""} onChange={(e) => setFormData((p) => ({ ...p, dataCategories: e.target.value }))} />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-muted">Nr. utilizatori afectați (estimat)</label>
                        <input type="number" className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" placeholder="0" value={formData.affectedUsers ?? ""} onChange={(e) => setFormData((p) => ({ ...p, affectedUsers: e.target.value }))} />
                      </div>
                    </div>
                  </>
                )}
                {stage.key === "finalReport" && (
                  <>
                    <div>
                      <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-muted">Analiză cauză rădăcină (RCA)</label>
                      <textarea className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" rows={2} placeholder="Ce a cauzat incidentul..." value={formData.rootCause ?? ""} onChange={(e) => setFormData((p) => ({ ...p, rootCause: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-muted">Lecții învățate</label>
                      <textarea className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" rows={2} placeholder="Ce am învățat..." value={formData.lessons ?? ""} onChange={(e) => setFormData((p) => ({ ...p, lessons: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-muted">Măsuri preventive</label>
                      <textarea className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text placeholder:text-eos-text-tertiary" rows={2} placeholder="Ce măsuri luăm pentru a preveni..." value={formData.preventive ?? ""} onChange={(e) => setFormData((p) => ({ ...p, preventive: e.target.value }))} />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-muted">Termen remediere</label>
                      <input type="date" className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text" value={formData.remediationDeadline ?? ""} onChange={(e) => setFormData((p) => ({ ...p, remediationDeadline: e.target.value }))} />
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
                    {incident.earlyWarningReport.crossBorderEffect && (
                      <span className="inline-flex items-center rounded-sm border border-eos-warning/30 bg-eos-warning-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-warning">
                        Efect transfrontalier
                      </span>
                    )}
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
