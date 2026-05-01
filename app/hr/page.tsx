// Pay Transparency landing — HR Director / CHRO la firme 100-500 ang
// Directiva (UE) 2023/970 — transpunere RO până la 7 iunie 2026

import type { Metadata } from "next"

import { LandingPageShell } from "@/components/compliscan/landing-page-shell"

export const metadata: Metadata = {
  title: "CompliScan HR — Pay Transparency 2026 pentru HR Directors",
  description:
    "Calculator gap salarial automat + salary range pentru anunțuri + employee request portal + raport ITM PDF. Compliance Directiva 2023/970 fără Excel. Deadline transpunere RO 7 iunie 2026.",
  alternates: { canonical: "/hr" },
  openGraph: {
    title: "CompliScan HR — Pay Transparency 2026",
    description:
      "Pay Transparency complet pentru firme 100-500 ang. Calculator gap, salary range generator, employee portal, ITM PDF.",
    url: "/hr",
    type: "website",
  },
}

export default function HrLandingPage() {
  return (
    <LandingPageShell
      icpSegment="imm-hr"
      eyebrow="HR Directors firme 100-500 ang"
      title="Pay Transparency 2026 — în 30 minute, nu 8 ore"
      subtitle="Calculator gap salarial automat. Salary range pentru anunțuri job. Employee request portal cu countdown 30 zile. Raport ITM gata de submit. Deadline transpunere RO 7 iunie 2026."
      frameworks={["Directiva UE 2023/970", "Codul Muncii", "ITM controale", "GDPR HR"]}
      features={[
        {
          title: "Calculator gap salarial automat",
          description:
            "Upload CSV grilă salarială → vezi gap pe role, department, gender. Risk level low/medium/high cu recomandări actionable.",
        },
        {
          title: "Salary range generator",
          description:
            "Click pe role + level → primești text gata pentru BestJobs / LinkedIn / eJobs / generic. Nu mai scrii „salariu negociabil”.",
        },
        {
          title: "Employee request portal",
          description:
            "Token public. Angajatul completează formular, tu primești în dashboard cu countdown 30 zile. Răspuns auto-format conform Directivei.",
        },
        {
          title: "Raport ITM PDF",
          description:
            "Generator raport ITM-shaped, gata de submit. Status workflow draft → approved → published. White-label dacă ești cabinet HR.",
        },
        {
          title: "Anti-confidentiality checker",
          description:
            "Upload contract → scan auto pentru clauze confidențialitate salarială (interzise din iunie 2026). Raport detection cu recomandare ștergere.",
        },
        {
          title: "Job architecture builder",
          description:
            "Construiești level + role + range odată. Salary ranges pentru anunțuri se generează automat. Update centralizat propagă peste tot.",
        },
      ]}
      steps={[
        {
          n: "01",
          title: "Upload CSV grilă",
          description:
            "Format simplu: jobRole, gender, salaryBrut, salaryBonuses, contractType, department. 5 minute setup.",
        },
        {
          n: "02",
          title: "Vezi gap calculation",
          description:
            "Risk level + role gap top + recomandări automate. Înțelegi imediat unde sunt problemele.",
        },
        {
          n: "03",
          title: "Generează raport draft",
          description:
            "Status workflow: draft → approve → publish. Versionate, audit trail complet pentru ITM.",
        },
        {
          n: "04",
          title: "Activează portal angajați",
          description:
            "Public link cu token. Cereri intră direct cu countdown 30 zile. Răspuns auto-completat din date.",
        },
      ]}
      testimonial={{
        quote:
          "Aveam 247 de angajați și calculam gap-ul salarial cu 8 ore în Excel. CompliScan îl face în 30 secunde și generează raportul ITM cu un click. Și anunțurile job au range automat.",
        author: "Andreea V.",
        role: "HR Director · firmă mid-market RO",
      }}
      notReplacing={["Payroll soft", "ATS", "HRIS", "Excel grilă"]}
      primaryCtaLabel="Începe trial 30 zile"
      primaryCtaHref="/login?icp=imm-hr&mode=register"
    />
  )
}
