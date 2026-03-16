import * as React from "react"

import { cn } from "@/lib/utils"

interface GuideCardProps {
  title: string
  detail: string
  className?: string
}

export function GuideCard({ title, detail, className }: GuideCardProps) {
  return (
    <div className={cn("rounded-eos-md border border-eos-border bg-eos-bg-inset p-4", className)}>
      <p className="text-sm font-medium text-eos-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-eos-text-muted">{detail}</p>
    </div>
  )
}
