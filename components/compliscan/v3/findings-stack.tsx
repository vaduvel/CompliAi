import { cn } from "@/lib/utils"

/**
 * V3 Findings Stack — bară segmentată 4px (multi-color severity) + sumar numeric tabular.
 * Pattern frozen: critical=red, high=amber, medium=violet (opacity), low=graphite. Total 0 → toate gri.
 */
export type V3FindingsStackSegment = {
  key: "critical" | "high" | "medium" | "low"
  count: number
  label?: string
}

const SEG_BAR: Record<V3FindingsStackSegment["key"], string> = {
  critical: "bg-eos-error",
  high: "bg-eos-warning",
  medium: "bg-eos-primary/70",
  low: "bg-eos-border-strong",
}

const SEG_NUMBER: Record<V3FindingsStackSegment["key"], string> = {
  critical: "text-eos-error",
  high: "text-eos-warning",
  medium: "text-eos-primary",
  low: "text-eos-text-muted",
}

const DEFAULT_LABELS: Record<V3FindingsStackSegment["key"], string> = {
  critical: "crit",
  high: "high",
  medium: "med",
  low: "low",
}

export function V3FindingsStack({
  segments,
  width = 130,
  className,
}: {
  segments: V3FindingsStackSegment[]
  width?: number
  className?: string
}) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.count), 0)

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className="flex h-1 overflow-hidden rounded-sm bg-eos-border-strong/40"
        style={{ width }}
        aria-hidden
      >
        {total > 0
          ? segments
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={s.key}
                  className={cn("h-full", SEG_BAR[s.key])}
                  style={{ width: `${(s.count / total) * 100}%` }}
                />
              ))
          : null}
      </div>
      <div className="flex items-center gap-2.5 font-mono text-[11px] leading-none">
        {segments.map((s) => (
          <span key={s.key} className="inline-flex items-baseline gap-0.5 font-medium">
            <span
              className={cn(
                "text-[12px] font-bold tabular-nums",
                s.count === 0 ? "text-eos-text-tertiary" : SEG_NUMBER[s.key]
              )}
            >
              {s.count}
            </span>
            <span className="text-[9.5px] uppercase tracking-[0.04em] text-eos-text-tertiary">
              {s.label ?? DEFAULT_LABELS[s.key]}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
