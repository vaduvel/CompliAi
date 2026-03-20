import * as React from "react"
import { cn } from "@/lib/utils"

export type CardVariant = "default" | "flush" | "tinted"
export type CardTint = "compliant" | "failing" | "drift" | "review" | "info"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  /** Apenas pe variant="tinted" */
  tint?: CardTint
  /** Adaugă hover dacă cardul e clicabil — NICIODATĂ pe carduri non-interactve */
  interactive?: boolean
}

const tintStyles: Record<CardTint, React.CSSProperties> = {
  compliant: {
    background: "var(--status-compliant-bg)",
    borderColor: "var(--status-compliant-border)",
  },
  failing: {
    background: "var(--status-failing-bg)",
    borderColor: "var(--status-failing-border)",
  },
  drift: {
    background: "var(--status-drift-bg)",
    borderColor: "var(--status-drift-border)",
  },
  review: {
    background: "var(--status-review-bg)",
    borderColor: "var(--status-review-border)",
  },
  info: {
    background: "var(--status-info-bg)",
    borderColor: "var(--status-info-border)",
  },
}

/**
 * DS v2.0 Card
 * Spec: docs/final-guide-plan/compliscan-ui-prompt.md
 * Regula: Nu face carduri cu hover dacă nu sunt clicabile (interactive={true}).
 * Regula: Status-tinted cards — folosești sparingly, nu pe tot dashboardul.
 */
export function Card({ variant = "default", tint, interactive = false, className, style, ...props }: CardProps) {
  const baseStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-sm)",
    padding: variant === "flush" ? 0 : "var(--space-5)",
    transition: interactive ? "background-color var(--motion-fast) var(--easing), border-color var(--motion-fast) var(--easing)" : undefined,
  }

  const tintStyle = variant === "tinted" && tint ? tintStyles[tint] : {}

  return (
    <div
      className={cn(
        interactive && "cursor-pointer hover:border-[var(--border-default)] hover:bg-[var(--bg-hover)]",
        className,
      )}
      style={{ ...baseStyle, ...tintStyle, ...style }}
      {...props}
    />
  )
}

/** Header al cardului cu border-bottom */
export function CardHeader({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between", className)}
      style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)", ...style }}
      {...props}
    />
  )
}

/** Footer al cardului */
export function CardFooter({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      style={{ padding: "12px 18px", borderTop: "1px solid var(--border-subtle)", ...style }}
      {...props}
    />
  )
}
