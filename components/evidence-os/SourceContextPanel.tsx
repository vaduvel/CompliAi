"use client"

import * as React from "react"

import { Badge } from "@/components/evidence-os/Badge"
import { Separator } from "@/components/evidence-os/Separator"
import { SignalBadgeList } from "@/components/evidence-os/SignalBadgeList"
import { SourceEnvelopeCard } from "@/components/evidence-os/SourceEnvelopeCard"
import { ScrollArea } from "@/components/evidence-os/ScrollArea"
import { cn } from "@/lib/utils"
import type { SourceEnvelope } from "@/lib/compliance/agent-os"

interface SourceContextPanelProps {
  envelope: SourceEnvelope
  className?: string
}

export function SourceContextPanel({ envelope, className }: SourceContextPanelProps) {
  const headingId = React.useId()
  const signalsId = React.useId()
  const previewId = React.useId()

  return (
    <section
      className={cn(
        "flex flex-col gap-4 overflow-hidden rounded-eos-xl border border-eos-border-subtle bg-eos-bg-panel p-4",
        className
      )}
      aria-labelledby={headingId}
    >
      <div>
        <Badge variant="outline" className="mb-2">
          Context sursa
        </Badge>
        <h3
          id={headingId}
          className="break-words text-lg font-semibold text-eos-text [overflow-wrap:anywhere]"
          title={envelope.sourceName}
        >
          {envelope.sourceName}
        </h3>
        <p className="mt-1 text-xs uppercase tracking-[0.01em] text-eos-text-muted">
          Context pentru decizia de audit
        </p>
      </div>

      <Separator />

      <ScrollArea className="flex-1" aria-label="Detalii context sursa">
        <div className="space-y-4 pr-4">
          <SourceEnvelopeCard envelope={envelope} />

          <section aria-labelledby={signalsId}>
            <p id={signalsId} className="sr-only">
              Semnale detectate
            </p>
            <SignalBadgeList
              signals={envelope.sourceSignals}
              title="Semnale detectate"
              showEmpty
              emptyLabel="Fără semnale brute"
            />
          </section>

          {envelope.rawText && (
            <section className="space-y-2" aria-labelledby={previewId}>
              <p id={previewId} className="text-xs font-medium text-eos-text-muted">
                Preview continut
              </p>
              <pre className="line-clamp-[10] overflow-hidden whitespace-pre-wrap rounded-eos-md bg-eos-bg-inset p-3 text-[10px] font-mono text-eos-text-muted [overflow-wrap:anywhere]">
                {envelope.rawText}
              </pre>
            </section>
          )}
        </div>
      </ScrollArea>
    </section>
  )
}
