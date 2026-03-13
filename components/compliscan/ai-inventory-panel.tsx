"use client"

import { useState } from "react"
import {
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  ShieldMinus,
  Trash2,
} from "lucide-react"

import { classifyAISystem, formatPurposeLabel } from "@/lib/compliance/ai-inventory"
import type { AISystemDraft } from "@/lib/compliance/ai-inventory"
import type { AISystemPurpose, AISystemRecord } from "@/lib/compliance/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  const previewTone = riskTone(previewClassification.riskLevel)
  const PreviewIcon = previewTone.icon

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.82fr)_minmax(0,1.18fr)]">
      {/* INVENTORY FLOW */}
      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader className="border-b border-[var(--color-border)] pb-5">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-xl">Flux inventar AI</CardTitle>
            <span className="text-xs text-[var(--color-muted)]">
              {step} / 4 — {STEP_LABELS[step]}
            </span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {([1, 2, 3, 4] as InventoryFlowStep[]).map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-variant)]"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Identifica sistemul pe care vrei sa-l clasifici.
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nume sistem AI (ex: ChatBot Clienti, ScoreRisc v2)"
                className="ring-focus h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Furnizor (ex: OpenAI, intern)"
                  className="ring-focus h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
                />
                <input
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  placeholder="Tip model (ex: LLM, reguli, ML)"
                  className="ring-focus h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Care este scopul principal al sistemului?
              </p>
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {PURPOSE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      purpose === opt.value
                        ? "border-[var(--border-subtle)] bg-[var(--bg-active)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-variant)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="purpose"
                      value={opt.value}
                      checked={purpose === opt.value}
                      onChange={() => setPurpose(opt.value)}
                      className="mt-0.5 accent-[var(--color-primary)]"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[var(--color-on-surface)]">
                          {opt.label}
                        </span>
                        {opt.defaultRisk === "high" && (
                          <span className="rounded-full border border-[var(--color-error)] bg-[var(--color-error-muted)] px-2 py-0.5 text-xs text-[var(--color-error)]">
                            Potential high-risk
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">{opt.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Raspunde la urmatoarele intrebari pentru a rafina clasificarea.
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
                  className={`flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 transition ${
                    item.checked
                      ? "border-[var(--border-subtle)] bg-[var(--bg-active)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-variant)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-[var(--color-on-surface)]">
                      {item.label}
                    </span>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">{item.hint}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.onChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                  />
                </label>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Clasificarea sistemului bazata pe raspunsurile tale.
              </p>
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={previewTone.badge}>
                    <PreviewIcon className="size-3.5" strokeWidth={2.25} />
                    {previewTone.label}
                  </Badge>
                  <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
                    {formatPurposeLabel(purpose)}
                  </Badge>
                </div>
                <p className="mt-3 text-lg font-semibold text-[var(--color-on-surface)]">{name}</p>
                <p className="text-sm text-[var(--color-on-surface-muted)]">
                  {vendor} · {modelType}
                </p>
                {previewClassification.annexIIIHint && (
                  <p className="mt-2 text-sm text-[var(--color-warning)]">
                    {previewClassification.annexIIIHint}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Urmatorii pasi recomandati
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--color-on-surface-muted)]">
                  {previewClassification.recommendedActions.map((action, i) => (
                    <li key={i} className="flex gap-2">
                      <Bot
                        className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]"
                        strokeWidth={2.25}
                      />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {step > 1 && (
              <Button
                onClick={() => setStep((s) => (s - 1) as InventoryFlowStep)}
                variant="outline"
                className="h-11 flex-1 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
              >
                <ChevronLeft className="size-4" />
                Inapoi
              </Button>
            )}

            {step < 4 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as InventoryFlowStep)}
                disabled={!canGoNext}
                className="h-11 flex-1 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
              >
                Continua
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={() => void handleSubmit()}
                disabled={busy}
                className="h-11 flex-1 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
              >
                <BrainCircuit className="size-4" strokeWidth={2.25} />
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

        <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
          <CardHeader className="border-b border-[var(--color-border)] pb-5">
            <CardTitle className="text-xl">Sisteme AI inventariate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {systems.length === 0 && (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 text-sm text-[var(--color-on-surface-muted)]">
                Inca nu exista sisteme AI inventariate. Fluxul de mai sus este primul pas real
                catre clasificare AI Act.
              </div>
            )}

            {systems.map((system) => {
              const tone = riskTone(system.riskLevel)
              const Icon = tone.icon

              return (
                <div
                  key={system.id}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={tone.badge}>
                          <Icon className="size-3.5" strokeWidth={2.25} />
                          {tone.label}
                        </Badge>
                        <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
                          {formatPurposeLabel(system.purpose)}
                        </Badge>
                      </div>
                      <p className="text-lg font-semibold text-[var(--color-on-surface)]">
                        {system.name}
                      </p>
                      <p className="text-sm text-[var(--color-on-surface-muted)]">
                        {system.vendor} · {system.modelType}
                      </p>
                      {system.annexIIIHint && (
                        <p className="text-sm text-[var(--color-warning)]">{system.annexIIIHint}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="grid gap-1.5 text-right text-sm text-[var(--color-muted)]">
                        <span>
                          {system.usesPersonalData ? "Date personale" : "Fara date personale"}
                        </span>
                        <span>
                          {system.makesAutomatedDecisions
                            ? "Decizie automata"
                            : "Asistenta, fara decizie automata"}
                        </span>
                        <span>
                          {system.hasHumanReview ? "Cu review uman" : "Fara review uman"}
                        </span>
                      </div>
                      <button
                        onClick={() => void handleRemove(system.id)}
                        disabled={removingId === system.id || busy}
                        className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-error)] hover:bg-[var(--color-error-muted)] disabled:opacity-40"
                      >
                        <Trash2 className="size-3.5" strokeWidth={2.25} />
                        Sterge
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                      Urmatorii pasi
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--color-on-surface-muted)]">
                      {system.recommendedActions.map((item, index) => (
                        <li key={`${system.id}-${index}`} className="flex gap-2">
                          <Bot
                            className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]"
                            strokeWidth={2.25}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
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
      ? "text-[var(--color-error)]"
      : tone === "warning"
        ? "text-[var(--color-warning)]"
        : "text-[var(--color-success)]"

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardContent className="p-5">
        <p className="text-sm text-[var(--color-muted)]">{title}</p>
        <p className={`mt-3 text-3xl font-semibold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
