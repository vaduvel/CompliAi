"use client"

import { AlertTriangle, LayoutTemplate, Scale, ShieldAlert } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { EvidenceReadinessCard } from "@/components/evidence-os/EvidenceReadinessCard"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { FindingProposalCard } from "@/components/evidence-os/FindingProposalCard"
import { DriftProposalCard } from "@/components/evidence-os/DriftProposalCard"
import { IntakeSystemCard } from "@/components/evidence-os/IntakeSystemCard"
import { ProposalBundlePanel } from "@/components/evidence-os/ProposalBundlePanel"
import { ProposalSectionHeader } from "@/components/evidence-os/ProposalSectionHeader"
import { TabsContent } from "@/components/evidence-os/Tabs"
import { ScrollArea } from "@/components/evidence-os/ScrollArea"
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
  const systems = bundle.intake?.proposedSystems ?? []
  const findings = bundle.findings ?? []
  const drifts = bundle.drifts ?? []
  const rejectedSystemsCount = systems.filter((system) => rejectedIds.has(system.tempId)).length
  const rejectedFindingsCount = findings.filter((finding) => rejectedIds.has(finding.findingId)).length
  const rejectedDriftsCount = drifts.filter((drift) => rejectedIds.has(drift.driftId)).length

  return (
    <ProposalBundlePanel bundle={bundle} value={value} onValueChange={onValueChange}>
      <div className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full pr-4">
          <TabsContent value="intake" className="m-0 space-y-4">
            <ProposalSectionHeader
              title="Sisteme propuse"
              description="Review pe inventarul detectat si pe clasificarea sugerata."
              icon={LayoutTemplate}
            />
            <SectionSummary
              totalLabel={`${systems.length} propuneri`}
              remainingLabel={`${systems.length - rejectedSystemsCount} ramase pentru commit`}
              rejectedLabel={rejectedSystemsCount > 0 ? `${rejectedSystemsCount} respinse` : undefined}
            />
            {systems.map((system) => (
              <IntakeSystemCard
                key={system.tempId}
                system={system}
                isRejected={rejectedIds.has(system.tempId)}
                onToggleRejection={onToggleRejection}
              />
            ))}
            {!systems.length && <EmptyState label="Nu au fost detectate sisteme AI." />}
          </TabsContent>

          <TabsContent value="findings" className="m-0 space-y-4">
            <ProposalSectionHeader
              title="Constatari propuse"
              description="Probleme detectate, rationale si remediere sugerata."
              icon={AlertTriangle}
            />
            <SectionSummary
              totalLabel={`${findings.length} constatari`}
              remainingLabel={`${findings.length - rejectedFindingsCount} ramase pentru commit`}
              rejectedLabel={rejectedFindingsCount > 0 ? `${rejectedFindingsCount} respinse` : undefined}
            />
            {findings.map((finding) => (
              <FindingProposalCard
                key={finding.findingId}
                finding={finding}
                isRejected={rejectedIds.has(finding.findingId)}
                onToggleRejection={onToggleRejection}
              />
            ))}
            {!findings.length && <EmptyState label="Nu au fost detectate probleme de conformitate." />}
          </TabsContent>

          <TabsContent value="drift" className="m-0 space-y-4">
            <ProposalSectionHeader
              title="Drift propus"
              description="Schimbari fata de baseline-ul aprobat si pasii sugerati."
              icon={Scale}
            />
            <SectionSummary
              totalLabel={`${drifts.length} drifturi`}
              remainingLabel={`${drifts.length - rejectedDriftsCount} ramase pentru commit`}
              rejectedLabel={rejectedDriftsCount > 0 ? `${rejectedDriftsCount} respinse` : undefined}
            />
            {drifts.map((drift) => (
              <DriftProposalCard
                key={drift.driftId}
                drift={drift}
                isRejected={rejectedIds.has(drift.driftId)}
                onToggleRejection={onToggleRejection}
              />
            ))}
            {!drifts.length && <EmptyState label="Nu au fost detectate schimbari fata de baseline." />}
          </TabsContent>

          <TabsContent value="evidence" className="m-0 space-y-4">
            <ProposalSectionHeader
              title="Stare dovezi"
              description="Pregatirea documentara pentru review si audit."
              icon={ShieldAlert}
            />
            <SectionSummary
              totalLabel={bundle.evidence ? "1 pachet de dovezi" : "0 pachete"}
              remainingLabel={bundle.evidence ? "gata pentru review" : "fara pachet generat"}
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

function SectionSummary({
  totalLabel,
  remainingLabel,
  rejectedLabel,
}: {
  totalLabel: string
  remainingLabel: string
  rejectedLabel?: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">{totalLabel}</Badge>
      <Badge variant="secondary">{remainingLabel}</Badge>
      {rejectedLabel ? <Badge variant="warning">{rejectedLabel}</Badge> : null}
    </div>
  )
}
