"use client"

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileDown,
  Paperclip,
  RefreshCcw,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import type { CockpitTask } from "@/components/compliscan/types"
import { resolveEvidenceHref } from "@/lib/compliance/evidence-links"
import type { EvidenceQualityAssessment, FindingResolution, TaskEvidenceKind, ValidationLevel } from "@/lib/compliance/types"
import { getValidationLevelMeta } from "@/lib/compliance/validation-levels"
import { formatPrincipleLabel } from "@/lib/compliance/constitution"
import {
  formatEvidenceQualityStatus,
  getEvidenceQualitySummary,
} from "@/lib/compliance/evidence-quality"
import { useTrackEvent } from "@/lib/client/use-track-event"

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
      badge: "border-eos-error-border bg-eos-error-soft text-eos-error",
      accent: "border-l-eos-error",
    }
  }
  if (priority === "P2") {
    return {
      badge: "border-eos-warning-border bg-eos-warning-soft text-eos-warning",
      accent: "border-l-eos-warning",
    }
  }
  return {
    badge:
      "border-eos-border bg-eos-surface-variant text-eos-text-muted",
    accent: "border-l-eos-primary",
  }
}

function confidenceLabel(confidence: CockpitTask["confidence"]) {
  if (confidence === "high") return "solid"
  if (confidence === "med") return "mediu"
  return "orientativ"
}

function validationTone(status: CockpitTask["validationStatus"]) {
  if (status === "passed") {
    return "border-eos-border bg-eos-success-soft text-eos-success"
  }
  if (status === "failed") {
    return "border-eos-error-border bg-eos-error-soft text-eos-error"
  }
  if (status === "needs_review") {
    return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  }
  return "border-eos-border bg-eos-surface-variant text-eos-text-muted"
}

function validationLabel(status: CockpitTask["validationStatus"]) {
  if (status === "passed") return "validat"
  if (status === "failed") return "respins"
  if (status === "needs_review") return "revizuire"
  return "nepornit"
}

function validationLevelTone(level: ValidationLevel) {
  if (level === 1) return "border-eos-border bg-eos-success-soft text-eos-success"
  if (level === 2) return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  return "border-eos-error-border bg-eos-error-soft text-eos-error"
}

function validationConfidenceLabel(confidence?: CockpitTask["validationConfidence"]) {
  if (confidence === "high") return "incredere mare"
  if (confidence === "medium") return "incredere medie"
  if (confidence === "low") return "incredere redusa"
  return "incredere n/a"
}

function validationBasisLabel(basis?: CockpitTask["validationBasis"]) {
  if (basis === "direct_signal") return "semnal direct"
  if (basis === "inferred_signal") return "semnal inferat"
  if (basis === "operational_state") return "stare operationala"
  return "baza n/a"
}

function severityLabel(severity: CockpitTask["severity"]) {
  if (severity === "critical") return "critic"
  if (severity === "high") return "ridicat"
  if (severity === "medium") return "mediu"
  return "scazut"
}

function severityTone(severity: CockpitTask["severity"]) {
  if (severity === "critical" || severity === "high") {
    return "border-eos-error-border bg-eos-error-soft text-eos-error"
  }
  if (severity === "medium") {
    return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  }
  return "border-eos-border bg-eos-surface-variant text-eos-text-muted"
}

function remediationModeLabel(mode: CockpitTask["remediationMode"]) {
  return mode === "rapid" ? "remediere rapida" : "remediere structurala"
}

function evidenceQualityTone(status?: EvidenceQualityAssessment["status"]) {
  if (status === "sufficient") {
    return "border-eos-border bg-eos-success-soft text-eos-success"
  }
  if (status === "weak") {
    return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  }
  return "border-eos-border bg-eos-bg-inset text-eos-text-muted"
}

function normalizeTaskCopy(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase()
}

function hasDistinctTaskCopy(primary: string, secondary: string) {
  const normalizedPrimary = normalizeTaskCopy(primary)
  const normalizedSecondary = normalizeTaskCopy(secondary)

  if (!normalizedSecondary) return false

  return (
    normalizedPrimary !== normalizedSecondary &&
    !normalizedPrimary.includes(normalizedSecondary) &&
    !normalizedSecondary.includes(normalizedPrimary)
  )
}

