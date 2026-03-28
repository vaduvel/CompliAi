"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "group peer h-4 w-4 shrink-0 rounded-[4px] border border-eos-border bg-eos-surface",
      "transition-[background-color,border-color,box-shadow] duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eos-primary-focus focus-visible:ring-offset-2 focus-visible:ring-offset-eos-bg",
      "hover:border-eos-border-strong",
      "disabled:pointer-events-none disabled:opacity-40",
      "data-[state=checked]:border-eos-primary data-[state=checked]:bg-eos-primary",
      "data-[state=indeterminate]:border-eos-primary data-[state=indeterminate]:bg-eos-primary",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-eos-primary-text">
      <Check className="size-3 group-data-[state=indeterminate]:hidden" strokeWidth={3} />
      <Minus className="hidden size-3 group-data-[state=indeterminate]:block" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
