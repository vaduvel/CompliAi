// Pay Transparency — Rapoarte ITM page
// Lista rapoarte generate + buton Export ITM PDF per raport

import type { Metadata } from "next"

import { PayTransparencyReportsList } from "@/components/compliscan/pay-transparency-reports-list"
import { PageIntro } from "@/components/evidence-os/PageIntro"

export const metadata: Metadata = {
  title: "Rapoarte ITM — Pay Transparency",
  description:
    "Lista rapoartelor de gap salarial generate. Export PDF ITM-shaped cu white-label cabinet (logo + signature).",
}

export default function PayTransparencyReportsPage() {
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Pay Transparency"
        title="Rapoarte ITM"
        description="Rapoartele de gap salarial generate. Export PDF ITM-shaped pentru depunere/comunicare. Status workflow: draft → approved → published."
      />
      <PayTransparencyReportsList />
    </div>
  )
}
