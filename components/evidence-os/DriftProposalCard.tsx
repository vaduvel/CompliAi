import { Ban } from "lucide-react"

import { ProposalCard } from "@/components/evidence-os/ProposalCard"
import { ProposalRejectButton } from "@/components/evidence-os/ProposalRejectButton"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { cn } from "@/lib/utils"
import type { DriftProposal } from "@/lib/compliance/agent-os"

interface DriftProposalCardProps {
  drift: DriftProposal
  isRejected: boolean
  onToggleRejection: (id: string) => void
}

export function DriftProposalCard({
  drift,
  isRejected,
  onToggleRejection,
}: DriftProposalCardProps) {
  return (
    <ProposalCard
      className={cn(
        "border-l-4 transition-opacity",
        isRejected ? "border-l-eos-border opacity-60" : "border-l-eos-error"
      )}
      title={
        <span className="flex items-center gap-2">
          {isRejected && <Ban className="size-4 text-eos-text-tertiary" />}
          <span className={cn(isRejected && "line-through text-eos-text-tertiary")}>{drift.driftType}</span>
        </span>
      }
      badges={<SeverityBadge severity={drift.severity} />}
      actions={<ProposalRejectButton onClick={() => onToggleRejection(drift.driftId)} />}
      contentClassName="space-y-3 px-4 py-3 text-sm"
    >
      {!isRejected && (
        <>
          <p>{drift.impactSummary}</p>

          {drift.rationale && (
            <div className="rounded bg-eos-bg-inset p-2 text-xs text-eos-text-muted">
              <span className="font-semibold text-eos-text">De ce:</span> {drift.rationale}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 rounded bg-eos-bg-inset p-2 text-xs">
            <div>
              <span className="font-semibold text-eos-error">Inainte:</span>
              <pre className="mt-1 whitespace-pre-wrap font-mono">{JSON.stringify(drift.before, null, 2)}</pre>
            </div>
            <div>
              <span className="font-semibold text-eos-success">Dupa:</span>
              <pre className="mt-1 whitespace-pre-wrap font-mono">{JSON.stringify(drift.after, null, 2)}</pre>
            </div>
          </div>

          <div className="mt-2 space-y-2 border-t border-eos-border pt-2">
            <div>
              <span className="text-xs font-semibold text-eos-primary">Actiune propusa</span>
              <p className="mt-1 text-xs">{drift.nextAction}</p>
            </div>

            {drift.evidenceRequired.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-eos-primary">Dovezi necesare</span>
                <ul className="mt-1 list-disc list-inside text-xs text-eos-text-muted">
                  {drift.evidenceRequired.map((evidence, index) => (
                    <li key={index}>{evidence}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </ProposalCard>
  )
}
