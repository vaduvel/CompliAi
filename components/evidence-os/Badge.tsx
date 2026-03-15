import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex max-w-full items-center justify-center gap-1 rounded-eos-sm border px-2 py-1 text-center text-[12px] font-medium uppercase leading-4 tracking-[0.01em] [overflow-wrap:anywhere] transition-[color,background,border-color,box-shadow]",
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

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

export function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="evidence-badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { badgeVariants }
