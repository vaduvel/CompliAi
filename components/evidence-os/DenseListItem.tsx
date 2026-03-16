import * as React from "react"

import { cn } from "@/lib/utils"

interface DenseListItemProps {
  active?: boolean
  className?: string
  children: React.ReactNode
}

export function DenseListItem({ active, className, children }: DenseListItemProps) {
  return (
    <div
      className={cn(
        "rounded-eos-md border transition",
        active ? "border-eos-border-strong bg-eos-bg-inset" : "border-eos-border bg-eos-surface-variant",
        className
      )}
    >
      {children}
    </div>
  )
}
