import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Lock } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"

export const metadata: Metadata = {
  title: "Generator Politică de Confidențialitate GDPR — CompliScan",
  description:
    "Generează gratuit o Politică de Confidențialitate GDPR personalizată pentru firma ta. Conform Art. 13–14 GDPR, în română, în 30 de secunde.",
  keywords: [
    "politica de confidentialitate GDPR",
    "generator politica GDPR Romania",
    "privacy policy Romania",
    "GDPR Romania SME",
    "politica confidentialitate gratuita",
  ],
  openGraph: {
    title: "Generator Politică de Confidențialitate GDPR — CompliScan",
    description: "Generează gratuit o politică GDPR personalizată pentru firma ta în 30 de secunde.",
    type: "website",
  },
}

const FEATURES = [
  { n: "01", label: "Conform GDPR Art. 13 și Art. 14" },
  { n: "02", label: "Personalizată cu datele firmei tale" },
  { n: "03", label: "Categorii de date, scopuri, drepturi" },
  { n: "04", label: "Date de contact DPO și responsabil" },
  { n: "05", label: "Download gratuit în format .md" },
  { n: "06", label: "Verificare AI + validare umană recomandată" },
]

const STEPS = [
  {
    step: "01",
    title: "Completezi datele firmei",
    detail: "Nume, CUI, website, sector, email DPO — datele tale fac documentul specific.",
  },
  {
    step: "02",
    title: "AI generează documentul",
    detail: "Gemini AI redactează politica completă conform GDPR, în 20–30 de secunde.",
  },
  {
    step: "03",
    title: "Verifici și publici",
    detail: "Descarci în format Markdown, verifici cu un specialist și publici pe site.",
  },
]

export default function GenereazaPoliticaGdprPage() {
  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      {/* ── Top nav ── */}
      <header className="sticky top-0 z-50 border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-primary/90"
          >
            Deschide dashboard
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative border-b border-eos-border px-6 py-20">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-eos-success/10 blur-3xl" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-eos-success/30 bg-eos-success-soft px-3 py-1">
              <CheckCircle2 className="size-3.5 text-eos-success" strokeWidth={2.5} />
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-success">
                Gratuit · fără card · fără cont
              </span>
            </div>
            <h1
              data-display-text="true"
              className="font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] text-eos-text md:text-[44px] lg:text-[48px]"
              style={{ textWrap: "balance" }}
            >
              Generator Politică de Confidențialitate GDPR
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[14.5px] leading-[1.65] text-eos-text-muted md:text-[16px]">
              Generează o politică completă, personalizată pentru firma ta. Conform GDPR Art.
              13–14. În română. În 30 de secunde.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-eos-sm bg-eos-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90"
              >
                Generează gratuit
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/login?mode=register"
                className="rounded-eos-sm border border-eos-border bg-white/[0.02] px-5 py-2.5 text-[13.5px] font-medium text-eos-text-muted transition-all hover:border-eos-border-strong hover:text-eos-text"
              >
                Înregistrează-te gratuit
              </Link>
            </div>

            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
              Documentele AI necesită verificare umană înainte de publicare
            </p>
          </div>
        </section>

        {/* ── Features (V3 numbered grid) ── */}
        <section className="border-b border-eos-border bg-white/[0.015] px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 max-w-2xl">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Conținut acoperit
              </p>
              <h2
                data-display-text="true"
                className="mt-3 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[30px]"
              >
                Ce conține politica generată
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feat) => (
                <div
                  key={feat.label}
                  className="rounded-eos-lg border border-eos-border bg-eos-surface p-4 transition-colors hover:border-eos-border-strong hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-primary">
                      {feat.n}
                    </span>
                    <CheckCircle2 className="size-3.5 text-eos-success" strokeWidth={2.5} />
                  </div>
                  <p className="mt-2 text-[13px] leading-[1.55] text-eos-text-muted">{feat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="border-b border-eos-border px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 max-w-2xl">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Pași
              </p>
              <h2
                data-display-text="true"
                className="mt-3 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[30px]"
              >
                Cum funcționează
              </h2>
            </div>

            <div className="relative grid gap-6 md:grid-cols-3">
              <div className="absolute left-0 right-0 top-3.5 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent md:block" />
              {STEPS.map((s, i) => (
                <div key={s.step} className="relative flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-eos-primary/30 bg-eos-primary/10 font-mono text-[11px] font-bold text-eos-primary">
                      {s.step}
                      {i === 0 && (
                        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border border-eos-bg bg-eos-primary" />
                      )}
                    </div>
                  </div>
                  <h3
                    data-display-text="true"
                    className="mt-4 font-display text-[16px] font-semibold tracking-[-0.015em] text-eos-text"
                  >
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-[1.55] text-eos-text-muted">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Legal context ── */}
        <section className="border-b border-eos-border px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Context legal
            </p>
            <h2
              data-display-text="true"
              className="mt-3 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[30px]"
            >
              De ce ai nevoie de o politică?
            </h2>

            <div className="mt-6 space-y-4 text-[14px] leading-[1.7] text-eos-text-muted">
              <p>
                <strong className="text-eos-text">GDPR Art. 13</strong> obligă orice operator de
                date să informeze persoanele vizate la momentul colectării datelor — prin
                site, aplicație sau formular de contact.
              </p>
              <p>
                Amenzile ANSPDCP pentru lipsa politicii sau pentru o politică incompletă pornesc
                de la câteva mii de euro și pot ajunge la{" "}
                <strong className="text-eos-text">4% din cifra de afaceri globală</strong>.
              </p>
              <p>
                O politică generată cu CompliScan acoperă toate secțiunile obligatorii:
                categorii de date, scopuri și temei juridic, durata păstrării, drepturile
                utilizatorilor, date DPO, transferuri internaționale.
              </p>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative px-6 py-20">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-eos-primary/10 blur-3xl" />
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-eos-sm border border-eos-primary/25 bg-eos-primary/10">
              <Lock className="size-5 text-eos-primary" strokeWidth={1.75} />
            </div>
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
              Începe acum
            </p>
            <h2
              data-display-text="true"
              className="mt-3 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-eos-text md:text-[32px]"
              style={{ textWrap: "balance" }}
            >
              Generează politica în 30 de secunde
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[13.5px] leading-[1.65] text-eos-text-muted">
              Gratuit pentru Politică de confidențialitate și Politică cookie. GDPR + AI Act +
              e-Factura — toate într-un singur loc.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-eos-sm bg-eos-primary px-6 py-3 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90"
            >
              Creează cont gratuit
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-eos-border-subtle py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-6 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
          <Link href="/" className="transition-colors hover:text-eos-text-muted">
            Acasă
          </Link>
          <Link href="/genereaza-dpa" className="transition-colors hover:text-eos-text-muted">
            Generator DPA
          </Link>
          <Link href="/trust" className="transition-colors hover:text-eos-text-muted">
            Trust Center
          </Link>
          <span className="ml-auto text-eos-text-muted">© {new Date().getFullYear()} CompliScan.ro</span>
        </div>
      </footer>
    </div>
  )
}
