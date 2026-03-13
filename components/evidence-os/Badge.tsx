import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const evidenceBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap rounded-full transition-[color,background,border-color,box-shadow]",
  {
    variants: {
      variant: {
        default:
          "bg-eos-primary text-eos-primary-text border-transparent shadow-sm",
        secondary:
          "bg-eos-secondary text-eos-secondary-text border-transparent",
        destructive:
          "bg-eos-error text-eos-error-text border-transparent",
        outline: "text-eos-text border-eos-border",
        success:
          "bg-eos-success text-eos-success-text border-transparent",
        warning:
          "bg-eos-warning text-eos-warning-text border-transparent",
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
