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
    <Card className={cn("bg-eos-bg shadow-none", className)}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium text-eos-text-muted uppercase tracking-wider">
          Sumar Impact
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="py-3 px-4 grid grid-cols-3 gap-4">
        <div className="flex flex-col">
          <span className="text-2xl font-semibold text-eos-text">
            {systemsCount}
          </span>
          <span className="text-xs text-eos-text-muted">Sisteme</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-semibold text-eos-warning">
            {findingsCount}
          </span>
          <span className="text-xs text-eos-text-muted">Findings</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-semibold text-eos-error">
            {driftsCount}
          </span>
          <span className="text-xs text-eos-text-muted">Drifts</span>
        </div>
      </CardContent>
    </Card>
  )
}