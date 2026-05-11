"use client"

import { useState } from "react"
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import { V3Stepper, type V3StepperStep } from "@/components/compliscan/v3/stepper"
import {
  NIS2_SECTORS,
  evaluateNis2Eligibility,
  type Nis2EmployeeRange,
  type Nis2RevenueRange,
  type Nis2EligibilityResult,
} from "@/lib/compliscan/nis2-eligibility"

type WizardStep = 1 | 2 | 3 | 4

type SavedEligibility = {
  sectorId: string
  employees: Nis2EmployeeRange
  revenue: Nis2RevenueRange
  result: Nis2EligibilityResult
  savedAtISO: string
}

export type Nis2EligibilityCompletionPayload = {
  sectorId: string
  sectorLabel: string
  employees: Nis2EmployeeRange
  revenue: Nis2RevenueRange
  result: Nis2EligibilityResult
}

type Props = {
  saved: SavedEligibility | null
  onComplete: (payload: Nis2EligibilityCompletionPayload) => void
  onResetSaved?: () => void
}

const EMPLOYEE_OPTIONS: Array<{ value: Nis2EmployeeRange; label: string; hint: string }> = [
  { value: "sub50", label: "Sub 50 angajați", hint: "Microîntreprindere sau întreprindere mică" },
  { value: "50-250", label: "50 – 250 angajați", hint: "Întreprindere mijlocie" },
  { value: "peste250", label: "Peste 250 angajați", hint: "Întreprindere mare" },
]

const REVENUE_OPTIONS: Array<{ value: Nis2RevenueRange; label: string; hint: string }> = [
  { value: "sub10m", label: "Sub 10M EUR", hint: "Cifră de afaceri anuală sub 10 milioane EUR" },
  { value: "10-50m", label: "10 – 50M EUR", hint: "Cifră de afaceri anuală între 10 și 50 milioane EUR" },
  { value: "peste50m", label: "Peste 50M EUR", hint: "Cifră de afaceri anuală peste 50 milioane EUR" },
]

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Sector",
  2: "Angajați",
  3: "Cifră afaceri",
  4: "Rezultat",
}

type ResultTone = {
  icon: typeof ShieldCheck
  wrapper: string
  iconColor: string
  pillClass: string
}

const RESULT_CONFIG: Record<Nis2EligibilityResult, ResultTone> = {
  intri: {
    icon: ShieldAlert,
    wrapper: "border-eos-warning/30 bg-eos-warning-soft",
    iconColor: "text-eos-warning",
    pillClass: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  },
  posibil: {
    icon: HelpCircle,
    wrapper: "border-eos-warning/30 bg-eos-warning-soft",
    iconColor: "text-eos-warning",
    pillClass: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  },
  nu_intri: {
    icon: ShieldCheck,
    wrapper: "border-eos-success/30 bg-eos-success-soft",
    iconColor: "text-eos-success",
    pillClass: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  },
}

function InlineTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
      {children}
    </span>
  )
}

