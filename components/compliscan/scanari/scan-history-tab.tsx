"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { RecentScansCard } from "@/components/compliscan/route-sections"
import type { CockpitTask } from "@/components/compliscan/types"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { SectionDividerCard } from "@/components/evidence-os/SectionDividerCard"
import type { ScanRecord } from "@/lib/compliance/types"

export function ScanHistoryTab({
  scans,
  tasks,
}: {
  scans: ScanRecord[]
  tasks: CockpitTask[]
}) {
  return (
    <div className="space-y-6">
      <SectionDividerCard
        eyebrow="Istoric"
        title="Istoric documente"
        description="Vezi toate scanarile recente intr-o singura lista si sari direct la rezultatul relevant."
      />
      <RecentScansCard scans={scans} tasks={tasks} />
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm font-medium text-eos-text">
              Istoricul complet ramane in Documente
            </p>
            <p className="text-xs text-eos-text-muted">
              Acolo gasesti toate scanarile, nu doar cele recente.
            </p>
          </div>
          <Button asChild variant="outline" className="h-9 rounded-xl">
            <Link href="/dashboard/documente">
              Mergi la Documente
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
