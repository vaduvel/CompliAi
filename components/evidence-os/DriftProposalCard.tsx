import { Ban } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
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
        <span className="flex min-w-0 items-center gap-2">
          {isRejected && <Ban className="size-4 text-eos-text-tertiary" />}
          <span className={cn("break-words [overflow-wrap:anywhere]", isRejected && "line-through text-eos-text-tertiary")}>
            {drift.driftType}
          </span>
        </span>
      }
      titleMeta={
        drift.lawReference ? (
          <p className="text-xs text-eos-text-muted [overflow-wrap:anywhere]">{drift.lawReference}</p>
        ) : undefined
      }
      badges={<SeverityBadge severity={drift.severity} />}
      actions={<ProposalRejectButton onClick={() => onToggleRejection(drift.driftId)} />}
      contentClassName="space-y-4 px-4 py-4 text-sm"
    >
      {!isRejected && (
        <>
          <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Impact</p>
            <p className="mt-1 text-sm text-eos-text [overflow-wrap:anywhere]">{drift.impactSummary}</p>
          </div>

          {drift.rationale && (
            <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset p-3 text-xs text-eos-text-muted">
              <span className="font-semibold text-eos-text">De ce:</span> {drift.rationale}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset p-3 text-xs">
              <span className="font-semibold text-eos-error">Inainte</span>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-eos-text-muted [overflow-wrap:anywhere]">
                {JSON.stringify(drift.before, null, 2)}
              </pre>
            </div>
            <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset p-3 text-xs">
              <span className="font-semibold text-eos-success">Dupa</span>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-eos-text-muted [overflow-wrap:anywhere]">
                {JSON.stringify(drift.after, null, 2)}
              </pre>
            </div>
          </div>

          <div className="space-y-3 border-t border-eos-border pt-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eos-primary">Actiune propusa</span>
              <p className="mt-1 text-sm text-eos-text [overflow-wrap:anywhere]">{drift.nextAction}</p>
            </div>

            {drift.evidenceRequired.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eos-primary">Dovezi necesare</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {drift.evidenceRequired.map((evidence, index) => (
                    <Badge
                      key={`${drift.driftId}-${index}`}
                      variant="outline"
                      className="justify-start normal-case tracking-normal [overflow-wrap:anywhere]"
                    >
                      {evidence}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </ProposalCard>
  )
}
