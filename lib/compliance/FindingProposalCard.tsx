import { Ban, XCircle } from "lucide-react"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { cn } from "@/lib/utils"
import type { FindingProposal } from "@/lib/compliance/agent-os"

interface FindingProposalCardProps {
  finding: FindingProposal
  isRejected: boolean
  onToggleRejection: (id: string) => void
}

export function FindingProposalCard({ finding, isRejected, onToggleRejection }: FindingProposalCardProps) {
  return (
    <Card className={cn(
      "border-l-4 transition-opacity",
      isRejected
        ? "border-l-eos-border opacity-60" 
        : "border-l-eos-warning"
    )}>
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
             {isRejected && <Ban className="size-4 text-muted-foreground" />}
             <CardTitle className={cn("text-sm font-medium", isRejected && "line-through text-muted-foreground")}>{finding.issue}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant={finding.severity === "high" || finding.severity === "critical" ? "destructive" : "secondary"}>
              {finding.severity}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 hover:bg-eos-error/10 hover:text-eos-error"
              onClick={() => onToggleRejection(finding.findingId)}
            >
              <XCircle className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isRejected && (
        <CardContent className="py-3 px-4 text-sm space-y-2">
          <p className="text-eos-text-muted">{finding.rationale}</p>
          <div className="rounded bg-eos-bg-inset p-2 text-xs">
            <span className="font-semibold">Fix: </span> {finding.recommendedFix}
          </div>
          {finding.lawReference && (
            <p className="text-xs text-eos-primary font-medium">Ref: {finding.lawReference}</p>
          )}
        </CardContent>
      )}
    </Card>
  )
}