function nextActionLabel(task: CockpitTask) {
  return task.steps[0] ?? task.fixPreview ?? task.summary
}

function auditBlockerLabel(task: CockpitTask) {
  if (!task.attachedEvidence) return "Lipsește dovada pentru închidere și audit."
  if (task.validationStatus === "failed") return "Ultima verificare a respins task-ul și cere revenire."
  if (task.validationStatus === "needs_review") return "Task-ul cere confirmare umană înainte de închidere."
  if (task.status === "done") return "Task-ul este închis și poate fi verificat separat în Vault."
  if (task.validationLevel === 3) return "Cazul este pregătit pentru validare de specialitate. Dovezile și red flags sunt deja organizate."
  if (task.validationLevel === 2) return "Cazul necesită confirmare internă înainte de închidere."
  return "Nu există blocaje majore vizibile pentru task-ul curent."
}

function primaryActionCopy(
  task: CockpitTask,
  nextAction: string,
  hasDistinctFixPreview: boolean,
) {
  if (!task.attachedEvidence && task.status !== "done" && task.closureRecipe) {
    return task.closureRecipe
  }
  if (hasDistinctFixPreview) {
    return task.fixPreview
  }
  return nextAction
}

export function TaskCard({
  task,
  highlighted,
  onMarkDone,
  onAttachEvidence,
  onExport,
}: TaskCardProps) {
  const { track } = useTrackEvent()
  const cardRef = useRef<HTMLDivElement | null>(null)
  const trackedRef = useRef(false)

  // Track "opened finding but not closed" when card becomes visible
  useEffect(() => {
    if (task.status !== "todo" || trackedRef.current) return
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !trackedRef.current) {
          trackedRef.current = true
          track("opened_finding_but_not_closed", { taskId: task.id })
          observer.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [task.id, task.status, track])

  const tone = priorityTone(task.priority)
  const evidenceInputRef = useRef<HTMLInputElement | null>(null)
  const [validating, setValidating] = useState(false)
  const [selectedEvidenceKind, setSelectedEvidenceKind] = useState<TaskEvidenceKind>(
    task.evidenceKinds[0] ?? "other"
  )
  const evidenceHref = resolveEvidenceHref(task.attachedEvidence)
  const evidenceQualitySummary = task.attachedEvidence
    ? getEvidenceQualitySummary(task.attachedEvidence)
    : null
  const hasDistinctFixPreview = hasDistinctTaskCopy(task.summary, task.fixPreview)
  const nextAction = nextActionLabel(task)
  const primaryAction = primaryActionCopy(task, nextAction, hasDistinctFixPreview)
  const auditBlocker = auditBlockerLabel(task)
  const visiblePrinciples = task.principles.slice(0, 2)
  const hiddenPrinciples = task.principles.slice(visiblePrinciples.length)
  const hiddenPrinciplesLabel = hiddenPrinciples
    .map((principle) => formatPrincipleLabel(principle))
    .join(", ")

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
      ref={cardRef}
      id={`task-${task.id}`}
      className={`border-eos-border bg-eos-surface shadow-sm transition ${
        highlighted ? "ring-1 ring-eos-border-strong ring-offset-2 ring-offset-eos-bg" : ""
      }`}
    >
      <CardContent className={`border-l-4 px-5 py-5 ${tone.accent}`}>
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
            <div className="min-w-0 space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={tone.badge}>{task.priority}</Badge>
                  <Badge className={severityTone(task.severity)}>{severityLabel(task.severity)}</Badge>
                  <Badge className={validationTone(task.validationStatus)}>
                    {validationLabel(task.validationStatus)}
                  </Badge>
                  <Badge
                    className={validationLevelTone(task.validationLevel)}
                    title={getValidationLevelMeta(task.validationLevel).description}
                  >
                    L{task.validationLevel} · {getValidationLevelMeta(task.validationLevel).shortLabel}
                  </Badge>
                  {task.category === "NIS2" ? (
                    <Badge className="border-eos-primary/20 bg-eos-primary-soft text-eos-primary dark:border-eos-primary/30 dark:bg-eos-primary-soft dark:text-eos-primary">
                      NIS2
                    </Badge>
                  ) : null}
                  {task.status === "done" ? (
                    <Badge className="border-eos-border bg-eos-surface-variant uppercase tracking-[0.24em] text-[11px] text-eos-text-muted">
                      închis
                    </Badge>
                  ) : null}
                </div>

                <h3 className="break-words text-lg font-semibold text-eos-text">
                  {task.title}
                </h3>
                <p className="text-sm text-eos-text-muted [overflow-wrap:anywhere]">
                  {task.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-eos-text-muted">
                <span className="[overflow-wrap:anywhere]">Responsabil: {task.owner}</span>
                <span className="[overflow-wrap:anywhere]">Termen: {task.dueDate}</span>
                <span className="[overflow-wrap:anywhere]">Tip: {remediationModeLabel(task.remediationMode)}</span>
                <span className="[overflow-wrap:anywhere]">{task.effortLabel}</span>
              </div>

              {task.resolution && <ResolutionPath resolution={task.resolution} />}

              {task.validationLevel >= 2 && (
                <ValidationLevelBlock level={task.validationLevel} />
              )}
            </div>

            <section className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-eos-text-muted">
                    Acum faci asta
                  </p>
                  <p className="mt-2 text-sm font-medium text-eos-text">
                    {primaryAction}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-eos-text-muted">
                    {auditBlocker}
                  </p>
                </div>

                {task.validationLevel >= 2 && (
                  <ValidationLevelBlock level={task.validationLevel} />
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge
                  className={
                    task.attachedEvidence
                      ? evidenceQualityTone(task.attachedEvidence.quality?.status)
                      : "border-eos-border bg-eos-surface text-eos-text-muted"
                  }
                >
                  {task.attachedEvidence ? "dovada atasata" : "fara dovada"}
                </Badge>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  onClick={() => {
                    if (!task.attachedEvidence && task.status !== "done") return
                    setValidating(true)
                    onMarkDone(task.id)
                  }}
                  disabled={validating || (!task.attachedEvidence && task.status !== "done")}
                  size="lg"
                  className="w-full gap-2"
                  title={!task.attachedEvidence && task.status !== "done" ? "Adaugă o dovadă înainte de a marca ca rezolvat" : undefined}
                >
                  {validating ? (
                    <RefreshCcw className="size-5 animate-spin" strokeWidth={2} />
                  ) : task.status === "done" ? (
                    <CheckCircle2 className="size-5" strokeWidth={2} />
                  ) : (
                    <RefreshCcw className="size-5" strokeWidth={2} />
                  )}
                  {task.status === "done" ? "Redeschide" : "Validează + rescanează"}
                </Button>
                {!task.attachedEvidence && task.status !== "done" && (
                  <p className="text-center text-[10px] text-eos-text-muted">
                    Adaugă o dovadă pentru a putea valida această problemă
                  </p>
                )}

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <select
                    value={selectedEvidenceKind}
                    onChange={(event) =>
                      setSelectedEvidenceKind(event.target.value as TaskEvidenceKind)
                    }
                    aria-label="Tipul de dovada"
                    className="h-9 min-w-0 rounded-eos-md border border-eos-border bg-eos-surface px-3 text-sm text-eos-text outline-none transition-[border-color,box-shadow] focus:border-eos-primary focus:ring-2 focus:ring-[var(--eos-accent-primary-subtle)]"
                  >
                    {task.evidenceKinds.map((kind) => (
                      <option key={`${task.id}-${kind}`} value={kind}>
                        {formatEvidenceKind(kind)}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => evidenceInputRef.current?.click()}
                    variant="outline"
                    className="gap-2"
                  >
                    <Paperclip className="size-4" strokeWidth={2} />
                    {task.attachedEvidence ? "Actualizeaza dovada" : "Adauga dovada"}
                  </Button>
                </div>
              </div>

              <details className="mt-3 rounded-eos-md border border-eos-border bg-eos-surface p-3 text-xs text-eos-text-muted">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-eos-text-muted">
                        Dovada si utilitare
                      </p>
                      <p className="text-xs text-eos-text-muted">
                        {task.attachedEvidence ? "Vezi dovada curenta sau exporta task-ul." : "Adauga dovada, apoi exporta doar daca ai nevoie separat."}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-eos-text-muted">Detalii</span>
                  </div>
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                    {task.attachedEvidence ? (
                      <div className="space-y-2">
                        <p className="font-medium text-eos-text">Dovada curenta</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {evidenceHref ? (
                            <a
                              href={evidenceHref}
                              target="_blank"
                              rel="noreferrer"
                              className="max-w-full break-all text-eos-info underline decoration-eos-border underline-offset-4"
                            >
                              {task.attachedEvidence.fileName}
                            </a>
                          ) : (
                            <span className="break-all text-eos-text">
                              {task.attachedEvidence.fileName}
                            </span>
                          )}
                          <span>·</span>
                          <span>{formatEvidenceKind(task.attachedEvidence.kind)}</span>
                          {task.attachedEvidence.quality ? (
                            <>
                              <span>·</span>
                              <Badge className={evidenceQualityTone(task.attachedEvidence.quality.status)}>
                                dovada {formatEvidenceQualityStatus(task.attachedEvidence.quality.status)}
                              </Badge>
                            </>
                          ) : null}
                        </div>
                        {evidenceQualitySummary ? (
                          <p className="[overflow-wrap:anywhere]">{evidenceQualitySummary}</p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium text-eos-text">Dovada lipseste</p>
                        <p>Ataseaza fisierul sau extrasul relevant inainte sa inchizi task-ul.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-eos-md border border-dashed border-eos-border bg-eos-bg-inset px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-eos-text-muted">
                        Utilitar
                      </p>
                      <p className="text-xs text-eos-text-muted">
                        Export separat pentru acest task.
                      </p>
                    </div>
                    <Button
                      onClick={() => onExport(task.id)}
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2"
                    >
                      <FileDown className="size-3.5" strokeWidth={2} />
                      Export task
                    </Button>
                  </div>
                </div>
              </details>
            </section>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <TaskDisclosure
              eyebrow="Context"
              title="Context si motivare"
              subtitle="Detaliile care explica de ce exista task-ul."
            >
              <div className="space-y-3">
                <p className="text-sm text-eos-text-muted [overflow-wrap:anywhere]">
                  {task.why}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-eos-text-muted">
                  <span className="[overflow-wrap:anywhere]">Sursa: {task.source}</span>
                  <span className="[overflow-wrap:anywhere]">
                    Semnal: {confidenceLabel(task.confidence)}
                  </span>
                  <span className="[overflow-wrap:anywhere]">{task.lawReference}</span>
                </div>
                <div>
                  <p className="break-words text-sm font-medium text-eos-text">
                    {task.triggerLabel}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words rounded-eos-md border border-eos-border bg-eos-bg-inset p-3 text-sm text-eos-text-muted">
                    {task.triggerSnippet ?? "Nu exista excerpt salvat pentru acest task."}
                  </p>
                </div>
                {task.legalSummary ? (
                  <p className="text-xs text-eos-text-muted [overflow-wrap:anywhere]">
                    {task.legalSummary}
                  </p>
                ) : null}
                {task.principles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {visiblePrinciples.map((principle) => (
                      <Badge
                        key={`${task.id}-${principle}`}
                        className="border-eos-border bg-eos-bg-inset text-eos-text-muted"
                      >
                        {formatPrincipleLabel(principle)}
                      </Badge>
                    ))}
                    {hiddenPrinciples.length > 0 ? (
                      <Badge
                        title={hiddenPrinciplesLabel}
                        className="border-eos-border bg-eos-bg-inset text-eos-text-muted"
                      >
                        +{hiddenPrinciples.length}
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </TaskDisclosure>

            <TaskDisclosure
              eyebrow="Suport"
              title={task.readyTextLabel}
              subtitle="Textul pregatit pentru copy-paste sau handoff."
            >
              <div className="space-y-3">
                <Button
                  onClick={() => void handleCopyReadyText()}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="size-3.5" strokeWidth={2} />
                  Copiaza
                </Button>
                <pre className="whitespace-pre-wrap break-words rounded-eos-md border border-eos-border bg-eos-bg-inset p-3 text-sm leading-6 text-eos-text [overflow-wrap:anywhere]">
                  {task.readyText}
                </pre>
              </div>
            </TaskDisclosure>

            <TaskDisclosure
              eyebrow="Verificare"
              title="Dovada si rationale"
              subtitle="Mesajele detaliate de verificare si suport."
            >
              <div className="space-y-3">
                <p className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3 text-sm leading-6 text-eos-text-muted [overflow-wrap:anywhere]">
                  {task.evidenceSnippet}
                </p>
                {task.rescanHint ? (
                  <p className="text-xs leading-5 text-eos-text-muted">{task.rescanHint}</p>
                ) : null}
                {(task.validationMessage || task.validatedAtLabel) ? (
                  <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                    <div className="flex items-start gap-3">
                      {task.validationStatus === "passed" ? (
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-eos-success"
                          strokeWidth={2}
                        />
                      ) : (
                        <AlertTriangle
                          className="mt-0.5 size-4 shrink-0 text-eos-warning"
                          strokeWidth={2}
                        />
                      )}
                      <div className="space-y-1">
                        <p className="text-sm text-eos-text [overflow-wrap:anywhere]">
                          {task.validationMessage || "Task-ul nu a fost validat inca."}
                        </p>
                        {task.validationBasis || task.validationConfidence ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {task.validationBasis ? (
                              <Badge className="border-eos-border bg-eos-surface-variant text-eos-text-muted">
                                baza: {validationBasisLabel(task.validationBasis)}
                              </Badge>
                            ) : null}
                            {task.validationConfidence ? (
                              <Badge className="border-eos-border bg-eos-surface-variant text-eos-text-muted">
                                {validationConfidenceLabel(task.validationConfidence)}
                              </Badge>
                            ) : null}
                          </div>
                        ) : null}
                        {task.validatedAtLabel ? (
                          <p className="text-xs text-eos-text-muted">
                            Ultima verificare: {task.validatedAtLabel}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </TaskDisclosure>
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

function TaskDisclosure({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <details className="group rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
      <summary className="cursor-pointer list-none">
        <p className="text-[11px] uppercase tracking-[0.24em] text-eos-text-muted">
          {eyebrow}
        </p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-eos-text">{title}</p>
            <p className="mt-1 text-xs leading-5 text-eos-text-muted">
              {subtitle}
            </p>
          </div>
          <span className="shrink-0 text-xs text-eos-text-muted">Detalii</span>
        </div>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  )
}

function formatEvidenceKind(kind: TaskEvidenceKind) {
  if (kind === "screenshot") return "Captura ecran"
  if (kind === "policy_text") return "Text de politica"
  if (kind === "log_export") return "Export loguri"
  if (kind === "yaml_evidence") return "Dovada YAML"
  if (kind === "document_bundle") return "Pachet documente"
  return "Alta dovada"
}

function acceptForEvidenceKind(kind: TaskEvidenceKind) {
  if (kind === "screenshot") return "image/*,.pdf"
  if (kind === "policy_text") return ".txt,.md,.pdf,.doc,.docx,.html,.yaml,.yml,.json"
  if (kind === "log_export") return ".log,.txt,.json,.csv"
  if (kind === "yaml_evidence") return ".yaml,.yml,.json,.txt"
  if (kind === "document_bundle") return ".pdf,.zip,.json,.csv,.txt,.doc,.docx"
  return undefined
}

// ── Validation Level Block ────────────────────────────────────────────────────

function ValidationLevelBlock({ level }: { level: ValidationLevel }) {
  const meta = getValidationLevelMeta(level)
  const isSpecialist = level === 3

  return (
    <div
      className={`mt-3 rounded-eos-md border px-4 py-3 ${
        isSpecialist
          ? "border-eos-error-border bg-eos-error-soft"
          : "border-eos-warning-border bg-eos-warning-soft"
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
          isSpecialist ? "text-eos-error" : "text-eos-warning"
        }`}
      >
        {meta.label}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-eos-text">
        {meta.escalationCopy}
      </p>
    </div>
  )
}

// ── V3 P0.0 / V4.3.3 Resolution Path ─────────────────────────────────────────
// V4.3: distincție vizuală CompliAI / Tu / Dovadă + progress indicator

type StepKind = "auto" | "human" | "evidence" | "info"

const RESOLUTION_STEPS: Array<{
  key: keyof FindingResolution
  label: string
  kind: StepKind
}> = [
  { key: "problem",        label: "Problemă detectată", kind: "info" },
  { key: "impact",         label: "Impact dacă nu acționezi", kind: "info" },
  { key: "action",         label: "Acțiunea exactă", kind: "human" },
  { key: "generatedAsset", label: "CompliAI face", kind: "auto" },
  { key: "humanStep",      label: "Tu faci", kind: "human" },
  { key: "closureEvidence",label: "Dovada de închidere", kind: "evidence" },
  { key: "revalidation",   label: "Revalidare", kind: "info" },
]

const STEP_KIND_CONFIG: Record<StepKind, { label: string; dot: string; text: string }> = {
  auto:     { label: "CompliAI", dot: "bg-eos-primary",  text: "text-eos-primary" },
  human:    { label: "Tu faci",  dot: "bg-eos-warning",   text: "text-eos-warning" },
  evidence: { label: "Dovadă",   dot: "bg-eos-success",   text: "text-eos-success" },
  info:     { label: "",         dot: "bg-eos-text-muted", text: "text-eos-text-muted" },
}

function ResolutionPath({ resolution }: { resolution: FindingResolution }) {
  const visibleSteps = RESOLUTION_STEPS.filter(({ key }) => resolution[key])
  if (visibleSteps.length === 0) return null

  const actionSteps = visibleSteps.filter((s) => s.kind === "human" || s.kind === "auto").length
  const evidenceStep = visibleSteps.find((s) => s.kind === "evidence")

  return (
    <div className="mt-3 rounded-eos-md border border-eos-border bg-eos-bg-inset">
      {/* Header cu progress */}
      <div className="flex items-center justify-between border-b border-eos-border-subtle px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
          Drum complet la rezolvare
        </span>
        {actionSteps > 0 && (
          <div className="flex items-center gap-2">
            {["auto", "human", "evidence"].map((kind) => {
              const cfg = STEP_KIND_CONFIG[kind as StepKind]
              const count = visibleSteps.filter((s) => s.kind === kind).length
              if (count === 0) return null
              return (
                <span key={kind} className="flex items-center gap-1 text-[10px] text-eos-text-muted">
                  <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Steps */}
      <ol className="space-y-3 px-4 pb-4 pt-3">
        {visibleSteps.map(({ key, label, kind }, idx) => {
          const cfg = STEP_KIND_CONFIG[kind]
          return (
            <li key={key} className="flex gap-3">
              <div className="mt-0.5 flex shrink-0 flex-col items-center gap-1">
                <span className={`flex size-5 items-center justify-center rounded-full border border-eos-border bg-eos-surface text-[10px] font-semibold text-eos-text-muted`}>
                  {idx + 1}
                </span>
                {idx < visibleSteps.length - 1 && (
                  <span className="h-3 w-px bg-eos-border-subtle" />
                )}
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
                    {label}
                  </p>
                  {cfg.label && (
                    <span className={`flex items-center gap-1 text-[10px] font-semibold ${cfg.text}`}>
                      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-5 text-eos-text [overflow-wrap:anywhere]">
                  {resolution[key]}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Closure note */}
      {evidenceStep && (
        <div className="border-t border-eos-border-subtle px-4 py-2.5">
          <p className="text-[10px] text-eos-text-muted">
            <span className="font-semibold text-eos-success">Inchidere:</span>{" "}
            Butonul &ldquo;Rezolvat&rdquo; devine activ doar după ce atașezi dovada de mai sus.
          </p>
        </div>
      )}
    </div>
  )
}
