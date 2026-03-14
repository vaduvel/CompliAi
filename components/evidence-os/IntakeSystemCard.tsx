import { Ban } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { HumanOversightBadge } from "@/components/evidence-os/HumanOversightBadge"
import { ProposalConfidenceBadge } from "@/components/evidence-os/ProposalConfidenceBadge"
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
    <Card
      className={cn(
        "border-l-4 transition-opacity",
        isRejected ? "border-l-eos-border opacity-60" : "border-l-eos-info"
      )}
    >
      <CardHeader className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isRejected && <Ban className="size-4 text-eos-text-tertiary" />}
            <CardTitle className={cn("text-base", isRejected && "line-through text-eos-text-tertiary")}>
              {system.systemName || "Sistem nedetectat"}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <ProposalConfidenceBadge confidence={system.confidence} />
            <ProposalRejectButton onClick={() => onToggleRejection(system.tempId)} />
          </div>
        </div>
      </CardHeader>
      {!isRejected && (
        <CardContent className="space-y-3 px-4 py-3 text-sm">
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
        </CardContent>
      )}
    </Card>
  )
}
