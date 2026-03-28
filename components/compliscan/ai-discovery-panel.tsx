"use client"

import { useMemo, useRef, useState } from "react"
import {
  Bot,
  CheckCheck,
  FileCode2,
  PencilLine,
  RotateCcw,
  SearchCode,
  ShieldAlert,
  ShieldCheck,
  ShieldMinus,
  Sparkles,
  X,
} from "lucide-react"

import type {
  AISystemPurpose,
  ComplianceDriftRecord,
  DetectedAISystemRecord,
} from "@/lib/compliance/types"
import { formatPurposeLabel } from "@/lib/compliance/ai-inventory"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"

const PURPOSE_OPTIONS: { value: AISystemPurpose; label: string }[] = [
  { value: "support-chatbot", label: "Chatbot / suport" },
  { value: "document-assistant", label: "Asistent documente" },
  { value: "marketing-personalization", label: "Personalizare marketing" },
  { value: "fraud-detection", label: "Fraud detection" },
  { value: "hr-screening", label: "HR screening" },
  { value: "credit-scoring", label: "Credit scoring" },
  { value: "biometric-identification", label: "Identificare biometrica" },
  { value: "other", label: "Alt scop" },
]

type EditDraft = {
  name: string
  purpose: AISystemPurpose
  vendor: string
  modelType: string
  confidence: DetectedAISystemRecord["confidence"]
  usesPersonalData: boolean
  makesAutomatedDecisions: boolean
  impactsRights: boolean
  hasHumanReview: boolean
  frameworks: string
  evidence: string
}

type EditableDetectedSystemUpdates = Partial<
  Pick<
    DetectedAISystemRecord,
    | "name"
    | "purpose"
    | "vendor"
    | "modelType"
    | "usesPersonalData"
    | "makesAutomatedDecisions"
    | "impactsRights"
    | "hasHumanReview"
    | "confidence"
    | "frameworks"
    | "evidence"
  >
>

function riskTone(
  level: DetectedAISystemRecord["riskLevel"]
): {
  badge: "destructive" | "warning" | "success"
  icon: typeof ShieldAlert | typeof ShieldMinus | typeof ShieldCheck
  label: string
} {
  if (level === "high") {
    return {
      badge: "destructive",
      icon: ShieldAlert,
      label: "High-risk",
    }
  }
  if (level === "limited") {
    return {
      badge: "warning",
      icon: ShieldMinus,
      label: "Limited-risk",
    }
  }
  return {
    badge: "success",
    icon: ShieldCheck,
    label: "Minimal-risk",
  }
}

function statusTone(
  status: DetectedAISystemRecord["detectionStatus"]
): "success" | "secondary" | "outline" | "warning" {
  if (status === "confirmed") return "success"
  if (status === "reviewed") return "secondary"
  if (status === "rejected") return "outline"
  return "warning"
}

function formatDetectionStatus(status: DetectedAISystemRecord["detectionStatus"]) {
  if (status === "reviewed") return "review facut"
  if (status === "confirmed") return "confirmat"
  if (status === "rejected") return "respins"
  return "detectat"
}

function detectionStatusHint(status: DetectedAISystemRecord["detectionStatus"]) {
  if (status === "reviewed") {
    return "Detectia a fost verificata, dar inca nu a intrat in inventarul oficial."
  }
  if (status === "confirmed") {
    return "Sistemul este deja mutat in inventarul oficial."
  }
  if (status === "rejected") {
    return "Detectia a fost scoasa din fluxul activ si ramane doar in istoric."
  }
  return "Sistemul a fost detectat automat si asteapta validare umana."
}

type AIDiscoveryPanelProps = {
  mode?: "manifest" | "yaml"
  systems: DetectedAISystemRecord[]
  drifts: ComplianceDriftRecord[]
  busy: boolean
  onDiscover: (input: { documentName: string; content: string }) => Promise<void>
  onUpdateStatus: (
    id: string,
    action: "review" | "confirm" | "reject" | "restore"
  ) => Promise<void>
  onEdit: (id: string, updates: EditableDetectedSystemUpdates) => Promise<void>
}

