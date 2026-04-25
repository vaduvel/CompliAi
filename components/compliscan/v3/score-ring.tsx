import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import type { V3SeverityTone } from "./finding-row"

/**
 * V3 Score Ring — SVG circle 36px (sau custom size) cu fill stroke-dashoffset proporțional cu valoarea.
 * Pattern frozen: track gri, fill colorat după tone (critical=red, high=amber, ok=emerald, info=cobalt).
 */
type V3ScoreRingTone = V3SeverityTone | "neutral"

const STROKE_TONE: Record<V3ScoreRingTone, string> = {
  critical: "stroke-eos-error",
  high: "stroke-eos-warning",
  medium: "stroke-eos-primary",
  low: "stroke-eos-border-strong",
  info: "stroke-eos-primary",
  ok: "stroke-eos-success",
  neutral: "stroke-eos-border-strong",
}

const NUMBER_TONE: Record<V3ScoreRingTone, string> = {
  critical: "text-eos-error",
  high: "text-eos-warning",
  medium: "text-eos-primary",
  low: "text-eos-text-muted",
  info: "text-eos-primary",
  ok: "text-eos-success",
  neutral: "text-eos-text",
}

export function V3ScoreRing({
  value,
  tone = "neutral",
  size = 36,
  strokeWidth = 3,
  numberOverride,
  className,
}: {
  value: number
  tone?: V3ScoreRingTone
  size?: number
  strokeWidth?: number
  numberOverride?: ReactNode
  className?: string
}) {
  const radius = size / 2 - strokeWidth
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference * (1 - clamped / 100)
  const cx = size / 2
  const cy = size / 2
  const fontSize = Math.max(9, Math.round(size * 0.32))

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-eos-border-strong/60"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-[400ms] ease-out",
            STROKE_TONE[tone]
          )}
        />
      </svg>
      <div
        className={cn(
          "absolute inset-0 grid place-items-center font-display font-semibold tabular-nums tracking-[-0.02em]",
          NUMBER_TONE[tone]
        )}
        style={{ fontSize }}
      >
        {numberOverride ?? Math.round(clamped)}
      </div>
    </div>
  )
}
