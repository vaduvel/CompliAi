"use client"

import * as React from "react"

import type { HumanReviewState } from "@/lib/compliance/agent-os"

import { Badge } from "@/components/evidence-os/Badge"
import { CommitSummaryCard } from "@/components/evidence-os/CommitSummaryCard"
import { HumanReviewPanel } from "@/components/evidence-os/HumanReviewPanel"
import { ReviewPolicyCard } from "@/components/evidence-os/ReviewPolicyCard"
import { cn } from "@/lib/utils"

interface ReviewDecisionPanelProps {
  systemsCount: number
  findingsCount: number
  driftsCount: number
  reviewState?: HumanReviewState
  onConfirm: () => void
  onReject: () => void
  onEdit?: () => void
  disabled?: boolean
  className?: string
}

export function ReviewDecisionPanel({
  systemsCount,
  findingsCount,
  driftsCount,
  reviewState,
  onConfirm,
  onReject,
  onEdit,
  disabled,
  className,
}: ReviewDecisionPanelProps) {
  const titleId = React.useId()
  const descriptionId = React.useId()

  return (
    <section
      className={cn(
        "flex flex-col gap-4 overflow-hidden rounded-eos-xl border border-eos-border-subtle bg-eos-bg-panel p-4",
        className
      )}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div>
        <Badge variant="outline" className="mb-2">
          Review uman
        </Badge>
        <h3 id={titleId} className="text-lg font-semibold text-eos-text">
          Decizie finala
        </h3>
        <p id={descriptionId} className="mt-1 text-xs text-eos-text-muted">
          Confirmi propunerile agentilor? Acestea vor intra in starea oficiala a sistemului.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-auto" aria-label="Sumar impact si politica de review">
        <CommitSummaryCard
          systemsCount={systemsCount}
          findingsCount={findingsCount}
          driftsCount={driftsCount}
        />
        <ReviewPolicyCard state={reviewState} />
      </div>

      <HumanReviewPanel onConfirm={onConfirm} onReject={onReject} onEdit={onEdit} disabled={disabled} />
    </section>
  )
}
