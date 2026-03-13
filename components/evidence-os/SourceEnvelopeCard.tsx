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
    repo: FileCode2
  }[envelope.sourceType] || FileText

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="flex size-10 items-center justify-center rounded-eos-md bg-eos-bg-inset text-eos-primary">
        <Icon className="size-5" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none text-eos-text">{envelope.sourceName}</p>
        <p className="text-xs text-eos-text-muted capitalize">{envelope.sourceType}</p>
      </div>
      <Badge variant="outline">{envelope.sourceSignals.length} signals</Badge>
    </Card>
  )
}