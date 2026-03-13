"use client"

import { useRef, useState, type ChangeEvent } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileDown,
  Paperclip,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { CockpitTask } from "@/components/compliscan/types"
import { resolveEvidenceHref } from "@/lib/compliance/evidence-links"
import type { EvidenceQualityAssessment, TaskEvidenceKind } from "@/lib/compliance/types"
import { formatPrincipleLabel } from "@/lib/compliance/constitution"
import {
  formatEvidenceQualityStatus,
  getEvidenceQualitySummary,
} from "@/lib/compliance/evidence-quality"

type TaskCardProps = {
  task: CockpitTask
  highlighted?: boolean
  onMarkDone: (id: string) => void
  onAttachEvidence: (id: string, file: File, kind: TaskEvidenceKind) => void | Promise<void>
  onExport: (id: string) => void
}

function priorityTone(priority: CockpitTask["priority"]) {
  if (priority === "P1") {
    return {
      badge: "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]",
      accent: "border-l-[var(--color-error)]",
    }
  }
  if (priority === "P2") {
    return {
      badge: "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
      accent: "border-l-[var(--color-warning)]",
    }
  }
  return {
    badge:
      "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]",
    accent: "border-l-[var(--color-info)]",
  }
}

function confidenceLabel(confidence: CockpitTask["confidence"]) {
  if (confidence === "high") return "high"
  if (confidence === "med") return "med"
  return "low"
}

function validationTone(status: CockpitTask["validationStatus"]) {
  if (status === "passed") {
    return "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
  }
  if (status === "failed") {
    return "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
  }
  if (status === "needs_review") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }
  return "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
}

function validationLabel(status: CockpitTask["validationStatus"]) {
  if (status === "passed") return "validated"
  if (status === "failed") return "failed"
  if (status === "needs_review") return "needs review"
  return "idle"
}

function validationConfidenceLabel(confidence?: CockpitTask["validationConfidence"]) {
  if (confidence === "high") return "încredere mare"
  if (confidence === "medium") return "încredere medie"
  if (confidence === "low") return "încredere redusă"
  return "încredere n/a"
}

function validationBasisLabel(basis?: CockpitTask["validationBasis"]) {
  if (basis === "direct_signal") return "semnal direct"
  if (basis === "inferred_signal") return "semnal inferat"
  if (basis === "operational_state") return "stare operațională"
  return "bază n/a"
}

function severityTone(severity: CockpitTask["severity"]) {
  if (severity === "critical" || severity === "high") {
    return "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
  }
  if (severity === "medium") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }
  return "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
}

function remediationModeTone(mode: CockpitTask["remediationMode"]) {
  if (mode === "rapid") {
    return "border-[var(--color-info)] bg-[var(--color-info-muted)] text-[var(--color-info)]"
  }

  return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
}

function remediationModeLabel(mode: CockpitTask["remediationMode"]) {
  return mode === "rapid" ? "remediere rapida" : "remediere structurala"
}

function evidenceQualityTone(status?: EvidenceQualityAssessment["status"]) {
  if (status === "sufficient") {
    return "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
  }
  if (status === "weak") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }
  return "border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]"
}

