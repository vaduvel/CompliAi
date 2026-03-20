"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive"
export type ButtonSize = "sm" | "md" | "lg"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] " +
    "hover:bg-[var(--action-primary-hover)] active:bg-[var(--action-primary-active)] border-0",
  secondary:
    "bg-[var(--action-secondary-bg)] text-[var(--action-secondary-text)] " +
    "border border-[var(--action-secondary-border)] hover:bg-[var(--action-secondary-hover)]",
  ghost:
    "bg-transparent text-[var(--action-ghost-text)] border-0 " +
    "hover:bg-[var(--action-ghost-hover)]",
  destructive:
    "bg-[var(--action-destructive-bg)] text-[var(--action-destructive-text)] " +
    "border border-[var(--action-destructive-border)] hover:opacity-90",
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-[13px]",
  lg: "h-10 px-5 text-sm",
}

/**
 * DS v2.0 Button
 * Spec: docs/final-guide-plan/compliscan-ui-prompt.md
 * Regula: O singură variantă primary per pagină / zonă.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // base
          "inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-sm)] select-none",
          "transition-[background-color,border-color,color] duration-[120ms]",
          "cs-focus-ring",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin"
              style={{ width: 14, height: 14 }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span className="sr-only">Se încarcă…</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"
