import { Ban } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { ProposalConfidenceBadge } from "@/components/evidence-os/ProposalConfidenceBadge"
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
    <Card
      className={cn(
        "border-l-4 transition-opacity",
        isRejected ? "border-l-eos-border opacity-60" : "border-l-eos-warning"
      )}
    >
      <CardHeader className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isRejected && <Ban className="size-4 text-eos-text-tertiary" />}
            <CardTitle className={cn("text-sm font-medium", isRejected && "line-through text-eos-text-tertiary")}>
              {finding.issue}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <ProposalConfidenceBadge confidence={finding.confidence} />
            <SeverityBadge severity={finding.severity} />
            <ProposalRejectButton onClick={() => onToggleRejection(finding.findingId)} />
          </div>
        </div>
      </CardHeader>
      {!isRejected && (
        <CardContent className="space-y-3 px-4 py-3 text-sm">
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
        </CardContent>
      )}
    </Card>
  )
}
