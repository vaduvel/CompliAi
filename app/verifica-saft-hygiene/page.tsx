import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, FileCode2, ShieldCheck } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { SaftHygieneCalculator } from "@/components/compliscan/marketing/saft-hygiene-calculator"

export const metadata: Metadata = {
  title: "Verifică gratuit igiena SAF-T D406 — CompliScan",
  description:
    "Încarcă fișierul SAF-T D406 (XML) și obține gratuit scor de igienă fiscală 0-100 cu indicatori. Detectează rectificări repetate, perioade lipsă, inconsistențe înainte ca ANAF să trimită notificare.",
  keywords: [
    "SAF-T D406 verificare",
    "calculator SAF-T Romania",
    "ANAF D406 hygiene",
    "control fiscal preventiv",
    "OUG 70/2024 D406",
    "Ord ANAF 1783/2021",
  ],
  openGraph: {
    title: "Verifică gratuit igiena SAF-T D406 — CompliScan",
    description:
      "Calculator gratuit pentru raportările SAF-T D406. Scor 0-100, indicatori și recomandări preventive.",
    type: "website",
  },
}

const FEATURES = [
  { n: "01", label: "Parser metadata SAF-T (perioadă, CIF, rectificare)" },
  { n: "02", label: "Detecție rectificări repetate (RevisionNumber > 0)" },
  { n: "03", label: "Scor de igienă 0-100 + label calitativ" },
  { n: "04", label: "Indicatori completitudine, timeliness, stabilitate" },
  { n: "05", label: "Probleme de consistență între perioade" },
  { n: "06", label: "Recomandări preventive ÎNAINTE de notificare ANAF" },
]

export default function VerificaSaftHygienePage() {
  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      {/* ── Top nav ── */}
      <header className="sticky top-0 z-50 border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <Link
            href="/register?utm_source=saft_calculator&utm_medium=topnav"
            className="flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-primary/90"
          >
            Cont gratuit
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </header>

      {/* JSON-LD FAQ structured data — rich snippets Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Cine este obligat să depună D406 (SAF-T)?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Începând cu ianuarie 2025, toate firmele din România sunt obligate să transmită declarația informativă D406 (SAF-T) către ANAF — lunar pentru contribuabilii mari și medii, trimestrial pentru cei mici. Bază legală: Ord. ANAF 1783/2021 + OUG 188/2022 + Cod Procedură Fiscală Art. 336.",
                },
              },
              {
                "@type": "Question",
                name: "Cât sunt amenzile pentru nedepunere D406?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Amenzile variază între 1.000 și 10.000 lei per declarație nedepusă, în funcție de categoria contribuabilului. Cod Procedură Fiscală Art. 336 alin. (1) lit. b).",
                },
              },
              {
                "@type": "Question",
                name: "Ce înseamnă rectificare repetată în SAF-T?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "RevisionNumber > 0 în header-ul XML SAF-T indică o rectificare. Două sau mai multe rectificări consecutive pe aceeași perioadă semnalează posibile probleme sistemice în software-ul contabil și pot atrage atenția controlorilor ANAF.",
                },
              },
              {
                "@type": "Question",
                name: "Calculatorul vostru salvează datele mele?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "NU. Conținutul XML este procesat în memorie strict pentru calcul; nu salvăm fișierele și nu păstrăm metadata după ce returnăm răspunsul. Verificare și ștergere în aceeași cerere HTTP.",
                },
              },
            ],
          }),
        }}
      />
      <main>
        {/* ── Hero ── */}
        <section className="relative border-b border-eos-border px-6 py-16">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-eos-primary/10 blur-3xl" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-eos-primary/25 bg-eos-primary/10 px-3 py-1">
              <ShieldCheck className="size-3.5 text-eos-primary" strokeWidth={2.25} />
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-primary">
                Calculator gratuit · Ord. ANAF 1783/2021
              </span>
            </div>
            <h1
              data-display-text="true"
              className="font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] text-eos-text md:text-[44px] lg:text-[48px]"
              style={{ textWrap: "balance" }}
            >
              Verifică gratuit igiena SAF-T D406
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[14.5px] leading-[1.65] text-eos-text-muted md:text-[16px]">
              Încarcă fișierul XML SAF-T (sau mai multe perioade) și află în 5 secunde scorul tău
              de igienă fiscală. Detectează preventiv rectificările repetate și inconsistențele
              înainte ca ANAF să trimită notificarea.
            </p>
          </div>
        </section>

        {/* ── Calculator (interactive) ── */}
        <section id="calculator" className="border-b border-eos-border px-6 py-12">
          <div className="mx-auto max-w-4xl">
            <SaftHygieneCalculator />
          </div>
        </section>

        {/* ── Why use this ── */}
        <section className="border-b border-eos-border px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              De ce să verifici
            </p>
            <h2
              data-display-text="true"
              className="mt-3 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[30px]"
            >
              Ce face acest calculator?
            </h2>
            <div className="mt-6 space-y-4 text-[14px] leading-[1.7] text-eos-text-muted">
              <p>
                Începând cu <strong className="text-eos-text">ianuarie 2025</strong>, toate firmele
                din România sunt obligate să transmită declarația D406 (SAF-T) către ANAF, lunar sau
                trimestrial. Nerespectarea atrage{" "}
                <strong className="text-eos-text">amenzi de 1.000–10.000 lei per declarație</strong>{" "}
                (Ord. ANAF 1783/2021).
              </p>
              <p>
                Calculatorul nostru analizează metadata XML SAF-T, calculează un scor 0-100 și
                generează indicatori pe completitudine, timeliness și stabilitate. Pentru analiză
                continuă pe toate perioadele, conectarea ANAF SPV și cross-check D300/D394, ai
                nevoie de un cont CompliScan (gratuit la înregistrare).
              </p>
              <p className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3 text-[13px] text-eos-text">
                <strong>Confidențialitate:</strong> Conținutul XML rămâne efemer — îl procesăm în
                memorie pentru a calcula scorul și nu salvăm nimic la final. Verificare și ștergere
                în aceeași cerere HTTP.
              </p>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-b border-eos-border bg-white/[0.015] px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 max-w-2xl">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Ce primești
              </p>
              <h2
                data-display-text="true"
                className="mt-3 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[30px]"
              >
                În raportul gratuit
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feat) => (
                <div
                  key={feat.label}
                  className="rounded-eos-lg border border-eos-border bg-eos-surface p-4 transition-colors hover:border-eos-border-strong"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-primary">
                      {feat.n}
                    </span>
                    <FileCode2 className="size-3.5 text-eos-text-tertiary" strokeWidth={2} />
                  </div>
                  <p className="mt-2 text-[13.5px] font-semibold leading-[1.4] text-eos-text">
                    {feat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              data-display-text="true"
              className="font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[30px]"
            >
              Vrei monitorizare continuă pentru toate firmele tale?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-[1.7] text-eos-text-muted">
              CompliScan urmărește lunar SAF-T, e-Factura, D300, D394 și e-TVA pentru toate firmele
              din portofoliul tău, generează findings preventive și păstrează istoric audit-pack.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register?utm_source=saft_calculator&utm_medium=cta"
                className="flex items-center gap-2 rounded-eos-sm bg-eos-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90"
              >
                Deschide cont gratuit
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/pricing"
                className="text-[13px] text-eos-text-muted underline-offset-4 hover:text-eos-text hover:underline"
              >
                Vezi planurile
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
