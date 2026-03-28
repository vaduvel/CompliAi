"use client"

import { Bot, Sparkles } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
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
    <Card
      className={cn(
        "border-2 border-dashed border-eos-border p-6 text-center sm:p-8",
        className
      )}
    >
      <div className="flex flex-wrap justify-center gap-2">
        <Badge variant="outline">Spațiu agent</Badge>
        <Badge variant="secondary">Pregatit de rulare</Badge>
      </div>
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-eos-bg-inset">
        <Bot className="size-6 text-eos-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-eos-text">Agent Evidence OS</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-eos-text-muted [overflow-wrap:anywhere]">
        Ruleaza suita de agenti pentru a analiza <strong>{sourceName}</strong>. Sistemul va propune
        inventarul, riscurile si dovezile necesare.
      </p>
      <div className="mx-auto mt-4 max-w-lg rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset p-3 text-left">
        <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Sursa selectata</p>
        <p className="mt-1 break-words text-sm text-eos-text [overflow-wrap:anywhere]">{sourceName}</p>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Badge variant="outline">sisteme</Badge>
        <Badge variant="outline">constatari</Badge>
        <Badge variant="outline">dovezi</Badge>
      </div>
      {action ?? (
        <Button onClick={onRunAgents} className="mt-6" size="lg" disabled={!onRunAgents}>
          <Sparkles className="mr-2 size-4" />
          Activeaza agentii
        </Button>
      )}
    </Card>
  )
}
