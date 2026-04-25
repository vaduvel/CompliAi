import Link from "next/link"
import { AlertTriangle, ChevronRight, RotateCcw } from "lucide-react"

import type { ScanFinding } from "@/lib/compliance/types"

type Props = {
  findings: ScanFinding[]
}

function isRecentReopen(iso?: string) {
  if (!iso) return false
  const timestamp = new Date(iso).getTime()
  if (!Number.isFinite(timestamp)) return false
  return Date.now() - timestamp <= 1000 * 60 * 60 * 24 * 21
}

export function DriftActiveCard({ findings }: Props) {
  const flagged = findings.filter(
    (finding) => finding.findingStatus === "under_monitoring" && finding.driftStatus === "active"
  )
  const reopened = findings.filter(
    (finding) =>
      (finding.driftStatus === "reopened" || isRecentReopen(finding.reopenedFromISO)) &&
      finding.findingStatus === "open"
  )
  const items = [...reopened, ...flagged].slice(0, 3)

  if (items.length === 0) return null

  return (
    <div className="overflow-hidden rounded-eos-xl border border-eos-warning/25 bg-eos-surface-variant">
      <div className="flex items-center justify-between border-b border-eos-border-subtle px-5 py-3.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-eos-warning" strokeWidth={2} />
          <p className="text-[10px] font-medium font-mono uppercase tracking-[0.14em] text-eos-text-tertiary">Drift activ</p>
        </div>
        <span className="rounded-full bg-eos-warning/10 px-2 py-0.5 text-[10px] font-semibold text-eos-warning">
          {flagged.length} în reverificare · {reopened.length} redeschise
        </span>
      </div>

      <div className="divide-y divide-eos-border-subtle">
        {items.map((finding) => {
          const statusLabel = finding.driftStatus === "reopened" || finding.findingStatus === "open"
            ? "Redeschis"
            : "Needs review"

          return (
            <Link
              key={finding.id}
              href={`/dashboard/resolve/${encodeURIComponent(finding.id)}`}
              className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-eos-surface-active"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eos-warning/10">
                {statusLabel === "Redeschis" ? (
                  <RotateCcw className="h-3.5 w-3.5 text-eos-warning" strokeWidth={2} />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-eos-warning" strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-eos-text">{finding.title}</p>
                  <span className="rounded bg-eos-warning/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-eos-warning">
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-eos-text-tertiary">
                  {finding.driftTriggerReason ?? "A apărut un semnal nou și cazul cere reverificare."}
                </p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
