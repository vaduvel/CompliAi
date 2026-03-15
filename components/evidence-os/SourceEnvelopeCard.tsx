"use client"

import { FileText, FileCode2, ScanText, ShieldAlert } from "lucide-react"
import { Card } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import type { SourceEnvelope } from "@/lib/compliance/agent-os"

interface SourceEnvelopeCardProps {
  envelope: SourceEnvelope
}

export function SourceEnvelopeCard({ envelope }: SourceEnvelopeCardProps) {
  const Icon = {
    document: FileText,
    manifest: FileCode2,
    text: ScanText,
    yaml: ShieldAlert,
  }[envelope.sourceType] || FileText

  const sourceTypeLabel = {
    document: "Document",
    manifest: "Manifest",
    text: "Text extras",
    yaml: "Fisier YAML",
  }[envelope.sourceType]

  return (
    <Card className="border-eos-border-subtle bg-eos-bg-panel p-4">
      <div className="flex items-start gap-4">
        <div className="flex size-10 items-center justify-center rounded-eos-md bg-eos-bg-inset text-eos-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p
            className="break-words text-sm font-medium leading-5 text-eos-text [overflow-wrap:anywhere]"
            title={envelope.sourceName}
          >
            {envelope.sourceName}
          </p>
          <p className="text-xs uppercase tracking-[0.01em] text-eos-text-muted">{sourceTypeLabel}</p>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 self-start"
          aria-label={`${envelope.sourceSignals.length} semnale detectate`}
        >
          {envelope.sourceSignals.length} semnale
        </Badge>
      </div>
    </Card>
  )
}
