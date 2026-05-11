"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[80px] w-full resize-y rounded-eos-sm border bg-eos-surface px-2.5 py-2 text-[13px] leading-[1.5] text-eos-text placeholder:text-eos-text-tertiary",
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
Textarea.displayName = "Textarea"

export { Textarea }
