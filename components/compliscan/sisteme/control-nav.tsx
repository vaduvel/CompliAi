"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import type { ControlPrimaryViewMode, SystemsSubViewMode } from "./sisteme-shared"

export function ControlPrimaryTabs({
  active,
  onChange,
  counts,
}: {
  active: ControlPrimaryViewMode
  onChange: (next: ControlPrimaryViewMode) => void
  counts: {
    confirmedCount: number
    detectedActiveCount: number
    recentDrifts: number
    reviewQueueCount: number
  }
}) {
  const tabs: Array<{
    id: ControlPrimaryViewMode
    title: string
    description: string
    badge: string
  }> = [
    {
      id: "overview",
      title: "Prezentare",
      description: "Snapshot control și handoff clar spre zona unde continui lucrul real.",
      badge: `${counts.reviewQueueCount} de validat`,
    },
    {
      id: "systems",
      title: "Sisteme",
      description: "Candidate, inventar, compliance pack și baseline pe același fir de confirmare.",
      badge: `${counts.confirmedCount} confirmate`,
    },
    {
      id: "drift",
      title: "Drift",
      description: "Schimbările față de baseline și investigația lor, separat de inventar.",
      badge: `${counts.recentDrifts} active`,
    },
    {
      id: "review",
      title: "Validare",
      description: "Tot ce cere validare umană înainte să poată deveni sursă de adevăr.",
      badge: `${counts.detectedActiveCount} detectii`,
    },
  ]

  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-eos-lg border p-4 text-left transition",
              isActive
                ? "border-eos-border-strong bg-white/[0.03]"
                : "border-eos-border bg-eos-surface hover:border-eos-border-strong hover:bg-white/[0.02]"
            )}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p
                  data-display-text="true"
                  className="font-display text-[14px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  {tab.title}
                </p>
                <span className="inline-flex shrink-0 items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
                  {tab.badge}
                </span>
              </div>
              <p className="text-[12px] leading-[1.5] text-eos-text-muted">{tab.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function SystemsLinearStepper({
  active,
  onChange,
  detectedActiveCount,
  confirmedCount,
  validatedBaseline,
  compliancePack,
}: {
  active: SystemsSubViewMode
  onChange: (next: SystemsSubViewMode) => void
  detectedActiveCount: number
  confirmedCount: number
  validatedBaseline: boolean
  compliancePack: AICompliancePack | null
}) {
  type StepStatus = "done" | "active" | "pending"

  const steps: Array<{
    id: SystemsSubViewMode
    step: number
    title: string
    description: string
    done: boolean
  }> = [
    {
      id: "discovery",
      step: 1,
      title: "Discovery",
      description: "Detectezi și revizuiești candidatele automate.",
      done: detectedActiveCount === 0 && confirmedCount > 0,
    },
    {
      id: "inventory",
      step: 2,
      title: "Inventar",
      description: "Confirmi sistemele oficiale.",
      done: confirmedCount > 0 && validatedBaseline,
    },
    {
      id: "baseline",
      step: 3,
      title: "Baseline",
      description: "Fixezi reperul pentru drift.",
      done: validatedBaseline,
    },
    {
      id: "pack",
      step: 4,
      title: "Compliance Pack",
      description: "Revizuiești pachetul pre-completat.",
      done: compliancePack !== null,
    },
  ]

  function stepStatus(step: (typeof steps)[number]): StepStatus {
    if (step.id === active) return "active"
    if (step.done) return "done"
    return "pending"
  }

  return (
    <div className="space-y-2">
      {/* Desktop: horizontal stepper */}
      <div className="hidden items-start sm:flex">
        {steps.map((step, index) => {
          const status = stepStatus(step)
          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-start">
              <button
                type="button"
                onClick={() => onChange(step.id)}
                className="group flex min-w-0 flex-1 flex-col items-center gap-2 px-2"
              >
                <div
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition",
                    status === "done"
                      ? "border-eos-success bg-eos-success-soft text-eos-success"
                      : status === "active"
                        ? "border-eos-border-strong bg-eos-surface-active text-eos-text"
                        : "border-eos-border bg-eos-bg text-eos-text-muted"
                  )}
                >
                  {status === "done" ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    step.step
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-semibold transition",
                      status === "active"
                        ? "text-eos-text"
                        : "text-eos-text-muted group-hover:text-eos-text"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-eos-text-muted">{step.description}</p>
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className="mt-4 h-px w-6 shrink-0 self-start bg-eos-border" />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: vertical step list */}
      <div className="flex flex-col gap-2 sm:hidden">
        {steps.map((step) => {
          const status = stepStatus(step)
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onChange(step.id)}
              className={cn(
                "flex items-start gap-3 rounded-eos-sm border p-3 text-left transition",
                status === "active"
                  ? "border-eos-border-strong bg-white/[0.03]"
                  : "border-eos-border bg-eos-surface hover:border-eos-border-strong hover:bg-white/[0.02]"
              )}
            >
              <div
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                  status === "done"
                    ? "border-eos-success bg-eos-success-soft text-eos-success"
                    : status === "active"
                      ? "border-eos-border-strong bg-eos-surface-active text-eos-text"
                      : "border-eos-border bg-eos-bg text-eos-text-muted"
                )}
              >
                {status === "done" ? <Check className="size-3" strokeWidth={2.5} /> : step.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-eos-text">{step.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-eos-text-muted">{step.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
