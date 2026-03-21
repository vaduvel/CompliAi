"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { RecentScansCard } from "@/components/compliscan/route-sections"
import type { CockpitTask } from "@/components/compliscan/types"
import { ActionCluster } from "@/components/evidence-os/ActionCluster"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { SectionDividerCard } from "@/components/evidence-os/SectionDividerCard"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type { ScanRecord } from "@/lib/compliance/types"

export function ScanHistoryTab({
  scans,
  tasks,
}: {
  scans: ScanRecord[]
  tasks: CockpitTask[]
}) {
  const hasScans = scans.length > 0

  return (
    <div className="space-y-6">
      <SectionDividerCard
        eyebrow="Istoric"
        title="Istoric documente"
        description="Vezi toate scanarile recente intr-o singura lista si sari direct la rezultatul relevant."
      />
      {hasScans ? (
        <RecentScansCard scans={scans} tasks={tasks} />
      ) : (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="py-6 text-sm text-eos-text-muted">
            Nu exista inca scanari recente pentru istoric.
          </CardContent>
        </Card>
      )}
      <ActionCluster
        eyebrow="Handoff"
        title="Istoricul complet ramane separat de fluxul activ"
        description="Acolo gasesti toate scanarile, nu doar cele recente."
        actions={
          <Button asChild variant="outline" size="default" className="gap-2">
            <Link href={dashboardRoutes.documents}>
              Mergi la Istoric complet
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </Button>
        }
      />
    </div>
  )
}
