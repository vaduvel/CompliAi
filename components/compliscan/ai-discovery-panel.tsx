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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

function riskTone(level: DetectedAISystemRecord["riskLevel"]) {
  if (level === "high") {
    return {
      badge: "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]",
      icon: ShieldAlert,
      label: "High-risk",
    }
  }
  if (level === "limited") {
    return {
      badge:
        "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
      icon: ShieldMinus,
      label: "Limited-risk",
    }
  }
  return {
    badge:
      "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]",
    icon: ShieldCheck,
    label: "Minimal-risk",
  }
}

function statusTone(status: DetectedAISystemRecord["detectionStatus"]) {
  if (status === "confirmed") {
    return "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
  }
  if (status === "reviewed") {
    return "border-[var(--color-info)] bg-[var(--color-info-muted)] text-[var(--color-info)]"
  }
  if (status === "rejected") {
    return "border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-muted)]"
  }
  return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
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
      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader className="border-b border-[var(--color-border)] pb-5">
          <CardTitle className="text-xl">{modeContent.title}</CardTitle>
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            {modeContent.description}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4 text-sm text-[var(--color-on-surface-muted)]">
            <p className="font-medium text-[var(--color-on-surface)]">{modeContent.detectionTitle}</p>
            <ul className="mt-3 space-y-2">
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
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4 text-sm text-[var(--color-on-surface-muted)]">
              <p className="font-medium text-[var(--color-on-surface)]">Ce nu mai apare aici</p>
              <p className="mt-2">
                Detectiile confirmate sunt mutate in inventarul oficial, iar cele respinse raman in istoric,
                dar nu mai aglomereaza lista de lucru.
              </p>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Confirmate: {confirmedCount} · Respinse: {rejectedCount}
              </p>
            </div>
          )}

          <input
            value={documentName}
            onChange={(event) => setDocumentName(event.target.value)}
            placeholder={modeContent.namePlaceholder}
            className="ring-focus h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={10}
            placeholder={modeContent.contentPlaceholder}
            className="ring-focus rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 py-3 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
          />

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="h-11 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
            >
              <FileCode2 className="size-4" strokeWidth={2.25} />
              {modeContent.pickerLabel}
            </Button>
            <Button
              onClick={() => void handleDiscover()}
              disabled={!documentName.trim() || !content.trim() || busy}
              className="h-11 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
            >
              <SearchCode className="size-4" strokeWidth={2.25} />
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

      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader className="border-b border-[var(--color-border)] pb-5">
          <CardTitle className="text-xl">Sisteme detectate automat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4 text-sm text-[var(--color-on-surface-muted)]">
            Aici ramane doar fluxul activ de lucru: detectii care mai cer review sau confirmare.
            Ce este deja confirmat traieste separat in inventarul oficial, iar drift-ul ramane centralizat in panoul dedicat.
          </div>
          {systems.length === 0 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 text-sm text-[var(--color-on-surface-muted)]">
              {mode === "yaml"
                ? "Încă nu avem rezultate din compliscan.yaml. Încarcă fișierul, validează-l și apoi revino aici pentru review și confirmare."
                : "Încă nu avem detectii automate. Ruleaza autodiscovery pe un manifest si apoi confirma doar sistemele utile in inventar."}
            </div>
          )}

          {activeSystems.map((system) => {
            const tone = riskTone(system.riskLevel)
            const Icon = tone.icon
            const relatedDrifts = drifts.filter((item) => item.systemLabel === system.name)
            const isEditing = editingId === system.id && editDraft

            return (
              <div
                key={system.id}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={tone.badge}>
                        <Icon className="size-3.5" strokeWidth={2.25} />
                        {tone.label}
                      </Badge>
                      <Badge className={statusTone(system.detectionStatus)}>
                        {formatDetectionStatus(system.detectionStatus)}
                      </Badge>
                      <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
                        confidence: {system.confidence}
                      </Badge>
                      <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
                        {formatPurposeLabel(system.purpose)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-[var(--color-on-surface)]">{system.name}</p>
                      <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                        {system.vendor} · {system.modelType}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        Sursa: {system.sourceDocument || "manifest necunoscut"}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-on-surface-muted)]">
                        {detectionStatusHint(system.detectionStatus)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {system.frameworks.map((framework) => (
                        <Badge
                          key={`${system.id}-${framework}`}
                          className="border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface-muted)]"
                        >
                          {framework}
                        </Badge>
                      ))}
                    </div>
                    {relatedDrifts.length > 0 && (
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                          <Badge className="border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]">
                            {relatedDrifts.length} drift activ
                          </Badge>
                          <span>Detalii in Control / Drift.</span>
                          <a
                            className="text-[var(--color-info)] underline decoration-[color:var(--color-border)] underline-offset-4"
                            href="/dashboard/alerte"
                          >
                            Deschide panoul
                          </a>
                        </div>
                      </div>
                    )}
                    {isEditing && (
                      <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                        <p className="text-sm font-medium text-[var(--color-on-surface)]">
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
                            className="ring-focus h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-on-surface)] outline-none"
                            placeholder="Nume sistem"
                          />
                          <input
                            value={editDraft.vendor}
                            onChange={(event) =>
                              setEditDraft((current) =>
                                current ? { ...current, vendor: event.target.value } : current
                              )
                            }
                            className="ring-focus h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-on-surface)] outline-none"
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
                            className="ring-focus h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-on-surface)] outline-none"
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
                            className="ring-focus h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-on-surface)] outline-none"
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
                            className="ring-focus h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-on-surface)] outline-none"
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
                            className="ring-focus h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-on-surface)] outline-none"
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
                          className="ring-focus rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-on-surface)] outline-none"
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
                            className="h-10 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                          >
                            Salveaza ajustarea
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            disabled={busy}
                            variant="outline"
                            className="h-10 rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
                          >
                            Renunta
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4 text-sm text-[var(--color-on-surface-muted)]">
                      <p className="font-medium text-[var(--color-on-surface)]">Evidenta detectiei</p>
                      <ul className="mt-3 space-y-2">
                        {system.evidence.slice(0, 5).map((item, index) => (
                          <li key={`${system.id}-evidence-${index}`} className="flex gap-2">
                            <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" strokeWidth={2.25} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-2">
                    {system.detectionStatus !== "confirmed" && (
                      <Button
                        onClick={() => startEditing(system)}
                        variant="secondary"
                        disabled={busy}
                        className="h-10 rounded-xl"
                      >
                        <PencilLine className="size-4" strokeWidth={2.25} />
                        Editeaza detectia
                      </Button>
                    )}
                    {(system.detectionStatus === "detected" || system.detectionStatus === "reviewed") && (
                      <Button
                        onClick={() => void onUpdateStatus(system.id, "confirm")}
                        disabled={busy}
                        className="h-10 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                      >
                        <CheckCheck className="size-4" strokeWidth={2.25} />
                        Confirma in inventar
                      </Button>
                    )}
                    {system.detectionStatus === "detected" && (
                      <Button
                        onClick={() => void onUpdateStatus(system.id, "review")}
                        variant="outline"
                        disabled={busy}
                        className="h-10 rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
                      >
                        <Bot className="size-4" strokeWidth={2.25} />
                        Marcheaza review
                      </Button>
                    )}
                    {system.detectionStatus !== "rejected" && system.detectionStatus !== "confirmed" && (
                      <Button
                        onClick={() => void onUpdateStatus(system.id, "reject")}
                        variant="outline"
                        disabled={busy}
                        className="h-10 rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-error)] hover:bg-[var(--color-error-muted)]"
                      >
                        <X className="size-4" strokeWidth={2.25} />
                        Respinge detectia
                      </Button>
                    )}
                    {system.detectionStatus === "rejected" && (
                      <Button
                        onClick={() => void onUpdateStatus(system.id, "restore")}
                        variant="outline"
                        disabled={busy}
                        className="h-10 rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
                      >
                        <RotateCcw className="size-4" strokeWidth={2.25} />
                        Repune in lucru
                      </Button>
                    )}
                    {system.detectionStatus === "confirmed" && (
                      <div className="rounded-2xl border border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] p-3 text-sm text-[var(--status-success-text)]">
                        Detectia a fost confirmata si mutata in inventarul oficial.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {systems.length > 0 && activeSystems.length === 0 && (
            <div className="rounded-2xl border border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] p-4 text-sm text-[var(--status-success-text)]">
              Nu mai exista detectii active. Ce a fost confirmat este deja in inventarul oficial, iar ce a fost respins a ramas doar in istoric. Daca vrei un nou ciclu de review, ruleaza o scanare noua pentru sursa curenta.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--color-on-surface)]">{value}</p>
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
    <label className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-on-surface-muted)]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[var(--color-primary)]"
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
