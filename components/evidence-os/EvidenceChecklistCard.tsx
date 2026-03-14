import { CheckCircle2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Separator } from "@/components/evidence-os/Separator"
import { cn } from "@/lib/utils"

interface EvidenceChecklistCardProps {
  title?: string
  items: string[]
  emptyLabel?: string
  className?: string
}

export function EvidenceChecklistCard({
  title = "Checklist actiuni",
  items,
  emptyLabel = "Nu exista actiuni recomandate.",
  className,
}: EvidenceChecklistCardProps) {
  return (
    <Card className={cn("border-eos-border-subtle bg-eos-bg-panel", className)}>
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm font-medium text-eos-text">{title}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="px-4 py-4">
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-eos-text">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-success" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-eos-text-muted">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  )
}
