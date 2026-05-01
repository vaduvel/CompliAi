// Pay Transparency — Public employee portal page
// NU are auth. Token-ul în URL identifică organizația care a publicat link-ul.
// Format: /employee-portal/[orgId]

import type { Metadata } from "next"

import { EmployeePortalForm } from "@/components/compliscan/employee-portal-form"

export const metadata: Metadata = {
  title: "Solicitare informații salariale — CompliScan",
  description:
    "Formular pentru cereri privind salariu, ecart salarial gen, criterii promovare. Conform Directivei (UE) 2023/970.",
  robots: { index: false, follow: false },
}

export default async function EmployeePortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <div className="min-h-screen bg-eos-bg-canvas px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-muted">
            Pay Transparency · Directiva 2023/970
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-eos-text">
            Solicitare informații salariale
          </h1>
          <p className="mt-3 text-sm text-eos-text-muted">
            Acest formular permite trimiterea unei cereri de informații privind salariul, ecartul
            salarial de gen, criteriile de promovare sau alte aspecte de transparență salarială.
            Răspunsul va fi furnizat în maximum 30 de zile calendaristice.
          </p>
        </header>

        <EmployeePortalForm token={token} />

        <footer className="mt-12 border-t border-eos-border pt-6 text-xs text-eos-text-muted">
          <p>
            <strong>Notă confidențialitate:</strong> Datele transmise prin acest formular sunt
            tratate conform GDPR. Răspunsul va fi agregat la nivel de rol/categorie unde este cazul,
            pentru a proteja informațiile individuale ale celorlalți angajați.
          </p>
          <p className="mt-2">
            <strong>Disclaimer:</strong> CompliScan este platforma utilizată de angajator pentru
            gestionarea cererilor. CompliScan nu accesează informațiile dumneavoastră salariale.
          </p>
        </footer>
      </div>
    </div>
  )
}
