import { CheckCheck, CheckCircle2, ShieldAlert, XCircle } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import type { HumanReviewState } from "@/lib/compliance/agent-os"

interface HumanReviewStateBadgeProps {
  state: HumanReviewState
}

export function HumanReviewStateBadge({ state }: HumanReviewStateBadgeProps) {
  const config = {
    needs_review: { icon: ShieldAlert, variant: "outline" as const, label: "Necesita review" },
    partially_confirmed: { icon: CheckCircle2, variant: "warning" as const, label: "Confirmat partial" },
    confirmed: { icon: CheckCheck, variant: "default" as const, label: "Confirmat" },
    rejected: { icon: XCircle, variant: "secondary" as const, label: "Respins" },
  }[state]

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
}
