// S3.2 — Landing page public Fiscal (cabinet contabil CECCAR)

import type { Metadata } from "next"

import { LandingPageShell } from "@/components/compliscan/landing-page-shell"

export const metadata: Metadata = {
  title: "CompliScan Fiscal — layer compliance peste SmartBill / Saga / Oblio",
  description:
    "Validator UBL CIUS-RO + e-TVA + GDPR lite per client contabil. Layer compliance peste tool-urile fiscale existente. Pricing self-serve €299-699/lună.",
  alternates: { canonical: "/fiscal" },
  openGraph: {
    title: "CompliScan Fiscal — layer compliance pentru contabili CECCAR",
    description: "Validator UBL CIUS-RO + e-TVA + GDPR per client. Layer peste SmartBill/Saga/Oblio.",
    url: "/fiscal",
    type: "website",
  },
}

export default function FiscalLandingPage() {
  return (
    <LandingPageShell
      icpSegment="cabinet-fiscal"
      eyebrow="Cabinete contabile CECCAR"
      title="Layer compliance peste stack-ul tău fiscal existent"
      subtitle="Validator UBL CIUS-RO + e-TVA discrepancy detection + GDPR lite per client. Funcționează alături de SmartBill, Saga, Oblio — NU le înlocuiește."
      frameworks={["e-Factura UBL CIUS-RO", "e-TVA", "GDPR (lite)", "ANAF SPV", "SAF-T"]}
      features={[
        {
          title: "Validator UBL CIUS-RO complet",
          description: "Verifică structural fiecare factură: CustomizationID, InvoiceTypeCode, parties, TaxTotal, LegalMonetaryTotal, PaymentMeans. Erori clare cu localizare în XML.",
        },
        {
          title: "ANAF SPV connector",
          description: "Conexiune securizată cu SPV pentru e-Factura status, e-TVA discrepancy, REGES export. Cron lunar auto-validare facturi.",
        },
        {
          title: "GDPR lite per client",
          description: "Fiecare client contabil primește un Privacy Policy, Cookie Policy, Retention Policy basic — generat automat din profilul firmei.",
        },
        {
          title: "Multi-client portfolio",
          description: "Cabinet view cu portofoliu agregat — vezi cross-client erorile e-Factura, alertele neacționate, riscuri lunar.",
        },
        {
          title: "Audit Pack pentru control fiscal",
          description: "ZIP cu manifestul lunar e-Factura, dovezile validate, hash chain. Pregătit pentru control ANAF cu structură determinist.",
        },
        {
          title: "Pricing self-serve transparent",
          description: "€299-699/lună, fără sales call. Cancel oricând. Trial 14 zile.",
        },
      ]}
      steps={[
        {
          n: "01",
          title: "Importă lista de clienți",
          description: "CSV cu CUI + nume + email contact. Auto-prefill din ANAF pentru sector + adresă.",
        },
        {
          n: "02",
          title: "Conectează ANAF SPV",
          description: "Token SPV per cabinet. Sincronizare facturi e-Factura + e-TVA per client.",
        },
        {
          n: "03",
          title: "Rulează validator",
          description: "Per fiecare client: validator UBL CIUS-RO automat. Erori grupate cu localizare în XML și recomandare de remediere.",
        },
        {
          n: "04",
          title: "Generează rapoarte lunare",
          description: "Cron 1 a lunii: digest portfolio cu erori top, GDPR pending, control ANAF readiness.",
        },
      ]}
      notReplacing={["SmartBill", "Saga", "Oblio", "WinMentor", "ANAF SPV"]}
    />
  )
}
