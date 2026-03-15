"use client"

import * as React from "react"

import type { HumanReviewState } from "@/lib/compliance/agent-os"

import { Badge } from "@/components/evidence-os/Badge"
import { CommitSummaryCard } from "@/components/evidence-os/CommitSummaryCard"
import { HumanReviewPanel } from "@/components/evidence-os/HumanReviewPanel"
import { HumanReviewStateBadge } from "@/components/evidence-os/HumanReviewStateBadge"
import { ReviewPolicyCard } from "@/components/evidence-os/ReviewPolicyCard"
import { cn } from "@/lib/utils"

interface ReviewDecisionPanelProps {
  systemsCount: number
  findingsCount: number
  driftsCount: number
  rejectedCount?: number
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
  rejectedCount = 0,
  reviewState,
  onConfirm,
  onReject,
  onEdit,
  disabled,
  className,
}: ReviewDecisionPanelProps) {
  const titleId = React.useId()
  const descriptionId = React.useId()
  const remainingTotal = systemsCount + findingsCount + driftsCount
  const reviewDescription =
    remainingTotal === 0
      ? "Nu a ramas nimic de confirmat. Revizuieste lotul sau inchide workspace-ul fara commit."
      : rejectedCount > 0
        ? "Confirmi doar propunerile ramase dupa excluderile facute in review."
        : "Confirmi propunerile agentilor? Acestea intra in starea oficiala a sistemului."

  return (
    <section
      className={cn(
        "flex min-h-[24rem] flex-col gap-4 overflow-hidden rounded-eos-xl border border-eos-border-subtle bg-eos-bg-panel p-4",
        className
      )}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline">Review uman</Badge>
          {reviewState ? <HumanReviewStateBadge state={reviewState} /> : null}
          {rejectedCount > 0 ? <Badge variant="warning">{rejectedCount} excluse</Badge> : null}
        </div>
        <h3 id={titleId} className="text-lg font-semibold text-eos-text">
          Decizie finala
        </h3>
        <p id={descriptionId} className="mt-1 text-xs text-eos-text-muted">
          {reviewDescription}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-auto" aria-label="Sumar impact si politica de review">
        <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Lot ramas pentru commit</p>
          <p className="mt-1 text-sm text-eos-text">
            {remainingTotal === 0
              ? "Nu exista propuneri ramase pentru aplicare."
              : `${remainingTotal} propuneri raman in lotul final.`}
          </p>
          {rejectedCount > 0 ? (
            <p className="mt-2 text-xs text-eos-text-muted">
              Propunerile respinse raman in afara starii oficiale si nu intra in commit.
            </p>
          ) : null}
        </div>
        <CommitSummaryCard
          systemsCount={systemsCount}
          findingsCount={findingsCount}
          driftsCount={driftsCount}
        />
        <ReviewPolicyCard state={reviewState} />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Actiune finala</p>
        <HumanReviewPanel onConfirm={onConfirm} onReject={onReject} onEdit={onEdit} disabled={disabled} />
      </div>
    </section>
  )
}
