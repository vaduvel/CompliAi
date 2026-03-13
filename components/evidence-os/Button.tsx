"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-eos-md text-sm font-medium ring-offset-eos-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eos-primary-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover shadow-sm",
        destructive: "bg-eos-error text-eos-error-text hover:bg-eos-error/90 shadow-sm",
        outline: "border border-eos-border bg-transparent hover:bg-eos-secondary hover:text-eos-secondary-text",
        secondary: "bg-eos-secondary text-eos-secondary-text hover:bg-eos-secondary-hover shadow-sm",
        ghost: "hover:bg-eos-secondary hover:text-eos-secondary-text",
        link: "text-eos-text-link underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2", // Slightly more compact than standard
        sm: "h-8 rounded-eos-sm px-3 text-xs",
        lg: "h-10 rounded-eos-lg px-8",
        icon: "h-9 w-9",
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
