import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ShieldCheck } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { FinesCalculator } from "@/components/compliscan/marketing/fines-calculator"

export const metadata: Metadata = {
  title: "Calculator amenzi ANAF — e-Factura, SAF-T, RO e-TVA — CompliScan",
  description:
    "Calculează expunerea ta la amenzi ANAF pentru încălcări e-Factura (OUG 120/2021), SAF-T D406 (OPANAF 1783/2021) și RO e-TVA (OUG 70/2024). Estimare orientativă în RON și EUR.",
  keywords: [
    "calculator amenzi ANAF",
    "amenzi e-Factura 2026",
    "amenzi SAF-T D406",
    "amenzi RO e-TVA",
    "OUG 120/2021 amenzi",
    "OUG 70/2024 amenzi",
  ],
  openGraph: {
    title: "Calculator amenzi ANAF — e-Factura / SAF-T / e-TVA",
    description:
      "Estimare orientativă a expunerii la amenzi ANAF pentru contribuabili mari/medii/mici. Bază legală citată.",
    type: "website",
  },
}

export default function CalculatorAmenziPage() {
  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <header className="sticky top-0 z-50 border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <Link
            href="/register?utm_source=fines_calculator&utm_medium=topnav"
            className="flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-primary/90"
          >
            Cont gratuit
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </header>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Cum sunt clasificate categoriile de contribuabili la ANAF?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "ANAF clasifică contribuabilii anual în 4 categorii — mari, medii, mici intermediari și mici/micro — pe baza cifrei de afaceri și a altor indicatori. Pragurile sunt revizuite anual prin Ordin ANAF.",
                },
              },
              {
                "@type": "Question",
                name: "Cât e amenda maximă pentru o factură netransmisă în SPV?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Conform OUG 120/2021 modificată de OUG 115/2023, amenzile pentru netransmiterea facturilor în e-Factura variază între 500 lei (contribuabil mic, prima abatere) și 10.000 lei (contribuabil mare, recurență). Fiecare factură netransmisă constituie încălcare separată.",
                },
              },
              {
                "@type": "Question",
                name: "Ce este RO e-TVA și ce amenzi atrage neRespondedul?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "RO e-TVA este declarația 300 pre-completată automat de ANAF pe baza facturilor e-Factura raportate. Dacă diferența între D300-ul depus și P300 pre-calculat depășește pragul (>20% AND ≥5.000 lei), ANAF trimite notificare cu termen 20 zile. NeRespondedul atrage 2.500-30.000 lei (OUG 70/2024 modificată de 89/2025).",
                },
              },
              {
                "@type": "Question",
                name: "Estimările de aici sunt obligatorii / definitive?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "NU. Cifrele sunt informative, pentru orientare. Decizia ANAF este în limita prevăzută de lege și depinde de circumstanțe (bună-credință, recurență, mărime). Verifică întotdeauna cu contabilul / fiscalistul tău înainte de a lua decizii bazate pe aceste estimări.",
                },
              },
            ],
          }),
        }}
      />
      <main>
        <section className="relative border-b border-eos-border px-6 py-16">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-eos-primary/10 blur-3xl" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-eos-primary/25 bg-eos-primary/10 px-3 py-1">
              <ShieldCheck className="size-3.5 text-eos-primary" strokeWidth={2.25} />
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-primary">
                Calculator gratuit · Bază legală citată
              </span>
            </div>
            <h1
              data-display-text="true"
              className="font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] text-eos-text md:text-[44px] lg:text-[48px]"
              style={{ textWrap: "balance" }}
            >
              Cât te-ar costa, în 2026, neconformitatea ANAF?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[14.5px] leading-[1.65] text-eos-text-muted md:text-[16px]">
              Estimează expunerea ta la amenzi pentru încălcări e-Factura, SAF-T D406 și RO e-TVA.
              Praguri actualizate per OUG 120/2021, OPANAF 1783/2021, OUG 70/2024 modificată
              de OUG 89/2025.
            </p>
          </div>
        </section>

        <section id="calculator" className="border-b border-eos-border px-6 py-12">
          <div className="mx-auto max-w-4xl">
            <FinesCalculator />
          </div>
        </section>

        <section className="border-b border-eos-border px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Cum funcționează amenzile ANAF
            </p>
            <h2
              data-display-text="true"
              className="mt-3 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[30px]"
            >
              Praguri per categorie de contribuabil
            </h2>
            <div className="mt-6 space-y-4 text-[14px] leading-[1.7] text-eos-text-muted">
              <p>
                Amenzile ANAF pentru e-Factura, SAF-T și e-TVA depind de:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-eos-text">Categoria contribuabilului</strong> — mare,
                  mediu sau mic (clasificare ANAF anuală).
                </li>
                <li>
                  <strong className="text-eos-text">Tipul încălcării</strong> — netransmitere,
                  întârziere, eroare repetată.
                </li>
                <li>
                  <strong className="text-eos-text">Recurența</strong> — fiecare factură netransmisă
                  poate atrage amendă separată.
                </li>
                <li>
                  <strong className="text-eos-text">Bună-credința</strong> — prima încălcare poate
                  primi minimul; recurența atrage maximum.
                </li>
              </ul>
              <p>
                Pentru contribuabilii mari (peste 1.000 facturi/lună), o lună uitată poate însemna
                expunere de zeci de mii de lei. Cu un sistem de monitorizare lunară (cum este
                CompliScan), încălcările sunt prevenite ÎNAINTE de notificarea ANAF.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              data-display-text="true"
              className="font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[30px]"
            >
              Vrei prevenție automată, lunar?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-[1.7] text-eos-text-muted">
              CompliScan rulează cron lunar pentru toate firmele tale și îți generează findings
              preventive cu countdown 20 zile pentru e-TVA, alertă la T+25 pentru D406, și
              validare UBL CIUS-RO live pentru fiecare factură.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register?utm_source=fines_calculator&utm_medium=footer_cta"
                className="flex items-center gap-2 rounded-eos-sm bg-eos-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90"
              >
                Cont gratuit CompliScan
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/verifica-saft-hygiene"
                className="text-[13px] text-eos-text-muted underline-offset-4 hover:text-eos-text hover:underline"
              >
                Verifică și SAF-T D406 →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
