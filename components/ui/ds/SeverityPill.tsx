import * as React from "react"
import { cn } from "@/lib/utils"

export type SeverityLevel = "critical" | "high" | "medium" | "low"

export interface SeverityPillProps {
  level: SeverityLevel
  className?: string
  style?: React.CSSProperties
}

const labelMap: Record<SeverityLevel, string> = {
  critical: "CRITIC",
  high:     "RIDICAT",
  medium:   "MEDIU",
  low:      "SCĂZUT",
}

const styleMap: Record<SeverityLevel, React.CSSProperties> = {
  critical: { color: "var(--severity-critical-text)", background: "var(--severity-critical-bg)" },
  high:     { color: "var(--severity-high-text)",     background: "var(--severity-high-bg)" },
  medium:   { color: "var(--severity-medium-text)",   background: "var(--severity-medium-bg)" },
  low:      { color: "var(--severity-low-text)",      background: "var(--severity-low-bg)" },
}

/**
 * DS v2.0 SeverityPill
 * Spec: docs/final-guide-plan/compliscan-ui-prompt.md
 * Scop: gravity unui finding — NICIODATĂ pentru status operațional.
 */
export function SeverityPill({ level, className, style }: SeverityPillProps) {
  return (
    <span
      className={cn("inline-flex items-center shrink-0", className)}
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: "var(--radius-pill)",
        ...styleMap[level],
        ...style,
      }}
      aria-label={`Severitate: ${labelMap[level]}`}
    >
      {labelMap[level]}
    </span>
  )
}
