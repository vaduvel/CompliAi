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
    <div className="relative overflow-hidden rounded-eos-lg border border-eos-warning/25 bg-eos-surface">
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-warning" aria-hidden />
      <header className="flex items-center justify-between border-b border-eos-border-subtle px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="size-3 text-eos-warning" strokeWidth={2} />
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Drift activ
          </p>
        </div>
        <span className="rounded-sm border border-eos-warning/25 bg-eos-warning-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-eos-warning">
          {flagged.length} reverificare · {reopened.length} redeschise
        </span>
      </header>

      <div className="divide-y divide-eos-border-subtle">
        {items.map((finding) => {
          const statusLabel = finding.driftStatus === "reopened" || finding.findingStatus === "open"
            ? "Redeschis"
            : "Needs review"

          return (
            <Link
              key={finding.id}
              href={`/dashboard/resolve/${encodeURIComponent(finding.id)}`}
              className="group flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
            >
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-eos-sm bg-eos-warning-soft text-eos-warning">
                {statusLabel === "Redeschis" ? (
                  <RotateCcw className="size-3" strokeWidth={2} />
                ) : (
                  <AlertTriangle className="size-3" strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold text-eos-text">{finding.title}</p>
                  <span className="rounded-sm border border-eos-warning/25 bg-eos-warning-soft px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-eos-warning">
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-eos-text-tertiary">
                  {finding.driftTriggerReason ?? "A apărut un semnal nou și cazul cere reverificare."}
                </p>
              </div>
              <ChevronRight className="mt-1.5 size-3.5 shrink-0 text-eos-text-tertiary transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
