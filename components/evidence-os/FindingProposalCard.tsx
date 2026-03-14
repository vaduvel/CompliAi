import { Ban } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { ProposalConfidenceBadge } from "@/components/evidence-os/ProposalConfidenceBadge"
import { ProposalCard } from "@/components/evidence-os/ProposalCard"
import { ProposalRejectButton } from "@/components/evidence-os/ProposalRejectButton"
import { SignalBadgeList } from "@/components/evidence-os/SignalBadgeList"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { cn } from "@/lib/utils"
import type { FindingProposal } from "@/lib/compliance/agent-os"

interface FindingProposalCardProps {
  finding: FindingProposal
  isRejected: boolean
  onToggleRejection: (id: string) => void
}

export function FindingProposalCard({
  finding,
  isRejected,
  onToggleRejection,
}: FindingProposalCardProps) {
  return (
    <ProposalCard
      className={cn(
        "border-l-4 transition-opacity",
        isRejected ? "border-l-eos-border opacity-60" : "border-l-eos-warning"
      )}
      title={
        <span className="flex items-center gap-2">
          {isRejected && <Ban className="size-4 text-eos-text-tertiary" />}
          <span className={cn(isRejected && "line-through text-eos-text-tertiary")}>{finding.issue}</span>
        </span>
      }
      badges={
        <>
          <ProposalConfidenceBadge confidence={finding.confidence} />
          <SeverityBadge severity={finding.severity} />
        </>
      }
      actions={<ProposalRejectButton onClick={() => onToggleRejection(finding.findingId)} />}
      contentClassName="space-y-3 px-4 py-3 text-sm"
    >
      {!isRejected && (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="normal-case tracking-normal">
              Principiu: {finding.principle}
            </Badge>
            {finding.lawReference && (
              <Badge variant="outline" className="normal-case tracking-normal">
                Referinta: {finding.lawReference}
              </Badge>
            )}
          </div>

          <p className="text-eos-text-muted">{finding.rationale}</p>

          <div className="rounded bg-eos-bg-inset p-2 text-xs">
            <span className="font-semibold">Remediere propusa: </span>
            {finding.recommendedFix}
          </div>

          <SignalBadgeList signals={finding.sourceSignals} title="Semnale sursa" />
        </>
      )}
    </ProposalCard>
  )
}
