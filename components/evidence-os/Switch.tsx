"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      "bg-eos-surface-elevated",
      "transition-[background-color,box-shadow] duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eos-primary-focus focus-visible:ring-offset-2 focus-visible:ring-offset-eos-bg",
      "disabled:pointer-events-none disabled:opacity-40",
      "data-[state=checked]:bg-eos-primary",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-eos-text-tertiary shadow-sm",
        "transition-transform duration-150",
        "data-[state=checked]:translate-x-4 data-[state=checked]:bg-eos-primary-text",
        "data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = "Switch"

export { Switch }
