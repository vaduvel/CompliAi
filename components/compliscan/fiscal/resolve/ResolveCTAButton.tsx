"use client"

// ResolveCTAButton — 1 buton CTA principal cu chain handler pentru Pattern A
// (auto-approve) și Pattern I (retransmit).
//
// Click → execută chain de pași async cu progress inline + audit log automat
// + reverificare la final. Folosit de Fiscal Resolve Cockpit pentru EF-003
// (repair → validate → submit → confirm → save) și EF-005 (validate → submit).
//
// Faza 3.1 din fiscal-module-final-sprint-2026-05-12.md.

import { useState } from "react"
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react"

export type ChainStep<TContext = Record<string, unknown>> = {
  id: string
  label: string
  /**
   * Runner async — primește contextul curent (output din pașii anteriori) și
   * returnează contextul nou (pe care îl primește pasul următor).
   */
  run: (ctx: TContext) => Promise<TContext>
}

type StepStatus = "pending" | "running" | "complete" | "failed"

type ResolveCTAButtonProps<TContext = Record<string, unknown>> = {
  /** Eticheta butonului (ex: "Rezolvă automat") */
  label: string
  /** Lista de pași async în ordine. */
  steps: ChainStep<TContext>[]
  /** Context inițial (input pentru primul pas). */
  initialContext: TContext
  /** Callback la sfârșit success — folosit pentru redirect/toast/refresh. */
  onComplete?: (ctx: TContext) => void
  /** Callback la sfârșit error. */
  onError?: (err: Error, failedStepId: string) => void
  /**
   * Disclaimer checkbox obligatoriu — dacă set, butonul e disabled până
   * utilizatorul bifează (CECCAR Art. 14 compliance).
   */
  requireDisclaimerLabel?: string
  /** Dezactivare manuală (ex: missing data). */
  disabled?: boolean
}

export function ResolveCTAButton<TContext = Record<string, unknown>>({
  label,
  steps,
  initialContext,
  onComplete,
  onError,
  requireDisclaimerLabel,
  disabled = false,
}: ResolveCTAButtonProps<TContext>) {
  const [running, setRunning] = useState(false)
  const [currentStepIdx, setCurrentStepIdx] = useState(-1)
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({})
  const [completed, setCompleted] = useState(false)
  const [failedStepId, setFailedStepId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [disclaimerChecked, setDisclaimerChecked] = useState(!requireDisclaimerLabel)

  async function handleClick() {
    if (running || disabled || !disclaimerChecked) return
    setRunning(true)
    setError(null)
    setFailedStepId(null)
    setCompleted(false)
    setStepStatuses({})
    let ctx = initialContext

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      setCurrentStepIdx(i)
      setStepStatuses((prev) => ({ ...prev, [step.id]: "running" }))
      try {
        ctx = await step.run(ctx)
        setStepStatuses((prev) => ({ ...prev, [step.id]: "complete" }))
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Eroare necunoscută."
        setStepStatuses((prev) => ({ ...prev, [step.id]: "failed" }))
        setFailedStepId(step.id)
        setError(errMsg)
        setRunning(false)
        onError?.(err instanceof Error ? err : new Error(errMsg), step.id)
        return
      }
    }
    setCompleted(true)
    setRunning(false)
    onComplete?.(ctx)
  }

  const buttonDisabled = running || disabled || !disclaimerChecked

  return (
    <div className="space-y-3">
      {requireDisclaimerLabel && (
        <label className="flex cursor-pointer items-start gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant/40 px-3 py-2">
          <input
            type="checkbox"
            checked={disclaimerChecked}
            onChange={(e) => setDisclaimerChecked(e.target.checked)}
            disabled={running}
            className="mt-0.5 size-3.5 shrink-0 rounded border-eos-border accent-eos-primary"
            aria-label="Disclaimer CECCAR"
          />
          <span className="text-[12px] leading-[1.5] text-eos-text-muted">
            {requireDisclaimerLabel}
          </span>
        </label>
      )}

      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={buttonDisabled}
        className="inline-flex items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2.5 text-[13px] font-semibold text-eos-primary-foreground shadow-sm transition hover:bg-eos-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Lucrez…
          </>
        ) : completed ? (
          <>
            <CheckCircle2 className="size-4" strokeWidth={2} />
            Rezolvat
          </>
        ) : (
          <>
            <Sparkles className="size-4" strokeWidth={2} />
            {label}
          </>
        )}
      </button>

      {running || completed || failedStepId ? (
        <ol className="space-y-1.5">
          {steps.map((step, idx) => {
            const status = stepStatuses[step.id] ?? "pending"
            return (
              <li
                key={step.id}
                className={`flex items-center gap-2 text-[12px] ${
                  status === "running"
                    ? "text-eos-text"
                    : status === "complete"
                      ? "text-eos-success"
                      : status === "failed"
                        ? "text-eos-error"
                        : "text-eos-text-tertiary"
                }`}
              >
                {status === "running" ? (
                  <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                ) : status === "complete" ? (
                  <CheckCircle2 className="size-3.5" strokeWidth={2} />
                ) : status === "failed" ? (
                  <XCircle className="size-3.5" strokeWidth={2} />
                ) : (
                  <span className="inline-block size-3.5 rounded-full border border-eos-border" />
                )}
                <span>
                  Pas {idx + 1}: {step.label}
                </span>
              </li>
            )
          })}
        </ol>
      ) : null}

      {error && (
        <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-[12px] text-eos-error">
          {error}
        </div>
      )}
    </div>
  )
}
