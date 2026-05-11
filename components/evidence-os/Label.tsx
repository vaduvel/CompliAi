"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-[12.5px] font-medium leading-none tracking-[-0.005em] text-eos-text peer-disabled:cursor-not-allowed peer-disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
