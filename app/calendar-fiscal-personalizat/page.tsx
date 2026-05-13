import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CalendarClock, ShieldCheck, Wand2 } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { FiscalCalendarPersonalizat } from "@/components/compliscan/marketing/fiscal-calendar-personalizat"

export const metadata: Metadata = {
  title:
    "Calendar fiscal personalizat ANAF — generator gratuit | CompliScan",
  description:
    "Generator gratuit calendar fiscal personalizat pentru firma ta. Vezi ce declarații ANAF se aplică ție (D300, D406, D394, e-Factura) și termenele exacte pe 3 luni — în 30 secunde. Cod Fiscal Art. 322 + OUG 120/2021.",
  keywords: [
    "calendar fiscal Romania",
    "termene ANAF",
    "D300 termen",
    "D406 SAF-T termen",
    "calendar fiscal personalizat",
    "obligatii fiscale firma",
    "termene declaratii fiscale 2026",
    "calendar ANAF SRL",
    "calendar fiscal PFA",
  ],
  openGraph: {
    title: "Calendar fiscal personalizat ANAF — generator gratuit",
    description:
      "Vezi exact ce declarații ANAF se aplică firmei tale și termenele pe 3 luni. Gratuit, în 30 secunde, fără cont.",
    type: "website",
  },
  alternates: {
    canonical: "/calendar-fiscal-personalizat",
  },
}

const FEATURES = [
  { n: "01", label: "Aplică 26 reguli fiscale RO publice pe profilul tău" },
  { n: "02", label: "Cod Fiscal Art. 322 + OUG 120/2021 + Ordine ANAF" },
  { n: "03", label: "Frecvență D300 lunar/trimestrial calculată automat" },
  { n: "04", label: "Termene exacte cu data (25 a lunii următoare, etc.)" },
  { n: "05", label: "Distinge SRL / PFA / SA / ONG cu reguli diferite" },
  { n: "06", label: "Zero invenție — doar aplicăm regulile fiscale publice" },
]

