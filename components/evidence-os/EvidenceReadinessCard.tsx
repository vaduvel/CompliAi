import { FileText } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { ControlCoverageBadge } from "@/components/evidence-os/ControlCoverageBadge"
import { EvidenceChecklistCard } from "@/components/evidence-os/EvidenceChecklistCard"
import { EvidenceReadinessBadge } from "@/components/evidence-os/EvidenceReadinessBadge"
import { Separator } from "@/components/evidence-os/Separator"
import { cn } from "@/lib/utils"
import type { EvidenceProposal } from "@/lib/compliance/agent-os"

interface EvidenceReadinessCardProps {
  evidence: EvidenceProposal
  className?: string
}

export function EvidenceReadinessCard({ evidence, className }: EvidenceReadinessCardProps) {
  const coveredCount = evidence.controlCoverage.filter((item) => item.status === "covered").length
  const partialCount = evidence.controlCoverage.filter((item) => item.status === "partial").length
  const missingCount = evidence.controlCoverage.filter((item) => item.status === "missing").length

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="border-eos-border-subtle bg-eos-bg-panel">
        <CardHeader className="px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-eos-text">Pregatire audit</CardTitle>
              <p className="text-xs text-eos-text-muted">Starea documentara si gradul de acoperire al dovezilor.</p>
            </div>
            <EvidenceReadinessBadge readiness={evidence.auditReadiness} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-eos-text-muted">
              {evidence.controlCoverage.length} controale mapate in starea curenta.
            </p>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 px-4 py-4">
          <div className="rounded-eos-md bg-eos-bg-inset p-3 text-sm text-eos-text-muted">
            {evidence.executiveSummaryDraft}
          </div>

          <div className="flex flex-wrap gap-2">
            <ControlCoverageBadge state="covered" count={coveredCount} />
            <ControlCoverageBadge state="partial" count={partialCount} />
            <ControlCoverageBadge state="missing" count={missingCount} />
          </div>

          {evidence.controlCoverage.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.01em] text-eos-text-muted">
                Acoperire controale
              </p>
              <div className="space-y-2">
                {evidence.controlCoverage.map((item) => (
                  <div
                    key={item.controlId}
                    className="flex items-center justify-between gap-3 rounded-eos-sm bg-eos-bg-inset px-3 py-2"
                  >
                    <span className="text-sm text-eos-text">{item.controlId}</span>
                    <ControlCoverageBadge state={item.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.01em] text-eos-text-muted">Dovezi lipsa</p>
            {evidence.missingEvidence.length > 0 ? (
              <ul className="space-y-2">
                {evidence.missingEvidence.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-eos-text-muted">
                    <FileText className="mt-0.5 size-4 shrink-0 text-eos-warning" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-eos-text-muted">Nu exista dovezi lipsa critice.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <EvidenceChecklistCard items={evidence.stakeholderChecklist} />
    </div>
  )
}
