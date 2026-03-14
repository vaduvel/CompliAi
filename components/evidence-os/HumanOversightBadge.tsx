import { AlertTriangle, CheckCircle2, CircleHelp, ShieldAlert } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import type { IntakeSystemProposal } from "@/lib/compliance/agent-os"

type HumanOversight = IntakeSystemProposal["humanOversight"]

interface HumanOversightBadgeProps {
  status: HumanOversight
}

export function HumanOversightBadge({ status }: HumanOversightBadgeProps) {
  const config = {
    required: { icon: AlertTriangle, variant: "warning" as const, label: "Oversight cerut" },
    present: { icon: CheckCircle2, variant: "success" as const, label: "Oversight prezent" },
    missing: { icon: ShieldAlert, variant: "destructive" as const, label: "Oversight lipsa" },
    unknown: { icon: CircleHelp, variant: "outline" as const, label: "Oversight necunoscut" },
  }[status]

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
}
