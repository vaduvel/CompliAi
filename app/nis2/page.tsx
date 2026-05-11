// S3.2 — Landing page public NIS2 (CISO/cybersec consultanți)

import type { Metadata } from "next"

import { LandingPageShell } from "@/components/compliscan/landing-page-shell"

export const metadata: Metadata = {
  title: "CompliScan pentru NIS2 — governance layer pentru CISO și cybersec consultanți",
  description:
    "Înregistrare DNSC, vendor risk register, incident response playbook, ISO 27001 readiness. NU înlocuim Wireshark/SIEM/EDR — adăugăm layer-ul de governance lipsă.",
  alternates: { canonical: "/nis2" },
  openGraph: {
    title: "CompliScan NIS2 — governance layer pentru CISO",
    description: "DNSC + vendor register + incident playbook + ISO 27001 readiness. Layer governance peste stack-ul tehnic.",
    url: "/nis2",
    type: "website",
  },
}

export default function Nis2LandingPage() {
  return (
    <LandingPageShell
      icpSegment="enterprise"
      eyebrow="CISO + cybersec consultanți"
      title="NIS2 governance layer pentru organizații reglementate"
      subtitle="Înregistrare DNSC, vendor risk register, incident response playbook, ISO 27001 readiness. Layer-ul de governance care lipsește între SOC tehnic și board."
      frameworks={["NIS2 Directive", "DNSC Înregistrare", "ISO 27001 readiness", "Incident Response", "Vendor Risk", "DORA"]}
      features={[
        {
          title: "DNSC Înregistrare wizard",
          description: "Ghidat pas cu pas: identificare entități esențiale/importante, scope NIS2, contact DPO + responsabil cybersec, submit DNSC.",
        },
        {
          title: "Vendor risk register",
          description: "Toate sub-procesatorii cu risk score (impact + likelihood), DPA tracking, review cycles, escalări la board.",
        },
        {
          title: "Incident response playbook",
          description: "Template-uri NIS2 pentru notificare 24h preliminary + 72h detailed + 1 lună final. Auto-fill din baseline org + system register.",
        },
        {
          title: "ISO 27001 readiness gap",
          description: "114 controale Annex A mapate la state-ul tău: ce e gata, ce lipsește, ce evidence ai pentru audit certifier.",
        },
        {
          title: "AI system register (EU AI Act)",
          description: "Inventariere sisteme AI cu risk classification (high-risk, limited-risk, minimal). Annex IV documentation auto-generated.",
        },
        {
          title: "Audit Pack + watermark",
          description: "ZIP cu MANIFEST + hash chain SHA-256 + traceability matrix + evidence ledger. Watermark „AUDIT READY” când dosarul atinge stadiul canonic.",
        },
      ]}
      steps={[
        {
          n: "01",
          title: "Mapare scope NIS2",
          description: "CompliScan detectează automat dacă organizația e essential / important entity bazat pe sector + employee count + critical infrastructure.",
        },
        {
          n: "02",
          title: "Vendor + asset inventory",
          description: "Import vendori + sisteme + AI tools. Risk scoring automat + lista controale aplicabile per item.",
        },
        {
          n: "03",
          title: "Closure findings prioritar",
          description: "Top 10 critical findings cu remediation playbook. Evidence template pentru fiecare control închis.",
        },
        {
          n: "04",
          title: "Submit DNSC + Audit Pack",
          description: "Wizard DNSC submit + export Audit Pack pentru auditor extern. Trust Profile public pentru clienți enterprise care cer due diligence.",
        },
      ]}
      notReplacing={["Wireshark", "SIEM (Splunk/Elastic)", "EDR (CrowdStrike/Sentinel)", "Pentest tools", "SOC2 Type II auditor"]}
      waitlistHref="/waitlist?icp=enterprise&source=/nis2"
    />
  )
}
