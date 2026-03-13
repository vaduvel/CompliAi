"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import { cn } from "@/lib/utils"
import type { AgentProposalConfidence } from "@/lib/compliance/agent-os"

interface ProposalCardProps {
  title: string
  confidence?: AgentProposalConfidence
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function ProposalCard({ title, confidence, children, className, actions }: ProposalCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 bg-eos-bg-inset/50 p-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {confidence && (
            <Badge variant="outline" className="opacity-80">
              {confidence} confidence
            </Badge>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  )
}