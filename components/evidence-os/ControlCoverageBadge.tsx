import { Badge } from "@/components/evidence-os/Badge"

export type ControlCoverageState = "covered" | "partial" | "missing"

interface ControlCoverageBadgeProps {
  state: ControlCoverageState
  count?: number
}

export function ControlCoverageBadge({ state, count }: ControlCoverageBadgeProps) {
  const config = {
    covered: {
      variant: "success" as const,
      label: "Acoperit",
      bars: [true, true, true] as const,
    },
    partial: {
      variant: "warning" as const,
      label: "Partial",
      bars: [true, true, false] as const,
    },
    missing: {
      variant: "destructive" as const,
      label: "Lipsa",
      bars: [false, false, false] as const,
    },
  }[state]

  return (
    <Badge variant={config.variant} className="gap-1 normal-case tracking-normal">
      <span>{config.label}</span>
      {typeof count === "number" && <span className="text-[11px] opacity-90">{count}</span>}
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {config.bars.map((filled, index) => (
          <span
            key={`${state}-${index}`}
            className={`h-1 w-2 rounded-full bg-current ${filled ? "opacity-90" : "opacity-20"}`}
          />
        ))}
      </span>
    </Badge>
  )
}
