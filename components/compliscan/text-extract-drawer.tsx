"use client"

import { AlignLeft } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

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
        className="w-full border-l border-[var(--color-border)] bg-[var(--color-surface)] p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-[var(--color-border)] p-6">
          <SheetTitle className="flex items-center gap-2 text-[var(--color-on-surface)]">
            <AlignLeft className="size-4 text-[var(--icon-secondary)]" strokeWidth={2.25} />
            Text extras
          </SheetTitle>
          <SheetDescription className="text-[var(--color-muted)]">{title}</SheetDescription>
        </SheetHeader>

        <div className="p-6">
          <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-on-surface-muted)]">
              {text || "Nu exista text extras disponibil pentru acest document."}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
