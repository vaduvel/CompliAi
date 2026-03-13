import { Ban, XCircle } from "lucide-react"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { cn } from "@/lib/utils"
import type { DriftProposal } from "@/lib/compliance/agent-os"

interface DriftProposalCardProps {
  drift: DriftProposal
  isRejected: boolean
  onToggleRejection: (id: string) => void
}

export function DriftProposalCard({ drift, isRejected, onToggleRejection }: DriftProposalCardProps) {
  return (
    <Card className={cn(
      "border-l-4 transition-opacity", 
      isRejected
        ? "border-l-eos-border opacity-60" 
        : "border-l-eos-error"
    )}>
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isRejected && <Ban className="size-4 text-muted-foreground" />}
            <CardTitle className={cn("text-sm font-medium", isRejected && "line-through text-muted-foreground")}>{drift.driftType}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge 
              variant={
                drift.severity === "critical" || drift.severity === "high" 
                  ? "destructive" 
                  : drift.severity === "medium" 
                    ? "warning" 
                    : "secondary"
              }
            >
              {drift.severity}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 hover:bg-eos-error/10 hover:text-eos-error"
              onClick={() => onToggleRejection(drift.driftId)}
            >
              <XCircle className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isRejected && (
        <CardContent className="py-3 px-4 text-sm space-y-3">
          <p>{drift.impactSummary}</p>
          
          {drift.rationale && (
            <div className="rounded bg-eos-bg-inset p-2 text-xs text-eos-text-muted">
              <span className="font-semibold text-foreground">De ce:</span> {drift.rationale}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs bg-eos-bg-inset/50 p-2 rounded">
            <div>
              <span className="font-semibold text-red-600">Înainte:</span>
              <pre className="mt-1 whitespace-pre-wrap font-mono">{JSON.stringify(drift.before, null, 2)}</pre>
            </div>
            <div>
              <span className="font-semibold text-green-600">După:</span>
              <pre className="mt-1 whitespace-pre-wrap font-mono">{JSON.stringify(drift.after, null, 2)}</pre>
            </div>
          </div>
          
          <div className="space-y-2 border-t border-eos-border pt-2 mt-2">
            <div>
                <span className="text-xs font-semibold text-eos-primary">Acțiune propusă (se va salva):</span>
                <p className="text-xs mt-1">{drift.nextAction}</p>
            </div>
            {drift.evidenceRequired && drift.evidenceRequired.length > 0 && (
                <div>
                    <span className="text-xs font-semibold text-eos-primary">Dovadă specifică (se va salva):</span>
                    <ul className="list-disc list-inside text-xs mt-1 text-eos-text-muted">
                        {drift.evidenceRequired.map((ev, idx) => (
                            <li key={idx}>{ev}</li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}