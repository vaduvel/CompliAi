// Pay Transparency — Job Architecture page
// Construiește matricea level × role × salary band

import type { Metadata } from "next"

import { JobArchitectureBuilder } from "@/components/compliscan/job-architecture-builder"
import { PageIntro } from "@/components/evidence-os/PageIntro"

export const metadata: Metadata = {
  title: "Job Architecture — CompliScan HR",
  description:
    "Construiește matricea level × role × salary band. Salariile generate pentru anunțuri job vor folosi această arhitectură.",
}

export default function JobArchitecturePage() {
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Pay Transparency"
        title="Job Architecture"
        description="Definește matricea level × role × salary band (RON brut/lună). Necesar pentru salary range generator în anunțuri job + raportare ITM."
      />
      <JobArchitectureBuilder />
    </div>
  )
}
