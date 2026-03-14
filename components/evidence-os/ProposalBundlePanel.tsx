"use client"

import * as React from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import type { AgentProposalBundle } from "@/lib/compliance/agent-os"

interface ProposalBundlePanelProps {
  bundle: AgentProposalBundle
  children: React.ReactNode // Content for tabs injected by parent for flexibility
  value?: string
  onValueChange?: (value: string) => void
}

export function ProposalBundlePanel({ bundle, children, value, onValueChange }: ProposalBundlePanelProps) {
  const labelId = React.useId()
  const items = [
    { value: "intake", label: "Sisteme", count: bundle.intake?.proposedSystems?.length ?? 0 },
    { value: "findings", label: "Constatari", count: bundle.findings?.length ?? 0 },
    { value: "drift", label: "Drift", count: bundle.drifts?.length ?? 0 },
    { value: "evidence", label: "Dovezi", count: bundle.evidence ? 1 : 0 },
  ] as const

  return (
    <Tabs
      defaultValue="intake"
      value={value}
      onValueChange={onValueChange}
      className="flex h-full flex-col"
    >
      <div className="border-b border-eos-border-subtle bg-eos-bg-inset px-4 py-2">
        <p id={labelId} className="sr-only">
          Navigatie pentru propunerile generate de Agent Evidence OS
        </p>
        <TabsList className="grid w-full grid-cols-4" aria-labelledby={labelId}>
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="gap-2"
              aria-label={`${item.label}: ${item.count} ${item.count === 1 ? "propunere" : "propuneri"}`}
            >
              <span>{item.label}</span>
              <span
                className="rounded-eos-sm bg-eos-surface-variant px-1.5 py-0.5 text-[11px] font-semibold text-eos-text-muted"
                aria-hidden="true"
              >
                {item.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </Tabs>
  )
}
