"use client"

import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface ProposalSectionHeaderProps {
  title: string
  description: string
  icon: LucideIcon
  className?: string
}

export function ProposalSectionHeader({
  title,
  description,
  icon: Icon,
  className,
}: ProposalSectionHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="flex size-8 items-center justify-center rounded-eos-lg bg-eos-bg-inset">
        <Icon className="size-4 text-eos-primary" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-eos-text">{title}</h4>
        <p className="mt-1 text-xs text-eos-text-muted">{description}</p>
      </div>
    </div>
  )
}
