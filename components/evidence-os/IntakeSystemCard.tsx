import { Ban } from "lucide-react"

import { HumanOversightBadge } from "@/components/evidence-os/HumanOversightBadge"
import { ProposalConfidenceBadge } from "@/components/evidence-os/ProposalConfidenceBadge"
import { ProposalCard } from "@/components/evidence-os/ProposalCard"
import { ProposalRejectButton } from "@/components/evidence-os/ProposalRejectButton"
import { RiskClassBadge } from "@/components/evidence-os/RiskClassBadge"
import { SignalBadgeList } from "@/components/evidence-os/SignalBadgeList"
import { SourceFieldStatusBadge } from "@/components/evidence-os/SourceFieldStatusBadge"
import { cn } from "@/lib/utils"
import type { IntakeSystemProposal } from "@/lib/compliance/agent-os"

interface IntakeSystemCardProps {
  system: IntakeSystemProposal
  isRejected: boolean
  onToggleRejection: (id: string) => void
}

export function IntakeSystemCard({
  system,
  isRejected,
  onToggleRejection,
}: IntakeSystemCardProps) {
  return (
    <ProposalCard
      className={cn(
        "border-l-4 transition-opacity",
        isRejected ? "border-l-eos-border opacity-60" : "border-l-eos-info"
      )}
      title={
        <span className="flex items-center gap-2">
          {isRejected && <Ban className="size-4 text-eos-text-tertiary" />}
          <span className={cn(isRejected && "line-through text-eos-text-tertiary")}>
            {system.systemName || "Sistem nedetectat"}
          </span>
        </span>
      }
      titleClassName="text-base"
      badges={<ProposalConfidenceBadge confidence={system.confidence} />}
      actions={<ProposalRejectButton onClick={() => onToggleRejection(system.tempId)} />}
      contentClassName="space-y-3 px-4 py-3 text-sm"
    >
      {!isRejected && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-eos-text-muted">Provider:</span>
              <p>{system.provider || "-"}</p>
            </div>
            <div>
              <span className="text-xs text-eos-text-muted">Model:</span>
              <p>{system.model || "-"}</p>
            </div>
            <div>
              <span className="text-xs text-eos-text-muted">Scop:</span>
              <p>{system.purpose || "-"}</p>
            </div>
            <div>
              <span className="text-xs text-eos-text-muted">Risc sugerat:</span>
              <RiskClassBadge riskClass={system.riskClassSuggested} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-eos-text-muted">Transparenta campuri</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-eos-sm bg-eos-bg-inset px-2 py-2">
                <span className="text-xs text-eos-text-muted">Provider</span>
                <SourceFieldStatusBadge status={system.fieldStatus.provider} />
              </div>
              <div className="flex items-center justify-between rounded-eos-sm bg-eos-bg-inset px-2 py-2">
                <span className="text-xs text-eos-text-muted">Model</span>
                <SourceFieldStatusBadge status={system.fieldStatus.model} />
              </div>
              <div className="flex items-center justify-between rounded-eos-sm bg-eos-bg-inset px-2 py-2">
                <span className="text-xs text-eos-text-muted">Scop</span>
                <SourceFieldStatusBadge status={system.fieldStatus.purpose} />
              </div>
              <div className="flex items-center justify-between rounded-eos-sm bg-eos-bg-inset px-2 py-2">
                <span className="text-xs text-eos-text-muted">Risc</span>
                <SourceFieldStatusBadge status={system.fieldStatus.risk_class} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-eos-text-muted">Control uman</p>
            <HumanOversightBadge status={system.humanOversight} />
          </div>

          <SignalBadgeList signals={system.sourceSignals} title="Semnale sursa" />
        </>
      )}
    </ProposalCard>
  )
}
