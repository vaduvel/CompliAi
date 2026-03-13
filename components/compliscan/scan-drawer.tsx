"use client"

import { FileText, ShieldAlert } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { CockpitTask } from "@/components/compliscan/types"
import type { ScanRecord } from "@/lib/compliance/types"

type ScanDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  scan: ScanRecord | null
  tasks: CockpitTask[]
}

export function ScanDrawer({ open, onOpenChange, scan, tasks }: ScanDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-[var(--color-border)] bg-[var(--color-surface)] p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-[var(--color-border)] p-6">
          <SheetTitle className="text-[var(--color-on-surface)]">
            {scan?.documentName ?? "Detalii scan"}
          </SheetTitle>
          <SheetDescription className="text-[var(--color-muted)]">
            {scan
              ? `Scanat la ${new Date(scan.createdAtISO).toLocaleString("ro-RO")}`
              : "Selecteaza un document din lista recenta."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-on-surface)]">
              <FileText className="size-4 text-[var(--icon-secondary)]" strokeWidth={2.25} />
              Rezumat scan
            </div>
            <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
              {scan?.contentPreview || "Nu exista preview pentru acest document."}
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-on-surface)]">
              <ShieldAlert className="size-4 text-[var(--color-warning)]" strokeWidth={2.25} />
              Task-uri asociate
            </div>
            <div className="space-y-3">
              {tasks.length === 0 && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--color-on-surface-muted)]">
                  Nu exista task-uri generate pentru acest scan.
                </div>
              )}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                      {task.title}
                    </p>
                    <span className="text-xs text-[var(--color-muted)]">{task.priority}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">{task.summary}</p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">{task.triggerLabel}</p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {task.source} · {task.lawReference}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
