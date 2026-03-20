import * as React from "react"
import { cn } from "@/lib/utils"

// ── Status badges (operational meaning) ──────────────────────────
export type StatusVariant =
  | "compliant"
  | "failing"
  | "drift"
  | "review"
  | "info"
  | "neutral"

// ── Severity badges (gravity) ─────────────────────────────────────
export type SeverityVariant = "critical" | "high" | "medium" | "low"

// ── Review state badges (finding lifecycle) ───────────────────────
export type ReviewVariant =
  | "detected"
  | "pending"
  | "escalated"
  | "confirmed"
  | "dismissed"
  | "remediation"
  | "resolved"

export type BadgeVariant = StatusVariant | SeverityVariant | ReviewVariant

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: "sm" | "md"
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  // status
  compliant:    { color: "var(--status-compliant-text)", background: "var(--status-compliant-bg)" },
  failing:      { color: "var(--status-failing-text)",   background: "var(--status-failing-bg)" },
  drift:        { color: "var(--status-drift-text)",     background: "var(--status-drift-bg)" },
  review:       { color: "var(--status-review-text)",    background: "var(--status-review-bg)" },
  info:         { color: "var(--status-info-text)",      background: "var(--status-info-bg)" },
  neutral:      { color: "var(--status-neutral-text)",   background: "var(--status-neutral-bg)" },
  // severity
  critical:     { color: "var(--severity-critical-text)", background: "var(--severity-critical-bg)" },
  high:         { color: "var(--severity-high-text)",     background: "var(--severity-high-bg)" },
  medium:       { color: "var(--severity-medium-text)",   background: "var(--severity-medium-bg)" },
  low:          { color: "var(--severity-low-text)",      background: "var(--severity-low-bg)" },
  // review states
  detected:     { color: "var(--review-detected-text)",    background: "var(--review-detected-bg)" },
  pending:      { color: "var(--review-pending-text)",     background: "var(--review-pending-bg)" },
  escalated:    { color: "var(--review-escalated-text)",   background: "var(--review-escalated-bg)" },
  confirmed:    { color: "var(--review-confirmed-text)",   background: "var(--review-confirmed-bg)" },
  dismissed:    { color: "var(--review-dismissed-text)",   background: "var(--review-dismissed-bg)" },
  remediation:  { color: "var(--review-remediation-text)", background: "var(--review-remediation-bg)" },
  resolved:     { color: "var(--review-resolved-text)",    background: "var(--review-resolved-bg)" },
}

const sizeStyles: Record<"sm" | "md", React.CSSProperties> = {
  sm: { fontSize: 11, padding: "2px 8px" },
  md: { fontSize: 12, padding: "4px 10px" },
}

/**
 * DS v2.0 Badge
 * Spec: docs/final-guide-plan/compliscan-ui-prompt.md
 * Regula: Status ≠ Severity — nu amesteca în același badge.
 * Regula: Nu folosești ca element interactiv (nu onClick).
 */
export function Badge({ variant = "neutral", size = "md", className, style, ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center font-semibold leading-none", className)}
      style={{
        borderRadius: "var(--radius-pill)",
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    />
  )
}
