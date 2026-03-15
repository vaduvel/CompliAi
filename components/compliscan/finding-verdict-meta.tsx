import { Badge } from "@/components/evidence-os/Badge"
import type { ScanFinding } from "@/lib/compliance/types"

type VerdictBasis = "direct_signal" | "inferred_signal" | undefined

function verdictBasisLabel(basis?: VerdictBasis) {
  if (basis === "direct_signal") return "semnal direct"
  if (basis === "inferred_signal") return "semnal inferat"
  return "bază verdict n/a"
}

function verdictBasisTone(basis?: VerdictBasis) {
  if (basis === "direct_signal") {
    return "border-[var(--color-info)] bg-[var(--color-info-muted)] text-[var(--color-info)]"
  }

  if (basis === "inferred_signal") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }

  return "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
}

function verdictConfidenceLabel(confidence?: ScanFinding["verdictConfidence"]) {
  if (confidence === "high") return "încredere mare"
  if (confidence === "medium") return "încredere medie"
  if (confidence === "low") return "încredere redusă"
  return "încredere n/a"
}

function verdictConfidenceTone(confidence?: ScanFinding["verdictConfidence"]) {
  if (confidence === "high") {
    return "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
  }

  if (confidence === "medium") {
    return "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
  }

  if (confidence === "low") {
    return "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
  }

  return "border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface-muted)]"
}

type FindingVerdictMetaProps = {
  finding: ScanFinding
  className?: string
  showReason?: boolean
}

export function FindingVerdictMeta({
  finding,
  className = "",
  showReason = true,
}: FindingVerdictMetaProps) {
  const hasVerdictMeta = finding.provenance?.verdictBasis || finding.verdictConfidence
  const hasReason = Boolean(finding.verdictConfidenceReason)

  if (!hasVerdictMeta && !hasReason) return null

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {finding.provenance?.verdictBasis && (
          <Badge className={verdictBasisTone(finding.provenance.verdictBasis)}>
            {verdictBasisLabel(finding.provenance.verdictBasis)}
          </Badge>
        )}
        {finding.verdictConfidence && (
          <Badge className={verdictConfidenceTone(finding.verdictConfidence)}>
            {verdictConfidenceLabel(finding.verdictConfidence)}
          </Badge>
        )}
      </div>
      {showReason && finding.verdictConfidenceReason && (
        <p className="mt-2 text-xs leading-6 text-[var(--color-on-surface-muted)]">
          {finding.verdictConfidenceReason}
        </p>
      )}
    </div>
  )
}
