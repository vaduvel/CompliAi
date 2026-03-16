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
        <span className="flex min-w-0 items-center gap-2">
          {isRejected && <Ban className="size-4 text-eos-text-tertiary" />}
          <span className={cn("break-words [overflow-wrap:anywhere]", isRejected && "line-through text-eos-text-tertiary")}>
            {system.systemName || "Sistem nedetectat"}
          </span>
        </span>
      }
      titleClassName="text-base"
      titleMeta={
        system.provider || system.model ? (
          <p className="text-xs text-eos-text-muted [overflow-wrap:anywhere]">
            {[system.provider, system.model].filter(Boolean).join(" · ")}
          </p>
        ) : undefined
      }
      badges={<ProposalConfidenceBadge confidence={system.confidence} />}
      actions={<ProposalRejectButton onClick={() => onToggleRejection(system.tempId)} />}
      contentClassName="space-y-4 px-4 py-4 text-sm"
    >
      {!isRejected && (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <MetadataBlock label="Provider" value={system.provider || "Nespecificat"} />
            <MetadataBlock label="Model" value={system.model || "Nespecificat"} />
            <MetadataBlock label="Scop" value={system.purpose || "Nespecificat"} />
            <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset p-3">
              <p className="text-xs text-eos-text-muted">Risc sugerat</p>
              <div className="mt-2">
                <RiskClassBadge riskClass={system.riskClassSuggested} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Transparenta campuri</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-3 py-2">
                <span className="text-xs text-eos-text-muted">Provider</span>
                <SourceFieldStatusBadge status={system.fieldStatus.provider} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-3 py-2">
                <span className="text-xs text-eos-text-muted">Model</span>
                <SourceFieldStatusBadge status={system.fieldStatus.model} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-3 py-2">
                <span className="text-xs text-eos-text-muted">Scop</span>
                <SourceFieldStatusBadge status={system.fieldStatus.purpose} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-3 py-2">
                <span className="text-xs text-eos-text-muted">Risc</span>
                <SourceFieldStatusBadge status={system.fieldStatus.risk_class} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Control uman</p>
            <HumanOversightBadge status={system.humanOversight} />
          </div>

          <SignalBadgeList signals={system.sourceSignals} title="Semnale sursa" />
        </>
      )}
    </ProposalCard>
  )
}

function MetadataBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset p-3">
      <p className="text-xs text-eos-text-muted">{label}</p>
      <p className="mt-1 break-words text-sm text-eos-text [overflow-wrap:anywhere]">{value}</p>
    </div>
  )
}
