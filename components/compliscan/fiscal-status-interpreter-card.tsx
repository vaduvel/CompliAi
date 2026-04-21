"use client"

import Link from "next/link"
import { ClipboardCheck, FileCode2, ShieldCheck, Undo2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import type { FiscalStatusInterpreterGuide } from "@/lib/compliance/efactura-status-interpreter"

type FiscalStatusInterpreterCardProps = {
  guide: FiscalStatusInterpreterGuide
  findingId: string
}

function copyWithFallback(text: string) {
  return navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.position = "absolute"
    ta.style.left = "-9999px"
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    ta.setSelectionRange(0, ta.value.length)
    const copied = document.execCommand("copy")
    document.body.removeChild(ta)
    if (!copied) {
      throw new Error("COPY_FAILED")
    }
  })
}

export function FiscalStatusInterpreterCard({
  guide,
  findingId,
}: FiscalStatusInterpreterCardProps) {
  const primaryHref = `/dashboard/fiscal?tab=${guide.primarySurface}&findingId=${encodeURIComponent(findingId)}`
  const secondaryHref = guide.secondarySurface
    ? `/dashboard/fiscal?tab=${guide.secondarySurface}&findingId=${encodeURIComponent(findingId)}`
    : null
  const returnHref = `/dashboard/actiuni/remediere/${encodeURIComponent(findingId)}?fiscalStatusFlow=done&evidenceNote=${encodeURIComponent(guide.cockpitNote)}`

  async function handleCopyNote() {
    try {
      await copyWithFallback(guide.cockpitNote)
      toast.success("Nota pentru cockpit a fost copiată", {
        description: "O poți lipi direct în dovada operațională a finding-ului fiscal.",
      })
    } catch {
      toast.error("Nu am putut copia nota pentru cockpit.")
    }
  }

  return (
    <Card className="border-eos-border bg-eos-surface" data-testid="fiscal-status-interpreter-card">
      <CardHeader className="border-b border-eos-border pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="normal-case tracking-normal">
            {guide.eyebrow}
          </Badge>
          <Badge variant="secondary" className="normal-case tracking-normal">
            {guide.findingTypeId}
          </Badge>
        </div>
        <CardTitle className="text-base">{guide.title}</CardTitle>
        <p className="text-sm text-eos-text-muted [overflow-wrap:anywhere]">{guide.explanation}</p>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        <div className="space-y-3">
          {guide.steps.map((step, index) => (
            <div
              key={step}
              className="flex items-start gap-3 rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-3"
            >
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-eos-primary/10 text-[11px] font-semibold text-eos-primary">
                {index + 1}
              </div>
              <p className="text-sm text-eos-text-muted">{step}</p>
            </div>
          ))}
        </div>

        <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">Dovada pe care o ceri în cockpit</p>
          <div className="mt-3 space-y-2">
            {guide.evidenceItems.map((item) => (
              <div key={item} className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm text-eos-text-muted">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">Nota pregătită pentru cockpit</p>
          <textarea
            data-testid="fiscal-status-note"
            readOnly
            value={guide.cockpitNote}
            rows={5}
            className="mt-3 min-h-[120px] w-full rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3 text-sm text-eos-text outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="gap-1.5" data-testid="open-primary-fiscal-action">
            <Link href={primaryHref}>
              {guide.primarySurface === "validator" ? <FileCode2 className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
              {guide.primaryLabel}
            </Link>
          </Button>

          {secondaryHref && guide.secondaryLabel ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5" data-testid="open-secondary-fiscal-action">
              <Link href={secondaryHref}>
                {guide.secondarySurface === "validator" ? <FileCode2 className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                {guide.secondaryLabel}
              </Link>
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            data-testid="copy-fiscal-status-note"
            onClick={() => void handleCopyNote()}
          >
            <ClipboardCheck className="size-3.5" />
            Copiază nota pentru cockpit
          </Button>

          <Button asChild variant="ghost" size="sm" className="gap-1.5" data-testid="return-to-cockpit-with-note">
            <Link href={returnHref}>
              <Undo2 className="size-3.5" />
              Revino în cockpit cu nota
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
