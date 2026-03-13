"use client"

import { Check, X, Edit2 } from "lucide-react"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Separator } from "@/components/evidence-os/Separator"

interface HumanReviewPanelProps {
  onConfirm: () => void
  onReject: () => void
  onEdit?: () => void
  disabled?: boolean
}

export function HumanReviewPanel({ onConfirm, onReject, onEdit, disabled }: HumanReviewPanelProps) {
  return (
    <Card className="bg-eos-bg-panel border-eos-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-eos-text-muted">
          Human Review Gate
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-3 pt-4">
        <Button 
          className="w-full justify-start" 
          variant="default" 
          onClick={onConfirm} 
          disabled={disabled}
        >
          <Check className="mr-2 size-4" />
          Confirm & Commit
        </Button>
        
        <Button className="w-full justify-start" variant="outline" onClick={onReject} disabled={disabled}>
          <X className="mr-2 size-4" />
          Reject Proposal
        </Button>

        {onEdit && (
          <Button className="w-full justify-start" variant="ghost" onClick={onEdit} disabled={disabled}>
            <Edit2 className="mr-2 size-4" />
            Edit Manually
          </Button>
        )}
        
        <p className="text-[10px] text-eos-text-muted mt-2">
          Confimarea aplică datele în inventarul permanent și generează task-uri de remediere.
        </p>
      </CardContent>
    </Card>
  )
}