import type { ReactNode } from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export type V3StepperStep = {
  id: string
  label: ReactNode
  status: "done" | "active" | "pending"
}

export function V3Stepper({ steps, className }: { steps: V3StepperStep[]; className?: string }) {
  return (
    <nav
      aria-label="Progres"
      className={cn("flex w-full items-center gap-2 overflow-x-auto", className)}
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-eos-sm border px-2 py-1 transition-colors duration-100",
                step.status === "active"
                  ? "border-eos-primary/35 bg-eos-primary/10"
                  : "border-transparent bg-transparent"
              )}
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white",
                  step.status === "done"
                    ? "bg-eos-success"
                    : step.status === "active"
                      ? "bg-eos-primary"
                      : "bg-white/[0.08] text-eos-text-tertiary"
                )}
              >
                {step.status === "done" ? (
                  <Check className="size-2.5" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap font-mono text-[11px] tracking-[0.02em]",
                  step.status === "done"
                    ? "text-eos-text-muted"
                    : step.status === "active"
                      ? "font-semibold text-eos-primary"
                      : "text-eos-text-tertiary"
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && <span className="text-[10px] text-white/10">—</span>}
          </div>
        )
      })}
    </nav>
  )
}
