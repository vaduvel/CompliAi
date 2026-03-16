import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import type { EvidenceProposal } from "@/lib/compliance/agent-os"

type AuditReadiness = EvidenceProposal["auditReadiness"]

interface EvidenceReadinessBadgeProps {
  readiness: AuditReadiness
}

export function EvidenceReadinessBadge({ readiness }: EvidenceReadinessBadgeProps) {
  const config = {
    ready: { icon: CheckCircle2, variant: "success" as const, label: "Pregatit" },
    partial: { icon: AlertCircle, variant: "warning" as const, label: "Partial" },
    blocked: { icon: ShieldAlert, variant: "destructive" as const, label: "Blocat" },
  }[readiness]

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="size-3.5" />
      {config.label}
    </Badge>
  )
}
