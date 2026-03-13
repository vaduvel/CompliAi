import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap [border-radius:var(--radius-pill)] transition-[color,background,border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)] [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-text)] [border-color:var(--badge-neutral-border)]",
        secondary:
          "bg-[var(--badge-brand-bg)] text-[var(--badge-brand-text)] [border-color:var(--badge-brand-border)]",
        destructive:
          "bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)] [border-color:var(--badge-danger-border)]",
        outline:
          "bg-transparent text-[var(--text-secondary)] [border-color:var(--border-default)]",
        ghost: "border-transparent bg-transparent text-[var(--text-secondary)]",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
