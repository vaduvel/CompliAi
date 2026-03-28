"use client"

import { FileText, ShieldAlert } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/evidence-os/Sheet"
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
        className="w-full border-l border-eos-border bg-eos-surface p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-eos-border p-6">
          <SheetTitle className="break-words text-eos-text">
            {scan?.documentName ?? "Detalii scan"}
          </SheetTitle>
          <SheetDescription className="text-eos-text-muted [overflow-wrap:anywhere]">
            {scan
              ? `Scanat la ${new Date(scan.createdAtISO).toLocaleString("ro-RO")}`
              : "Selecteaza un document din lista recenta."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-6">
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-eos-text">
              <FileText className="size-4 text-eos-text-muted" strokeWidth={2} />
              Rezumat scan
            </div>
            <p className="mt-3 text-sm text-eos-text-muted [overflow-wrap:anywhere]">
              {scan?.contentPreview || "Nu există preview pentru acest document."}
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-eos-text">
              <ShieldAlert className="size-4 text-eos-warning" strokeWidth={2} />
              Task-uri asociate
            </div>
            <div className="space-y-3">
              {tasks.length === 0 && (
                <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted">
                  Nu există task-uri generate pentru acest scan.
                </div>
              )}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="break-words text-sm font-semibold text-eos-text">
                      {task.title}
                    </p>
                    <span className="text-xs text-eos-text-muted">{task.priority}</span>
                  </div>
                  <p className="mt-2 text-sm text-eos-text-muted [overflow-wrap:anywhere]">
                    {task.summary}
                  </p>
                  <p className="mt-2 text-xs text-eos-text-muted [overflow-wrap:anywhere]">
                    {task.triggerLabel}
                  </p>
                  <p className="mt-2 text-xs text-eos-text-muted [overflow-wrap:anywhere]">
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
