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
    <Card className="border-eos-border-subtle bg-eos-bg-panel" aria-label="Actiuni review uman">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-eos-text-muted">
          Review uman obligatoriu
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-3 pt-4">
        <Button className="w-full justify-start" variant="default" onClick={onConfirm} disabled={disabled}>
          <Check className="mr-2 size-4" />
          Confirma propunerile
        </Button>

        <Button className="w-full justify-start" variant="outline" onClick={onReject} disabled={disabled}>
          <X className="mr-2 size-4" />
          Respinge lotul
        </Button>

        {onEdit && (
          <Button className="w-full justify-start" variant="ghost" onClick={onEdit} disabled={disabled}>
            <Edit2 className="mr-2 size-4" />
            Editeaza manual
          </Button>
        )}

        <p className="mt-2 text-[10px] leading-4 text-eos-text-muted">
          Confirmarea aplica propunerile in starea oficiala si lasa o urma clara pentru audit.
        </p>
      </CardContent>
    </Card>
  )
}
