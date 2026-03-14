"use client"

import * as React from "react"

import { AgentProposalTabs } from "@/components/evidence-os/AgentProposalTabs"
import { AgentReviewLayout } from "@/components/evidence-os/AgentReviewLayout"
import { AgentStartStateCard } from "@/components/evidence-os/AgentStartStateCard"
import { ProposalColumnShell } from "@/components/evidence-os/ProposalColumnShell"
import { ReviewDecisionPanel } from "@/components/evidence-os/ReviewDecisionPanel"
import { SourceContextPanel } from "@/components/evidence-os/SourceContextPanel"
import type { AgentProposalBundle, SourceEnvelope } from "@/lib/compliance/agent-os"

interface AgentWorkspaceProps {
  sourceEnvelope: SourceEnvelope
  bundle: AgentProposalBundle | null
  loading: boolean
  onRunAgents: () => void
  onCommit: (bundle: AgentProposalBundle) => void | Promise<void>
  onCancel: () => void
}

export function AgentWorkspace({
  sourceEnvelope,
  bundle,
  loading,
  onRunAgents,
  onCommit,
  onCancel,
}: AgentWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState("intake")
  const [rejectedIds, setRejectedIds] = React.useState<Set<string>>(new Set())

  const toggleRejection = (id: string) => {
    const next = new Set(rejectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setRejectedIds(next)
  }

  const handleCommit = () => {
    if (!bundle) return

    const finalBundle: AgentProposalBundle = {
      ...bundle,
      intake: bundle.intake
        ? {
            ...bundle.intake,
            proposedSystems: bundle.intake.proposedSystems.filter((system) => !rejectedIds.has(system.tempId)),
          }
        : bundle.intake,
      findings: bundle.findings?.filter((finding) => !rejectedIds.has(finding.findingId)) ?? [],
      drifts: bundle.drifts?.filter((drift) => !rejectedIds.has(drift.driftId)) ?? [],
      evidence: bundle.evidence,
    }

    void onCommit(finalBundle)
  }

  if (!bundle && !loading) {
    return <AgentStartStateCard sourceName={sourceEnvelope.sourceName} onRunAgents={onRunAgents} />
  }

  return (
    <AgentReviewLayout
      context={<SourceContextPanel envelope={sourceEnvelope} />}
      proposals={
        <ProposalColumnShell loading={loading}>
          {bundle ? (
            <AgentProposalTabs
              bundle={bundle}
              value={activeTab}
              onValueChange={setActiveTab}
              rejectedIds={rejectedIds}
              onToggleRejection={toggleRejection}
            />
          ) : null}
        </ProposalColumnShell>
      }
      review={
        <ReviewDecisionPanel
          systemsCount={bundle?.intake?.proposedSystems.filter((system) => !rejectedIds.has(system.tempId)).length || 0}
          findingsCount={bundle?.findings?.filter((finding) => !rejectedIds.has(finding.findingId)).length || 0}
          driftsCount={bundle?.drifts?.filter((drift) => !rejectedIds.has(drift.driftId)).length || 0}
          reviewState={bundle?.reviewState}
          onConfirm={handleCommit}
          onReject={onCancel}
          disabled={!bundle || loading}
        />
      }
    />
  )
}
