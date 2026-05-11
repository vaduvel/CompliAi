// S3.2 — Landing page public IMM (responsabil compliance intern)

import type { Metadata } from "next"

import { LandingPageShell } from "@/components/compliscan/landing-page-shell"

export const metadata: Metadata = {
  title: "CompliScan pentru IMM — control tower compliance intern",
  description:
    "Pentru IMM-uri 50-250 angajați cu responsabil compliance intern. GDPR + AI Act + NIS2 + DORA într-un singur tool, fără 4-8 consultanți fragmentați. Pricing €99-299/lună.",
  alternates: { canonical: "/imm" },
  openGraph: {
    title: "CompliScan pentru IMM — control tower compliance",
    description: "Toate frameworks (GDPR/AI Act/NIS2/DORA) într-un singur tool pentru IMM mid-market.",
    url: "/imm",
    type: "website",
  },
}

export default function ImmLandingPage() {
  return (
    <LandingPageShell
      icpSegment="imm-internal"
      eyebrow="IMM 50-250 angajați"
      title="Control tower pentru responsabilul intern de compliance"
      subtitle="Internalizezi compliance-ul fără să angajezi un departament enterprise. ROI 2-5× față de 4-8 consultanți fragmentați (€60-150K/an)."
      frameworks={["GDPR", "EU AI Act", "NIS2", "DORA", "ISO 27001 readiness", "Pay Transparency"]}
      features={[
        {
          title: "Toate frameworks-urile într-un loc",
          description: "GDPR, AI Act, NIS2, DORA — același cockpit, aceleași findings, același baseline. Fără jonglerie cross-tool.",
        },
        {
          title: "Trust Profile public",
          description: "Link partajabil cu scor canonic + frameworks acoperite. Folosit pentru clienți enterprise care cer due diligence.",
        },
        {
          title: "Drift detection automat",
          description: "Cron daily verifică schimbări față de baseline (vendor nou, employee adăugat, sistem nou). Riscuri reopened cu motivare.",
        },
        {
          title: "Audit Pack pentru auditori externi",
          description: "ZIP cu MANIFEST + traceability matrix + evidence ledger + hash chain SHA-256. Stand-alone, suficient pentru audit ANSPDCP/DNSC/ISO.",
        },
        {
          title: "Multi-user cu roles",
          description: "Owner + compliance officer + reviewer + viewer. Permisiuni granulate pentru audit trail clar.",
        },
        {
          title: "Mistral EU sovereignty option",
          description: "Pentru date sensibile, switch Gemini → Mistral Large 2 (sediu Paris, hosting EU). Sau dezactivezi AI complet și folosești templates deterministe.",
        },
      ]}
      steps={[
        {
          n: "01",
          title: "Onboarding 5 min",
          description: "CUI + sector + frameworks aplicabile. Baseline scan automat (site + ANAF + ANSPDCP signals).",
        },
        {
          n: "02",
          title: "Closure findings prioritar",
          description: "Cockpit listează findings ordonat: critical → high → medium. Fiecare cu recomandare concretă + evidence path.",
        },
        {
          n: "03",
          title: "Validează baseline freeze",
          description: "După 0 findings deschise + 100% evidence atașată, fixezi snapshot ca reper. Drift detection pornește de aici.",
        },
        {
          n: "04",
          title: "Trust Profile + monthly digest",
          description: "Link public partajabil. Email lunar către board cu progress score + frameworks status.",
        },
      ]}
      notReplacing={["Auditor extern", "DPO consultant punctual", "ISO 27001 certifier", "Avocat business"]}
    />
  )
}
