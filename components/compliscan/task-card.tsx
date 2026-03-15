"use client"

import { useRef, useState, type ChangeEvent, type ReactNode } from "react"
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

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
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
  if (confidence === "high") return "mare"
  if (confidence === "med") return "medie"
  return "redusa"
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
  if (status === "passed") return "validat"
  if (status === "failed") return "respins"
  if (status === "needs_review") return "revizuire"
  return "nepornit"
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
    return "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
  }
  if (severity === "medium") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }
  return "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
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
  const evidenceQualitySummary = task.attachedEvidence
    ? getEvidenceQualitySummary(task.attachedEvidence)
    : null
  const hasDistinctFixPreview = hasDistinctTaskCopy(task.summary, task.fixPreview)
  const nextAction = nextActionLabel(task)
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
      id={`task-${task.id}`}
      className={`border-[var(--color-border)] bg-[var(--color-surface)] [box-shadow:var(--shadow-md)] transition ${
        highlighted ? "ring-1 ring-[var(--border-strong)] ring-offset-2 ring-offset-[var(--color-bg)]" : ""
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
                  {task.status === "done" ? (
                    <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] uppercase tracking-[0.24em] text-[11px] text-[var(--color-muted)]">
                      inchis
                    </Badge>
                  ) : null}
                </div>

                <h3 className="break-words text-lg font-semibold text-[var(--color-on-surface)]">
                  {task.title}
                </h3>
                <p className="text-sm text-[var(--color-on-surface-muted)] [overflow-wrap:anywhere]">
                  {task.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
                <span>Responsabil: {task.owner}</span>
                <span>Termen: {task.dueDate}</span>
                <span>Tip: {remediationModeLabel(task.remediationMode)}</span>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Urmatoarea actiune
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                  {nextAction}
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
              <div className="grid gap-2 text-sm text-[var(--color-muted)]">
                <span>Responsabil: {task.owner}</span>
                <span>Termen: {task.dueDate}</span>
                <span>{task.effortLabel}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge
                  className={
                    task.attachedEvidence
                      ? evidenceQualityTone(task.attachedEvidence.quality?.status)
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface-muted)]"
                  }
                >
                  {task.attachedEvidence ? "dovada atasata" : "fara dovada"}
                </Badge>
                <Badge className={validationTone(task.validationStatus)}>
                  {validationLabel(task.validationStatus)}
                </Badge>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  onClick={() => onMarkDone(task.id)}
                  className="h-11 w-full rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                >
                  {task.status === "done" ? (
                    <CheckCircle2 className="size-4" strokeWidth={2.25} />
                  ) : (
                    <RefreshCcw className="size-4" strokeWidth={2.25} />
                  )}
                  {task.status === "done" ? "Redeschide taskul" : "Valideaza si rescaneaza"}
                </Button>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <select
                    value={selectedEvidenceKind}
                    onChange={(event) =>
                      setSelectedEvidenceKind(event.target.value as TaskEvidenceKind)
                    }
                    aria-label="Tipul de dovada"
                    className="h-10 min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-on-surface)] outline-none transition-[border-color,box-shadow] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
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
                    className="h-10 rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
                  >
                    <Paperclip className="size-4" strokeWidth={2.25} />
                    {task.attachedEvidence ? "Actualizeaza dovada" : "Adauga dovada"}
                  </Button>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-on-surface-muted)]">
                {task.attachedEvidence ? (
                  <div className="space-y-2">
                    <p className="font-medium text-[var(--color-on-surface)]">Dovada curenta</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {evidenceHref ? (
                        <a
                          href={evidenceHref}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-full break-all text-[var(--color-info)] underline decoration-[color:var(--color-border)] underline-offset-4"
                        >
                          {task.attachedEvidence.fileName}
                        </a>
                      ) : (
                        <span className="break-all text-[var(--color-on-surface)]">
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
                    {evidenceQualitySummary ? <p>{evidenceQualitySummary}</p> : null}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-medium text-[var(--color-on-surface)]">Dovada lipseste</p>
                    <p>Ataseaza fisierul sau extrasul relevant inainte sa inchizi task-ul.</p>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Utilitar
                  </p>
                  <p className="text-xs text-[var(--color-on-surface-muted)]">
                    Export separat pentru acest task.
                  </p>
                </div>
                <Button
                  onClick={() => onExport(task.id)}
                  variant="outline"
                  className="h-9 shrink-0 rounded-xl border-[var(--color-border)] bg-[var(--bg-inset)] px-3 text-xs text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
                >
                  <FileDown className="size-4" strokeWidth={2.25} />
                  Export task
                </Button>
              </div>
            </section>
          </div>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Ce faci acum
              </p>
              {hasDistinctFixPreview ? (
                <p className="mt-2 break-words rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3 text-sm text-[var(--color-on-surface)] [overflow-wrap:anywhere]">
                  {task.fixPreview}
                </p>
              ) : null}
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-on-surface-muted)]">
                {task.steps.slice(0, 3).map((step, index) => (
                  <li key={`${task.id}-${index}`} className="flex gap-2">
                    <ShieldCheck
                      className="mt-0.5 size-4 shrink-0 text-[var(--icon-secondary)]"
                      strokeWidth={2.25}
                    />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Verificare rapida
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface)] [overflow-wrap:anywhere]">
                {task.validationMessage || "Task-ul nu a fost validat inca."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {task.validationBasis ? (
                  <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                    baza: {validationBasisLabel(task.validationBasis)}
                  </Badge>
                ) : null}
                {task.validationConfidence ? (
                  <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                    {validationConfidenceLabel(task.validationConfidence)}
                  </Badge>
                ) : null}
                {task.validatedAtLabel ? (
                  <Badge className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]">
                    {task.validatedAtLabel}
                  </Badge>
                ) : null}
              </div>
            </div>
          </section>

          <div className="grid gap-3 xl:grid-cols-3">
            <TaskDisclosure
              eyebrow="Context"
              title="Context si motivare"
              subtitle="Detaliile care explica de ce exista task-ul."
            >
              <div className="space-y-3">
                <p className="text-sm text-[var(--color-on-surface-muted)] [overflow-wrap:anywhere]">
                  {task.why}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
                  <span>Sursa: {task.source}</span>
                  <span>Incredere: {confidenceLabel(task.confidence)}</span>
                  <span className="[overflow-wrap:anywhere]">{task.lawReference}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">
                    {task.triggerLabel}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3 text-sm text-[var(--color-on-surface-muted)]">
                    {task.triggerSnippet ?? "Nu exista excerpt salvat pentru acest task."}
                  </p>
                </div>
                {task.legalSummary ? (
                  <p className="text-xs text-[var(--color-on-surface-muted)]">{task.legalSummary}</p>
                ) : null}
                {task.principles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {visiblePrinciples.map((principle) => (
                      <Badge
                        key={`${task.id}-${principle}`}
                        className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]"
                      >
                        {formatPrincipleLabel(principle)}
                      </Badge>
                    ))}
                    {hiddenPrinciples.length > 0 ? (
                      <Badge
                        title={hiddenPrinciplesLabel}
                        className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]"
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
                  className="h-9 rounded-xl border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
                >
                  <Copy className="size-4" strokeWidth={2.25} />
                  Copiaza
                </Button>
                <pre className="whitespace-pre-wrap break-words rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3 text-sm leading-6 text-[var(--color-on-surface)] [overflow-wrap:anywhere]">
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
                <p className="rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3 text-sm leading-6 text-[var(--color-on-surface-muted)] [overflow-wrap:anywhere]">
                  {task.evidenceSnippet}
                </p>
                {task.rescanHint ? (
                  <p className="text-xs leading-5 text-[var(--color-muted)]">{task.rescanHint}</p>
                ) : null}
                {(task.validationMessage || task.validatedAtLabel) ? (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                    <div className="flex items-start gap-3">
                      {task.validationStatus === "passed" ? (
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-[var(--status-success-text)]"
                          strokeWidth={2.25}
                        />
                      ) : (
                        <AlertTriangle
                          className="mt-0.5 size-4 shrink-0 text-[var(--color-warning)]"
                          strokeWidth={2.25}
                        />
                      )}
                      <div className="space-y-1">
                        <p className="text-sm text-[var(--color-on-surface)] [overflow-wrap:anywhere]">
                          {task.validationMessage || "Task-ul nu a fost validat inca."}
                        </p>
                        {task.validationBasis || task.validationConfidence ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {task.validationBasis ? (
                              <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]">
                                baza: {validationBasisLabel(task.validationBasis)}
                              </Badge>
                            ) : null}
                            {task.validationConfidence ? (
                              <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]">
                                {validationConfidenceLabel(task.validationConfidence)}
                              </Badge>
                            ) : null}
                          </div>
                        ) : null}
                        {task.validatedAtLabel ? (
                          <p className="text-xs text-[var(--color-muted)]">
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
    <details className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
      <summary className="cursor-pointer list-none">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
          {eyebrow}
        </p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-on-surface)]">{title}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-on-surface-muted)]">
              {subtitle}
            </p>
          </div>
          <span className="shrink-0 text-xs text-[var(--color-muted)]">Detalii</span>
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
