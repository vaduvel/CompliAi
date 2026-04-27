// S3.3 — Waitlist public page.
// Folosit pentru ICP segments coming-soon (Faza 2/3 conform Doc 06):
// IMM bundle, Compliance Officer category creation.

import type { Metadata } from "next"

import { WaitlistFormSurface } from "@/components/compliscan/waitlist-form"

export const metadata: Metadata = {
  title: "Listă de așteptare CompliScan",
  description:
    "Înscrie-te pe listă pentru a fi anunțat când deschidem segmentul tău (Enterprise multi-framework, IMM bundle, Compliance Officer intern).",
  alternates: { canonical: "/waitlist" },
  openGraph: {
    title: "Listă de așteptare CompliScan",
    description: "Anunț când deschidem segmentul tău.",
    url: "/waitlist",
    type: "website",
  },
}

export default function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ icp?: string; source?: string }>
}) {
  return <WaitlistFormSurface searchParams={searchParams} />
}
