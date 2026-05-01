// Pay Transparency landing — Cabinet HR multi-client (consultanți)
// White-label complet pentru cabinete care servesc 5-25 firme client

import type { Metadata } from "next"

import { LandingPageShell } from "@/components/compliscan/landing-page-shell"

export const metadata: Metadata = {
  title: "CompliScan pentru Cabinete HR — multi-client cu white-label",
  description:
    "Pay Transparency cross-client cu logo cabinet. 5-25 firme client. Bulk import + rapoarte lunare batch + alerte cereri angajați. Rebill 200-400 lei/client/lună.",
  alternates: { canonical: "/cabinet-hr" },
  openGraph: {
    title: "CompliScan pentru Cabinete HR",
    description: "Multi-client Pay Transparency cu white-label complet pentru consultanți HR.",
    url: "/cabinet-hr",
    type: "website",
  },
}

export default function CabinetHrLandingPage() {
  return (
    <LandingPageShell
      icpSegment="cabinet-hr"
      eyebrow="Cabinete HR consultanți"
      title="Multi-client HR cu white-label complet"
      subtitle="5-25 firme client în același dashboard. Logo, brand color, signature consultant pe rapoarte. Rebill 200-400 lei/client/lună. Cabinetul tău, infrastructure noastră."
      frameworks={["Directiva 2023/970", "Pay Transparency", "GDPR HR", "ITM compliance"]}
      features={[
        {
          title: "Cross-client dashboard",
          description:
            "Toate firmele tale într-un single pane. Vezi care e aproape de deadline, care are gap critic, care are cereri în așteptare. Heatmap colorat per client.",
        },
        {
          title: "Bulk import salary records",
          description:
            "Upload 10 CSV-uri o dată. Mapare automată per firmă. Calcul gap per client în 30 secunde. Re-procesare lunară cu 1 click.",
        },
        {
          title: "Rapoarte lunare batch",
          description:
            "5-25 PDF-uri ITM-shaped generate într-un click. Logo cabinet pe fiecare. Email automat la clienți cu link share-able.",
        },
        {
          title: "Alerte cereri angajați",
          description:
            "Vezi când e o cerere aproape de 30 zile la un client. Nu mai pierzi termene. Email + dashboard alert cross-portfolio.",
        },
        {
          title: "Cabinet revenue dashboard",
          description:
            "MRR per client, churn rate, growth. Vezi rebill margin în timp real. Calculator ROI integrat: 5 oameni × 22 clienți = profit cabinet.",
        },
        {
          title: "White-label cabinet 100%",
          description:
            "Logo, culoare brand, signature consultant pe toate rapoartele. Custom domain optional pe Plus tier (cabinet.compliai.ro).",
        },
      ]}
      steps={[
        {
          n: "01",
          title: "Setup white-label",
          description:
            "Logo, culoare brand, signature consultant. ICP segment 'cabinet-hr'. 5 minute setup.",
        },
        {
          n: "02",
          title: "Importă firme client",
          description:
            "5-25 firme cu CUI. Magic link de acces opțional pentru clienți. Permission isolation strictă.",
        },
        {
          n: "03",
          title: "Bulk import grile salariale",
          description:
            "Per client, CSV-ul lui. Calcul instant. Cross-client dashboard arată gap heatmap.",
        },
        {
          n: "04",
          title: "Livrează rapoarte ITM lunar",
          description:
            "Batch PDF generation cu brand cabinet. Email automat la clienți. Tu păstrezi relația, noi facem treaba.",
        },
      ]}
      testimonial={{
        quote:
          "Cabinetul meu servea 8 firme cu Excel. Cu CompliScan am ajuns la 22 fără să angajez pe nimeni — rapoartele lunare se generează batch cu logo cabinet. Profit cabinet × 2.5 în 3 luni.",
        author: "Alexandra D.",
        role: "Cabinet HR · 22 clienți activi",
      }}
      notReplacing={["Excel cabinet", "Email per client", "PowerPoint rapoarte"]}
      primaryCtaLabel="Pilot 5 firme — 30 zile gratis"
      primaryCtaHref="/login?icp=cabinet-hr&mode=register"
    />
  )
}
