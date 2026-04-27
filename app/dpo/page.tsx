// S3.2 — Landing page public DPO (cabinet consultanți Word/Excel)

import type { Metadata } from "next"

import { LandingPageShell } from "@/components/compliscan/landing-page-shell"

export const metadata: Metadata = {
  title: "CompliScan pentru DPO — cabinet operations OS pentru consultanți GDPR",
  description:
    "Înlocuim Excel + Word + Drive cu un cockpit finding-first pentru cabinete DPO. Magic links la patroni, Audit Pack ZIP, white-label complet. Pricing transparent €499-1.999/lună.",
  alternates: { canonical: "/dpo" },
  openGraph: {
    title: "CompliScan pentru DPO — cabinet operations OS",
    description: "Cockpit GDPR finding-first pentru cabinete DPO România. Magic links + Audit Pack + white-label.",
    url: "/dpo",
    type: "website",
  },
}

export default function DpoLandingPage() {
  return (
    <LandingPageShell
      icpSegment="cabinet-dpo"
      eyebrow="Cabinete DPO România"
      title="DPO Operations OS pentru cabinete cu portofoliu real"
      subtitle="Finding-first cockpit care înlocuiește Word + Excel + Drive. Magic links pentru aprobări patron. Audit Pack ZIP livrabil. White-label cabinet 100%."
      frameworks={["GDPR", "EU AI Act", "ANSPDCP", "DPO Regulament"]}
      features={[
        {
          title: "Cockpit finding-first",
          description: "Vezi ce e deschis, ce așteaptă răspuns, ce blochează audit-ul. Fără tabele Excel, fără Drive haotic.",
        },
        {
          title: "Magic links → patron",
          description: "Trimite document spre aprobare prin link unic semnat HMAC. Patronul aprobă, respinge sau comentează — totul intră în Audit Trail.",
        },
        {
          title: "Audit Pack ZIP cu watermark",
          description: "Export pachet structurat: MANIFEST, evidence, traceability matrix, hash chain SHA-256. Watermark „AUDIT READY” pe PDF când dosarul e canonic.",
        },
        {
          title: "White-label cabinet 100%",
          description: "Logo, culoare brand, signature consultant pe footer document, custom templates Markdown per documentType.",
        },
        {
          title: "AI ON/OFF per client",
          description: "Pentru clienți sensibili (banking, healthcare) dezactivezi AI și folosești templates deterministe. Pentru rest, Gemini sau Mistral EU.",
        },
        {
          title: "Trust Profile public",
          description: "Link partajabil cu scor canonic, fără login. Patronul vede readiness instant, fără să te sune.",
        },
      ]}
      steps={[
        {
          n: "01",
          title: "Setup brand cabinet",
          description: "5 minute: logo, color, signature, ICP segment. Apare pe toate documentele și magic links.",
        },
        {
          n: "02",
          title: "Adaugă primul client",
          description: "CUI-prefill ANAF, demo data optional. Workspace context cabinet vizibil constant.",
        },
        {
          n: "03",
          title: "Generează & trimite document",
          description: "Privacy Policy, DPA, RoPA, Retention. Trimiți magic link patron — vedere internă vs externă separate.",
        },
        {
          n: "04",
          title: "Validează baseline & exportează",
          description: "După închiderea findings + dovezi atașate, validezi snapshot ca baseline. Audit Pack ZIP cu watermark.",
        },
      ]}
      testimonial={{
        quote: "În 30 minute am setat brand-ul, am adăugat 3 clienți și am generat primul Audit Pack pe care l-am trimis prin magic link. Clientul a aprobat în aceeași zi.",
        author: "Diana P.",
        role: "DPO Complet — pilot kickoff 7 mai 2026",
      }}
      notReplacing={["Privacy Manager", "OneTrust", "Excel", "Word", "Drive"]}
    />
  )
}
