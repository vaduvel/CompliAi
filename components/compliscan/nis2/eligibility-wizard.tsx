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
  ShieldX,
  Users,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
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
  1: "Sector de activitate",
  2: "Număr angajați",
  3: "Cifra de afaceri",
  4: "Rezultat",
}

const RESULT_CONFIG: Record<
  Nis2EligibilityResult,
  { icon: typeof ShieldCheck; label: string; variant: "success" | "warning" | "secondary" }
> = {
  intri: { icon: ShieldAlert, label: "Intri sub NIS2", variant: "warning" },
  posibil: { icon: HelpCircle, label: "Posibil NIS2", variant: "warning" },
  nu_intri: { icon: ShieldCheck, label: "Nu intri sub NIS2", variant: "success" },
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="size-5 text-eos-primary" strokeWidth={2} />
            Eligibilitate NIS2
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            OUG 155/2024
          </Badge>
        </div>
        <p className="mt-1 text-xs text-eos-text-muted">
          Verifică dacă organizația ta intră sub incidența Directivei NIS2 — 3 întrebări rapide.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-eos-text-muted">
            <span>Pas {step}/4 — {STEP_LABELS[step]}</span>
            {saved && step === 4 && (
              <button
                onClick={handleReset}
                className="text-eos-primary hover:underline"
              >
                Refă evaluarea
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            {([1, 2, 3, 4] as WizardStep[]).map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-eos-primary" : "bg-eos-surface-variant"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Sector */}
        {step === 1 && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="size-4" strokeWidth={2} />
              În ce sector activează firma ta?
            </label>
            <select
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              className="w-full rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2.5 text-sm text-eos-text focus:border-eos-primary focus:outline-none focus:ring-1 focus:ring-eos-primary"
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
            <label className="flex items-center gap-2 text-sm font-medium">
              <Users className="size-4" strokeWidth={2} />
              Câți angajați are firma?
            </label>
            <div className="space-y-2">
              {EMPLOYEE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-eos-md border p-3 transition ${
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
                    <span className="text-sm font-medium">{opt.label}</span>
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
            <label className="flex items-center gap-2 text-sm font-medium">
              <Wallet className="size-4" strokeWidth={2} />
              Care este cifra de afaceri anuală?
            </label>
            <div className="space-y-2">
              {REVENUE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-eos-md border p-3 transition ${
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
                    <span className="text-sm font-medium">{opt.label}</span>
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
            <div
              className={`rounded-eos-md border p-4 ${
                output.result === "intri"
                  ? "border-eos-warning/30 bg-eos-warning-soft dark:border-eos-warning/70 dark:bg-eos-warning-soft/30"
                  : output.result === "posibil"
                    ? "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/30"
                    : "border-eos-success/30 bg-eos-success-soft dark:border-eos-success/70 dark:bg-eos-success-soft/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <resultConfig.icon
                  className={`size-5 ${
                    output.result === "intri"
                      ? "text-eos-warning dark:text-eos-warning"
                      : output.result === "posibil"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-eos-success dark:text-eos-success"
                  }`}
                  strokeWidth={2}
                />
                <span className="text-sm font-semibold">{output.title}</span>
              </div>
              <p className="mt-2 text-sm text-eos-text-muted">{output.description}</p>
            </div>

            <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-eos-text-muted">
                Recomandare
              </p>
              <p className="mt-1 text-sm">{output.recommendation}</p>
            </div>

            {/* Summary of answers */}
            <div className="flex flex-wrap gap-2 text-xs text-eos-text-muted">
              <Badge variant="outline">
                {selectedSector?.label ?? sectorId}
              </Badge>
              <Badge variant="outline">
                {EMPLOYEE_OPTIONS.find((o) => o.value === employees)?.label}
              </Badge>
              <Badge variant="outline">
                {REVENUE_OPTIONS.find((o) => o.value === revenue)?.label}
              </Badge>
            </div>

            {error && (
              <p className="text-sm text-eos-error dark:text-eos-error">{error}</p>
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
      </CardContent>
    </Card>
  )
}
