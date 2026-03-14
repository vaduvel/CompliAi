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
        <span className="flex min-w-0 items-center gap-2">
          {isRejected && <Ban className="size-4 text-eos-text-tertiary" />}
          <span className={cn("break-words [overflow-wrap:anywhere]", isRejected && "line-through text-eos-text-tertiary")}>
            {finding.issue}
          </span>
        </span>
      }
      titleMeta={
        finding.ownerSuggestion ? (
          <p className="text-xs text-eos-text-muted [overflow-wrap:anywhere]">
            Responsabil sugerat: {finding.ownerSuggestion}
          </p>
        ) : undefined
      }
      badges={
        <>
          <ProposalConfidenceBadge confidence={finding.confidence} />
          <SeverityBadge severity={finding.severity} />
        </>
      }
      actions={<ProposalRejectButton onClick={() => onToggleRejection(finding.findingId)} />}
      contentClassName="space-y-4 px-4 py-4 text-sm"
    >
      {!isRejected && (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <MetadataBadge label="Principiu" value={finding.principle} />
            {finding.lawReference ? (
              <MetadataBadge label="Referinta" value={finding.lawReference} />
            ) : (
              <MetadataBadge label="Referinta" value="Nespecificata" />
            )}
          </div>

          <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">De ce conteaza</p>
            <p className="mt-1 text-sm text-eos-text-muted [overflow-wrap:anywhere]">{finding.rationale}</p>
          </div>

          <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Remediere propusa</p>
            <p className="mt-1 text-sm text-eos-text [overflow-wrap:anywhere]">{finding.recommendedFix}</p>
          </div>

          <SignalBadgeList signals={finding.sourceSignals} title="Semnale sursa" />
        </>
      )}
    </ProposalCard>
  )
}

function MetadataBadge({ label, value }: { label: string; value: string }) {
  return (
    <Badge variant="outline" className="justify-start normal-case tracking-normal [overflow-wrap:anywhere]">
      {label}: {value}
    </Badge>
  )
}
