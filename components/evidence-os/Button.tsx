"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-eos-md border text-center text-sm font-medium leading-5 ring-offset-eos-bg transition-[color,background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eos-primary-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "border-transparent bg-eos-primary text-eos-primary-text shadow-sm hover:bg-eos-primary-hover",
        destructive: "border-eos-error-border bg-eos-error-soft text-eos-error hover:bg-eos-error hover:text-white",
        outline: "border-eos-border bg-eos-surface text-eos-text hover:bg-eos-secondary",
        secondary: "border-eos-border bg-eos-secondary text-eos-secondary-text hover:bg-eos-secondary-hover",
        ghost: "border-transparent bg-transparent text-eos-text-muted hover:bg-eos-secondary hover:text-eos-text",
        link: "border-transparent text-eos-text-link underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-7 rounded-eos-sm px-3 text-[12px]",
        lg: "min-h-11 px-5 text-[15px]",
        icon: "h-9 w-9 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
