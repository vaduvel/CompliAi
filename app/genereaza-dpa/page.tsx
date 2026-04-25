import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, FileText, ShieldCheck } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"

export const metadata: Metadata = {
  title: "Generator Acord de Prelucrare Date (DPA) GDPR — CompliScan",
  description:
    "Generează un Acord de Prelucrare a Datelor (DPA) conform GDPR Art. 28 pentru firma ta. Obligatoriu pentru relațiile operator–procesator. Template complet în română.",
  keywords: [
    "acord prelucrare date DPA GDPR",
    "generator DPA Romania",
    "GDPR Art 28 Romania",
    "contract prelucrare date personale",
    "data processing agreement Romania",
  ],
  openGraph: {
    title: "Generator Acord de Prelucrare Date (DPA) — CompliScan",
    description: "Generează un DPA complet conform GDPR Art. 28. Template personalizat în română.",
    type: "website",
  },
}

const FEATURES = [
  { n: "01", label: "Conform GDPR Art. 28 complet" },
  { n: "02", label: "Obligațiile procesatorului (Art. 28.3 a-h)" },
  { n: "03", label: "Clauze sub-procesatori" },
  { n: "04", label: "Notificare breșe de date" },
  { n: "05", label: "Transferuri internaționale (SCC)" },
  { n: "06", label: "Durata și rezilierea contractului" },
]

export default function GenereazaDpaPage() {
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
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-eos-primary/10 blur-3xl" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-eos-primary/25 bg-eos-primary/10 px-3 py-1">
              <ShieldCheck className="size-3.5 text-eos-primary" strokeWidth={2.25} />
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-primary">
                GDPR Art. 28 · obligatoriu cu procesatorii
              </span>
            </div>
            <h1
              data-display-text="true"
              className="font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] text-eos-text md:text-[44px] lg:text-[48px]"
              style={{ textWrap: "balance" }}
            >
              Generator Acord de Prelucrare Date (DPA)
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[14.5px] leading-[1.65] text-eos-text-muted md:text-[16px]">
              Generează un DPA complet și personalizat pentru relația cu procesatorii de date.
              Conform GDPR Art. 28. În română. Cu toate clauzele obligatorii.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-eos-sm bg-eos-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90"
              >
                Generează DPA
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Link>
            </div>
            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
              Disponibil în planul Starter · verificare umană obligatorie înainte de semnare
            </p>
          </div>
        </section>

        {/* ── What is DPA ── */}
        <section className="border-b border-eos-border px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Context legal
            </p>
            <h2
              data-display-text="true"
              className="mt-3 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[30px]"
            >
              Ce este un DPA și când e obligatoriu?
            </h2>

            <div className="mt-6 space-y-4 text-[14px] leading-[1.7] text-eos-text-muted">
              <p>
                <strong className="text-eos-text">GDPR Art. 28</strong> impune încheierea unui
                Acord de Prelucrare a Datelor între <em>operatorul de date</em> (firma ta) și
                orice <em>procesator</em> — servicii cloud, platforme SaaS, agenții de marketing,
                furnizori de e-mail, procesatori de plăți.
              </p>
              <p>
                Fără DPA, relația este{" "}
                <strong className="text-eos-text">ilegală conform GDPR</strong> și poate atrage
                amenzi ANSPDCP. Exemple de procesatori care necesită DPA: Google Workspace, AWS,
                Stripe, Mailchimp, HubSpot, orice furnizor care accesează date personale ale
                clienților tăi.
              </p>
              <p>
                CompliScan generează un DPA complet cu toate clauzele obligatorii, inclusiv
                lista sub-procesatorilor, dreptul de audit și procedura de notificare a breșelor.
              </p>
            </div>
          </div>
        </section>

        {/* ── Features (V3 numbered grid) ── */}
        <section className="border-b border-eos-border bg-white/[0.015] px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 max-w-2xl">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Ce conține
              </p>
              <h2
                data-display-text="true"
                className="mt-3 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[30px]"
              >
                DPA-ul generat — clauze esențiale
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

        {/* ── Final CTA ── */}
        <section className="relative px-6 py-20">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-eos-primary/10 blur-3xl" />
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-eos-sm border border-eos-primary/25 bg-eos-primary/10">
              <FileText className="size-5 text-eos-primary" strokeWidth={1.75} />
            </div>
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
              Suite completă de conformitate
            </p>
            <h2
              data-display-text="true"
              className="mt-3 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-eos-text md:text-[32px]"
              style={{ textWrap: "balance" }}
            >
              DPA · Privacy Policy · Cookie · NIS2 — toate într-un singur loc.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[13.5px] leading-[1.65] text-eos-text-muted">
              GDPR, EU AI Act, e-Factura — generate, validate și păstrate în Dosarul de
              conformitate. Cu monitorizare continuă.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-eos-sm bg-eos-primary px-6 py-3 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90"
            >
              Înregistrează-te gratuit
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
          <Link href="/genereaza-politica-gdpr" className="transition-colors hover:text-eos-text-muted">
            Generator politică GDPR
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