export function Nis2EligibilityWizard({ saved, onComplete, onResetSaved }: Props) {
  const [step, setStep] = useState<WizardStep>(saved ? 4 : 1)
  const [sectorId, setSectorId] = useState(saved?.sectorId ?? "")
  const [employees, setEmployees] = useState<Nis2EmployeeRange | "">(saved?.employees ?? "")
  const [revenue, setRevenue] = useState<Nis2RevenueRange | "">(saved?.revenue ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canGoNext =
    step === 1 ? sectorId !== "" :
    step === 2 ? employees !== "" :
    step === 3 ? revenue !== "" :
    true

  const output =
    sectorId && employees && revenue
      ? evaluateNis2Eligibility(sectorId, employees as Nis2EmployeeRange, revenue as Nis2RevenueRange)
      : null

  async function handleSave() {
    if (!output || !employees || !revenue) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/nis2/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectorId, employees, revenue }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Eroare la salvare")
      }
      onComplete({
        sectorId,
        sectorLabel: selectedSector?.label ?? sectorId,
        employees,
        revenue,
        result: output.result,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la salvare")
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setStep(1)
    setSectorId("")
    setEmployees("")
    setRevenue("")
    setError(null)
    onResetSaved?.()
  }

  const selectedSector = NIS2_SECTORS.find((s) => s.id === sectorId)
  const resultConfig = output ? RESULT_CONFIG[output.result] : null

  const stepperSteps: V3StepperStep[] = ([1, 2, 3, 4] as WizardStep[]).map((s) => ({
    id: String(s),
    label: STEP_LABELS[s],
    status: s < step ? "done" : s === step ? "active" : "pending",
  }))

  return (
    <section className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
      <header className="flex items-start justify-between gap-3 border-b border-eos-border-subtle px-4 py-3.5">
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            OUG 155/2024
          </p>
          <h3
            data-display-text="true"
            className="flex items-center gap-2 font-display text-[14.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
          >
            <ShieldAlert className="size-4 text-eos-primary" strokeWidth={2} />
            Eligibilitate NIS2
          </h3>
          <p className="mt-1 text-[12px] text-eos-text-muted">
            Verifică dacă organizația ta intră sub incidența Directivei NIS2 — 3 întrebări rapide.
          </p>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        {/* Step progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <V3Stepper steps={stepperSteps} />
            {saved && step === 4 && (
              <button
                onClick={handleReset}
                className="shrink-0 font-mono text-[10.5px] font-semibold tracking-[0.02em] text-eos-primary hover:underline"
              >
                Refă evaluarea
              </button>
            )}
          </div>
        </div>

        {/* Step 1: Sector */}
        {step === 1 && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-eos-text">
              <Building2 className="size-4" strokeWidth={2} />
              În ce sector activează firma ta?
            </label>
            <select
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              className="w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2.5 text-sm text-eos-text focus:border-eos-primary focus:outline-none focus:ring-1 focus:ring-eos-primary"
            >
              <option value="">Alege sectorul...</option>
              <optgroup label="Anexa 1 — Sectoare de importanță ridicată">
                {NIS2_SECTORS.filter((s) => s.annex === "1").map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Anexa 2 — Alte sectoare critice">
                {NIS2_SECTORS.filter((s) => s.annex === "2" && s.id !== "other").map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Alte sectoare">
                <option value="other">Alt sector (retail, servicii profesionale, educație etc.)</option>
              </optgroup>
            </select>
            {selectedSector && selectedSector.id !== "other" && (
              <p className="text-xs text-eos-text-muted">
                Anexa {selectedSector.annex} — {selectedSector.annex === "1" ? "Entități esențiale" : "Entități importante"}
              </p>
            )}
          </div>
        )}

        {/* Step 2: Employees */}
        {step === 2 && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-eos-text">
              <Users className="size-4" strokeWidth={2} />
              Câți angajați are firma?
            </label>
            <div className="space-y-2">
              {EMPLOYEE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-eos-sm border p-3 transition ${
                    employees === opt.value
                      ? "border-eos-primary bg-eos-surface-active"
                      : "border-eos-border bg-eos-surface-variant hover:bg-eos-secondary-hover"
                  }`}
                >
                  <input
                    type="radio"
                    name="employees"
                    value={opt.value}
                    checked={employees === opt.value}
                    onChange={() => setEmployees(opt.value)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-eos-text">{opt.label}</span>
                    <p className="mt-0.5 text-xs text-eos-text-muted">{opt.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Revenue */}
        {step === 3 && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-eos-text">
              <Wallet className="size-4" strokeWidth={2} />
              Care este cifra de afaceri anuală?
            </label>
            <div className="space-y-2">
              {REVENUE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-eos-sm border p-3 transition ${
                    revenue === opt.value
                      ? "border-eos-primary bg-eos-surface-active"
                      : "border-eos-border bg-eos-surface-variant hover:bg-eos-secondary-hover"
                  }`}
                >
                  <input
                    type="radio"
                    name="revenue"
                    value={opt.value}
                    checked={revenue === opt.value}
                    onChange={() => setRevenue(opt.value)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-eos-text">{opt.label}</span>
                    <p className="mt-0.5 text-xs text-eos-text-muted">{opt.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 4 && output && resultConfig && (
          <div className="space-y-4">
            <div className={`rounded-eos-sm border p-4 ${resultConfig.wrapper}`}>
              <div className="flex items-center gap-2">
                <resultConfig.icon
                  className={`size-5 ${resultConfig.iconColor}`}
                  strokeWidth={2}
                />
                <span className="text-sm font-semibold text-eos-text">{output.title}</span>
              </div>
              <p className="mt-2 text-sm text-eos-text-muted">{output.description}</p>
            </div>

            <div className="rounded-eos-sm border border-eos-border bg-eos-bg-inset p-3">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
                Recomandare
              </p>
              <p className="mt-1 text-sm text-eos-text">{output.recommendation}</p>
            </div>

            {/* Summary of answers */}
            <div className="flex flex-wrap gap-2 text-xs text-eos-text-muted">
              <InlineTag>{selectedSector?.label ?? sectorId}</InlineTag>
              <InlineTag>{EMPLOYEE_OPTIONS.find((o) => o.value === employees)?.label}</InlineTag>
              <InlineTag>{REVENUE_OPTIONS.find((o) => o.value === revenue)?.label}</InlineTag>
            </div>

            {error && (
              <p className="text-sm text-eos-error">{error}</p>
            )}

            {!saved && (
              <Button
                onClick={() => void handleSave()}
                disabled={saving}
                className="w-full gap-2 bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                ) : (
                  <CheckCircle2 className="size-4" strokeWidth={2} />
                )}
                Salvează rezultatul
              </Button>
            )}

            {saved && (
              <div className="flex items-center gap-2 text-xs text-eos-text-muted">
                <CheckCircle2 className="size-3.5 text-eos-success" strokeWidth={2} />
                Salvat la {new Date(saved.savedAtISO).toLocaleDateString("ro-RO")}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.max(1, s - 1) as WizardStep)}
              disabled={step === 1}
              className="gap-1"
            >
              <ChevronLeft className="size-4" strokeWidth={2} />
              Înapoi
            </Button>
            <Button
              size="sm"
              onClick={() => setStep((s) => Math.min(4, s + 1) as WizardStep)}
              disabled={!canGoNext}
              className="gap-1 bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
            >
              Continuă
              <ChevronRight className="size-4" strokeWidth={2} />
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
