import { ShieldAlert } from "lucide-react"
import { HumanReviewStateBadge } from "@/components/evidence-os/HumanReviewStateBadge"
import type { HumanReviewState } from "@/lib/compliance/agent-os"
import { cn } from "@/lib/utils"

interface ReviewPolicyCardProps {
  className?: string
  state?: HumanReviewState
}

export function ReviewPolicyCard({ className, state }: ReviewPolicyCardProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-eos-md border border-eos-warning-border border-l-[3px] border-l-eos-warning bg-eos-warning-soft p-3 text-[13px] text-eos-text",
        className
      )}
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-eos-warning" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-eos-text">Review uman obligatoriu</p>
          {state && <HumanReviewStateBadge state={state} />}
        </div>
        <p className="text-eos-text-muted">
          Sistemul nu aplică automat decizii critice. Confirmarea umană rămâne obligatorie pentru audit trail.
        </p>
      </div>
    </div>
  )
}
