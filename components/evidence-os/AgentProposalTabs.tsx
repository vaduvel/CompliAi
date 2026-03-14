"use client"

import { AlertTriangle, LayoutTemplate, Scale, ShieldAlert } from "lucide-react"

import { EvidenceReadinessCard } from "@/components/evidence-os/EvidenceReadinessCard"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { FindingProposalCard } from "@/components/evidence-os/FindingProposalCard"
import { DriftProposalCard } from "@/components/evidence-os/DriftProposalCard"
import { IntakeSystemCard } from "@/components/evidence-os/IntakeSystemCard"
import { ProposalBundlePanel } from "@/components/evidence-os/ProposalBundlePanel"
import { ProposalSectionHeader } from "@/components/evidence-os/ProposalSectionHeader"
import { TabsContent } from "@/components/evidence-os/Tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AgentProposalBundle } from "@/lib/compliance/agent-os"

interface AgentProposalTabsProps {
  bundle: AgentProposalBundle
  value: string
  onValueChange: (value: string) => void
  rejectedIds: ReadonlySet<string>
  onToggleRejection: (id: string) => void
}

export function AgentProposalTabs({
  bundle,
  value,
  onValueChange,
  rejectedIds,
  onToggleRejection,
}: AgentProposalTabsProps) {
  return (
    <ProposalBundlePanel bundle={bundle} value={value} onValueChange={onValueChange}>
      <div className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full pr-4">
          <TabsContent value="intake" className="m-0 space-y-4">
            <ProposalSectionHeader
              title="Intake agent"
              description="Sisteme AI identificate si propuneri de clasificare."
              icon={LayoutTemplate}
            />
            {bundle.intake?.proposedSystems?.map((system) => (
              <IntakeSystemCard
                key={system.tempId}
                system={system}
                isRejected={rejectedIds.has(system.tempId)}
                onToggleRejection={onToggleRejection}
              />
            ))}
            {!bundle.intake?.proposedSystems?.length && <EmptyState label="Nu au fost detectate sisteme AI." />}
          </TabsContent>

          <TabsContent value="findings" className="m-0 space-y-4">
            <ProposalSectionHeader
              title="Agent de constatari"
              description="Probleme de conformitate detectate si reguli incalcate."
              icon={AlertTriangle}
            />
            {bundle.findings?.map((finding) => (
              <FindingProposalCard
                key={finding.findingId}
                finding={finding}
                isRejected={rejectedIds.has(finding.findingId)}
                onToggleRejection={onToggleRejection}
              />
            ))}
            {!bundle.findings?.length && <EmptyState label="Nu au fost detectate probleme de conformitate." />}
          </TabsContent>

          <TabsContent value="drift" className="m-0 space-y-4">
            <ProposalSectionHeader
              title="Agent de drift"
              description="Schimbari fata de baseline-ul aprobat."
              icon={Scale}
            />
            {bundle.drifts?.map((drift) => (
              <DriftProposalCard
                key={drift.driftId}
                drift={drift}
                isRejected={rejectedIds.has(drift.driftId)}
                onToggleRejection={onToggleRejection}
              />
            ))}
            {!bundle.drifts?.length && <EmptyState label="Nu au fost detectate schimbari fata de baseline." />}
          </TabsContent>

          <TabsContent value="evidence" className="m-0 space-y-4">
            <ProposalSectionHeader
              title="Agent de dovezi"
              description="Starea documentara si pregatirea pentru audit."
              icon={ShieldAlert}
            />
            {bundle.evidence ? (
              <EvidenceReadinessCard evidence={bundle.evidence} />
            ) : (
              <EmptyState label="Nu exista inca un pachet de dovezi generat pentru aceasta sursa." />
            )}
          </TabsContent>
        </ScrollArea>
      </div>
    </ProposalBundlePanel>
  )
}
