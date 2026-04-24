import * as React from "react"
import { FileText, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type V3PillVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"

const pillVariantClass: Record<V3PillVariant, string> = {
  default: "border-eos-primary/25 bg-eos-primary/10 text-eos-primary",
  secondary: "border-eos-border-subtle bg-white/[0.04] text-eos-text-muted",
  destructive: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  outline: "border-eos-border bg-white/[0.03] text-eos-text-muted",
  success: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  warning: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
}

export interface V3PillProps extends React.ComponentProps<"span"> {
  variant?: V3PillVariant
  dot?: boolean
}

export function V3Pill({
  className,
  variant = "default",
  dot = false,
  children,
  ...props
}: V3PillProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center justify-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase leading-4 tracking-[0.05em] transition-colors",
        pillVariantClass[variant],
        className
      )}
      {...props}
    >
      {dot ? (
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current opacity-80" />
      ) : null}
      {children}
    </span>
  )
}

export const V3Surface = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        "rounded-eos-lg border border-eos-border bg-eos-surface text-eos-text transition-colors hover:border-eos-border-strong",
        className
      )}
      {...props}
    />
  )
)
V3Surface.displayName = "V3Surface"

export const V3SurfaceHead = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <header ref={ref} className={cn("flex flex-col gap-1 px-4 pb-3 pt-4", className)} {...props} />
  )
)
V3SurfaceHead.displayName = "V3SurfaceHead"

export const V3SurfaceTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    data-display-text="true"
    className={cn("font-display text-[14px] font-semibold leading-tight tracking-[-0.01em]", className)}
    {...props}
  />
))
V3SurfaceTitle.displayName = "V3SurfaceTitle"

export const V3SurfaceBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-4 pb-4 pt-0 text-[13px] leading-[1.55]", className)} {...props} />
  )
)
V3SurfaceBody.displayName = "V3SurfaceBody"

interface V3BlankSlateProps {
  title?: string
  label: string
  icon?: LucideIcon
  actions?: React.ReactNode
  className?: string
}

export function V3BlankSlate({
  title,
  label,
  icon: Icon = FileText,
  actions,
  className,
}: V3BlankSlateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-eos-lg border border-dashed border-eos-border-subtle bg-eos-bg-inset px-4 py-10 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-eos-bg-panel">
        <Icon className="size-5 text-eos-text-tertiary" aria-hidden="true" />
      </div>
      {title ? <p className="break-words text-sm font-medium text-eos-text [overflow-wrap:anywhere]">{title}</p> : null}
      <p
        className={cn(
          "break-words text-sm leading-6 text-eos-text-muted [overflow-wrap:anywhere]",
          title ? "mt-1 max-w-md" : "max-w-sm"
        )}
      >
        {label}
      </p>
      {actions ? <div className="mt-4 flex w-full flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  )
}

interface V3IntroProps {
  eyebrow?: React.ReactNode
  title: string
  description?: string
  badges?: React.ReactNode
  actions?: React.ReactNode
  aside?: React.ReactNode
  className?: string
}

export function V3Intro({
  eyebrow,
  title,
  description,
  badges,
  actions,
  aside,
  className,
}: V3IntroProps) {
  const titleId = React.useId()
  const descriptionId = React.useId()

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn("rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-5", className)}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              {eyebrow}
            </p>
          ) : null}
          {badges ? <div className="mt-2 flex flex-wrap gap-2">{badges}</div> : null}
          <h1
            id={titleId}
            data-display-text="true"
            className={cn(
              "font-display text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-eos-text [overflow-wrap:anywhere]",
              eyebrow || badges ? "mt-3" : ""
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              id={descriptionId}
              className="mt-3 max-w-3xl text-[13.5px] leading-6 text-eos-text-muted [overflow-wrap:anywhere]"
            >
              {description}
            </p>
          ) : null}
        </div>
        {aside || actions ? (
          <div className="flex w-full shrink-0 flex-col gap-2 xl:max-w-[var(--eos-page-rail-width)]">
            {aside ? (
              <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-bg-inset p-4">
                {aside}
              </div>
            ) : null}
            {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
