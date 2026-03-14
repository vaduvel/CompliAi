import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const evidenceBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-eos-sm border px-2 py-1 text-[12px] font-medium uppercase tracking-[0.01em] whitespace-nowrap transition-[color,background,border-color,box-shadow]",
  {
    variants: {
      variant: {
        default: "border-transparent bg-eos-primary-soft text-eos-primary shadow-sm",
        secondary: "border-eos-border-subtle bg-eos-surface-variant text-eos-text-muted",
        destructive: "border-transparent bg-eos-error-soft text-eos-error shadow-sm",
        outline: "border-eos-border bg-eos-surface text-eos-text",
        success: "border-transparent bg-eos-success-soft text-eos-success shadow-sm",
        warning: "border-transparent bg-eos-warning-soft text-eos-warning shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof evidenceBadgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="evidence-badge"
      data-variant={variant}
      className={cn(evidenceBadgeVariants({ variant }), className)}
      {...props}
    />
  )
}
