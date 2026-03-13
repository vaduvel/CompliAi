"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import type { AgentProposalBundle } from "@/lib/compliance/agent-os"

interface ProposalBundlePanelProps {
  bundle: AgentProposalBundle
  children: React.ReactNode // Content for tabs injected by parent for flexibility
}

export function ProposalBundlePanel({ bundle, children }: ProposalBundlePanelProps) {
  return (
    <Tabs defaultValue="intake" className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-eos-border bg-eos-bg-inset/30">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="intake">
            Intake {bundle.intake ? `(${bundle.intake.proposedSystems.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="findings">
            Findings {bundle.findings ? `(${bundle.findings.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="drift">
            Drift {bundle.drifts ? `(${bundle.drifts.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="evidence">
            Evidence
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </Tabs>
  )
}