export function TaskCard({
  task,
  highlighted,
  onMarkDone,
  onAttachEvidence,
  onExport,
}: TaskCardProps) {
  const tone = priorityTone(task.priority)
  const evidenceInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedEvidenceKind, setSelectedEvidenceKind] = useState<TaskEvidenceKind>(
    task.evidenceKinds[0] ?? "other"
  )
  const evidenceHref = resolveEvidenceHref(task.attachedEvidence)

  async function handleCopyReadyText() {
    try {
      await navigator.clipboard.writeText(task.readyText)
      toast.success("Text copiat", { description: task.readyTextLabel })
    } catch {
      toast.error("Nu am putut copia textul")
    }
  }

  function handleEvidenceSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    void onAttachEvidence(task.id, file, selectedEvidenceKind)
    event.target.value = ""
  }

  return (
    <Card
      id={`task-${task.id}`}
      className={`border-[var(--color-border)] bg-[var(--color-surface)] [box-shadow:var(--shadow-md)] transition ${
        highlighted ? "ring-1 ring-[var(--border-strong)] ring-offset-2 ring-offset-[var(--color-bg)]" : ""
      }`}
    >
      <CardContent className={`border-l-4 px-5 py-5 ${tone.accent}`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={tone.badge}>{task.priority}</Badge>
                <Badge className={severityTone(task.severity)}>{task.severity}</Badge>
                <Badge className={remediationModeTone(task.remediationMode)}>
                  {remediationModeLabel(task.remediationMode)}
                </Badge>
                <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] uppercase tracking-[0.24em] text-[11px] text-[var(--color-muted)]">
                  {task.status === "done" ? "done" : "open"}
                </Badge>
                <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
                  confidence {confidenceLabel(task.confidence)}
                </Badge>
                <Badge className={validationTone(task.validationStatus)}>
                  {validationLabel(task.validationStatus)}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-on-surface)]">{task.title}</h3>
              <p className="text-sm text-[var(--color-on-surface-muted)]">{task.summary}</p>
            </div>

            <div className="grid gap-1 text-sm text-[var(--color-muted)] md:text-right">
              <span>Owner: {task.owner}</span>
              <span>Due: {task.dueDate}</span>
              <span>{task.effortLabel}</span>
            </div>
          </div>

          <Separator className="bg-[var(--color-border)]" />

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Ce am detectat
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">{task.summary}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                De ce
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">{task.why}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Unde apare
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface)]">{task.triggerLabel}</p>
              <p className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-3 text-sm text-[var(--color-on-surface-muted)] whitespace-pre-wrap">
                {task.triggerSnippet ?? "Nu există excerpt salvat pentru acest task."}
              </p>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {task.source} · {task.lawReference}
              </p>
              {task.legalSummary && (
                <p className="mt-2 text-xs text-[var(--color-on-surface-muted)]">
                  {task.legalSummary}
                </p>
              )}
              {task.principles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {task.principles.map((principle) => (
                    <Badge
                      key={`${task.id}-${principle}`}
                      className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]"
                    >
                      {formatPrincipleLabel(principle)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Fix propus
              </p>
            </div>
            <p className="mt-2 text-xs text-[var(--color-on-surface-muted)]">
              {task.remediationMode === "rapid"
                ? "Task de inchidere rapida: schimbare mica de text, setare sau dovada pe care o poti valida imediat."
                : "Task structural: cere actualizare de procedura, configurare persistenta sau control operational stabil."}
            </p>
            <p className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-3 text-sm text-[var(--color-on-surface)]">
              {task.fixPreview}
            </p>
          </div>

          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                {task.readyTextLabel}
              </p>
              <Button
                onClick={() => void handleCopyReadyText()}
                variant="outline"
                className="h-9 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
              >
                <Copy className="size-4" strokeWidth={2.25} />
                Copiaza textul
              </Button>
            </div>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-3 text-sm leading-6 text-[var(--color-on-surface)]">
              {task.readyText}
            </pre>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
              Ce ai de facut
            </p>
            <ul className="mt-2 space-y-2 text-sm text-[var(--color-on-surface-muted)]">
              {task.steps.slice(0, 3).map((step, index) => (
                <li key={`${task.id}-${index}`} className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-4 text-[var(--icon-secondary)]" strokeWidth={2.25} />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
              Dovada de inchidere
            </p>
            <p className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-3 text-sm text-[var(--color-on-surface-muted)]">
              {task.evidenceSnippet}
            </p>
          </div>

          {(task.validationMessage || task.validatedAtLabel) && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Rezultat verificare
              </p>
              <div className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-3">
                <div className="flex items-start gap-3">
                  {task.validationStatus === "passed" ? (
                    <CheckCircle2
                      className="mt-0.5 size-4 text-[var(--status-success-text)]"
                      strokeWidth={2.25}
                    />
                  ) : (
                    <AlertTriangle
                      className="mt-0.5 size-4 text-[var(--color-warning)]"
                      strokeWidth={2.25}
                    />
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-[var(--color-on-surface)]">
                      {task.validationMessage || "Task-ul nu a fost validat încă."}
                    </p>
                    {(task.validationBasis || task.validationConfidence) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {task.validationBasis && (
                          <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                            bază: {validationBasisLabel(task.validationBasis)}
                          </Badge>
                        )}
                        {task.validationConfidence && (
                          <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                            {validationConfidenceLabel(task.validationConfidence)}
                          </Badge>
                        )}
                      </div>
                    )}
                    {task.validatedAtLabel && (
                      <p className="text-xs text-[var(--color-muted)]">
                        Ultima verificare: {task.validatedAtLabel}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {task.rescanHint && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Cand rescanezi
              </p>
              <p className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-3 text-sm text-[var(--color-on-surface-muted)]">
                {task.rescanHint}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-xs text-[var(--color-muted)]">
              {task.attachedEvidence ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span>Dovada atasata:</span>
                  {evidenceHref ? (
                    <a
                      href={evidenceHref}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-info)] underline decoration-[color:var(--color-border)] underline-offset-4"
                    >
                      {task.attachedEvidence.fileName}
                    </a>
                  ) : (
                    <span className="text-[var(--color-on-surface-muted)]">
                      {task.attachedEvidence.fileName}
                    </span>
                  )}
                  <span>·</span>
                  <span>{formatEvidenceKind(task.attachedEvidence.kind)}</span>
                  {task.attachedEvidence.quality && (
                    <>
                      <span>·</span>
                      <Badge className={evidenceQualityTone(task.attachedEvidence.quality.status)}>
                        dovadă {formatEvidenceQualityStatus(task.attachedEvidence.quality.status)}
                      </Badge>
                    </>
                  )}
                  {getEvidenceQualitySummary(task.attachedEvidence) && (
                    <span className="basis-full text-[var(--color-on-surface-muted)]">
                      {getEvidenceQualitySummary(task.attachedEvidence)}
                    </span>
                  )}
                </div>
              ) : (
                "Nu exista dovada atasata inca."
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedEvidenceKind}
                onChange={(event) =>
                  setSelectedEvidenceKind(event.target.value as TaskEvidenceKind)
                }
                className="h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-3 text-sm text-[var(--color-on-surface)] outline-none"
              >
                {task.evidenceKinds.map((kind) => (
                  <option key={`${task.id}-${kind}`} value={kind}>
                    {formatEvidenceKind(kind)}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => onMarkDone(task.id)}
                variant="outline"
                className="h-10 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
              >
                {task.status === "done" ? (
                  <CheckCircle2 className="size-4" strokeWidth={2.25} />
                ) : (
                  <RefreshCcw className="size-4" strokeWidth={2.25} />
                )}
                {task.status === "done" ? "Reopen task" : "Mark as fixed & rescan"}
              </Button>
              <Button
                onClick={() => evidenceInputRef.current?.click()}
                variant="outline"
                className="h-10 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
              >
                <Paperclip className="size-4" strokeWidth={2.25} />
                {task.attachedEvidence ? "Schimba dovada" : "Ataseaza dovada"}
              </Button>
              <Button
                onClick={() => onExport(task.id)}
                className="h-10 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
              >
                <FileDown className="size-4" strokeWidth={2.25} />
                Export PDF
              </Button>
            </div>
          </div>
          <input
            ref={evidenceInputRef}
            type="file"
            className="hidden"
            accept={acceptForEvidenceKind(selectedEvidenceKind)}
            onChange={handleEvidenceSelection}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function formatEvidenceKind(kind: TaskEvidenceKind) {
  if (kind === "screenshot") return "Screenshot"
  if (kind === "policy_text") return "Policy text"
  if (kind === "log_export") return "Log export"
  if (kind === "yaml_evidence") return "YAML evidence"
  if (kind === "document_bundle") return "Document bundle"
  return "Other"
}

function acceptForEvidenceKind(kind: TaskEvidenceKind) {
  if (kind === "screenshot") return "image/*,.pdf"
  if (kind === "policy_text") return ".txt,.md,.pdf,.doc,.docx,.html,.yaml,.yml,.json"
  if (kind === "log_export") return ".log,.txt,.json,.csv"
  if (kind === "yaml_evidence") return ".yaml,.yml,.json,.txt"
  if (kind === "document_bundle") return ".pdf,.zip,.json,.csv,.txt,.doc,.docx"
  return undefined
}
