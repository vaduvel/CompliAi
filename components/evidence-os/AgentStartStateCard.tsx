"use client"

import { Bot, Sparkles } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import { Card } from "@/components/evidence-os/Card"
import { cn } from "@/lib/utils"

interface AgentStartStateCardProps {
  sourceName: string
  onRunAgents?: () => void
  action?: React.ReactNode
  className?: string
}

export function AgentStartStateCard({
  sourceName,
  onRunAgents,
  action,
  className,
}: AgentStartStateCardProps) {
  return (
    <Card className={cn("border-2 border-dashed border-eos-border p-8 text-center", className)}>
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-eos-bg-inset">
        <Bot className="size-6 text-eos-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-eos-text">Agent Evidence OS</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-eos-text-muted">
        Ruleaza suita de agenti pentru a analiza <strong>{sourceName}</strong>. Sistemul va propune
        inventarul, riscurile si dovezile necesare.
      </p>
      {action ?? (
        <Button onClick={onRunAgents} className="mt-6" size="lg" disabled={!onRunAgents}>
          <Sparkles className="mr-2 size-4" />
          Activeaza agentii
        </Button>
      )}
    </Card>
  )
}
