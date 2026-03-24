import { Badge } from "@/components/evidence-os/Badge"

type CeBadgeProps = {
  mode: "transparent" | "decision-gate"
  className?: string
}

export function CeBadge({ mode, className }: CeBadgeProps) {
  if (mode === "transparent") {
    return (
      <Badge variant="success" className={className}>
        AI Act Transparent - Art. 50
      </Badge>
    )
  }

  return (
    <Badge variant="warning" className={className}>
      CE decision gate pending legal review
    </Badge>
  )
}
