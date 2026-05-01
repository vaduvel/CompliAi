// Pay Transparency — Cabinet HR portfolio cross-client view
// Pentru icpSegment cabinet-hr (multi-client)

import type { Metadata } from "next"

import { PortfolioPayTransparencyClient } from "@/components/compliscan/portfolio-pay-transparency-page"
import { PageIntro } from "@/components/evidence-os/PageIntro"

export const metadata: Metadata = {
  title: "Pay Transparency — Portofoliu",
  description:
    "Cross-client Pay Transparency dashboard pentru cabinete HR. Heatmap gap, deadline-uri, cereri pending pe toate firmele client.",
}

export const dynamic = "force-dynamic"

export default function PortfolioPayTransparencyPage() {
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Portofoliu HR"
        title="Pay Transparency cross-client"
        description="Toate firmele tale client într-un singur dashboard. Vezi care e aproape de deadline, care are gap critic, care are cereri în așteptare."
      />
      <PortfolioPayTransparencyClient />
    </div>
  )
}
