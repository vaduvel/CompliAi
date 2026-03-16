"use client"

import { AlignLeft } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/evidence-os/Sheet"

type TextExtractDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  text: string
}

export function TextExtractDrawer({
  open,
  onOpenChange,
  title,
  text,
}: TextExtractDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-eos-border bg-eos-surface p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-eos-border p-6">
          <SheetTitle className="flex items-center gap-2 text-eos-text">
            <AlignLeft className="size-4 text-eos-text-muted" strokeWidth={2} />
            Text extras
          </SheetTitle>
          <SheetDescription className="text-eos-text-muted">{title}</SheetDescription>
        </SheetHeader>

        <div className="p-6">
          <div className="max-h-[75vh] overflow-y-auto rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-eos-text-muted">
              {text || "Nu exista text extras disponibil pentru acest document."}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
