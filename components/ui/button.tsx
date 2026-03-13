import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap [border-radius:var(--button-radius-md)] text-sm font-semibold tracking-[-0.01em] transition-[background,border-color,color,box-shadow,transform] duration-150 ease-[var(--ease-standard)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)] disabled:pointer-events-none disabled:border-[var(--button-disabled-border)] disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--button-disabled-text)] disabled:[box-shadow:none] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] [box-shadow:var(--shadow-emerald-glow-sm)] hover:bg-[var(--action-primary-bg-hover)] active:bg-[var(--action-primary-bg-active)]",
        destructive:
          "border border-transparent bg-[var(--action-danger-bg)] text-[var(--action-danger-text)] [box-shadow:var(--shadow-sm)] hover:bg-[var(--action-danger-bg-hover)] active:bg-[var(--action-danger-bg-active)]",
        outline:
          "border bg-transparent text-[var(--action-outline-text)] [border-color:var(--action-outline-border)] hover:bg-[var(--action-outline-bg-hover)] active:bg-[var(--action-outline-bg-active)]",
        secondary:
          "border text-[var(--action-secondary-text)] [border-color:var(--action-secondary-border)] bg-[var(--action-secondary-bg)] [box-shadow:var(--shadow-sm)] hover:bg-[var(--action-secondary-bg-hover)] active:bg-[var(--action-secondary-bg-active)]",
        ghost:
          "border border-transparent bg-transparent text-[var(--action-ghost-text)] hover:bg-[var(--action-ghost-bg-hover)] active:bg-[var(--action-ghost-bg-active)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[var(--button-height-md)] px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 [border-radius:var(--button-radius-sm)] px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-[var(--button-height-sm)] gap-1.5 [border-radius:var(--button-radius-sm)] px-3 has-[>svg]:px-2.5",
        lg: "h-[var(--button-height-lg)] [border-radius:var(--button-radius-lg)] px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 [border-radius:var(--button-radius-sm)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 [border-radius:var(--button-radius-sm)]",
        "icon-lg": "size-10 [border-radius:var(--button-radius-lg)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
