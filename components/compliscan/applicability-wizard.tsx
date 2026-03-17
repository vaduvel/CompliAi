"use client"

import { useState } from "react"
import { CheckCircle2, ChevronRight, Loader2, Shield } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import {
  ORG_SECTOR_LABELS,
  ORG_EMPLOYEE_COUNT_LABELS,
  APPLICABILITY_TAG_LABELS,
  type OrgSector,
  type OrgEmployeeCount,
  type ApplicabilityResult,
} from "@/lib/compliance/applicability"

type WizardStep = "sector" | "size" | "ai" | "efactura" | "done"

type WizardState = {
  sector: OrgSector | null
  employeeCount: OrgEmployeeCount | null
  usesAITools: boolean | null
  requiresEfactura: boolean | null
}

type Props = {
  onComplete: (result: ApplicabilityResult) => void
}

const SECTORS = Object.entries(ORG_SECTOR_LABELS) as [OrgSector, string][]
const SIZES = Object.entries(ORG_EMPLOYEE_COUNT_LABELS) as [OrgEmployeeCount, string][]

const CERTAINTY_BADGE: Record<string, string> = {
  certain: "border-eos-border bg-eos-success-soft text-eos-success",
  probable: "border-eos-warning-border bg-eos-warning-soft text-eos-warning",
  unlikely: "border-eos-border bg-eos-surface-variant text-eos-text-muted",
}

export function ApplicabilityWizard({ onComplete }: Props) {
  const [step, setStep] = useState<WizardStep>("sector")
  const [values, setValues] = useState<WizardState>({
    sector: null,
    employeeCount: null,
    usesAITools: null,
    requiresEfactura: null,
  })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<ApplicabilityResult | null>(null)

  async function handleSubmit() {
    if (!values.sector || !values.employeeCount || values.usesAITools === null || values.requiresEfactura === null) return
    setSaving(true)
    try {
      const res = await fetch("/api/org/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector: values.sector,
          employeeCount: values.employeeCount,
          usesAITools: values.usesAITools,
          requiresEfactura: values.requiresEfactura,
        }),
      })
      if (!res.ok) throw new Error("save failed")
      const data = (await res.json()) as { applicability: ApplicabilityResult }
      setResult(data.applicability)
      setStep("done")
    } catch {
      // keep wizard open
    } finally {
      setSaving(false)
    }
  }

  function handleDone() {
    if (result) onComplete(result)
  }

  const STEP_LABELS: Record<WizardStep, string> = {
    sector: "1 / 4",
    size: "2 / 4",
    ai: "3 / 4",
    efactura: "4 / 4",
    done: "✓",
  }

  return (
    <Card className="border-eos-border bg-eos-surface shadow-sm">
      <CardContent className="border-l-4 border-l-eos-primary px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 shrink-0 text-eos-primary" />
            <div>
              <p className="text-sm font-semibold text-eos-text">
                Descoperă ce legi se aplică organizației tale
              </p>
              <p className="text-xs text-eos-text-muted">
                4 întrebări · sub 60 de secunde · fără date personale
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium text-eos-text-muted tabular-nums">
            {STEP_LABELS[step]}
          </span>
        </div>

        <div className="mt-5">
          {/* Step 1: Sector */}
          {step === "sector" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-eos-text">
                Care este sectorul principal de activitate?
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SECTORS.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setValues((v) => ({ ...v, sector: value }))
                      setStep("size")
                    }}
                    className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2.5 text-left text-sm text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Size */}
          {step === "size" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-eos-text">
                Câți angajați are organizația?
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SIZES.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setValues((v) => ({ ...v, employeeCount: value }))
                      setStep("ai")
                    }}
                    className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2.5 text-left text-sm text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: AI Tools */}
          {step === "ai" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-eos-text">
                Folosești unelte bazate pe AI? (ChatGPT, Copilot, Gemini, orice LLM sau clasificator automat)
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setValues((v) => ({ ...v, usesAITools: true }))
                    setStep("efactura")
                  }}
                  className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm font-medium text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                >
                  Da
                </button>
                <button
                  onClick={() => {
                    setValues((v) => ({ ...v, usesAITools: false }))
                    setStep("efactura")
                  }}
                  className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm font-medium text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                >
                  Nu (deocamdată)
                </button>
              </div>
            </div>
          )}

          {/* Step 4: e-Factura */}
          {step === "efactura" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-eos-text">
                Ești plătitor de TVA cu tranzacții B2B? (obligat să transmiți facturile prin e-Factura / SPV ANAF)
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setValues((v) => ({ ...v, requiresEfactura: true }))
                    void (async () => {
                      setValues((prev) => ({ ...prev, requiresEfactura: true }))
                      setSaving(true)
                      try {
                        const finalValues = {
                          sector: values.sector!,
                          employeeCount: values.employeeCount!,
                          usesAITools: values.usesAITools!,
                          requiresEfactura: true,
                        }
                        const res = await fetch("/api/org/profile", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(finalValues),
                        })
                        if (!res.ok) throw new Error("save failed")
                        const data = (await res.json()) as { applicability: ApplicabilityResult }
                        setResult(data.applicability)
                        setStep("done")
                      } catch {
                        // keep wizard open
                      } finally {
                        setSaving(false)
                      }
                    })()
                  }}
                  className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm font-medium text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                >
                  Da
                </button>
                <button
                  onClick={() => {
                    void (async () => {
                      setValues((prev) => ({ ...prev, requiresEfactura: false }))
                      setSaving(true)
                      try {
                        const finalValues = {
                          sector: values.sector!,
                          employeeCount: values.employeeCount!,
                          usesAITools: values.usesAITools!,
                          requiresEfactura: false,
                        }
                        const res = await fetch("/api/org/profile", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(finalValues),
                        })
                        if (!res.ok) throw new Error("save failed")
                        const data = (await res.json()) as { applicability: ApplicabilityResult }
                        setResult(data.applicability)
                        setStep("done")
                      } catch {
                        // keep wizard open
                      } finally {
                        setSaving(false)
                      }
                    })()
                  }}
                  className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm font-medium text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                >
                  Nu / Nu știu
                </button>
              </div>
              {saving && (
                <div className="flex items-center gap-2 text-xs text-eos-text-muted">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Se calculează aplicabilitatea...
                </div>
              )}
            </div>
          )}

          {/* Done: show result */}
          {step === "done" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-eos-success" />
                <p className="text-sm font-medium text-eos-text">
                  Profilul tău de aplicabilitate
                </p>
              </div>

              <div className="space-y-2">
                {result.entries.map((entry) => (
                  <div
                    key={entry.tag}
                    className="flex items-start gap-3 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2.5"
                  >
                    <Badge className={`mt-0.5 shrink-0 ${CERTAINTY_BADGE[entry.certainty]}`}>
                      {entry.certainty === "certain"
                        ? "Se aplică"
                        : entry.certainty === "probable"
                          ? "Probabil"
                          : "Neaplicabil"}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-eos-text">
                        {APPLICABILITY_TAG_LABELS[entry.tag]}
                      </p>
                      <p className="mt-0.5 text-xs text-eos-text-muted">{entry.reason}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleDone}
                className="w-full"
              >
                Continuă la dashboard
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
