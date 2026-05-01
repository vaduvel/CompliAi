// Pay Transparency — Salary Range Generator page
// Output text formatat pentru anunțuri job (BestJobs/LinkedIn/eJobs)

import type { Metadata } from "next"

import { SalaryRangeGeneratorCard } from "@/components/compliscan/salary-range-generator-card"
import { PageIntro } from "@/components/evidence-os/PageIntro"

export const metadata: Metadata = {
  title: "Salary Range Generator — CompliScan HR",
  description:
    "Generator text formatat pentru anunțuri job. BestJobs / LinkedIn / eJobs / Generic. Conform Directivei 2023/970.",
}

export default function SalaryRangesPage() {
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Pay Transparency"
        title="Salary Range Generator"
        description="Conform Directivei (UE) 2023/970, anunțurile job trebuie să includă salariu sau range salarial. Selectează level + role + format și primești text gata de copy-paste."
      />
      <SalaryRangeGeneratorCard />
    </div>
  )
}
