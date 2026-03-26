"use client"

import { useState } from "react"
import {
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldMinus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { classifyAISystem, formatPurposeLabel } from "@/lib/compliance/ai-inventory"
import type { AISystemDraft } from "@/lib/compliance/ai-inventory"
import { classifyAISystem as classifyForExplain } from "@/lib/compliance/ai-act-classifier"
import type { AISystemPurpose, AISystemRecord } from "@/lib/compliance/types"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { AIActTimelineCard } from "@/components/compliscan/ai-act-timeline-card"

type AIInventoryPanelProps = {
  systems: AISystemRecord[]
  busy: boolean
  onSubmit: (input: AISystemDraft) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

type InventoryFlowStep = 1 | 2 | 3 | 4

const PURPOSE_OPTIONS: Array<{
  value: AISystemPurpose
  label: string
  hint: string
  defaultRisk: string
}> = [
  {
    value: "hr-screening",
    label: "HR / Screening CV",
    hint: "Selectie candidati, evaluare automata, ATS cu scoring",
    defaultRisk: "high",
  },
  {
    value: "credit-scoring",
    label: "Credit scoring / Eligibilitate",
    hint: "Evaluare financiara, scoring de risc, acces la servicii",
    defaultRisk: "high",
  },
  {
    value: "biometric-identification",
    label: "Identificare biometrica",
    hint: "Recunoastere faciala, amprente, identificare in timp real",
    defaultRisk: "high",
  },
  {
    value: "fraud-detection",
    label: "Fraud detection",
    hint: "Detectie anomalii, scoring tranzactii, alerte automate",
    defaultRisk: "limited",
  },
  {
    value: "marketing-personalization",
    label: "Personalizare marketing",
    hint: "Recomandari de produse, segmentare audienta, targeting",
    defaultRisk: "limited",
  },
  {
    value: "support-chatbot",
    label: "Chatbot / Suport",
    hint: "Asistenta clienti, raspunsuri automate, FAQ bot",
    defaultRisk: "minimal",
  },
  {
    value: "document-assistant",
    label: "Asistent documente",
    hint: "Rezumare, extragere date, clasificare documente",
    defaultRisk: "minimal",
  },
  {
    value: "other",
    label: "Alt scop",
    hint: "Alt flux AI nelistat mai sus",
    defaultRisk: "minimal",
  },
]

function riskTone(level: AISystemRecord["riskLevel"]) {
  if (level === "high") {
    return {
      badge: "border-eos-error-border bg-eos-error-soft text-eos-error",
      icon: ShieldAlert,
      label: "High-risk",
    }
  }
  if (level === "limited") {
    return {
      badge:
        "border-eos-warning-border bg-eos-warning-soft text-eos-warning",
      icon: ShieldMinus,
      label: "Limited-risk",
    }
  }
  return {
    badge:
      "border-eos-border bg-eos-success-soft text-eos-success",
    icon: ShieldCheck,
    label: "Minimal-risk",
  }
}

const STEP_LABELS: Record<InventoryFlowStep, string> = {
  1: "Informatii de baza",
  2: "Scop principal",
  3: "Factori de risc",
  4: "Clasificare",
}

export function AIInventoryPanel({ systems, busy, onSubmit, onRemove }: AIInventoryPanelProps) {
  const [step, setStep] = useState<InventoryFlowStep>(1)
  const [name, setName] = useState("")
  const [vendor, setVendor] = useState("")
  const [modelType, setModelType] = useState("")
  const [purpose, setPurpose] = useState<AISystemPurpose>("support-chatbot")
  const [usesPersonalData, setUsesPersonalData] = useState(true)
  const [makesAutomatedDecisions, setMakesAutomatedDecisions] = useState(false)
  const [impactsRights, setImpactsRights] = useState(false)
  const [hasHumanReview, setHasHumanReview] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const draft: AISystemDraft = {
    name,
    purpose,
    vendor,
    modelType,
    usesPersonalData,
    makesAutomatedDecisions,
    impactsRights,
    hasHumanReview,
  }

  const previewClassification = classifyAISystem(draft)

  const highRiskCount = systems.filter((s) => s.riskLevel === "high").length
  const limitedCount = systems.filter((s) => s.riskLevel === "limited").length
  const minimalCount = systems.filter((s) => s.riskLevel === "minimal").length

  const canGoNext =
    step === 1 ? Boolean(name.trim() && vendor.trim() && modelType.trim()) : true

  function resetWizard() {
    setStep(1)
    setName("")
    setVendor("")
    setModelType("")
    setPurpose("support-chatbot")
    setUsesPersonalData(true)
    setMakesAutomatedDecisions(false)
    setImpactsRights(false)
    setHasHumanReview(true)
  }

  async function handleSubmit() {
    await onSubmit(draft)
    resetWizard()
  }

  async function handleRemove(id: string) {
    setRemovingId(id)
    try {
      await onRemove(id)
    } finally {
      setRemovingId(null)
    }
  }

  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function handleDownloadAnnexIV(system: AISystemRecord) {
    setDownloadingId(system.id)
    try {
      const res = await fetch("/api/ai-act/annex-iv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemId: system.id }),
      })
      if (!res.ok) throw new Error("Eroare server")
      const { content, title } = await res.json() as { content: string; title: string }
      const blob = new Blob([content], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `annex-iv-${system.name.toLowerCase().replace(/\s+/g, "-")}.md`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Anexa IV descărcată: ${title}`)
    } catch {
      toast.error("Eroare la generarea Anexei IV")
    } finally {
      setDownloadingId(null)
    }
  }

  const previewTone = riskTone(previewClassification.riskLevel)
  const PreviewIcon = previewTone.icon

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.82fr)_minmax(0,1.18fr)]">
      {/* INVENTORY FLOW */}
      <Card className="border-eos-border bg-eos-surface">
        <CardHeader className="border-b border-eos-border pb-5">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-xl">Flux inventar AI</CardTitle>
            <span className="text-xs text-eos-text-muted">
              {step} / 4 — {STEP_LABELS[step]}
            </span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {([1, 2, 3, 4] as InventoryFlowStep[]).map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-eos-primary" : "bg-eos-surface-variant"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-eos-text-muted">
                Identifica sistemul pe care il confirmi acum in inventar.
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nume sistem AI (ex: ChatBot Clienti, ScoreRisc v2)"
                className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Furnizor (ex: OpenAI, intern)"
                  className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                />
                <input
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  placeholder="Tip model (ex: LLM, reguli, ML)"
                  className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-eos-text-muted">
                Alege scopul dominant ca sa fixam clasa de risc.
              </p>
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {PURPOSE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-eos-md border p-4 transition ${
                      purpose === opt.value
                        ? "border-eos-border-subtle bg-eos-surface-active"
                        : "border-eos-border bg-eos-surface-variant hover:bg-eos-secondary-hover"
                    }`}
                  >
                    <input
                      type="radio"
                      name="purpose"
                      value={opt.value}
                      checked={purpose === opt.value}
                      onChange={() => setPurpose(opt.value)}
                      className="mt-0.5 accent-eos-primary"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-eos-text">
                          {opt.label}
                        </span>
                        {opt.defaultRisk === "high" && (
                          <span className="rounded-full border border-eos-error-border bg-eos-error-soft px-2 py-0.5 text-xs text-eos-error">
                            Potential high-risk
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-eos-text-muted">{opt.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-eos-text-muted">
                Marcheaza doar semnalele care schimba riscul sau obligatiile de control.
              </p>
              {[
                {
                  checked: usesPersonalData,
                  onChecked: setUsesPersonalData,
                  label: "Foloseste date personale",
                  hint: "Proceseaza date care identifica sau pot identifica o persoana fizica",
                },
                {
                  checked: makesAutomatedDecisions,
                  onChecked: setMakesAutomatedDecisions,
                  label: "Produce decizii automate sau scoring",
                  hint: "Sistemul genereaza un rezultat direct actionabil fara revizie umana obligatorie",
                },
                {
                  checked: impactsRights,
                  onChecked: setImpactsRights,
                  label: "Poate afecta drepturi sau eligibilitate",
                  hint: "Rezultatul poate influenta acces la job, credit, servicii sau drepturi civile",
                },
                {
                  checked: hasHumanReview,
                  onChecked: setHasHumanReview,
                  label: "Exista verificare umana inainte de decizia finala",
                  hint: "Un operator uman revizuieste si poate corecta output-ul sistemului",
                },
              ].map((item) => (
                <label
                  key={item.label}
                  className={`flex cursor-pointer items-start justify-between gap-4 rounded-eos-md border p-4 transition ${
                    item.checked
                      ? "border-eos-border-subtle bg-eos-surface-active"
                      : "border-eos-border bg-eos-surface-variant hover:bg-eos-secondary-hover"
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-eos-text">
                      {item.label}
                    </span>
                    <p className="mt-1 text-xs text-eos-text-muted">{item.hint}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.onChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-eos-primary"
                  />
                </label>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-eos-text-muted">
                Rezultatul pe care il vei confirma in inventar.
              </p>
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={previewTone.badge}>
                    <PreviewIcon className="size-3.5" strokeWidth={2} />
                    {previewTone.label}
                  </Badge>
                  <Badge className="border-eos-border bg-transparent text-eos-text-muted">
                    {formatPurposeLabel(purpose)}
                  </Badge>
                </div>
                <p className="mt-3 text-lg font-semibold text-eos-text">{name}</p>
                <p className="text-sm text-eos-text-muted">
                  {vendor} · {modelType}
                </p>
                {previewClassification.annexIIIHint && (
                  <p className="mt-2 text-sm text-eos-warning">
                    {previewClassification.annexIIIHint}
                  </p>
                )}
              </div>

              <details className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                  Urmatorii pasi recomandati
                </summary>
                <ul className="mt-3 space-y-2 text-sm text-eos-text-muted">
                  {previewClassification.recommendedActions.map((action, i) => (
                    <li key={i} className="flex gap-2">
                      <Bot
                        className="mt-0.5 size-4 shrink-0 text-eos-primary"
                        strokeWidth={2}
                      />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {step > 1 && (
              <Button
                onClick={() => setStep((s) => (s - 1) as InventoryFlowStep)}
                variant="outline"
                size="lg"
                className="flex-1 gap-2 border-eos-border bg-eos-surface-variant text-eos-text hover:bg-eos-secondary-hover"
              >
                <ChevronLeft className="size-5" strokeWidth={2} />
                Inapoi
              </Button>
            )}

            {step < 4 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as InventoryFlowStep)}
                disabled={!canGoNext}
                size="lg"
                className="flex-1 gap-2 bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
              >
                Continua
                <ChevronRight className="size-5" strokeWidth={2} />
              </Button>
            ) : (
              <Button
                onClick={() => void handleSubmit()}
                disabled={busy}
                size="lg"
                className="flex-1 gap-2 bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
              >
                <BrainCircuit className="size-5" strokeWidth={2} />
                Adauga in inventar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* INVENTORY LIST */}
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="High-risk" value={highRiskCount} tone="error" />
          <SummaryCard title="Limited-risk" value={limitedCount} tone="warning" />
          <SummaryCard title="Minimal-risk" value={minimalCount} tone="success" />
        </div>

        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="border-b border-eos-border pb-5">
            <CardTitle className="text-xl">Sisteme AI inventariate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {systems.length === 0 && (
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5 text-sm text-eos-text-muted">
                Inca nu exista sisteme AI inventariate. Fluxul de mai sus este primul pas real
                catre clasificare AI Act.
              </div>
            )}

            {systems.map((system) => {
              const tone = riskTone(system.riskLevel)
              const Icon = tone.icon
              const explanation = classifyForExplain(system.purpose)

              return (
                <div
                  key={system.id}
                  className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={tone.badge}>
                          <Icon className="size-3.5" strokeWidth={2} />
                          {tone.label}
                        </Badge>
                        <Badge className="border-eos-border bg-transparent text-eos-text-muted">
                          {formatPurposeLabel(system.purpose)}
                        </Badge>
                        {explanation.article !== "—" && (
                          <span className="rounded border border-eos-border bg-eos-bg-inset px-1.5 py-0.5 font-mono text-[10px] text-eos-text-muted">
                            {explanation.article}
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-eos-text">
                        {system.name}
                      </p>
                      <p className="text-sm text-eos-text-muted">
                        {system.vendor} · {system.modelType}
                      </p>
                      {/* Sprint 10: Classification explainability */}
                      <p className="text-xs text-eos-text-muted leading-relaxed">
                        {explanation.reason}
                      </p>
                      {system.annexIIIHint && (
                        <p className="text-sm text-eos-warning">{system.annexIIIHint}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Badge className="border-eos-border bg-transparent text-eos-text-muted">
                          {system.usesPersonalData ? "Date personale" : "Fara date personale"}
                        </Badge>
                        <Badge className="border-eos-border bg-transparent text-eos-text-muted">
                          {system.makesAutomatedDecisions ? "Decizie automata" : "Asistenta"}
                        </Badge>
                        <Badge className="border-eos-border bg-transparent text-eos-text-muted">
                          {system.hasHumanReview ? "Cu review uman" : "Fara review uman"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {system.riskLevel === "high" && (
                          <Button
                            onClick={() => void handleDownloadAnnexIV(system)}
                            disabled={downloadingId === system.id || busy}
                            variant="outline"
                            size="sm"
                            className="gap-2 border-eos-border bg-eos-surface text-eos-text"
                          >
                            {downloadingId === system.id ? (
                              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                            ) : (
                              <Download className="size-3.5" strokeWidth={2} />
                            )}
                            Anexa IV
                          </Button>
                        )}
                        <Button
                          onClick={() => void handleRemove(system.id)}
                          disabled={removingId === system.id || busy}
                          variant="outline"
                          size="sm"
                          className="gap-2 border-eos-border bg-eos-surface text-eos-error hover:bg-eos-error-soft"
                        >
                          <Trash2 className="size-3.5" strokeWidth={2} />
                          Sterge
                        </Button>
                      </div>
                    </div>
                  </div>

                  <details className="mt-4 rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                      Urmatorii pasi
                    </summary>
                    <ul className="mt-3 space-y-2 text-sm text-eos-text-muted">
                      {system.recommendedActions.map((item, index) => (
                        <li key={`${system.id}-${index}`} className="flex gap-2">
                          <Bot
                            className="mt-0.5 size-4 shrink-0 text-eos-primary"
                            strokeWidth={2}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </details>

                  <div className="mt-3">
                    <AIActTimelineCard system={system} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string
  value: number
  tone: "error" | "warning" | "success"
}) {
  const color =
    tone === "error"
      ? "text-eos-error"
      : tone === "warning"
        ? "text-eos-warning"
        : "text-eos-success"

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardContent className="p-5">
        <p className="text-sm text-eos-text-muted">{title}</p>
        <p className={`mt-3 text-3xl font-semibold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
