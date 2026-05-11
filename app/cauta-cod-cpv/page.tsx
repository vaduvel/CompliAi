import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { CpvSearchTool } from "@/components/compliscan/marketing/cpv-search-tool"

export const metadata: Metadata = {
  title: "Caută cod CPV pentru factura ta B2G — Asistent gratuit | CompliScan",
  description:
    "Introdu descrierea produsului sau serviciului și primește top 3 sugestii de cod CPV. Obligatoriu pe facturile B2G din 1 ian 2025 (OUG 138/2024). Gratuit.",
  keywords: [
    "cod CPV facturi B2G",
    "CPV obligatoriu 2025",
    "OUG 138/2024 CPV",
    "Regulament 2195/2002",
    "căutare cod CPV gratis",
    "e-Factura B2G CPV",
  ],
  openGraph: {
    title: "Caută cod CPV pentru factura ta B2G",
    description:
      "Sugestii top 3 cod CPV per descriere produs. Obligatoriu B2G de la 1 ian 2025. Gratis.",
    type: "website",
  },
}

export default function CpvLookupPage() {
  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <header className="sticky top-0 z-50 border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <Link
            href="/register?utm_source=cpv_lookup&utm_medium=topnav"
            className="flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-eos-primary/90"
          >
            Cont gratuit
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
        <section className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-primary/30 bg-eos-primary/10 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-primary">
            <Search className="size-3.5" strokeWidth={2} />
            Asistent gratuit
          </span>
          <h1
            data-display-text="true"
            className="font-display text-[32px] font-semibold tracking-[-0.025em] text-eos-text md:text-[40px]"
          >
            Caută cod CPV pentru factura ta B2G
          </h1>
          <p className="text-[15px] leading-[1.55] text-eos-text-muted">
            Începând cu <strong>1 ianuarie 2025</strong>, toate facturile emise în relația{" "}
            <strong>business-to-government (B2G)</strong> trebuie să conțină codul CPV
            (Common Procurement Vocabulary) conform OUG 138/2024 + Regulament UE 2195/2002.
            Introdu descrierea produsului sau serviciului facturat și primește top 3 sugestii.
          </p>
        </section>

        <CpvSearchTool />

        <section className="space-y-4 rounded-eos-lg border border-eos-border bg-eos-surface-elevated p-6">
          <h2
            data-display-text="true"
            className="font-display text-[20px] font-semibold tracking-[-0.02em] text-eos-text"
          >
            De ce e obligatoriu CPV pe facturi B2G?
          </h2>
          <ul className="space-y-2 text-[13px] leading-[1.6] text-eos-text">
            <li>
              <strong>OUG 138/2024</strong> modif. OUG 10/2021 — toate facturile către instituții
              publice trebuie să conțină codul CPV începând cu 1 ianuarie 2025.
            </li>
            <li>
              <strong>Aplicabilitate:</strong> contracte de achiziții publice, achiziții sectoriale,
              concesiuni de lucrări/servicii.
            </li>
            <li>
              <strong>Lipsa codului CPV</strong> poate duce la respingerea facturii în SPV ANAF +
              întârzieri la plată din partea instituției publice.
            </li>
            <li>
              <strong>Sursa oficială:</strong> Regulamentul (CE) nr. 2195/2002 — vocabular comun
              pentru achiziții publice.
            </li>
          </ul>
        </section>

        <section className="space-y-4 rounded-eos-lg border border-eos-primary/30 bg-eos-primary/[0.06] p-6">
          <h3 className="font-display text-[18px] font-semibold text-eos-primary">
            Ai mai mult de 5 clienți B2G?
          </h3>
          <p className="text-[13px] leading-[1.55] text-eos-text-muted">
            CompliScan integrează auto-sugestiile CPV direct în <strong>Validator e-Factura</strong>{" "}
            și în <strong>Bulk ZIP upload</strong>. Pre-completează XML-ul cu codul propus + învață
            din alegerile tale pentru sugestii mai precise data viitoare.
          </p>
          <Link
            href="/register?utm_source=cpv_lookup&utm_medium=cta_box"
            className="inline-flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-eos-primary/90"
          >
            Activează CompliScan (gratuit 14 zile)
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
        </section>

        <section className="text-[11.5px] text-eos-text-tertiary">
          <p>
            <strong>Disclaimer:</strong> Sugestiile CPV sunt informative. Codul final aparține
            contabilului responsabil (CECCAR Art. 14). Verifică în catalogul oficial EU înainte de
            transmitere SPV.
          </p>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 border-t border-eos-border-subtle pt-6 text-[12.5px]">
          <Link
            href="/calculator-amenzi-anaf"
            className="inline-flex items-center gap-1.5 text-eos-primary hover:underline"
          >
            Calculator amenzi ANAF →
          </Link>
          <Link
            href="/pentru/pfa-form-082"
            className="inline-flex items-center gap-1.5 text-eos-primary hover:underline"
          >
            PFA Form 082 deadline →
          </Link>
        </section>
      </main>
    </div>
  )
}
