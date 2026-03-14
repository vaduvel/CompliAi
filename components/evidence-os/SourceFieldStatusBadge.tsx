import { AlertCircle, CheckCircle2, CircleDashed, CircleDot } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import type { SourceFieldStatus } from "@/lib/compliance/agent-os"

interface SourceFieldStatusBadgeProps {
  status: SourceFieldStatus
}

export function SourceFieldStatusBadge({ status }: SourceFieldStatusBadgeProps) {
  const config = {
    detected: { icon: CircleDot, variant: "outline" as const, label: "Detectat" },
    inferred: { icon: CircleDashed, variant: "warning" as const, label: "Inferat" },
    missing: { icon: AlertCircle, variant: "destructive" as const, label: "Lipsa" },
    confirmed_by_user: { icon: CheckCircle2, variant: "default" as const, label: "Confirmat" },
  }[status]

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
}
