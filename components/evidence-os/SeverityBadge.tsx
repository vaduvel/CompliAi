import { AlertCircle, AlertOctagon, AlertTriangle, Info } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import type { FindingProposal, DriftProposal } from "@/lib/compliance/agent-os"

type Severity = FindingProposal["severity"] | DriftProposal["severity"]

interface SeverityBadgeProps {
  severity: Severity
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = {
    critical: { icon: AlertOctagon, variant: "destructive" as const, label: "Critical" },
    high: { icon: AlertTriangle, variant: "destructive" as const, label: "High" },
    medium: { icon: AlertCircle, variant: "warning" as const, label: "Medium" },
    low: { icon: Info, variant: "secondary" as const, label: "Low" },
  }[severity]

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
}