export function AIDiscoveryPanel({
  mode = "manifest",
  systems,
  drifts,
  busy,
  onDiscover,
  onUpdateStatus,
  onEdit,
}: AIDiscoveryPanelProps) {
  const modeContent = useMemo(
    () =>
      mode === "yaml"
        ? {
            title: "Control din compliscan.yaml",
            description:
              "Incarca `compliscan.yaml` ca sa validam configuratia declarata, sa generam findings si sa comparam drift-ul cu baseline-ul.",
            detectionTitle: "Ce validam acum",
            points: [
              "Provider, model si capability declarate in configuratie",
              "Risk class, rezidenta datelor si semnale GDPR",
              "Human oversight, alert_on_failure si drift fata de snapshot-ul validat",
            ],
            namePlaceholder: "Nume fisier (ex: compliscan.yaml)",
            contentPlaceholder: "Lipeste continutul fisierului compliscan.yaml sau alege fisierul local.",
            buttonLabel: "Valideaza configul",
            pickerLabel: "Alege YAML-ul",
            defaultName: "compliscan.yaml",
          }
        : {
            title: "Autodiscovery din manifest",
            description:
              "Incarca `package.json`, `requirements.txt`, `pyproject.toml` sau lockfiles ca sa propunem sisteme AI si sa generam drift operational.",
            detectionTitle: "Ce detectam acum",
            points: [
              "Provideri: OpenAI, Anthropic, Google, Cohere, Ollama",
              "Framework-uri: LangChain, LlamaIndex, Transformers, PyTorch, TensorFlow",
              "Semnale: date personale, scop, review uman, drift fata de snapshot-ul anterior",
            ],
            namePlaceholder: "Nume fisier (ex: package.json)",
            contentPlaceholder: "Lipeste continutul manifestului sau alege fisierul local.",
            buttonLabel: "Ruleaza autodiscovery",
            pickerLabel: "Alege manifest",
            defaultName: "package.json",
          },
    [mode]
  )

  const [documentName, setDocumentName] = useState(modeContent.defaultName)
  const [content, setContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)
  const [actionError, setActionError] = useState<{ systemId: string; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const activeSystems = systems.filter(
    (item) => item.detectionStatus !== "confirmed" && item.detectionStatus !== "rejected"
  )
  const confirmedCount = systems.filter((item) => item.detectionStatus === "confirmed").length
  const rejectedCount = systems.filter((item) => item.detectionStatus === "rejected").length
  const reviewedCount = systems.filter((item) => item.detectionStatus === "reviewed").length
  const pendingCount = systems.filter((item) => item.detectionStatus === "detected").length

  async function handleDiscover() {
    await onDiscover({ documentName, content })
  }

  async function handleUpdateStatus(systemId: string, action: Parameters<typeof onUpdateStatus>[1]) {
    setActionError(null)
    try {
      await onUpdateStatus(systemId, action)
    } catch {
      setActionError({
        systemId,
        message: "Nu am putut salva actiunea. Verifica conexiunea si incearca din nou.",
      })
    }
  }

  async function handlePickFile(file: File) {
    const text = await file.text()
    setDocumentName(file.name)
    setContent(text)
  }

  function startEditing(system: DetectedAISystemRecord) {
    setEditingId(system.id)
    setEditDraft({
      name: system.name,
      purpose: system.purpose,
      vendor: system.vendor,
      modelType: system.modelType,
      confidence: system.confidence,
      usesPersonalData: system.usesPersonalData,
      makesAutomatedDecisions: system.makesAutomatedDecisions,
      impactsRights: system.impactsRights,
      hasHumanReview: system.hasHumanReview,
      frameworks: system.frameworks.join(", "),
      evidence: system.evidence.join("\n"),
    })
  }

  function cancelEditing() {
    setEditingId(null)
    setEditDraft(null)
  }

  async function saveEditing(id: string) {
    if (!editDraft) return

    await onEdit(id, {
      name: editDraft.name,
      purpose: editDraft.purpose,
      vendor: editDraft.vendor,
      modelType: editDraft.modelType,
      confidence: editDraft.confidence,
      usesPersonalData: editDraft.usesPersonalData,
      makesAutomatedDecisions: editDraft.makesAutomatedDecisions,
      impactsRights: editDraft.impactsRights,
      hasHumanReview: editDraft.hasHumanReview,
      frameworks: splitCommaList(editDraft.frameworks),
      evidence: splitLineList(editDraft.evidence),
    })

    cancelEditing()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.78fr)_minmax(0,1.22fr)]">
      <Card className="border-eos-border bg-eos-surface">
        <CardHeader className="border-b border-eos-border pb-5">
          <CardTitle className="text-xl">{modeContent.title}</CardTitle>
          <p className="text-sm text-eos-text-muted">
            {modeContent.description}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                  Acum
                </p>
                <p className="mt-2 text-sm font-medium text-eos-text">
                  {modeContent.detectionTitle}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                  active {activeSystems.length}
                </Badge>
                <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                  drift {drifts.length}
                </Badge>
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-eos-text-muted">
              {modeContent.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SummaryTile label="Detectate" value={pendingCount} />
            <SummaryTile label="Revizuite" value={reviewedCount} />
            <SummaryTile label="Drift activ" value={drifts.length} />
          </div>

          {(confirmedCount > 0 || rejectedCount > 0) && (
            <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4 text-sm text-eos-text-muted">
              <p className="font-medium text-eos-text">Flux curat de review</p>
              <p className="mt-2">
                Confirmatele merg in inventar, respinsele raman in istoric. Aici vezi doar ce mai cere validare umana.
              </p>
              <p className="mt-2 text-xs text-eos-text-muted">Confirmate: {confirmedCount} · Respinse: {rejectedCount}</p>
            </div>
          )}

          <input
            value={documentName}
            onChange={(event) => setDocumentName(event.target.value)}
            placeholder={modeContent.namePlaceholder}
            className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={10}
            placeholder={modeContent.contentPlaceholder}
            className="ring-focus rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
          />

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="default"
              className="gap-2 border-eos-border bg-eos-surface-variant text-eos-text hover:bg-eos-secondary-hover"
            >
              <FileCode2 className="size-4" strokeWidth={2} />
              {modeContent.pickerLabel}
            </Button>
            <Button
              onClick={() => void handleDiscover()}
              disabled={!documentName.trim() || !content.trim() || busy}
              size="lg"
              className="gap-2 bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
            >
              <SearchCode className="size-5" strokeWidth={2} />
              {modeContent.buttonLabel}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".json,.txt,.toml,.yaml,.yml,.lock"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              await handlePickFile(file)
              event.target.value = ""
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-eos-border bg-eos-surface">
        <CardHeader className="border-b border-eos-border pb-5">
          <CardTitle className="text-xl">Sisteme detectate automat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4 text-sm text-eos-text-muted">
            Aici rămâne doar lista de lucru activă: detecții care mai cer review sau confirmare.
          </div>
          {systems.length === 0 && (
            <EmptyState
              title={mode === "yaml" ? "Fără rezultate din YAML" : "Fără detecții automate"}
              label={
                mode === "yaml"
                  ? "Încă nu avem rezultate din compliscan.yaml. Încarcă fișierul, validează-l și apoi revino pentru review și confirmare."
                  : "Încă nu avem detecții automate. Rulează autodiscovery pe un manifest și apoi confirmă doar sistemele utile în inventar."
              }
              className="rounded-eos-md border-eos-border bg-eos-surface-variant px-5 py-6"
            />
          )}

          {activeSystems.map((system) => {
            const tone = riskTone(system.riskLevel)
            const Icon = tone.icon
            const relatedDrifts = drifts.filter((item) => item.systemLabel === system.name)
            const isEditing = editingId === system.id && editDraft

            return (
              <div
                key={system.id}
                className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={tone.badge}>
                        <Icon className="size-3.5" strokeWidth={2} />
                        {tone.label}
                      </Badge>
                      <Badge variant={statusTone(system.detectionStatus)}>
                        {formatDetectionStatus(system.detectionStatus)}
                      </Badge>
                      <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                        confidence: {system.confidence}
                      </Badge>
                      <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                        {formatPurposeLabel(system.purpose)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-eos-text">{system.name}</p>
                      <p className="mt-1 text-sm text-eos-text-muted">
                        {system.vendor} · {system.modelType}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {system.frameworks.map((framework) => (
                        <Badge
                          key={`${system.id}-${framework}`}
                          variant="secondary"
                          className="normal-case tracking-normal text-eos-text-muted"
                        >
                          {framework}
                        </Badge>
                      ))}
                    </div>
                    {relatedDrifts.length > 0 && (
                      <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-eos-text-muted">
                          <Badge variant="warning">
                            {relatedDrifts.length} drift activ
                          </Badge>
                          <span>Detalii in Control / Drift.</span>
                          <a
                            className="text-eos-info underline decoration-eos-border underline-offset-4"
                            href="/dashboard/alerte"
                          >
                            Deschide Drift
                          </a>
                        </div>
                      </div>
                    )}
                    <details className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3">
                      <summary className="cursor-pointer text-sm font-medium text-eos-text">
                        Detalii detectie si evidenta
                      </summary>
                      <div className="mt-3 space-y-3 text-sm text-eos-text-muted">
                        <p>{detectionStatusHint(system.detectionStatus)}</p>
                        <p className="text-xs text-eos-text-muted">
                          Sursa: {system.sourceDocument || "manifest necunoscut"}
                        </p>
                        <div>
                          <p className="font-medium text-eos-text">Evidenta detectiei</p>
                          <ul className="mt-3 space-y-2">
                            {system.evidence.slice(0, 5).map((item, index) => (
                              <li key={`${system.id}-evidence-${index}`} className="flex gap-2">
                                <Sparkles className="mt-0.5 size-4 shrink-0 text-eos-primary" strokeWidth={2} />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </details>
                    {isEditing && (
                      <div className="grid gap-3 rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                        <p className="text-sm font-medium text-eos-text">
                          Ajusteaza detectia inainte de confirmare
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            value={editDraft.name}
                            onChange={(event) =>
                              setEditDraft((current) =>
                                current ? { ...current, name: event.target.value } : current
                              )
                            }
                            className="ring-focus h-9 rounded-eos-md border border-eos-border bg-eos-surface px-3 text-sm text-eos-text outline-none"
                            placeholder="Nume sistem"
                          />
                          <input
                            value={editDraft.vendor}
                            onChange={(event) =>
                              setEditDraft((current) =>
                                current ? { ...current, vendor: event.target.value } : current
                              )
                            }
                            className="ring-focus h-9 rounded-eos-md border border-eos-border bg-eos-surface px-3 text-sm text-eos-text outline-none"
                            placeholder="Provider"
                          />
                          <select
                            value={editDraft.purpose}
                            onChange={(event) =>
                              setEditDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      purpose: event.target.value as AISystemPurpose,
                                    }
                                  : current
                              )
                            }
                            className="ring-focus h-9 rounded-eos-md border border-eos-border bg-eos-surface px-3 text-sm text-eos-text outline-none"
                          >
                            {PURPOSE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <input
                            value={editDraft.modelType}
                            onChange={(event) =>
                              setEditDraft((current) =>
                                current ? { ...current, modelType: event.target.value } : current
                              )
                            }
                            className="ring-focus h-9 rounded-eos-md border border-eos-border bg-eos-surface px-3 text-sm text-eos-text outline-none"
                            placeholder="Model / stack"
                          />
                          <select
                            value={editDraft.confidence}
                            onChange={(event) =>
                              setEditDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      confidence: event.target.value as DetectedAISystemRecord["confidence"],
                                    }
                                  : current
                              )
                            }
                            className="ring-focus h-9 rounded-eos-md border border-eos-border bg-eos-surface px-3 text-sm text-eos-text outline-none"
                          >
                            <option value="low">Confidence low</option>
                            <option value="medium">Confidence medium</option>
                            <option value="high">Confidence high</option>
                          </select>
                          <input
                            value={editDraft.frameworks}
                            onChange={(event) =>
                              setEditDraft((current) =>
                                current ? { ...current, frameworks: event.target.value } : current
                              )
                            }
                            className="ring-focus h-9 rounded-eos-md border border-eos-border bg-eos-surface px-3 text-sm text-eos-text outline-none"
                            placeholder="Framework-uri separate prin virgula"
                          />
                        </div>
                        <textarea
                          value={editDraft.evidence}
                          onChange={(event) =>
                            setEditDraft((current) =>
                              current ? { ...current, evidence: event.target.value } : current
                            )
                          }
                          rows={4}
                          className="ring-focus rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3 text-sm text-eos-text outline-none"
                          placeholder="O evidenta pe linie"
                        />
                        <div className="grid gap-2 md:grid-cols-4">
                          <ToggleField
                            label="Date personale"
                            checked={editDraft.usesPersonalData}
                            onChange={(checked) =>
                              setEditDraft((current) =>
                                current ? { ...current, usesPersonalData: checked } : current
                              )
                            }
                          />
                          <ToggleField
                            label="Decizie automata"
                            checked={editDraft.makesAutomatedDecisions}
                            onChange={(checked) =>
                              setEditDraft((current) =>
                                current
                                  ? { ...current, makesAutomatedDecisions: checked }
                                  : current
                              )
                            }
                          />
                          <ToggleField
                            label="Impact drepturi"
                            checked={editDraft.impactsRights}
                            onChange={(checked) =>
                              setEditDraft((current) =>
                                current ? { ...current, impactsRights: checked } : current
                              )
                            }
                          />
                          <ToggleField
                            label="Review uman"
                            checked={editDraft.hasHumanReview}
                            onChange={(checked) =>
                              setEditDraft((current) =>
                                current ? { ...current, hasHumanReview: checked } : current
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={() => void saveEditing(system.id)}
                            disabled={busy}
                            size="default"
                            className="bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
                          >
                            Salveaza ajustarea
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            disabled={busy}
                            variant="outline"
                            size="default"
                            className="border-eos-border bg-eos-surface text-eos-text hover:bg-eos-secondary-hover"
                          >
                            Renunta
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-2">
                    {system.detectionStatus !== "confirmed" && (
                      <Button
                        onClick={() => startEditing(system)}
                        variant="secondary"
                        disabled={busy}
                        size="default"
                        className="gap-2"
                      >
                        <PencilLine className="size-4" strokeWidth={2} />
                        Editeaza detectia
                      </Button>
                    )}
                    {actionError?.systemId === system.id && (
                      <div className="rounded-eos-md border border-eos-warning-border bg-eos-warning-soft px-3 py-2 text-xs text-eos-warning">
                        <p className="font-medium">Actiunea nu a fost salvata</p>
                        <p className="mt-1">{actionError.message}</p>
                        <button
                          type="button"
                          onClick={() => void handleUpdateStatus(system.id, "confirm")}
                          className="mt-2 underline underline-offset-2 hover:no-underline"
                        >
                          Incearca din nou
                        </button>
                      </div>
                    )}
                    {(system.detectionStatus === "detected" || system.detectionStatus === "reviewed") && (
                      <Button
                        onClick={() => void handleUpdateStatus(system.id, "confirm")}
                        disabled={busy}
                        size="default"
                        className="gap-2 bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
                      >
                        <CheckCheck className="size-4" strokeWidth={2} />
                        Confirma in inventar
                      </Button>
                    )}
                    {system.detectionStatus === "detected" && (
                      <Button
                        onClick={() => void handleUpdateStatus(system.id, "review")}
                        variant="outline"
                        disabled={busy}
                        size="default"
                        className="gap-2 border-eos-border bg-eos-surface text-eos-text hover:bg-eos-secondary-hover"
                      >
                        <Bot className="size-4" strokeWidth={2} />
                        Marcheaza review
                      </Button>
                    )}
                    {system.detectionStatus !== "rejected" && system.detectionStatus !== "confirmed" && (
                      <Button
                        onClick={() => void handleUpdateStatus(system.id, "reject")}
                        variant="outline"
                        disabled={busy}
                        size="default"
                        className="gap-2 border-eos-border bg-eos-surface text-eos-error hover:bg-eos-error-soft"
                      >
                        <X className="size-4" strokeWidth={2} />
                        Respinge detectia
                      </Button>
                    )}
                    {system.detectionStatus === "rejected" && (
                      <Button
                        onClick={() => void onUpdateStatus(system.id, "restore")}
                        variant="outline"
                        disabled={busy}
                        size="default"
                        className="gap-2 border-eos-border bg-eos-surface text-eos-text hover:bg-eos-secondary-hover"
                      >
                        <RotateCcw className="size-4" strokeWidth={2} />
                        Repune in lucru
                      </Button>
                    )}
                    {system.detectionStatus === "confirmed" && (
                      <div className="rounded-eos-md border border-eos-border bg-eos-success-soft p-3 text-sm text-eos-success">
                        Detectia a fost confirmata si mutata in inventarul oficial.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {systems.length > 0 && activeSystems.length === 0 && (
            <EmptyState
              title="Nicio detectie activa"
              label="Ce a fost confirmat este deja in inventarul oficial, iar ce a fost respins a ramas doar in istoric. Daca vrei un nou ciclu de review, ruleaza o scanare noua pentru sursa curenta."
              className="rounded-eos-md border-eos-border-subtle bg-eos-success-soft px-3 py-6"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
      <p className="text-sm text-eos-text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-eos-text">{value}</p>
    </div>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3 text-sm text-eos-text-muted">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-eos-primary"
      />
    </label>
  )
}

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitLineList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}
