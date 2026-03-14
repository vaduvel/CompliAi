import { CheckCircle2, CircleDot, Clock3, PauseCircle, ShieldAlert } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"

export type LifecycleState = "open" | "acknowledged" | "in_progress" | "resolved" | "waived"

interface LifecycleBadgeProps {
  state: LifecycleState
}

export function LifecycleBadge({ state }: LifecycleBadgeProps) {
  const config = {
    open: { icon: ShieldAlert, variant: "destructive" as const, label: "Deschis" },
    acknowledged: { icon: CircleDot, variant: "outline" as const, label: "Confirmat" },
    in_progress: { icon: Clock3, variant: "warning" as const, label: "In progres" },
    resolved: { icon: CheckCircle2, variant: "success" as const, label: "Rezolvat" },
    waived: { icon: PauseCircle, variant: "secondary" as const, label: "Renuntat" },
  }[state]

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
}
