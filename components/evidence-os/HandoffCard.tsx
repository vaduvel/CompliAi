import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { cn } from "@/lib/utils"

interface HandoffCardProps {
  eyebrow?: string
  title: string
  description: string
  checklist?: string[]
  actions?: React.ReactNode
  destinationLabel?: string
  className?: string
}

export function HandoffCard(props: HandoffCardProps) {
  const {
    eyebrow = "Predare",
    title,
    description,
    checklist,
    actions,
    destinationLabel,
    className,
  } = props

  return (
    <Card
      className={cn(
        "bg-[linear-gradient(180deg,var(--eos-surface-secondary),var(--eos-surface-primary))]",
        className
      )}
    >
      <CardHeader className="border-b border-eos-border-subtle pb-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
          {eyebrow}
        </p>
        <CardTitle className="mt-2 text-xl leading-tight [overflow-wrap:anywhere]">
          {title}
        </CardTitle>
        <p className="text-sm leading-6 text-eos-text-muted [overflow-wrap:anywhere]">
          {description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {checklist?.length ? (
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li
                key={item}
                className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-3 py-2 text-sm text-eos-text-muted [overflow-wrap:anywhere]"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {destinationLabel ? (
          <div className="text-xs uppercase tracking-[0.22em] text-eos-text-tertiary">
            {destinationLabel}
          </div>
        ) : null}

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  )
}
