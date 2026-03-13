import { Ban, XCircle } from "lucide-react"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { cn } from "@/lib/utils"
import type { IntakeSystemProposal } from "@/lib/compliance/agent-os"

interface IntakeSystemCardProps {
  system: IntakeSystemProposal
  isRejected: boolean
  onToggleRejection: (id: string) => void
}

export function IntakeSystemCard({ system, isRejected, onToggleRejection }: IntakeSystemCardProps) {
  return (
    <Card className={cn(
      "border-l-4 transition-opacity", 
      isRejected
        ? "border-l-eos-border opacity-60" 
        : "border-l-eos-info"
    )}>
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {isRejected && <Ban className="size-4 text-muted-foreground" />}
            <CardTitle className={cn("text-base", isRejected && "line-through text-muted-foreground")}>
              {system.systemName || "Sistem Nedetectat"}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{system.confidence} confidence</Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 hover:bg-eos-error/10 hover:text-eos-error"
              onClick={() => onToggleRejection(system.tempId)}
              title="Respinge propunerea"
            >
              <XCircle className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isRejected && (
        <CardContent className="py-3 px-4 text-sm space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-eos-text-muted text-xs">Provider:</span>
              <p>{system.provider || "-"}</p>
            </div>
            <div>
              <span className="text-eos-text-muted text-xs">Model:</span>
              <p>{system.model || "-"}</p>
            </div>
            <div>
              <span className="text-eos-text-muted text-xs">Purpose:</span>
              <p>{system.purpose || "-"}</p>
            </div>
            <div>
              <span className="text-eos-text-muted text-xs">Risc sugerat:</span>
              <Badge variant={system.riskClassSuggested === "high" ? "destructive" : "success"} className="ml-1">
                {system.riskClassSuggested || "unknown"}
              </Badge>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}