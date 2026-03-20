import * as React from "react"

export type StatusDotVariant = "ok" | "warning" | "fail" | "review" | "neutral"
export type StatusDotSize = "sm" | "md"

export interface StatusDotProps {
  variant?: StatusDotVariant
  size?: StatusDotSize
  className?: string
  style?: React.CSSProperties
}

const colorMap: Record<StatusDotVariant, string> = {
  ok:      "var(--status-compliant-text)",
  warning: "var(--status-drift-text)",
  fail:    "var(--status-failing-text)",
  review:  "var(--status-review-text)",
  neutral: "var(--text-muted)",
}

const sizeMap: Record<StatusDotSize, number> = {
  sm: 6,
  md: 8,
}

/**
 * DS v2.0 StatusDot
 * Spec: docs/final-guide-plan/compliscan-ui-prompt.md
 * Regula: Mereu însoțit de text — nu singur ca indicator.
 */
export function StatusDot({ variant = "neutral", size = "md", className, style }: StatusDotProps) {
  const dim = sizeMap[size]
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: dim,
        height: dim,
        borderRadius: "50%",
        background: colorMap[variant],
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
