import { Badge } from "@/components/evidence-os/Badge"
import { cn } from "@/lib/utils"

interface SignalBadgeListProps {
  signals: string[]
  title?: string
  emptyLabel?: string
  showEmpty?: boolean
  className?: string
}

export function SignalBadgeList({
  signals,
  title,
  emptyLabel = "Niciun semnal disponibil",
  showEmpty = false,
  className,
}: SignalBadgeListProps) {
  if (signals.length === 0 && !showEmpty) {
    return null
  }

  return (
    <div className={cn("space-y-2", className)}>
      {title && <p className="text-xs text-eos-text-muted">{title}</p>}
      <div className="flex flex-wrap gap-2">
        {signals.length > 0 ? (
          signals.map((signal) => (
            <Badge key={signal} variant="secondary" className="normal-case tracking-normal">
              {signal}
            </Badge>
          ))
        ) : (
          <span className="text-xs italic text-eos-text-muted">{emptyLabel}</span>
        )}
      </div>
    </div>
  )
}