export default function CalendarFiscalPersonalizatPage() {
  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      {/* ── Top nav ── */}
      <header className="sticky top-0 z-50 border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <Link
            href="/register?utm_source=calendar_fiscal&utm_medium=topnav"
            className="flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-primary/90"
          >
            Cont gratuit
            <ArrowRight className="size-3" strokeWidth={2.5} />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="border-b border-eos-border bg-eos-bg">
        <div className="mx-auto max-w-5xl px-6 py-14 md:py-20">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-eos-primary" strokeWidth={2.5} />
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-eos-primary">
              Generator gratuit · 30 secunde
            </span>
          </div>
          <h1
            data-display-text="true"
            className="mt-3 font-display text-[34px] font-bold leading-[1.1] tracking-[-0.025em] text-eos-text md:text-[44px]"
          >
            Vezi exact ce declarații ANAF{" "}
            <span className="text-eos-primary">se aplică firmei tale</span>
            <br />
            și când au termenul
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.6] text-eos-text-muted md:text-[16.5px]">
            Răspunde la 4 întrebări (tip firmă, angajați, TVA, UE) și află în 30
            secunde calendarul tău fiscal personalizat: ce declarații (D300,
            D406, D394, e-Factura) trebuie să depui, când, pe ce frecvență. Nu
            inventăm nimic — aplicăm <strong>26 reguli fiscale RO publice</strong>{" "}
            (Cod Fiscal Art. 322, OUG 120/2021, Ordine ANAF) pe profilul firmei
            tale.
          </p>

          {/* Trust strip */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] text-eos-text-tertiary">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-eos-success" strokeWidth={2} />
              Gratuit · Fără cont
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wand2 className="size-3.5 text-eos-primary" strokeWidth={2} />
              Generat din profil, nu inventat
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-eos-warning" strokeWidth={2} />
              Termene exacte cu data
            </span>
          </div>
        </div>
      </section>

      {/* ── Calculator ── */}
      <section className="border-b border-eos-border bg-eos-bg">
        <div className="mx-auto max-w-3xl px-6 py-10 md:py-14">
          <FiscalCalendarPersonalizat />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-b border-eos-border bg-eos-bg">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2
            data-display-text="true"
            className="font-display text-[24px] font-semibold tracking-[-0.02em] text-eos-text md:text-[28px]"
          >
            De ce e diferit acest calendar
          </h2>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-[1.55] text-eos-text-muted">
            Calendarul ANAF e public, scris în lege, dar are 200+ pagini. Noi îți
            arătăm doar ce te privește pe tine.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.n}
                className="rounded-eos-lg border border-eos-border bg-eos-surface p-4"
              >
                <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-eos-primary">
                  {f.n}
                </span>
                <p className="mt-2 text-[13px] leading-[1.5] text-eos-text">
                  {f.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-b border-eos-border bg-eos-bg">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2
            data-display-text="true"
            className="font-display text-[24px] font-semibold tracking-[-0.02em] text-eos-text md:text-[28px]"
          >
            Cum funcționează în 3 pași
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Step
              n="1"
              title="Completezi 4 întrebări"
              description="Tip firmă (SRL/PFA/etc.), număr angajați, statut TVA, dacă ai tranzacții UE. Atât."
            />
            <Step
              n="2"
              title="Aplicăm regulile ANAF"
              description="Motorul nostru aplică 26 de reguli fiscale publice pe profilul tău și calculează exact ce te privește."
            />
            <Step
              n="3"
              title="Vezi calendarul"
              description="Listă cu declarațiile aplicabile + primele 10 termene viitoare cu data exactă. Gata."
            />
          </div>
        </div>
      </section>

      {/* ── CTA secondary ── */}
      <section className="bg-eos-bg">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-8 text-center">
            <CalendarClock className="mx-auto size-8 text-eos-primary" strokeWidth={2} />
            <h2
              data-display-text="true"
              className="mt-3 font-display text-[22px] font-semibold tracking-[-0.02em] text-eos-text md:text-[26px]"
            >
              Vrei calendarul complet pe 12 luni + reminder zilnic?
            </h2>
            <p className="mt-2 max-w-xl mx-auto text-[13.5px] leading-[1.55] text-eos-text-muted">
              Creează un cont gratuit. Calendarul tău se salvează permanent.
              Primești email automat la 7, 3 și 1 zi înainte de fiecare termen.
              Plus confirmare automată din SmartBill / Saga / SPV ANAF.
            </p>
            <Link
              href="/register?utm_source=calendar_fiscal&utm_medium=footer"
              className="mt-5 inline-flex items-center gap-1.5 rounded-eos-md border border-eos-primary bg-eos-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-eos-sm transition hover:bg-eos-primary/90"
            >
              Activează reminder gratuit
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-eos-border bg-eos-bg">
        <div className="mx-auto max-w-5xl px-6 py-6 text-[11px] text-eos-text-tertiary">
          <p>
            CompliScan · Calendar fiscal personalizat e generat automat pe baza
            regulilor publice (Cod Fiscal, OUG 120/2021, Ordine ANAF). Pentru
            decizii fiscale, consultă întotdeauna contabilul tău. Calendarul e
            informativ, nu garantează aplicabilitatea integrală în cazuri
            speciale.
          </p>
        </div>
      </footer>
    </div>
  )
}

function Step({
  n,
  title,
  description,
}: {
  n: string
  title: string
  description: string
}) {
  return (
    <div>
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-eos-primary font-mono text-[12px] font-bold text-white">
        {n}
      </span>
      <h3
        data-display-text="true"
        className="mt-3 font-display text-[15px] font-semibold tracking-[-0.015em] text-eos-text"
      >
        {title}
      </h3>
      <p className="mt-1.5 text-[12.5px] leading-[1.55] text-eos-text-muted">
        {description}
      </p>
    </div>
  )
}
