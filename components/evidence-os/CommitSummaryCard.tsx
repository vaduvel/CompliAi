import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Separator } from "@/components/evidence-os/Separator"
import { cn } from "@/lib/utils"

interface CommitSummaryCardProps {
  systemsCount: number
  findingsCount: number
  driftsCount: number
  className?: string
}

export function CommitSummaryCard({ systemsCount, findingsCount, driftsCount, className }: CommitSummaryCardProps) {
  return (
    <Card className={cn("border-eos-border-subtle bg-eos-bg-panel shadow-none", className)} aria-label="Sumar impact propus">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium text-eos-text-muted uppercase tracking-wider">
          Impact propus
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="grid grid-cols-3 gap-3 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xl font-semibold text-eos-text sm:text-2xl">
            {systemsCount}
          </span>
          <span className="text-xs text-eos-text-muted">Sisteme AI</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold text-eos-warning sm:text-2xl">
            {findingsCount}
          </span>
          <span className="text-xs text-eos-text-muted">Constatari</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold text-eos-error sm:text-2xl">
            {driftsCount}
          </span>
          <span className="text-xs text-eos-text-muted">Drifturi</span>
        </div>
      </CardContent>
    </Card>
  )
}
