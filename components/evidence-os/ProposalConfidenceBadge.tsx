import { CheckCircle2, CircleDashed, MinusCircle } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import type { AgentProposalConfidence } from "@/lib/compliance/agent-os"

interface ProposalConfidenceBadgeProps {
  confidence: AgentProposalConfidence
}

export function ProposalConfidenceBadge({ confidence }: ProposalConfidenceBadgeProps) {
  const config = {
    high: { icon: CheckCircle2, variant: "success" as const, label: "Incredere ridicata" },
    medium: { icon: CircleDashed, variant: "warning" as const, label: "Incredere medie" },
    low: { icon: MinusCircle, variant: "outline" as const, label: "Incredere scazuta" },
  }[confidence]

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="size-3.5" />
      {config.label}
    </Badge>
  )
}
