"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "h-9 w-full rounded-eos-sm border bg-eos-surface px-2.5 text-[13px] text-eos-text placeholder:text-eos-text-tertiary",
        "transition-[border-color,box-shadow] duration-[120ms]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eos-primary-focus focus-visible:ring-offset-2 focus-visible:ring-offset-eos-bg",
        "disabled:pointer-events-none disabled:opacity-40",
        error
          ? "border-eos-error-border focus-visible:ring-eos-error"
          : "border-eos-border hover:border-eos-border-strong",
        className
      )}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }
