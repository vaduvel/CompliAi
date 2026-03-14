import { AlertTriangle, ShieldCheck, ShieldMinus } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import type { IntakeSystemProposal } from "@/lib/compliance/agent-os"

type RiskClass = IntakeSystemProposal["riskClassSuggested"]

interface RiskClassBadgeProps {
  riskClass?: RiskClass
}

export function RiskClassBadge({ riskClass }: RiskClassBadgeProps) {
  if (!riskClass) {
    return <Badge variant="outline">Necunoscut</Badge>
  }

  const config = {
    minimal: { icon: ShieldCheck, variant: "secondary" as const, label: "Minimal" },
    limited: { icon: ShieldMinus, variant: "warning" as const, label: "Limitat" },
    high: { icon: AlertTriangle, variant: "destructive" as const, label: "Ridicat" },
  }[riskClass]

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
}
