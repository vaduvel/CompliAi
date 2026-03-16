"use client"

import { Badge } from "@/components/evidence-os/Badge"
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import type { AgentRunStatus } from "@/lib/compliance/agent-os"

interface AgentRunBadgeProps {
  status: AgentRunStatus
}

export function AgentRunBadge({ status }: AgentRunBadgeProps) {
  if (status === "running") {
    return (
      <Badge variant="warning" className="gap-1">
        <Loader2 className="size-3.5 animate-spin" />
        In rulare
      </Badge>
    )
  }

  const config = {
    queued: { icon: Clock, variant: "outline" as const, label: "In coada" },
    completed: { icon: CheckCircle2, variant: "success" as const, label: "Finalizat" },
    failed: { icon: XCircle, variant: "destructive" as const, label: "Esuat" },
    cancelled: { icon: XCircle, variant: "secondary" as const, label: "Anulat" },
  }[status] || { icon: Clock, variant: "secondary" as const, label: status }

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="size-3.5" />
      {config.label}
    </Badge>
  )
}
